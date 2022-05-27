import type ChatInputInteraction from "../structures/interactions/ChatInput";
import type { CommandOptions } from "./options";

export type MiddlewareResponse<T extends object> =
  | {
      next: true;
      ctx: T;
    }
  | {
      next: false;
    };

export type MiddlewareFunction<
  T extends CommandOptions | undefined,
  U extends object
> = (ctx: ChatInputInteraction<T, U>) => Promise<MiddlewareResponse<U>>;

export type inferMiddlewareContextType<T extends MiddlewareFunction<any, any>> =
  T extends MiddlewareFunction<any, infer U> ? U : {};

export type inferMiddlewareContextTypes<
  T extends MiddlewareFunction<any, any>[]
> = inferMiddlewareContextType<T[number]>;

export type constructMiddleware<T extends MiddlewareFunction<any, any>[]> = {
  middlewares: T;
};
