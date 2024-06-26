import type { FramJetBridge } from './bridge';
import type {
  BridgeCommandHandler,
  BridgeCommandReject,
  BridgeCommandRequest,
  BridgeCommandResolve,
  CommandTypeFromName,
  FramJetBridgeCommandTypes,
} from './command';

function isPromiseLike(obj: unknown): obj is PromiseLike<any> {
  return (
    obj != null &&
    (typeof obj === 'object' || typeof obj === 'function') &&
    'then' in obj &&
    typeof obj.then === 'function'
  );
}

function serializeError(error: Error): object {
  return {
    __framjet_bridge_error__: true,
    name: error.name,
    message: error.message,
    stack: error.stack,
    cause: error.cause && serializeError(error.cause as Error),
    ...error, // This will include any custom properties added to the error
  };
}

function deserializeError(serializedError: any): Error {
  const error = new Error(serializedError.message);
  error.name = serializedError.name;
  error.stack = serializedError.stack;
  if (serializedError.cause) {
    error.cause = deserializeError(serializedError.cause);
  }

  // Restore any custom properties
  Object.assign(error, serializedError);

  return error;
}

export class FramJetBridgeRPC {
  private readonly $bridge: FramJetBridge;

  private readonly $commands = new Map<
    FramJetBridgeCommandTypes,
    BridgeCommandHandler<any>
  >();
  private readonly $commandRequests = new Map<
    string,
    BridgeCommandRequest<any>
  >();

  constructor(bridge: FramJetBridge) {
    this.$bridge = bridge;

    this.$bridge.registerHandler('cmd.req', (req) => {
      const command = this.$commands.get(req.name);

      if (command === undefined) {
        this.$sendResponse(
          req.id,
          req.name,
          false,
          undefined,
          new Error(`Command with name "${req.name}" doesn't exist`)
        );

        return;
      }

      command(
        req.input,
        (value) => {
          if (isPromiseLike(value)) {
            value.then(
              (v) => {
                this.$sendResponse(req.id, req.name, true, v);
              },
              (e) => {
                this.$sendResponse(req.id, req.name, false, undefined, e);
              }
            );
          } else {
            this.$sendResponse(req.id, req.name, true, value);
          }
        },
        (reason) => {
          this.$sendResponse(req.id, req.name, false, undefined, reason);
        }
      );
    });

    this.$bridge.registerHandler('cmd.res', (res) => {
      const request = this.$commandRequests.get(res.id);

      if (request === undefined) {
        console.error(
          `FramJetBridgeRPC: Command request "${res.id}" for command "${res.name}" does not exist`
        );
        return;
      }

      this.$commandRequests.delete(res.id);

      if (res.success) {
        request[0](res.output);
      } else {
        if ('__framjet_bridge_error__' in res.error) {
          const { __framjet_bridge_error__: _, ...rest } = res.error;

          request[1](deserializeError(rest));
        } else {
          request[1](res.error);
        }
      }
    });

    this.register('nop', (_, r) => r());
  }

  public register<TName extends FramJetBridgeCommandTypes>(
    name: TName,
    handler: BridgeCommandHandler<CommandTypeFromName<TName>>
  ) {
    if (this.$commands.has(name)) {
      throw new Error(
        `FramJetBridgeRPC: Command "${name}" is already registered`
      );
    }

    this.$commands.set(name, handler);

    return () => {
      this.$commands.delete(name);
    };
  }

  public call<
    TName extends FramJetBridgeCommandTypes,
    TCommand extends CommandTypeFromName<TName>
  >(name: TName, input: TCommand['input'], timeout = 3000) {
    const id = crypto.randomUUID();

    const promise = new Promise<TCommand['output']>((resolve, reject) => {
      const timeoutNr = setTimeout(() => {
        reject(new Error('FramJetBridgeRPC: Timeout'));
      }, timeout);

      const wrappedResolve: BridgeCommandResolve<TCommand['output']> = (
        value
      ) => {
        clearTimeout(timeoutNr);

        this.$commandRequests.delete(id);

        return resolve(value);
      };

      const wrappedReject: BridgeCommandReject = (reason) => {
        clearTimeout(timeoutNr);

        this.$commandRequests.delete(id);

        reject(reason);
      };

      this.$commandRequests.set(id, [wrappedResolve, wrappedReject]);
    });

    this.$bridge.send({
      type: 'cmd.req',
      id,
      name,
      input,
    });

    return promise;
  }

  private $sendResponse(
    id: string,
    name: string,
    success: boolean,
    output?: any,
    error?: any
  ) {
    this.$bridge.send({
      type: 'cmd.res',
      id: id,
      name: name,
      success: success,
      error: error instanceof Error ? serializeError(error) : error,
      output,
    });
  }
}
