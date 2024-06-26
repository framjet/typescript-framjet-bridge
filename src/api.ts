/**
 * Describes a PostMessage event that the RPC will read. A subset of the
 * MessageEvent DOM type.
 */
export interface IMessageEvent {
  data: any;
  origin: string;
}

/**
 * IPostable is an interface that describes something to which we can send a
 * browser postMessage. It's implemented by the `window`, and is mocked
 * in tests.
 */
export interface ITarget {
  postMessage(data: any, targetOrigin: string): void;

  /**
   * Takes a callback invoked to invoke whenever a message is received,
   * and returns a function which can be used to unsubscribe the callback.
   */
  readMessages(callback: (ev: IMessageEvent) => void): () => void;
}

export function createTarget(contentWindow: Window): ITarget {
  return {
    readMessages(callback) {
      contentWindow.addEventListener('message', callback);

      return () => contentWindow.removeEventListener('message', callback);
    },
    postMessage(data: any, targetOrigin: string) {
      contentWindow.postMessage(data, targetOrigin);
    }
  };
}

/**
 * Default `IReceivable` implementation that listens on the window.
 */
export const defaultTarget = createTarget(window);
