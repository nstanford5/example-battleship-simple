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
import { witnesses } from './witnesses.js';

const currentDir = path.resolve(new URL(import.meta.url).pathname, '..');
export const zkConfigPath = path.resolve(currentDir, 'managed', 'battleship');

export const CompiledBattleshipContract = CompiledContract.make(
    'BattleshipContract',
    Contract,
).pipe(
    CompiledContract.withWitnesses(witnesses),
    CompiledContract.withCompiledFileAssets(zkConfigPath),
)