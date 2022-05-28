import type ChatInputInteraction from "../structures/interactions/chatInput";
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
  DMPermission extends boolean | undefined,
  CmdOpts extends CommandOptions | undefined,
  Ctx extends object
> = (
  ctx: ChatInputInteraction<DMPermission, CmdOpts, Ctx>
) => Promise<MiddlewareResponse<Ctx>>;

export type inferMiddlewareContextType<
  DMPermission extends boolean | undefined,
  T extends MiddlewareFunction<DMPermission, any, any>
> = T extends MiddlewareFunction<DMPermission, any, infer U> ? U : {};

export type inferMiddlewareContextTypes<
  DMPermission extends boolean | undefined,
  T extends MiddlewareFunction<DMPermission, any, any>[]
> = inferMiddlewareContextType<DMPermission, T[number]>;

export type constructMiddleware<
  DMPermission extends boolean | undefined,
  T extends MiddlewareFunction<DMPermission, any, any>[]
> = {
  middlewares: T;
};
