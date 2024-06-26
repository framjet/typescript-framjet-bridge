import type { FramJetBridgeCommandTypeRegistry } from './index';

export interface BridgeCommand<TName extends string, TInput, TOutput> {
  name: TName,
  input: TInput,
  output: TOutput,
}

export interface BridgeCommandHandler<TCommand extends FramJetBridgeCommand> {
  (
    input: TCommand['input'],
    resolve: BridgeCommandResolve<TCommand['output']>,
    reject: BridgeCommandReject,
  ): void;
}

export type BridgeCommandResolve<T> = (value: T | PromiseLike<T>) => void;
export type BridgeCommandReject = (reason?: any) => void;
export type BridgeCommandRequest<T> = [BridgeCommandResolve<T>, BridgeCommandReject];

export type FramJetBridgeCommandTypes = FramJetBridgeCommand['name'];
export type FramJetBridgeCommand = FramJetBridgeCommandTypeRegistry[keyof FramJetBridgeCommandTypeRegistry];

export type CommandTypeFromName<TName extends FramJetBridgeCommandTypes> = TName extends keyof FramJetBridgeCommandTypeRegistry ? FramJetBridgeCommandTypeRegistry[TName] : never;
