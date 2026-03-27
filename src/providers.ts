// Returns the providers in an object which can be created for each users
// individual tests
import { type MidnightProviders } from '@midnight-ntwrk/midnight-js-types';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { NodeZkConfigProvider } from '@midnight-ntwrk/midnight-js-node-zk-config-provider';
import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';
import { type MidnightWalletProvider } from './wallet.js';
import { type NetworkConfig } from './config.js';

export type BattleshipCircuits = 'acceptGame' | 'player1Shoot' | 'checkboard1' | 'player2Shoot' | 'checkboard2';

export type BattleshipProviders = MidnightProviders<any>;

export function buildProviders(
    wallet: MidnightWalletProvider,
    zkConfigPath: string,
    config: NetworkConfig,
): BattleshipProviders {
    const zkConfigProvider = new NodeZkConfigProvider<BattleshipCircuits>(zkConfigPath);
    return {
        privateStateProvider: levelPrivateStateProvider({
            // @TODO -- should I pass in a name for each of the private states?
            privateStateStoreName: `battleship-${Date.now()}`,
            // this password has requirements (capital/special chars >= 3)
            privateStoragePasswordProvider: () => 'Battleship-Test-Password',
            accountId: wallet.getCoinPublicKey(),
        }),
        publicDataProvider: indexerPublicDataProvider(
            config.indexer,
            config.indexerWS,
        ),
        zkConfigProvider,
        proofProvider: httpClientProofProvider(
            config.proofServer,
            zkConfigProvider,
        ),
        walletProvider: wallet,
        midnightProvider: wallet,
    };
}