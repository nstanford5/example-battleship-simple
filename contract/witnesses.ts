// The main purpose of this file is to hold all of the code relevant to private state.
// It is good practice to isolate this data so that you can start to think of private state
// in a different context for your DApp
// import { type Ledger, BoardState, ShotState } from './managed/battleship/contract/index.js';
// import { type WitnessContext } from '@midnight-ntwrk/compact-runtime';

// export type BattlePrivateState = {
//     x1: bigint,
//     x2: bigint,
//     boardState: number,
//     shotState: number,
//     sk: Uint8Array,
// };

// export const createBattlePrivateState = (
//     x1: bigint,
//     x2: bigint,
//     boardState: number,
//     shotState: number,
//     sk: Uint8Array,
// ) => ({
//     x1,
//     x2,
//     boardState,
//     shotState,
//     sk
// });

// export const witnesses = {
//     localSetBoard: ({
//         privateState
//     }: WitnessContext<Ledger, BattlePrivateState>, x1: bigint, x2: bigint): [
//         BattlePrivateState,
//         BoardState
//     ] => {
//         privateState.x1 = x1;
//         privateState.x2 = x2;
//         privateState.boardState = BoardState.SET;
//         return [privateState, privateState.boardState];
//     },// end of localSetBoard
//     localCheckBoard: ({
//         privateState
//     }: WitnessContext<Ledger, BattlePrivateState>, x: bigint): [
//         BattlePrivateState,
//         ShotState
//     ] => {
//         let currentShot = ShotState.MISS;// reset to default -- MISS
//         if(x == privateState.x1 || x == privateState.x2){
//             currentShot = ShotState.HIT;// only HIT if it is in fact a HIT
//         }
//         privateState.shotState = currentShot;
//         return [privateState, privateState.shotState];
//     },// end of localCheckBoard
//     localSecretKey: ({
//         privateState
//     }: WitnessContext<Ledger, BattlePrivateState>): [
//         BattlePrivateState,
//         Uint8Array
//     ] => {
//         return [privateState, privateState.sk];
//     },
// };