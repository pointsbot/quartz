import {
  APIMessage,
  APIMessageComponentInteraction,
  ComponentType,
  InteractionResponseType,
} from "discord-api-types/v10";
import type { ServerResponse } from "node:http";
import type { Client } from "../../index.js";
import type { SendOptions } from "../../index.js";
import BaseInteraction from "./base.js";

class MessageComponentInteraction<
  DMPermission extends boolean | undefined
> extends BaseInteraction<DMPermission> {
  customID: string;
  componentType: ComponentType;
  _message: APIMessage;
  #res: ServerResponse;

  constructor({
    interaction,
    client,
    res,
  }: {
    client: Client;
    interaction: APIMessageComponentInteraction;
    res: ServerResponse;
  }) {
    super({ interaction, client, res });
    this.customID = interaction.data.custom_id;
    this.componentType = interaction.data.component_type;
    this._message = interaction.message;
    this.#res = res;
  }

  async ack() {
    if (!this.sent) {
      this.sent = true;
      this.#res.statusCode = 200;
      this.#res.setHeader("content-type", "application/json");
      this.#res.end(
        JSON.stringify({
          type: InteractionResponseType.DeferredMessageUpdate,
        })
      );
    }
  }

  async editParent({ allowedMentions, ...rest }: SendOptions) {
    if (this.expired) throw new Error("Interaction already expired");

    if (!this.sent) {
      this.#res.statusCode = 200;
      this.#res.setHeader("content-type", "application/json");
      this.#res.end(
        JSON.stringify({
          type: InteractionResponseType.UpdateMessage,
          data: {
            content: "content" in rest ? rest.content : undefined,
            embeds: "embeds" in rest ? rest.embeds : undefined,
            components: "components" in rest ? rest.components : undefined,
            allowed_mentions: allowedMentions,
          },
        })
      );
      return;
    } else {
      await this.edit(rest, this._message.id);
      return;
    }
  }
}

export default MessageComponentInteraction;
