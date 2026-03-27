// main test suite
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { WebSocket } from 'ws';// this was removed
import { randomBytes } from 'node:crypto';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import {
    createUnprovenDeployTx,
    deployContract,
    submitCallTx,
} from '@midnight-ntwrk/midnight-js-contracts';
import type { ContractAddress } from '@midnight-ntwrk/compact-runtime';
import { sampleUserAddress, encodeCoinPublicKey } from '@midnight-ntwrk/compact-runtime';
import pino from 'pino';

import { getConfig } from '../config.js';
import { MidnightWalletProvider, syncWallet } from '../wallet.js';
import { buildProviders, type BattleshipProviders } from '../providers.js';
import {
    CompiledBattleshipContract,
    createBattlePrivateState,
    ledger,
    zkConfigPath,
} from '../../contract/index.js';
import type { EnvironmentConfiguration } from '@midnight-ntwrk/testkit-js';
import type { CoinPublicKey } from '@midnight-ntwrk/ledger-v8';
import { 
    BoardState, 
    ShotState, 
    WinState,
} from '../../contract/managed/battleship/contract/index.js';

// Required for GraphQL subscriptions in Node.js
// @ts-expect-error WebSocket global assignment for apollo
globalThis.WebSocket = WebSocket;

process.on('unhandledRejection', (reason, promise) => {
  console.error('UNHANDLED REJECTION:', reason);
  console.error('Promise:', promise);
});

process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err);
});

const ALICE_SEED = 
  '0000000000000000000000000000000000000000000000000000000000000001';
const BOB_SEED = 
  '0000000000000000000000000000000000000000000000000000000000000002';
const ALICE_PRIVATE_ID = 'alicePrivateState';
const BOB_PRIVATE_ID = 'bobPrivateState';

const logger = pino({
    level: process.env['LOG_LEVEL'] ?? 'info',
    transport: { target: 'pino-pretty' },
});

describe('Battleship Smart Contract via midnight-js', () => {
    let aliceWallet: MidnightWalletProvider;
    let bobWallet: MidnightWalletProvider;
    let aliceProviders: BattleshipProviders;
    let bobProviders: BattleshipProviders;
    let contractAddress: ContractAddress;

    const config = getConfig();

    async function queryLedger(providers: BattleshipProviders) {
        const state = await providers.publicDataProvider.queryContractState(contractAddress);
        expect(state).not.toBeNull();
        return ledger(state!.data);
    }

    // setup before tests
    beforeAll(async () => {
        setNetworkId(config.networkId);

        const envConfig: EnvironmentConfiguration = {
            walletNetworkId: config.networkId,
            networkId: config.networkId,
            indexer: config.indexer,
            indexerWS: config.indexerWS,
            node: config.node,
            nodeWS: config.nodeWS,
            faucet: config.faucet,
            proofServer: config.proofServer,
        };

        aliceWallet = await MidnightWalletProvider.build(logger, envConfig, ALICE_SEED);
        await aliceWallet.start();
        await syncWallet(logger, aliceWallet.wallet, 600_000);

        bobWallet = await MidnightWalletProvider.build(logger, envConfig, BOB_SEED);
        await bobWallet.start();
        await syncWallet(logger, bobWallet.wallet, 600_000);

        aliceProviders = buildProviders(aliceWallet, zkConfigPath, config);
        bobProviders = buildProviders(bobWallet, zkConfigPath, config);

        logger.info('Providers initialized, ready to test.');
    });

    // tear down after tests
    afterAll(async () => {
        if(aliceWallet) {
            logger.info('Stopping aliceWallet...');
            await aliceWallet.stop();
        }
        if(bobWallet) {
            logger.info('Stopping bobWallet...');
            await bobWallet.stop();
        }
    });

    it('deploys the contract', async () => {
        // @TODO -- how do I get this from WalletFacade?
        const aliceAddress = sampleUserAddress();// @TODO -- do I need this?
        const aliceSk = randomBytes(32);
        const alicePrivateState = createBattlePrivateState(
            BigInt(3),// x1 ship location
            BigInt(10),// x2
            BoardState.UNSET,
            ShotState.MISS,
            aliceSk,
        );


        // create Tx locally, unproven and unbalanced
        const unprovenData: any = await (createUnprovenDeployTx as any)(aliceProviders, {
            compiledContract: CompiledBattleshipContract,
            privateStateId: ALICE_PRIVATE_ID,
            alicePrivateState,
            args: [alicePrivateState.x1, alicePrivateState.x2, alicePrivateState.sk]
        });

        const pendingAddress = unprovenData.public?.contractAddress;
        logger.info(`Unproven tx created. Pending contract address: ${pendingAddress}`);

        // send to proof server, get ZK proof back
        const provenTx = await aliceProviders.proofProvider.proveTx(unprovenData.private.unprovenTx);
        logger.info('proven tx received from proof server');

        // balance wallet
        const balancedTx = await aliceProviders.walletProvider.balanceTx(provenTx);
        logger.info('Balanced tx ready for submission');

        // submit to network node
        const txId = await aliceProviders.midnightProvider.submitTx(balancedTx);
        logger.info(`Submitted tx id: ${txId}`);

        // watch the chain for the finalized txn
        const finalizedTxData = await aliceProviders.publicDataProvider.watchForTxData(txId);
        logger.info(`Finalized! Status: ${finalizedTxData.status}, block: ${finalizedTxData.blockHeight}`);

        logger.info(`Setting the contract address...`);
        aliceProviders.privateStateProvider.setContractAddress(pendingAddress);
        await aliceProviders.privateStateProvider.set(ALICE_PRIVATE_ID, alicePrivateState);

        contractAddress = pendingAddress;
        logger.info(`Contract address: ${contractAddress}`);
        expect(contractAddress).toBeDefined();
        expect(contractAddress.length).toBeGreaterThan(0);

        let state = await queryLedger(aliceProviders);
        expect(state.board1State).toEqual(BoardState.SET);
        expect(state.board2State).toEqual(BoardState.UNSET);
        expect(state.winState).toEqual(WinState.CONTINUE_PLAY);


        // maybe deployContract is the problem?
        // aliceProviders.privateStateProvider.setContractAddress(contractAddress);
        // await aliceProviders.privateStateProvider.set(ALICE_PRIVATE_ID, alicePrivateState);

        // const deployed: any = await (deployContract as any)(aliceProviders, {
        //     compiledContract: CompiledBattleshipContract,
        //     privateStateId: ALICE_PRIVATE_ID,
        //     privateState: aliceProviders.privateStateProvider.get(ALICE_PRIVATE_ID),
        //     args: [alicePrivateState.x1, alicePrivateState.x2]
        // });

        // contractAddress = deployed.deployTxData.public.contractAddress;
        // logger.info(`Contract deployed at: ${contractAddress}`);
        // expect(contractAddress).toBeDefined();
        // expect(contractAddress.length).toBeGreaterThan(0);

        // let state = await queryLedger(aliceProviders);
        // expect(state.board1State).toEqual(BoardState.SET);
        // expect(state.board2State).toEqual(BoardState.UNSET);
        // expect(state.winState).toEqual(WinState.CONTINUE_PLAY);
    });
})
