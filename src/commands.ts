import {
  APIChannel,
  APIGuildMember,
  APIRole,
  APIUser,
  ApplicationCommandOptionType,
  ChannelType,
} from "discord-api-types";

export interface BaseCommandOption<T extends boolean> {
  description: string;
  required?: T;
  type: ApplicationCommandOptionType;
}

export interface StringCommandOption<
  T extends Record<string, Box<string>> | undefined,
  U extends boolean
> extends BaseCommandOption<U> {
  type: ApplicationCommandOptionType.String;
  choices?: T;
}

export interface IntegerCommandOption<
  T extends Record<string, Box<number>> | undefined,
  U extends boolean
> extends BaseCommandOption<U> {
  type: ApplicationCommandOptionType.Integer;
  minValue?: number;
  maxValue?: number;
  choices?: T;
}

export interface BooleanCommandOption<T extends boolean>
  extends BaseCommandOption<T> {
  type: ApplicationCommandOptionType.Boolean;
}

export interface UserCommandOption<T extends boolean>
  extends BaseCommandOption<T> {
  type: ApplicationCommandOptionType.User;
}

export interface ChannelCommandOption<T extends boolean>
  extends BaseCommandOption<T> {
  type: ApplicationCommandOptionType.Channel;
  types?: ChannelType[];
}

export interface RoleCommandOption<T extends boolean>
  extends BaseCommandOption<T> {
  type: ApplicationCommandOptionType.Role;
}

export interface MentionableCommandOption<T extends boolean>
  extends BaseCommandOption<T> {
  type: ApplicationCommandOptionType.Mentionable;
}

export interface NumberCommandOption<
  T extends Record<string, Box<number>> | undefined,
  U extends boolean
> extends BaseCommandOption<U> {
  type: ApplicationCommandOptionType.Number;
  minValue?: number;
  maxValue?: number;
  choices?: T;
}

type CommandOption<T extends boolean> =
  | StringCommandOption<any, T>
  | IntegerCommandOption<any, T>
  | BooleanCommandOption<T>
  | UserCommandOption<T>
  | ChannelCommandOption<T>
  | RoleCommandOption<T>
  | MentionableCommandOption<T>
  | NumberCommandOption<any, T>;

type CommandOptionsWithChoices<
  U extends Record<string, Box<any>>,
  T extends boolean
> =
  | StringCommandOption<U, T>
  | IntegerCommandOption<U, T>
  | NumberCommandOption<U, T>;

type inferBaseOption<T extends CommandOption<boolean>> =
  T extends StringCommandOption<any, any>
    ? string
    : T extends IntegerCommandOption<any, any>
    ? number
    : T extends BooleanCommandOption<any>
    ? boolean
    : T extends UserCommandOption<any>
    ? APIGuildMember
    : T extends ChannelCommandOption<any>
    ? APIChannel
    : T extends RoleCommandOption<any>
    ? APIRole
    : T extends MentionableCommandOption<any>
    ? APIGuildMember | APIRole
    : T extends NumberCommandOption<any, any>
    ? number
    : never;

type Box<T extends string | number> = { value: T };
type Unbox<T extends Box<any>> = T["value"];
export const literal = <T extends string | number>(value: T): Box<T> => ({
  value,
});

type inferRequiredOption<T extends CommandOption<boolean>> =
  T extends CommandOption<true>
    ? inferBaseOption<T>
    : inferBaseOption<T> | undefined;

type inferOption<T extends CommandOption<boolean>> =
  T extends CommandOptionsWithChoices<infer U, any>
    ? [U] extends [undefined]
      ? inferRequiredOption<T>
      : T extends CommandOption<true>
      ? Unbox<U[keyof U]>
      : Unbox<U[keyof U]> | undefined
    : inferRequiredOption<T>;

type inferOptions<T extends Record<string, CommandOption<boolean>>> = {
  [K in keyof T]: inferOption<T[K]>;
};

type inferCommand<T extends Command<any>> = T extends Command<infer U>
  ? inferOptions<U>
  : never;

export interface Command<T extends Record<string, CommandOption<boolean>>> {
  name: string;
  description: string;
  options?: T;
  handler: (ctx: { options: inferOptions<T> }) => void;
}

export const options = {
  string<T extends Record<string, Box<string>> | undefined, U extends boolean>(
    options: Omit<StringCommandOption<T, U>, "type">
  ): StringCommandOption<T, U> {
    return { ...options, type: ApplicationCommandOptionType.String };
  },
  integer<T extends Record<string, Box<number>> | undefined, U extends boolean>(
    options: Omit<IntegerCommandOption<T, U>, "type">
  ): IntegerCommandOption<T, U> {
    return { ...options, type: ApplicationCommandOptionType.Integer };
  },
  boolean<U extends boolean>(
    options: Omit<BooleanCommandOption<U>, "type">
  ): BooleanCommandOption<U> {
    return { ...options, type: ApplicationCommandOptionType.Boolean };
  },
  user<U extends boolean>(
    options: Omit<UserCommandOption<U>, "type">
  ): UserCommandOption<U> {
    return { ...options, type: ApplicationCommandOptionType.User };
  },
  channel<U extends boolean>(
    options: Omit<ChannelCommandOption<U>, "type">
  ): ChannelCommandOption<U> {
    return { ...options, type: ApplicationCommandOptionType.Channel };
  },
  role<U extends boolean>(
    options: Omit<RoleCommandOption<U>, "type">
  ): RoleCommandOption<U> {
    return { ...options, type: ApplicationCommandOptionType.Role };
  },
  mentionable<U extends boolean>(
    options: Omit<MentionableCommandOption<U>, "type">
  ): MentionableCommandOption<U> {
    return { ...options, type: ApplicationCommandOptionType.Mentionable };
  },
  number<T extends Record<string, Box<number>> | undefined, U extends boolean>(
    options: Omit<NumberCommandOption<T, U>, "type">
  ): NumberCommandOption<T, U> {
    return { ...options, type: ApplicationCommandOptionType.Number };
  },
};

export const command = <T extends Record<string, CommandOption<boolean>>>(
  options: Command<T>
): Command<T> => {
  return options;
};

const a = command({
  name: "owo",
  description: "UwU",
  options: {
    name: options.string({
      description: "UwU Me!",
      required: true,
      choices: {
        owo: literal("uwu"),
      },
    }),
    cost: options.number({
      description: "cost of u",
      required: true,
    }),
    user: options.user({
      description: "ur mom",
      required: false,
    }),
  },
  handler: (ctx) => {
    ctx.options.user;
  },
});

type owo = inferCommand<typeof a>;
