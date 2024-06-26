import type { BaseBridgeMessage } from '@framjet-bridge/source';

export interface ReadyMessage extends BaseBridgeMessage {
  type: 'ready';
}
