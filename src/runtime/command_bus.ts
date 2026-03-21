// runtime/command_bus.ts
// Central command dispatch registry

import { CommandResult, RuntimeContext } from "./models";

type CommandHandler = (
  payload: Record<string, any>,
  context: RuntimeContext
) => Promise<CommandResult> | CommandResult;

export class CommandBus {
  private handlers: Map<string, CommandHandler> = new Map();

  register(command_name: string, handler: CommandHandler): void {
    if (this.handlers.has(command_name)) {
      throw new Error(`Handler already registered for command: ${command_name}`);
    }
    this.handlers.set(command_name, handler);
  }

  async dispatch(
    command_name: string,
    payload: Record<string, any>,
    context: RuntimeContext
  ): Promise<CommandResult> {
    const handler = this.handlers.get(command_name);
    if (!handler) {
      return {
        success: false,
        error: `No handler registered for command: ${command_name}`,
        error_code: "COMMAND_NOT_FOUND",
      };
    }

    try {
      const result = await handler(payload, context);
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        error_code: "HANDLER_ERROR",
      };
    }
  }

  listRegisteredCommands(): string[] {
    return Array.from(this.handlers.keys());
  }
}