import type {
  BridgeMessageHandler,
  FramJetBridgeMessage,
  FramJetBridgeMessageTypes,
  MessageTypeFromName,
} from './message';
import { defaultTarget, type IMessageEvent, type ITarget } from './api';
import { type BridgePacket, isBridgePacket } from './packet';

export interface FramJetBridgeOptions {
  initializeTimeout: number;

  pingInterval: number;

  onReady: (bridge: FramJetBridge) => void;

  onDestroy: (bridge: FramJetBridge) => void;

  /**
   * Remote origin that we'll communicate with. It may be set to and
   * defaults to '*'.
   */
  origin: string;

  /**
   * Protocol version that socket will advertise. Defaults to 1.0. You can
   * rev this for compatibility changes between consumers.
   */
  protocolVersion: string;
}

export class FramJetBridge {
  private readonly $bridgeId: string;
  private readonly $target: ITarget;
  private readonly $options: FramJetBridgeOptions;

  private readonly $unsubscribeCallback: () => void;

  private $pingInterval: number | undefined;
  private $messageHandlers = new Map<
    FramJetBridgeMessageTypes,
    Set<BridgeMessageHandler<any>>
  >();

  public isReady: Promise<void>;

  constructor(
    bridgeId: string,
    target?: ITarget,
    options: Partial<FramJetBridgeOptions> = {}
  ) {
    this.$bridgeId = bridgeId;
    this.$target = target;
    this.$options = this.processOptions(options);

    this.$unsubscribeCallback = target.readMessages(this.$listener);

    this.isReady = new Promise((resolve, reject) => {
      const readyTimeout = setTimeout(() => {
        reject(
          new Error(`Failed to initialize FramJetBridge ${this.$bridgeId}`)
        );
      }, this.$options.initializeTimeout);
      const sentReadyInterval = setInterval(() => {
        this.send({
          type: 'ready',
        });
      }, 1000);

      const ready = this.registerHandler('ready', () => {
        clearTimeout(readyTimeout);
        clearInterval(sentReadyInterval);

        resolve();

        this.$options.onReady(this);

        this.registerHandler('ping', (msg) => {
          this.send({
            type: 'pong',
            receivedAt: Date.now(),
            timestamp: msg.timestamp,
          });
        });

        this.$pingInterval = setInterval(() => {
          this.send({
            type: 'ping',
            timestamp: Date.now(),
          });
        }, this.$options.pingInterval);

        ready();
      });

      this.send({
        type: 'ready',
      });
    });
  }

  public static async create(
    bridgeId: string,
    target: ITarget = defaultTarget,
    options: Partial<FramJetBridgeOptions> = {}
  ) {
    const bridge = new FramJetBridge(bridgeId, target, options);

    await bridge.isReady;

    return bridge;
  }

  public destroy(): void {
    if (this.$pingInterval) {
      clearInterval(this.$pingInterval);
    }

    if (this.$unsubscribeCallback) {
      this.$unsubscribeCallback();
    }

    this.$options.onDestroy(this);
  }

  public registerHandler<TName extends FramJetBridgeMessageTypes>(
    name: TName,
    handler: BridgeMessageHandler<MessageTypeFromName<TName>>
  ) {
    let handlers = this.$messageHandlers.get(name);

    if (!handlers) {
      handlers = new Set();

      this.$messageHandlers.set(name, handlers);
    }

    handlers.add(handler);

    return () => {
      handlers.delete(handler);

      if (handlers.size === 0) {
        this.$messageHandlers.delete(name);
      }
    };
  }

  public send<TMessage extends FramJetBridgeMessage>(msg: TMessage): void {
    this.sendPacket({
      __framjet_bridge__: 'framjet-bridge',
      bridgeId: this.$bridgeId,
      message: msg,
    });
  }

  public sendPacket<TMessage extends FramJetBridgeMessage>(
    packet: BridgePacket<TMessage>
  ): void {
    this.$target.postMessage(JSON.stringify(packet), this.$options.origin);
  }

  private $listener = (e: IMessageEvent) => {
    // If we got data that wasn't a string or could not be parsed, or was
    // from a different remote, it's not for us.
    if (
      this.$options.origin &&
      this.$options.origin !== '*' &&
      e.origin !== this.$options.origin
    ) {
      return;
    }

    let packet: BridgePacket<any>;
    try {
      packet = JSON.parse(e.data);
    } catch (e) {
      return;
    }

    if (!isBridgePacket(packet) || packet.bridgeId !== this.$bridgeId) {
      return;
    }

    const msg: FramJetBridgeMessage = packet.message;
    const handlers = this.$messageHandlers.get(msg.type);

    if (handlers) {
      handlers.forEach((handler) => handler(msg, packet, e));
    }
  };

  private processOptions(
    options: Partial<FramJetBridgeOptions> = {}
  ): FramJetBridgeOptions {
    const {
      initializeTimeout = 5000,
      pingInterval = 1000 * 60,
      origin = '*',
      protocolVersion = '1.0.0',
      onReady = () => {
        /* nop */
      },
      onDestroy = () => {
        /* nop */
      },
    } = options;

    return {
      initializeTimeout,
      pingInterval,
      onReady,
      onDestroy,
      origin,
      protocolVersion,
    };
  }
}
