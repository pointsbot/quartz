import {
  APIInteractionDataResolvedChannel,
  APIRole,
  ApplicationCommandOptionType,
  ChannelType,
} from "discord-api-types/v10";
import type Member from "../structures/Member";
import type User from "../structures/User";
import type { Box, Unbox } from "./utils";

export type OptionChoices<ChoiceType extends number | string> = Record<
  string,
  Box<ChoiceType>
>;
export type CommandOptions = Record<string, CommandOption<boolean | undefined>>;

export interface BaseCommandOption<Required extends boolean | undefined> {
  description: string;
  required?: Required | undefined;
  type: ApplicationCommandOptionType;
}

export interface StringCommandOption<
  Required extends boolean | undefined,
  Choices extends OptionChoices<string> | undefined
> extends BaseCommandOption<Required> {
  type: ApplicationCommandOptionType.String;
  choices?: Choices | undefined;
}

export interface IntegerCommandOption<
  Required extends boolean | undefined,
  Choices extends OptionChoices<number> | undefined
> extends BaseCommandOption<Required> {
  type: ApplicationCommandOptionType.Integer;
  minValue?: number | undefined;
  maxValue?: number | undefined;
  choices?: Choices | undefined;
}

export interface BooleanCommandOption<Required extends boolean | undefined>
  extends BaseCommandOption<Required> {
  type: ApplicationCommandOptionType.Boolean;
}

export interface UserCommandOption<Required extends boolean | undefined>
  extends BaseCommandOption<Required> {
  type: ApplicationCommandOptionType.User;
}

export interface ChannelCommandOption<Required extends boolean | undefined>
  extends BaseCommandOption<Required> {
  type: ApplicationCommandOptionType.Channel;
  types?: ChannelType[] | undefined;
}

export interface RoleCommandOption<Required extends boolean | undefined>
  extends BaseCommandOption<Required> {
  type: ApplicationCommandOptionType.Role;
}

export interface MentionableCommandOption<Required extends boolean | undefined>
  extends BaseCommandOption<Required> {
  type: ApplicationCommandOptionType.Mentionable;
}

export interface NumberCommandOption<
  Required extends boolean | undefined,
  Choices extends OptionChoices<number> | undefined
> extends BaseCommandOption<Required> {
  type: ApplicationCommandOptionType.Number;
  minValue?: number | undefined;
  maxValue?: number | undefined;
  choices?: Choices | undefined;
}

export type CommandOption<Required extends boolean | undefined> =
  | StringCommandOption<Required, OptionChoices<string>>
  | IntegerCommandOption<Required, OptionChoices<number>>
  | BooleanCommandOption<Required>
  | UserCommandOption<Required>
  | ChannelCommandOption<Required>
  | RoleCommandOption<Required>
  | MentionableCommandOption<Required>
  | NumberCommandOption<Required, OptionChoices<number>>;

export type CommandOptionsWithChoices<
  Required extends boolean | undefined,
  Choices extends OptionChoices<string | number>
> = Choices extends OptionChoices<string>
  ? StringCommandOption<Required, Choices>
  : Choices extends OptionChoices<number>
  ?
      | IntegerCommandOption<Required, Choices>
      | NumberCommandOption<Required, Choices>
  : never;

export type inferBaseOption<CmdOpt extends CommandOption<boolean>> =
  CmdOpt extends StringCommandOption<CmdOpt["required"], any>
    ? string
    : CmdOpt extends IntegerCommandOption<CmdOpt["required"], any>
    ? number
    : CmdOpt extends BooleanCommandOption<CmdOpt["required"]>
    ? boolean
    : CmdOpt extends UserCommandOption<CmdOpt["required"]>
    ? Member & { user: User }
    : CmdOpt extends ChannelCommandOption<CmdOpt["required"]>
    ? APIInteractionDataResolvedChannel
    : CmdOpt extends RoleCommandOption<CmdOpt["required"]>
    ? APIRole
    : CmdOpt extends MentionableCommandOption<CmdOpt["required"]>
    ? (Member & { user: User }) | APIRole
    : CmdOpt extends NumberCommandOption<CmdOpt["required"], any>
    ? number
    : never;

export type inferRequiredOption<
  CmdOpt extends CommandOption<boolean | undefined>
> = CmdOpt extends CommandOption<true>
  ? inferBaseOption<CmdOpt>
  : inferBaseOption<CmdOpt> | undefined;

export type inferOption<
  Required extends boolean | undefined,
  Options extends CommandOption<boolean>
> = Options extends CommandOptionsWithChoices<Required, infer U>
  ? [U] extends [undefined]
    ? inferRequiredOption<Options>
    : Options extends CommandOption<true>
    ? Unbox<U[keyof U]>
    : Unbox<U[keyof U]> | undefined
  : inferRequiredOption<Options>;

export type inferOptions<T extends CommandOptions | undefined> = [T] extends [
  CommandOptions
]
  ? {
      [K in keyof T]: inferOption<T[K]["required"], T[K]>;
    }
  : undefined;

export const options = {
  string<
    Required extends boolean | undefined,
    Choices extends OptionChoices<string> | undefined
  >(
    options: Omit<StringCommandOption<Required, Choices>, "type">
  ): StringCommandOption<Required, Choices> {
    return { ...options, type: ApplicationCommandOptionType.String };
  },
  integer<
    Required extends boolean | undefined,
    Choices extends OptionChoices<number> | undefined
  >(
    options: Omit<IntegerCommandOption<Required, Choices>, "type">
  ): IntegerCommandOption<Required, Choices> {
    return { ...options, type: ApplicationCommandOptionType.Integer };
  },
  boolean<Required extends boolean | undefined>(
    options: Omit<BooleanCommandOption<Required>, "type">
  ): BooleanCommandOption<Required> {
    return { ...options, type: ApplicationCommandOptionType.Boolean };
  },
  user<Required extends boolean | undefined>(
    options: Omit<UserCommandOption<Required>, "type">
  ): UserCommandOption<Required> {
    return { ...options, type: ApplicationCommandOptionType.User };
  },
  channel<Required extends boolean | undefined>(
    options: Omit<ChannelCommandOption<Required>, "type">
  ): ChannelCommandOption<Required> {
    return { ...options, type: ApplicationCommandOptionType.Channel };
  },
  role<Required extends boolean | undefined>(
    options: Omit<RoleCommandOption<Required>, "type">
  ): RoleCommandOption<Required> {
    return { ...options, type: ApplicationCommandOptionType.Role };
  },
  mentionable<Required extends boolean | undefined>(
    options: Omit<MentionableCommandOption<Required>, "type">
  ): MentionableCommandOption<Required> {
    return { ...options, type: ApplicationCommandOptionType.Mentionable };
  },
  number<
    Required extends boolean | undefined,
    Choices extends OptionChoices<number> | undefined
  >(
    options: Omit<NumberCommandOption<Required, Choices>, "type">
  ): NumberCommandOption<Required, Choices> {
    return { ...options, type: ApplicationCommandOptionType.Number };
  },
};
