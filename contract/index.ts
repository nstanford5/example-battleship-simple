// This files main purpose is to export the compiled contract
import { CompiledContract } from '@midnight-ntwrk/compact-js';
import path from 'node:path';

export {
    Contract,
    ledger,
    pureCircuits,
    type Witnesses,
    type Ledger,
    type ImpureCircuits,
    type PureCircuits
} from './managed/battleship/contract/index.js';
import { Contract } from './managed/battleship/contract/index.js';
import { type Ledger, BoardState, ShotState } from './managed/battleship/contract/index.js';
import { type WitnessContext } from '@midnight-ntwrk/compact-runtime';

export type BattlePrivateState = {
    x1: bigint,
    x2: bigint,
    boardState: number,
    shotState: number,
    sk: Uint8Array,
};

export const createBattlePrivateState = (
    x1: bigint,
    x2: bigint,
    boardState: number,
    shotState: number,
    sk: Uint8Array,
) => ({
    x1,
    x2,
    boardState,
    shotState,
    sk
});

const witnesses = {
    localSetBoard: ({
        privateState
    }: WitnessContext<Ledger, BattlePrivateState>, x1: bigint, x2: bigint): [
        BattlePrivateState,
        BoardState
    ] => {
        privateState.x1 = x1;
        privateState.x2 = x2;
        privateState.boardState = BoardState.SET;
        return [privateState, privateState.boardState];
    },// end of localSetBoard
    localCheckBoard: ({
        privateState
    }: WitnessContext<Ledger, BattlePrivateState>, x: bigint): [
        BattlePrivateState,
        ShotState
    ] => {
        let currentShot = ShotState.MISS;// reset to default -- MISS
        if(x == privateState.x1 || x == privateState.x2){
            currentShot = ShotState.HIT;// only HIT if it is in fact a HIT
        }
        privateState.shotState = currentShot;
        return [privateState, privateState.shotState];
    },// end of localCheckBoard
    localSecretKey: ({
        privateState
    }: WitnessContext<Ledger, BattlePrivateState>): [
        BattlePrivateState,
        Uint8Array
    ] => {
        return [privateState, privateState.sk];
    },
};

const currentDir = path.resolve(new URL(import.meta.url).pathname, '..');
export const zkConfigPath = path.resolve(currentDir, 'managed', 'battleship');

export const CompiledBattleshipContract = CompiledContract.make(
    'BattleshipContract',
    Contract,
).pipe(
    CompiledContract.withWitnesses(witnesses),
    CompiledContract.withCompiledFileAssets(zkConfigPath),
)