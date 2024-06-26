import type { BaseBridgeMessage } from '../message';

export interface PingMessage extends BaseBridgeMessage {
  type: 'ping';
  timestamp: number;
}

export interface PongMessage extends BaseBridgeMessage {
  type: 'pong';
  receivedAt: number;
  timestamp: number;
}


