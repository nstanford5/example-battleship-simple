# Battleship Tutorial

- Private State management
- Intermediate Witness functions
- 

This tutorial covers a line-by-line walkthrough of the Compact code and the supporting frontend test suite. It does not cover any UI implementation.

## Prerequisites

Before you begin this tutorial, esure you have:
- [installed the toolchain](../../getting-started/installation)
- Node.js v22+

This is an intermediate tutorial, ensure you have completed the beginner tutorials if needed:
- [hello-world](../../getting-started/hello-world)
- [private-party](../tutorials/private-party)

## Problem Analysis


## Program Design


## Compact Tutorial



### Setup

Create the project root folder and `package.json`:
```bash
mkdir example-battleship && cd example-battleship
touch package.json 
```

Add the following to `package.json`:
```json
{
  "name": "example-battleship",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "workspaces": [
    "contracts"
  ],
  "scripts": {
    "test": "vitest"
  },
  "devDependencies": {
    "@types/node": "^25.3.2",
    "testcontainers": "^11.12.0",
    "ts-node": "^10.9.2",
    "typescript": "^5.9.3",
    "vitest": "^4.0.18"
  },
  "dependencies": {
    "@midnight-ntwrk/compact-runtime": "0.14.0",
    "@midnight-ntwrk/midnight-js-network-id": "3.1.0",
    "@midnight-ntwrk/compact-js": "2.4.0"
  }
}
```

Install the depedencies:
```bash
npm install
```

Set up for Compact code:
```bash
mkdir contracts && cd contracts
mkdir src && cd src
touch battleship-simple.compact
```
Open the `.compact` file in your text editor and start with some declarations:
```compact
pragma language_version 0.21;
import CompactStandardLibrary;

@TODO enums here...
```
- line 1
- line 2

### Identifier declarations

Now we'll declare the public ledger identifiers and their types:
```compact
```


### Witness function signature

Add the witness function signature:
```compact
```


### Party Constructor

Let's construct this party by defining its initial state through the constructor:
```compact

```

### Add Circuit


### Add 


### Some circuit



### Some circuit

That's all folks, that's all of the Compact code we need to start our private party contract in about 75 lines. Let's make sure the program compiles, from the `src` directory:
```bash
compact compile battleship-simple.compact managed/battleship-simple
```

Should produce output like this:
```terminal
Compiling n circuits:

```
:::note
If compilation was not successful, work with the compiler output to determine where the error may exist in your code. A lot of lessons can be learned by fighting the compiler.
:::

After successful compilation, you should see new directories for the compiled contract artifacts:
```
contracts/
├── src/
|   └── managed/
|       └── battleship-simple/
|           ├── compiler/
|           ├── contract/
|           ├── keys/
|           └── zkir/
└── battleship-simple.compact
```

Now that the contract compiles correctly, let's move on to defining the witness functions.

## TS config

Before writing any Typescript, make sure to create the config file in the `contracts` directory:
```bash
touch contracts/tsconfig.json
```

Populate the config file:
```json
{
  "include": ["src/**/*.ts"],
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist",
    "declaration": true,
    "lib": ["ESNext"],
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "node",
    "allowJs": true,
    "forceConsistentCasingInFileNames": true,
    "noImplicitAny": true,
    "strict": true,
    "isolatedModules": true,
    "sourceMap": true,
    "resolveJsonModule": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  }
}
```

## Witness


## Battle Simulator
In order to run many tests against our private-party contract, we'll need to create a class that will be used to initiate different test cases.

```bash
cd contracts/src
mkdir test && cd test
touch battle-simulator.ts
```

Open the battle-simulator.ts file in your VSCode

### Imports
```ts
```

Now let's write the simulator class.

## Test using the Simulator

Create the scaffolding for necessary class components:
```ts
export class BattleSimulator {

    constructor() {

    }
}
```

Let's define the type for our new contract and create a new instance:
```ts
export class BattleSimulator {
    readonly contract: Contract<BattlePrivateState>;

    constructor() {
        this.contract = new Contract<BattlePrivateState>(witnesses);
    }
}
```

Now we create the initial state of our contract:
```ts
```

Now we need to provide context for the circuits, based on the returns from our initial state:
```ts
```
Full constructor:
```ts
```

Now we need to create functions in our simulator for the circuits in our contract, add this just below the constructor:
```ts

```
Here we demonstrate the shape of circuit calls, what would the other definitions look like? Be sure to try them yourself before looking up the solution below -- the rest have very similar types and data shapes, with only some minor differences.


Now the solutions:
```ts

```

It will also be useful to define some helper functions for use in our tests, add these after your `chainStartParty` function:
```ts

```

And that is all for Simulator code -- we can now create instances of our party contract quickly and efficiently! Let's finish the setup before moving on to writing tests.

### More setup

Create the `src/index.ts` file:
```bash
touch src/index.ts
```

Populate the `index.ts` file: @TODO -- do I need this?
```ts
```

Create the `vitest.config.ts` file:
```bash
touch contracts/vitest.config.ts
```

Populate the testing config file:
```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  mode: "node",
  test: {
    deps: {
      interopDefault: true
    },
    globals: true,
    environment: "node",
    include: ["**/*.test.ts"],
    exclude: ["node_modules"],
    root: ".",
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      thresholds: {
        branches: 50,
        functions: 73,
        lines: 72,
        statements: -269
      }
    },
    reporters: ["default", ["junit", { outputFile: "reports/report.xml" }]]
  },
  resolve: {
    extensions: [".ts", ".js"],
    conditions: ["import", "node", "default"]
  }
});
```

Save the file and we'll move on to writing some tests.

### Write Tests



First, let's create our test file:
```bash
touch test/battle.test.ts
```

Declare imports (this may be tempting to copy/paste, but you should write these out by hand to better understand the location and purpose of specific imports):
```ts
```

Set the networkId to undeployed:
```ts
setNetworkId('undeployed' as NetworkId);
```

Scaffold the test and write your first test case:
```ts

```

This tests that the constructor runs properly and that ledger values are set correctly after the constructor executes. Execute the test suite by navigating to the `test` directory and running:
```bash
npm run test
```

What other tests should be run? Spend some time looking over the smart contract and writing some tests. Maybe the next one should be:
```ts
// next test
```

Make sure to write as many tests as you can think of!