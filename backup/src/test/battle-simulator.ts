import {    
    type CircuitContext,
    sampleContractAddress,
    createConstructorContext,
    CostModel,
    QueryContext,
    sampleUserAddress,
    ChargedState,
    createCircuitContext
} from '@midnight-ntwrk/compact-runtime';
import {
    Contract,
    type Ledger,
    ledger,
    BoardState,
    ShotState,
} from '../managed/battleship-simple/contract/index.js';
import {
    witnesses,
    BattlePrivateState,
    createBattlePrivateState
} from '../witnesses.js';
import { randomBytes } from './utils.js';

export class BattleSimulator {
    readonly contract: Contract<BattlePrivateState>;
    contractAddress: string;
    aliceAddress: string;
    aliceSk: Uint8Array;
    alicePrivateState: BattlePrivateState;
    initialBoardState: BoardState;
    initialShotState: ShotState;
    circuitContext: CircuitContext<BattlePrivateState>;

    constructor(x1: bigint, x2: bigint) {
        this.contract = new Contract<BattlePrivateState>(witnesses);
        this.contractAddress = sampleContractAddress();
        this.aliceAddress = sampleUserAddress();
        this.aliceSk = randomBytes(32);
        this.initialBoardState = BoardState.UNSET;
        this.initialShotState = ShotState.MISS;

        this.alicePrivateState = createBattlePrivateState(
            x1,// alice deploys the contract, so these can be passed in through constructor
            x2,
            this.initialBoardState,
            this.initialShotState,
            this.aliceSk
        );
        const {
            currentContractState,
            currentPrivateState,
            currentZswapLocalState
        } = this.contract.initialState(
            createConstructorContext(this.alicePrivateState, this.aliceAddress),
            this.alicePrivateState.x1,
            this.alicePrivateState.x2,
        );
        this.circuitContext = {
            currentPrivateState,
            currentZswapLocalState,
            costModel: CostModel.initialCostModel(),
            currentQueryContext: new QueryContext(
                currentContractState.data,
                this.contractAddress,
            ),
        };
    }// end of constructor

    // helper function for tests
    public getLedger(): Ledger {
        return ledger(this.circuitContext.currentQueryContext.state);
    }

    public getContractState(): ChargedState {
        return this.circuitContext.currentQueryContext.state;
    }

    public switchCallerToBob(callerContext: CircuitContext): void {
        this.circuitContext = callerContext;
    }

    public setAliceContext(contractState: ChargedState): void {
        this.circuitContext = createCircuitContext(
            this.contractAddress,
            this.aliceAddress,
            contractState,
            this.alicePrivateState
        );
    }

    // contract circuit wrappers
    public acceptGame(x1: bigint, x2: bigint): void {
        this.circuitContext = this.contract.impureCircuits.acceptGame(
            this.circuitContext,
            x1,
            x2,
        ).context;
    }

    public player1Shoot(x: bigint): void {
        this.circuitContext = this.contract.impureCircuits.player1Shoot(
            this.circuitContext,
            x,
        ).context;
    }

    public player2Shoot(x: bigint): void {
        this.circuitContext = this.contract.impureCircuits.player2Shoot(
            this.circuitContext,
            x,
        ).context;
    }

    public checkBoard1(sk: Uint8Array): void {
        this.circuitContext = this.contract.impureCircuits.checkBoard1(
            this.circuitContext,
        ).context;
    }

    public checkBoard2(sk: Uint8Array): void {
        this.circuitContext = this.contract.impureCircuits.checkBoard2(
            this.circuitContext,
        ).context;
    }

    public publicKey(sk: Uint8Array): Uint8Array {
        return this.contract.circuits.publicKey(
            this.circuitContext,
            sk
        ).result;
    }
}// end of class

export class WalletBuilder {
    address: string;
    sk: Uint8Array;
    contractAddress: string;
    callerContext: CircuitContext<BattlePrivateState>;
    privateState: BattlePrivateState;

    constructor(contractAddress: string, contractState: ChargedState) {
        this.address = sampleUserAddress();
        this.sk = randomBytes(32);
        this.contractAddress = contractAddress;
        this.privateState = createBattlePrivateState(
            BigInt(0),// initialize to 0 which is not setable in contract
            BigInt(0),
            BoardState.UNSET,
            ShotState.MISS,
            this.sk
        );
        this.callerContext = createCircuitContext(
            this.contractAddress,
            this.address,
            contractState,
            this.privateState
        )
    }

    public updatePrivateState(x1: bigint, x2: bigint): void {
        this.privateState.x1 = x1;
        this.privateState.x2 = x2;
    }

    public updateCallerContext(contractState: ChargedState): void {
        this.callerContext = createCircuitContext(
            this.contractAddress,
            this.address,
            contractState,
            this.privateState
        );
    }
}// end of class WalletBuilder