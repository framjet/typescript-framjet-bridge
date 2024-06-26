import type { BaseBridgeMessage } from '@framjet-bridge/source';
import type { FramJetBridgeCommand } from '../command';

export interface CommandRequestMessage<TCommand extends FramJetBridgeCommand> extends BaseBridgeMessage {
  type: 'cmd.req';
  id: string;
  name: TCommand['name'];
  input: TCommand['input'];
}

export interface CommandResponseMessage<TCommand extends FramJetBridgeCommand> extends BaseBridgeMessage {
  type: 'cmd.res';
  id: string;
  name: TCommand['name'];
  success: boolean;
  output?: TCommand['output'];
  error?: any;
}
