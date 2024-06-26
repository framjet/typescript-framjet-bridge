import type { FramJetBridgeMessageTypeRegistry } from './index';
import type { BridgePacket } from './packet';
import type { IMessageEvent } from './api';

export interface BaseBridgeMessage {
  type: string;
}

export interface BridgeMessageHandler<TMessage extends FramJetBridgeMessage> {
  (msg: TMessage, packet: BridgePacket<TMessage>, event: IMessageEvent): void;
}

export type FramJetBridgeMessageTypes = FramJetBridgeMessage['type'];
export type FramJetBridgeMessage = FramJetBridgeMessageTypeRegistry[keyof FramJetBridgeMessageTypeRegistry];

export type MessageTypeFromName<TName extends FramJetBridgeMessageTypes> = TName extends keyof FramJetBridgeMessageTypeRegistry ? FramJetBridgeMessageTypeRegistry[TName] : never;
