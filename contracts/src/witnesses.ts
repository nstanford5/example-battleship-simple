import { Ledger, BoardState, ShotState } from './managed/battleship-simple/contract/index.js';
import { WitnessContext } from '@midnight-ntwrk/compact-runtime';

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

// do I need individual set/check functions for each board? Or can I combine these and just operate
// on the specific privateState being passed in?
export const witnesses = {
    localSetBoard1: ({
        privateState
    }: WitnessContext<Ledger, BattlePrivateState>, x1: bigint, x2: bigint): [
        BattlePrivateState,
        BoardState
    ] => {
        // changes to privateState variables
        privateState.x1 = x1;
        privateState.x2 = x2;
        privateState.boardState = BoardState.SET;
        return [privateState, privateState.boardState];
    },// end of localSetBoard1
    localSetBoard2: ({
        privateState
    }: WitnessContext<Ledger, BattlePrivateState>, x1: bigint, x2: bigint): [
        BattlePrivateState,
        BoardState
    ] => {
        privateState.x1 = x1;
        privateState.x2 = x2;
        privateState.boardState = BoardState.SET;
        return [privateState, privateState.boardState];
    },// end of localSetBoard2
    localCheckBoard1: ({
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
    },// end of localCheckBoard1
    localCheckBoard2: ({
        privateState
    }: WitnessContext<Ledger, BattlePrivateState>, x: bigint): [
        BattlePrivateState,
        ShotState
    ] => {
        // tests to demonstrate: what happens in our DApp if the wrong calculation happens here?
        let currentShot = ShotState.MISS;// reset to default -- MISS
        if(x == privateState.x1 || x == privateState.x2){
            currentShot = ShotState.HIT;
        }
        privateState.shotState = currentShot;
        return [privateState, privateState.shotState];
    },// end of localCheckBoard2
    localSecretKey: ({
        privateState
    }: WitnessContext<Ledger, BattlePrivateState>): [
        BattlePrivateState,
        Uint8Array
    ] => {
        return [privateState, privateState.sk];
    },
};