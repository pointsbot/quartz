import http, { IncomingMessage, ServerResponse } from "node:http";
import {
  APIPingInteraction,
  APIApplicationCommandInteraction,
  APIMessageComponentInteraction,
  InteractionType,
  ApplicationCommandType,
  RESTPostAPIChatInputApplicationCommandsJSONBody,
  APIChatInputApplicationCommandInteraction,
  APIApplicationCommandAutocompleteInteraction,
} from "discord-api-types/v10";
import { DiscordAPI, streamToString, verify } from "./util.js";
import Guild from "./structures/Guild.js";
import User from "./structures/User.js";
import Member from "./structures/Member.js";
import ActionRow from "./structures/ActionRow.js";
import Button from "./structures/Button.js";
import SelectMenu from "./structures/SelectMenu.js";
import Embed from "./structures/Embed.js";
import ChatInputInteraction from "./structures/interactions/ChatInput.js";
import MessageComponentInteraction from "./structures/interactions/MessageComponent.js";
import type {
  inferMiddlewareContextTypes,
  MiddlewareFunction,
} from "./typings/middleware.js";
import type { Command } from "./typings/command.js";
import type { CommandOption } from "./typings/options.js";

class Client {
  commandsFolderName: string;
  applicationID: string;
  publicKey: string;
  token: string;
  components: Map<
    string,
    {
      handler: (ctx: MessageComponentInteraction) => void;
      expires: number;
      expired?: (() => void) | undefined;
    }
  > = new Map();
  middlewares: MiddlewareFunction<any, any>[] = [];
  private commands: Command<
    Record<string, CommandOption<boolean>>,
    inferMiddlewareContextTypes<typeof this.middlewares>
  >[] = [];

  constructor({
    applicationID,
    publicKey,
    token,
    commandsFolderName,
  }: {
    applicationID: string;
    publicKey: string;
    token: string;
    commandsFolderName?: string;
  }) {
    this.commandsFolderName = commandsFolderName || "commands";
    this.applicationID = applicationID;
    this.publicKey = publicKey;
    this.token = token;
    this.handle = this.handle.bind(this);
  }

  private async handle(req: IncomingMessage, res: ServerResponse) {
    const data = await streamToString(req);

    if (!(await verify(req.headers, data, this.publicKey))) {
      res.statusCode = 401;
      return res.end();
    }

    const interaction = JSON.parse(data) as
      | APIPingInteraction
      | APIApplicationCommandInteraction
      | APIMessageComponentInteraction
      | APIApplicationCommandAutocompleteInteraction;

    switch (interaction.type) {
      case InteractionType.Ping: {
        res.statusCode = 200;
        res.setHeader("content-type", "application/json");
        res.end(JSON.stringify({ type: InteractionType.Ping }));
        return;
      }

      case InteractionType.ApplicationCommand: {
        switch (interaction.data.type) {
          case ApplicationCommandType.ChatInput: {
            const command = this.commands.find(
              (c) => interaction.data.name === c.name
            );

            if (!command) {
              res.statusCode = 400;
              res.end();
              return;
            }

            const handlerContext = new ChatInputInteraction(
              this,
              interaction as APIChatInputApplicationCommandInteraction,
              ({ code, body }) => {
                res.statusCode = code;
                res.setHeader("content-type", "application/json");
                res.end(JSON.stringify(body));
                return;
              }
            );

            for (const middleware of this.middlewares) {
              const res = await middleware(handlerContext);
              if (!res.next) {
                return;
              }
              handlerContext.context = res.ctx;
            }

            command.handler(handlerContext as any);

            return;
          }
          case ApplicationCommandType.Message: {
            return;
          }
          case ApplicationCommandType.User: {
            return;
          }
        }
      }

      case InteractionType.MessageComponent: {
        if (
          this.components.has(
            `${interaction.message.id}-${interaction.data.custom_id}`
          )
        ) {
          const handlerContext = new MessageComponentInteraction(
            this,
            interaction as APIMessageComponentInteraction,
            ({ code, body }) => {
              res.statusCode = code;
              res.setHeader("content-type", "application/json");
              res.end(JSON.stringify(body));
              return;
            }
          );
          return this.components
            .get(`${interaction.message.id}-${interaction.data.custom_id}`)
            ?.handler(handlerContext);
        }
        return;
      }

      case InteractionType.ApplicationCommandAutocomplete: {
        return;
      }
    }
  }

  async listen(port: number = 3000, address: string = "localhost") {
    if (process.env["CLEAR_ON_START"]) await this.overwriteCommands();
    http.createServer(this.handle).listen(port, address);
  }

  command<T extends Record<string, CommandOption<boolean>> | undefined>(
    options: Command<T, inferMiddlewareContextTypes<this["middlewares"]>>
  ) {
    this.commands.push(options as any);
  }

  middleware<T extends object>(
    this: this,
    middleware: MiddlewareFunction<
      inferMiddlewareContextTypes<this["middlewares"]>,
      T
    >
  ): asserts this is this & { middlewares: typeof middleware[] } {
    this.middlewares.push(middleware);
  }

  generateCommands(): RESTPostAPIChatInputApplicationCommandsJSONBody[] {
    return this.commands.map((command) => ({
      name: command.name,
      name_localizations: command.nameLocalizations,
      description: command.description,
      description_localizations: command.descriptionLocalizations,
      options: Object.entries(command.options ?? {}).map(([name, value]) => ({
        type: value.type,
        name,
        description: value.description,
        required: value.required ?? false,
        ...("choices" in value && value.choices
          ? {
              choices: Object.entries(value.choices).map(
                ([key, { value }]: any) => ({
                  name: key,
                  value,
                })
              ),
            }
          : {}),
        ...("types" in value ? { channel_types: value.types } : {}),
        ...("minValue" in value ? { min_value: value.minValue } : {}),
        ...("maxValue" in value ? { max_value: value.maxValue } : {}),
      })) as any,
      dm_permission: command.dmPermission ?? true,
      default_member_permissions: command.defaultMemberPermissions,
      default_permission: command.defaultPermission ?? true,
      type: ApplicationCommandType.ChatInput,
    }));
  }

  async overwriteCommands() {
    await DiscordAPI.put(
      `/applications/${this.applicationID}/commands`,
      this.generateCommands(),
      {
        headers: {
          Authorization: `Bot ${this.token}`,
        },
      }
    );
  }

  async overwriteGuildCommands(guildID: string) {
    await DiscordAPI.put(
      `/applications/${this.applicationID}/guilds/${guildID}/commands`,
      this.generateCommands(),
      {
        headers: {
          Authorization: `Bot ${this.token}`,
        },
      }
    );
  }

  async clearCommands() {
    await DiscordAPI.put(`/applications/${this.applicationID}/commands`, [], {
      headers: {
        Authorization: `Bot ${this.token}`,
      },
    });
  }

  async clearGuildCommands(guildID: string) {
    await DiscordAPI.put(
      `/applications/${this.applicationID}/guilds/${guildID}/commands`,
      [],
      {
        headers: {
          Authorization: `Bot ${this.token}`,
        },
      }
    );
  }
}

export const client = new Client({
  applicationID: process.env["DISCORD_APPLICATION_ID"]!,
  publicKey: process.env["DISCORD_PUBLIC_KEY"]!,
  token: process.env["DISCORD_TOKEN"]!,
  commandsFolderName: process.env["COMMANDS_DIR"] ?? "commands",
});

export * from "./typings/index.js";
export { Client, ActionRow, Button, SelectMenu, Guild, Member, User, Embed };
