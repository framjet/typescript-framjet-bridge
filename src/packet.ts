import type { FramJetBridgeMessage } from './message';

export interface BridgePacket<TMessage extends FramJetBridgeMessage> {
  __framjet_bridge__: 'framjet-bridge';
  senderId: string;
  bridgeId: string;
  message: TMessage;
}

export function isBridgePacket(data: unknown): data is BridgePacket<any> {
  return (
    data != null &&
    typeof data === 'object' &&
    '__framjet_bridge__' in data &&
    'senderId' in data &&
    'bridgeId' in data &&
    'message' in data &&
    data['__framjet_bridge__'] === 'framjet-bridge' &&
    data['senderId'] != null &&
    data['bridgeId'] != null &&
    data['message'] != null &&
    typeof data['senderId'] === 'string' &&
    typeof data['bridgeId'] === 'string' &&
    typeof data['message'] === 'object' &&
    'type' in data['message']
  );
}
