import type { PingMessage, PongMessage, ReadyMessage } from './messages';
import type { BridgeCommand } from './command';
import type { CommandRequestMessage, CommandResponseMessage } from './messages/rpc';

export * from './api';
export * from './packet';
export * from './message';
export * from './messages';
export * from './command';
export * from './bridge';
export * from './rpc';

export interface FramJetBridgeMessageTypeRegistry {
  'ping': PingMessage;
  'pong': PongMessage;
  'ready': ReadyMessage;
  'cmd.req': CommandRequestMessage<any>;
  'cmd.res': CommandResponseMessage<any>;
}

export interface FramJetBridgeCommandTypeRegistry {
  'nop': BridgeCommand<'nop', void, void>;
}
