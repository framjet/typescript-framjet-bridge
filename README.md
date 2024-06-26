# @framjet/bridge

FramJet Bridge is a lightweight TypeScript library that provides seamless bridge communication and RPC functionality using the `window.postMessage` interface. It's designed to facilitate communication between different contexts, such as between a parent window and an iframe, or between two separate windows.

## Features

- Easy-to-use bridge communication
- RPC (Remote Procedure Call) support
- Ping-pong functionality for connection health checks
- Customizable message handlers
- TypeScript support with strong typing

## Installation

You can install `@framjet/bridge` using your preferred package manager:

npm:
```bash
npm install @framjet/bridge
```

Yarn:
```bash
yarn add @framjet/bridge
```

pnpm:
```bash
pnpm add @framjet/bridge
```

## Usage

### Registering Custom Messages and Commands

Before using the bridge, you need to register your custom messages and commands. This is done using the `declare module` syntax to extend the existing interfaces:

```typescript
import '@framjet/bridge';
import type { BridgeCommand, BaseBridgeMessage } from '@framjet/bridge';

interface CustomMessage extends BaseBridgeMessage {
  type: 'custom-message';
  data: string;
};

declare module '@framjet/bridge' {
  interface FramJetBridgeMessageTypeRegistry {
    'custom-message': CustomMessage;
  }

  interface FramJetBridgeCommandTypeRegistry {
    'multiply': BridgeCommand<'multiply', { a: number; b: number }, number>;
  }
}
```

### Basic Bridge Setup

```typescript
import { FramJetBridge, createTarget } from '@framjet/bridge';

// Create a bridge in the parent window
const parentBridge = await FramJetBridge.create('my-bridge-id');

// Create a bridge in the child iframe
const iframe = document.querySelector('iframe');
const iframeTarget = createTarget(iframe.contentWindow);
const childBridge = await FramJetBridge.create('my-bridge-id', iframeTarget);

// Send a message from parent to child
parentBridge.send({
  type: 'custom-message',
  data: 'Hello from parent!'
});

// Register a message handler in the child
childBridge.registerHandler('custom-message', (msg) => {
  console.log('Received message:', msg.data);
});
```

### Using RPC

```typescript
import { FramJetBridge, FramJetBridgeRPC } from '@framjet/bridge';

// Set up bridges as shown in the previous example

// Create RPC instances
const parentRPC = new FramJetBridgeRPC(parentBridge);
const childRPC = new FramJetBridgeRPC(childBridge);

// Register a command handler in the child
childRPC.register('multiply', (input, resolve) => {
  const result = input.a * input.b;
  resolve(result);
});

// Call the command from the parent
async function multiplyNumbers() {
  try {
    const result = await parentRPC.call('multiply', { a: 5, b: 3 });
    console.log('Result:', result); // Output: Result: 15
  } catch (error) {
    console.error('RPC call failed:', error);
  }
}

multiplyNumbers();
```

## API Reference

### FramJetBridge

The main class for creating and managing bridge communication.

| Method                                                                                                                      | Description                                                                                    |
|-----------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------|
| `FramJetBridge.create(bridgeId: string, target?: ITarget, options?: Partial<FramJetBridgeOptions>): Promise<FramJetBridge>` | Creates a new bridge instance.                                                                 |
| `bridge.send(msg: FramJetBridgeMessage): void`                                                                              | Sends a message through the bridge.                                                            |
| `bridge.registerHandler(name: string, handler: BridgeMessageHandler): () => void`                                           | Registers a handler for a specific message type. Returns a function to unregister the handler. |
| `bridge.destroy(): void`                                                                                                    | Destroys the bridge, cleaning up resources.                                                    |

### FramJetBridgeRPC

Provides RPC functionality on top of FramJetBridge.

| Method                                                                  | Description                                                                |
|-------------------------------------------------------------------------|----------------------------------------------------------------------------|
| `new FramJetBridgeRPC(bridge: FramJetBridge)`                           | Creates a new RPC instance for the given bridge.                           |
| `rpc.register(name: string, handler: BridgeCommandHandler): () => void` | Registers a command handler. Returns a function to unregister the handler. |
| `rpc.call(name: string, input: any, timeout?: number): Promise<any>`    | Calls a remote command and returns a promise with the result.              |

## Configuration

You can customize the bridge behavior by passing options to the `FramJetBridge.create` method:

```typescript
const bridge = await FramJetBridge.create('my-bridge-id', target, {
    initializeTimeout: 10000, // 10 seconds
    pingInterval: 30000, // 30 seconds
    origin: 'https://trusted-domain.com',
    onReady: (bridge) => {
      console.log('Bridge is ready!');
    }
});
```

## Contributing

Contributions to `@framjet/bridge` are welcome! If you encounter any issues or have suggestions for improvements, please feel free to submit a pull request or open an issue on the project's repository.

## License
This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.
