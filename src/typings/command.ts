import type { Permissions } from "discord-api-types/globals";
import type {
  AllowedMentionsTypes,
  APIEmbed,
  APIMessage,
  APIChannel,
  LocalizationMap,
} from "discord-api-types/v10";
import type ActionRow from "../structures/ActionRow";
import type Button from "../structures/Button";
import type Guild from "../structures/Guild";
import type ChatInputInteraction from "../structures/interactions/chatInput";
import type Member from "../structures/Member";
import type SelectMenu from "../structures/SelectMenu";
import type User from "../structures/User";
import type { CommandOptions, inferOptions } from "./options";

export interface BaseSendOptions {
  allowedMentions?: AllowedMentionsTypes | undefined;
  components?: (ActionRow | Button | SelectMenu)[];
}

export type SendOptions = BaseSendOptions &
  (
    | {
        content: string;
        embeds?: undefined;
      }
    | { embeds: [APIEmbed, ...APIEmbed[]]; content?: undefined }
    | ({
        content: string;
      } & { embeds: [APIEmbed, ...APIEmbed[]] })
  );

export interface FollowUp {
  send(options: SendOptions & { ephemeral?: boolean }): Promise<APIMessage>;
  edit(options: SendOptions, messageID?: string): Promise<APIMessage>;
  delete(messageID?: string): Promise<void>;
}

export interface HandlerContext<
  DMPermission extends boolean,
  Options extends CommandOptions | undefined,
  MiddlewareContext extends object
> {
  name: string;
  context: MiddlewareContext;
  options: inferOptions<Options>;
  channelID: string;
  guildID: DMPermission extends false ? string : string | undefined;
  channel: () => Promise<APIChannel>;
  guild: () => Promise<Guild | undefined>;
  user?: User;
  member: DMPermission extends false ? Member : Member | undefined;
  send(options: SendOptions & { ephemeral?: boolean }): FollowUp;
  defer(ephemeral?: boolean): FollowUp;
}

export interface Command<
  DMPermission extends boolean | undefined,
  Options extends CommandOptions | undefined,
  U extends object
> {
  name: string;
  description: string;
  nameLocalizations?: LocalizationMap;
  descriptionLocalizations?: LocalizationMap;
  options?: Options;
  /**
   * @deprecated Use `dmPermission` and `defaultMemberPermissions` instead
   */
  defaultPermission?: boolean;
  dmPermission?: DMPermission;
  defaultMemberPermissions?: Permissions;
  handler: (ctx: ChatInputInteraction<DMPermission, Options, U>) => void;
}
