import { BattleSimulator, WalletBuilder } from './battle-simulator.js';
import { NetworkId, setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { describe, it, expect } from 'vitest';
import { startArgs } from './utils.js';
import { BoardState, WinState, TurnState } from '../managed/battleship-simple/contract/index.js'

setNetworkId('undeployed' as NetworkId);

describe('Battleship Tests', () => {
    it('executes the constructor correctly', () => {
        const [x1, x2] = startArgs(2, 4);
        const sim = new BattleSimulator(x1, x2);
        expect(sim.alicePrivateState.x1 == x1 
            && sim.alicePrivateState.x2 == x2).toBeTruthy();

        const ledgerState = sim.getLedger();

        expect(ledgerState.board1.size()).toEqual(2n);
        expect(ledgerState.board1State).toEqual(BoardState.SET);
        expect(ledgerState.winState).toEqual(WinState.CONTINUE_PLAY);
        expect(ledgerState.board2.size()).toEqual(0n);
        expect(ledgerState.board2State).toEqual(BoardState.UNSET);
    });
    it('allows bob to accept the game', () => {
        const [x1, x2] = startArgs(9, 15);
        const sim = new BattleSimulator(x1, x2);

        const [bobX1, bobX2] = startArgs(3, 14);
        const bob = new WalletBuilder(sim.contractAddress, sim.getContractState());
        bob.updatePrivateState(bobX1, bobX2);
        expect(bob.privateState.x1 == bobX1 
            && bob.privateState.x2 == bobX2).toBeTruthy();

        expect(() => {// alice submits her PS again as "bob"
            sim.acceptGame(
                sim.alicePrivateState.x1,
                sim.alicePrivateState.x2,
            );
        }).toThrow("You cannot play against yourself");
    
        sim.switchCallerToBob(bob.callerContext);
        sim.acceptGame(// bob joins
            bob.privateState.x1, 
            bob.privateState.x2,
        );

        const ledgerState = sim.getLedger();
        expect(ledgerState.board2State).toEqual(BoardState.SET);
        expect(ledgerState.board2.size()).toEqual(2n);
        expect(ledgerState.turn).toEqual(TurnState.PLAYER_1_SHOOT);
    });
    it('allows Alice to take the first shot', () => {
        const [x1, x2] = startArgs(18, 13);
        const sim = new BattleSimulator(x1, x2);
        
        const bob = new WalletBuilder(sim.contractAddress, sim.getContractState());
        const [bobX1, bobX2] = startArgs(5, 7);
        bob.updatePrivateState(bobX1, bobX2);

        sim.switchCallerToBob(bob.callerContext);
        sim.acceptGame(
            bob.privateState.x1, 
            bob.privateState.x2,
        );
        
        const ledgerState = sim.getLedger();

        expect(ledgerState.turn).toEqual(TurnState.PLAYER_1_SHOOT);
        expect(() => { // check for shooting out of turn (bob)
            sim.player2Shoot(BigInt(9));
        }).toThrow("It is not player2 turn to shoot");

        sim.setAliceContext(sim.getContractState());
        const aliceShot = BigInt(9);// miss
        sim.player1Shoot(aliceShot);

        const newLedgerState = sim.getLedger();
        expect(newLedgerState.turn).toEqual(TurnState.PLAYER_2_CHECK);
        expect(newLedgerState.player1Shot.head().is_some).toBeTruthy();
        expect(newLedgerState.player1Shot.head().value).toEqual(aliceShot);
        expect(() => { // check for double shot
            sim.player1Shoot(BigInt(10));
        }).toThrow("It is not player1 turn to shoot");
    });
    it('Plays a full game(Alice Wins)', () => {
        const [x1, x2] = startArgs(1, 3);
        const sim = new BattleSimulator(x1, x2);

        const bob = new WalletBuilder(sim.contractAddress, sim.getContractState());
        const [bobX1, bobX2] = startArgs(19, 2);
        bob.updatePrivateState(bobX1, bobX2);

        // verify private state values, acceptGame
        expect(bob.privateState.x1).toEqual(19n);
        expect(bob.privateState.x2).toEqual(2n);
        sim.switchCallerToBob(bob.callerContext);
        sim.acceptGame(bobX1, bobX2);

        // alice looks around the board and cheats, only for testing lols
        const aliceShot = bob.privateState.x1;
        sim.setAliceContext(sim.getContractState());
        sim.player1Shoot(aliceShot);

        const ledgerState = sim.getLedger();
        expect(ledgerState.turn).toEqual(TurnState.PLAYER_2_CHECK);
        expect(ledgerState.player1Shot.head().value).toEqual(aliceShot);

        bob.updateCallerContext(sim.getContractState());
        sim.switchCallerToBob(bob.callerContext);
        sim.checkBoard2(bob.privateState.sk);
        const newLedgerState = sim.getLedger();
        expect(newLedgerState.winState).toEqual(WinState.CONTINUE_PLAY);
        expect(newLedgerState.board2HitCount).toEqual(1n);
        expect(newLedgerState.board2Hits.member(aliceShot)).toBeTruthy();
        expect(newLedgerState.turn).toEqual(TurnState.PLAYER_2_SHOOT);

        const bobShot = BigInt(5);
        sim.player2Shoot(bobShot);

        const nextLedgerState = sim.getLedger();
        expect(nextLedgerState.winState).toEqual(WinState.CONTINUE_PLAY);
        expect(nextLedgerState.turn).toEqual(TurnState.PLAYER_1_CHECK);
        expect(nextLedgerState.player2Shot.head().is_some).toBeTruthy();
        expect(nextLedgerState.player2Shot.head().value).toEqual(bobShot);

        sim.setAliceContext(sim.getContractState());
        sim.checkBoard1(sim.alicePrivateState.sk);
        const nextNextLedgerState = sim.getLedger();
        expect(nextNextLedgerState.winState).toEqual(WinState.CONTINUE_PLAY);
        expect(nextNextLedgerState.turn).toEqual(TurnState.PLAYER_1_SHOOT);
        expect(nextNextLedgerState.player2Shot.head().is_some).toBeFalsy();

        expect(() => {
            sim.player1Shoot(bob.privateState.x1);
        }).toThrow("Cheat Detected: Player1: Attempt to repeat a previous HIT");

        sim.player1Shoot(bob.privateState.x2);
        const finalLedgerState = sim.getLedger();
        expect(finalLedgerState.turn).toEqual(TurnState.PLAYER_2_CHECK);

        bob.updateCallerContext(sim.getContractState());
        sim.switchCallerToBob(bob.callerContext);
        sim.checkBoard2(bob.privateState.sk);
        const finalFinalLedgerState = sim.getLedger();
        expect(finalFinalLedgerState.winState).toEqual(WinState.PLAYER_1_WINS);
        expect(finalFinalLedgerState.board2HitCount).toEqual(2n);
        expect(finalFinalLedgerState.board2Hits.member(bob.privateState.x1));
        expect(finalFinalLedgerState.board2Hits.member(bob.privateState.x2));
        expect(() => {
            sim.player2Shoot(BigInt(10));
        }).toThrow("A winner has already been declared");
    });
    it('Plays a full game(Bob Wins)', () => {
        const [x1, x2] = startArgs(1, 2);
        const sim = new BattleSimulator(x1, x2);
        expect(sim.alicePrivateState.x1).toEqual(x1);
        expect(sim.alicePrivateState.x2).toEqual(x2);

        const bob = new WalletBuilder(sim.contractAddress, sim.getContractState());
        const [bobX1, bobX2] = startArgs(10, 11);
        bob.updatePrivateState(bobX1, bobX2);
        sim.switchCallerToBob(bob.callerContext);
        sim.acceptGame(bobX1, bobX2);

        // switch back to alice
        sim.setAliceContext(sim.getContractState());
        sim.player1Shoot(BigInt(9));
        // switch to bob
        bob.updateCallerContext(sim.getContractState());
        sim.switchCallerToBob(bob.callerContext);
        sim.checkBoard2(bob.privateState.sk);

        const ledgerState = sim.getLedger();
        expect(ledgerState.board2HitCount).toEqual(0n);

        // pass in a HIT
        sim.player2Shoot(sim.alicePrivateState.x1);

        // switch to Alice
        sim.setAliceContext(sim.getContractState());
        sim.checkBoard1(sim.alicePrivateState.sk);
        const nextLedgerState = sim.getLedger();
        expect(nextLedgerState.board1HitCount).toEqual(1n);
        expect(nextLedgerState.board1Hits.member(sim.alicePrivateState.x1)).toBeTruthy();

        sim.player1Shoot(BigInt(5));

        // switch to bob
        bob.updateCallerContext(sim.getContractState());
        sim.switchCallerToBob(bob.callerContext);
        sim.checkBoard2(bob.privateState.sk);
        expect(() => {
            sim.player2Shoot(sim.alicePrivateState.x1);
        }).toThrow("Cheat Detected: Player2: Attempt to repeat a previous HIT");

        // bob should win
        sim.player2Shoot(sim.alicePrivateState.x2);

        // switch to alice
        sim.setAliceContext(sim.getContractState());
        sim.checkBoard1(sim.alicePrivateState.sk);
        const finalLedgerState = sim.getLedger();
        expect(finalLedgerState.board1HitCount).toEqual(2n);
        expect(finalLedgerState.winState).toEqual(WinState.PLAYER_2_WINS);
        expect(() => {
            sim.player1Shoot(BigInt(19));
        }).toThrow("A winner has already been declared");
    });
    it('forces ships on the board to both players', () => {
        expect(() => {
            const sim = new BattleSimulator(BigInt(0), BigInt(1));
        }).toThrow("No zero index, board starts at 1");

        expect(() => {
            const sim = new BattleSimulator(BigInt(1), BigInt(0));
        }).toThrow("No zero index, board starts at 1");

        expect(() => {
            const sim = new BattleSimulator(BigInt(1), BigInt(1));
        }).toThrow("Cannot use the same number twice");

        expect(() => {
            const sim = new BattleSimulator(BigInt(21), BigInt(1));
        }).toThrow("Out of bounds, please keep ships on the board");

        expect(() => {
            const sim = new BattleSimulator(BigInt(1), BigInt(21));
        }).toThrow("Out of bounds, please keep ships on the board");

        const [x1, x2] = startArgs(12, 15);
        const sim = new BattleSimulator(x1, x2);
        const bob = new WalletBuilder(sim.contractAddress, sim.getContractState());
        sim.switchCallerToBob(bob.callerContext);

        expect(() => {
            sim.acceptGame(BigInt(0), BigInt(1));
        }).toThrow("No zero index, please keep ships on the board");

        expect(() => {
            sim.acceptGame(BigInt(1), BigInt(0));
        }).toThrow("No zero index, please keep ships on the board");

        expect(() => {
            sim.acceptGame(BigInt(2), BigInt(2));
        }).toThrow("Cannot use the same number twice");
        
        expect(() => {
            sim.acceptGame(BigInt(21), BigInt(2));
        }).toThrow("Out of bounds, please keep ships on the board");
        
        expect(() => {
            sim.acceptGame(BigInt(2), BigInt(21));
        }).toThrow("Out of bounds, please keep ships on the board");
        
    });
});