import { ActionRow, Button, client, options } from "../../lib/index.js";

client.command({
  name: "ping",
  description: "Sends a ping response",
  options: {
    foo: options.string({
      description: "bar",
      required: true,
    }),
    user: options.user({
      description: "user to pong",
      required: false,
    }),
    n: options.number({
      description: "number to pong",
    }),
  },
  handler: async (ctx) => {
    await ctx.defer(true);
    const guild = await ctx.guild();
    await ctx.send({
      content: `Ponging ${guild?.name}`,
      components: [
        new ActionRow().addButton(
          new Button().setID("test").setLabel("test button")
        ),
      ],
    });

    await ctx.registerComponent({
      id: "test",
      handler: (btnCtx) => {
        btnCtx.editParent({
          content: "tested",
          components: [],
        });
      },
    });
  },
});
