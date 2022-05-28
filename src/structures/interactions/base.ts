import type { ServerResponse } from "node:http";
import {
  APIApplicationCommandInteraction,
  APIChannel,
  APIGuild,
  APIMessage,
  APIMessageComponentInteraction,
  InteractionResponseType,
} from "discord-api-types/v10";
import { Client, Guild, Member, SendOptions, User } from "../../index.js";
import { DiscordAPI } from "../../util.js";
import type MessageComponentInteraction from "./messageComponent.js";

export type BaseInteractionParams = {
  res: ServerResponse;
  interaction:
    | APIApplicationCommandInteraction
    | APIMessageComponentInteraction;
  client: Client;
};

class BaseInteraction<DMPermission extends boolean | undefined> {
  #res: ServerResponse;
  #interaction:
    | APIApplicationCommandInteraction
    | APIMessageComponentInteraction;

  readonly client: Client;
  readonly invokedAt: number = Date.now();
  messageID?: string | undefined;

  user: User;
  #member?: Member | undefined;
  readonly token?: string;
  readonly channelID: string;
  sent = false;
  deferred = false;

  constructor({ client, res, interaction }: BaseInteractionParams) {
    this.#interaction = interaction;
    this.client = client;
    this.#res = res;

    this.channelID = interaction.channel_id;
    this.token = interaction.token;
    this.#member =
      "guild_id" in interaction
        ? new Member(interaction.member!, interaction.guild_id!)
        : undefined;
    this.user = new User(
      "guild_id" in interaction ? interaction.member!.user : interaction.user!
    );
  }

  get expired() {
    return this.invokedAt + 1000 * 60 * 15 < Date.now();
  }

  get guildID(): DMPermission extends false ? string : string | undefined {
    return this.#interaction.guild_id as DMPermission extends false
      ? string
      : string | undefined;
  }

  get member(): DMPermission extends false ? Member : Member | undefined {
    return this.#member as DMPermission extends false
      ? Member
      : Member | undefined;
  }

  async guild() {
    if (!this.guildID) return;
    const rawGuild = (
      await DiscordAPI.get<APIGuild>(`/guilds/${this.guildID}`, {
        headers: {
          Authorization: `Bot ${this.client.token}`,
        },
      })
    ).data;
    if (!rawGuild) return;
    return new Guild(rawGuild, this.client.token);
  }

  get locale() {
    return (
      "guild_locale" in this.#interaction
        ? (this.#interaction as any)?.guild_locale
        : (this.#interaction as any).locale
    ) as string;
  }

  async channel() {
    (
      await DiscordAPI.get<APIChannel>(
        `/channels/${this.#interaction.channel_id}`,
        {
          headers: {
            Authorization: `Bot ${this.client.token}`,
          },
        }
      )
    ).data;
  }

  async message(id = "@original") {
    const message = (
      await DiscordAPI.get<APIMessage>(
        `/webhooks/${this.client.applicationID}/${this.token}/messages/${id}`
      )
    ).data;
    if (id === "@original") this.messageID = message.id;
    return message;
  }

  async send({
    allowedMentions,
    ephemeral,
    ...rest
  }: SendOptions & { ephemeral?: boolean }) {
    if (this.expired) throw new Error("Interaction already expired");
    if (!this.sent) {
      this.sent = true;
      this.#res.statusCode = 200;
      this.#res.setHeader("content-type", "application/json");
      this.#res.end(
        JSON.stringify({
          type: InteractionResponseType.ChannelMessageWithSource,
          data: {
            content: "content" in rest ? rest.content : undefined,
            embeds: "embeds" in rest ? rest.embeds : undefined,
            allowed_mentions: allowedMentions,
            components: "components" in rest ? rest.components : undefined,
            flags: ephemeral ? 1 << 6 : undefined,
          },
        })
      );
      return;
    } else if (this.sent && this.deferred) {
      return this.edit({
        allowedMentions,
        ...rest,
      });
    } else {
      return this.sendFollowUp({
        allowedMentions,
        ephemeral,
        ...rest,
      });
    }
  }

  async sendFollowUp({
    allowedMentions,
    ephemeral,
    ...rest
  }: SendOptions & { ephemeral?: boolean | undefined }) {
    if (this.expired) throw new Error("Interaction already expired");
    const message = (
      await DiscordAPI.post<APIMessage>(
        `/webhooks/${this.client.applicationID}/${this.token}`,
        {
          content: "content" in rest ? rest.content : undefined,
          embeds: "embeds" in rest ? rest.embeds : undefined,
          allowed_mentions: allowedMentions,
          components: "components" in rest ? rest.components : undefined,
          flags: ephemeral ? 1 << 6 : undefined,
        },
        {
          headers: {
            Authorization: `Bot ${this.client.token}`,
          },
        }
      )
    ).data;
    return message;
  }

  async edit(
    { allowedMentions, ...rest }: SendOptions,
    messageID: string = "@original"
  ) {
    if (messageID === "@original") {
      this.deferred = false;
    }
    if (this.expired) throw new Error("Interaction already expired");
    const message = (
      await DiscordAPI.patch<APIMessage>(
        `/webhooks/${this.client.applicationID}/${this.token}/messages/${messageID}`,
        {
          content: "content" in rest ? rest.content : undefined,
          embeds: "embeds" in rest ? rest.embeds : undefined,
          components: "components" in rest ? rest.components : undefined,
          allowed_mentions: allowedMentions,
        },
        {
          headers: {
            Authorization: `Bot ${this.client.token}`,
          },
        }
      )
    ).data;
    if (messageID === "@original") {
      this.messageID = message.id;
    }
    return message;
  }

  async delete(id = "@original") {
    await DiscordAPI.delete(
      `/webhooks/${this.client.applicationID}/${this.token}/messages/${id}`,
      {
        headers: {
          Authorization: `Bot ${this.client.token}`,
        },
      }
    );
    if (id === "@original") this.messageID = undefined;
  }

  async defer(ephemeral = false) {
    if (!this.sent && !this.deferred) {
      this.sent = true;
      this.deferred = true;
      this.#res.statusCode = 200;
      this.#res.setHeader("content-type", "application/json");
      this.#res.end(
        JSON.stringify({
          type: InteractionResponseType.DeferredChannelMessageWithSource,
          data: {
            flags: ephemeral ? 1 << 6 : undefined,
          },
        })
      );
      return;
    }
  }

  async registerComponent({
    id,
    handler,
    expiration = 1000 * 60 * 15,
    expired,
  }: {
    id: string;
    handler: (ctx: MessageComponentInteraction<DMPermission>) => void;
    expiration?: number;
    expired?: () => void;
  }) {
    if (this.expired) throw new Error("Interaction already expired");
    if (!this.sent || this.deferred)
      throw new Error("A message must be sent before registering a component");
    if (!this.messageID) throw new Error("Fetch message first");
    this.client.components.set(`${this.messageID}-${id}`, {
      handler,
      expires: this.invokedAt + expiration,
      expired,
    });
  }

  async unregisterComponent({
    id,
    messageID,
  }: {
    id: string;
    messageID?: string;
  }) {
    if (!messageID) {
      if (!this.messageID) throw new Error("Init message id");
      else messageID = this.messageID;
    }
    return this.client.components.delete(`${messageID}-${id}`);
  }
}

export default BaseInteraction;
