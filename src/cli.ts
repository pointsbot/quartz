#!/usr/bin/env ts-node
import "dotenv/config";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import ora from "ora";
import chalk from "chalk";
import { register } from "ts-node";

register({
  esm: true,
  cwd: process.cwd(),
});

yargs(hideBin(process.argv))
  .scriptName("quartz")
  .usage("$0 <cmd> [args]")
  .command(
    "push [guildID]",
    "Push commands to discord",
    (args) => {
      return args.positional("guildID", {
        describe: "The guild to push to",
        type: "string",
      });
    },
    async (argv) => {
      try {
        const { client } = await import("./index.js");
        const spinner = ora("Pushing commands...").start();

        if (argv.guildID) await client.overwriteGuildCommands(argv.guildID);
        else await client.overwriteCommands();

        spinner.stop();

        if (argv.guildID) {
          console.log(chalk.green("Pushed to guild!"));
          console.log(
            chalk.gray("Changes are immediately reflected on discord...")
          );
        } else {
          console.log(chalk.green("Pushed to discord!"));
          console.log(
            chalk.gray(
              "Changes may take up to 1 hour to be reflected on discord..."
            )
          );
        }
      } catch (error) {
        console.log(chalk.red("Failed to push to discord!"));
        console.error(error);
      }
    }
  )
  .command(
    "clear [guildID]",
    "Clear commands from discord",
    (args) => {
      return args.positional("guildID", {
        describe: "The guild to clear",
        type: "string",
      });
    },
    async (argv) => {
      try {
        const { client } = await import("./index.js");
        const spinner = ora("Clearing commands").start();

        if (argv.guildID) await client.clearGuildCommands(argv.guildID);
        else await client.clearCommands();

        spinner.stop();

        if (argv.guildID) {
          console.log(chalk.green("Cleared commands from guild!"));
          console.log(
            chalk.gray("Changes are immediately reflected on discord...")
          );
        } else {
          console.log(chalk.green("Cleared commands from discord!"));
          console.log(
            chalk.gray(
              "Changes may take up to 1 hour to be reflected on discord..."
            )
          );
        }
      } catch (error) {
        console.log(chalk.red("Failed to clear from discord!"));
        console.error(error);
      }
    }
  )
  .parse();
