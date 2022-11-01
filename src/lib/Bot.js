const { REST, Routes, Client, GatewayIntentBits } = require("discord.js");
const config = require("../config.json");
const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const {
  Worker,
  isMainThread,
  parentPort,
  workerData,
} = require("node:worker_threads");

const commands = [
  {
    name: "init",
    description: "Init the bot in this channel",
  },
];

const rest = new REST({ version: "10" }).setToken(config.BOT_TOKEN);

const CLIENT_ID = "1037028431558348881";

if (isMainThread) {
  const worker = new Worker(__filename, {});
} else {
  const bot = () => {
    client.login(config.BOT_TOKEN);

    (async () => {
      try {
        console.log("Started refreshing application (/) commands.");

        await rest.put(Routes.applicationCommands(CLIENT_ID), {
          body: commands,
        });

        console.log("Successfully reloaded application (/) commands.");
      } catch (error) {
        console.error(error);
      }
    })();

    client.on("ready", () => {
      console.log(`Logged in as ${client.user.tag}!`);
    });

    const targetChannels = new Set();

    client.on("interactionCreate", async (interaction) => {
      console.log(interaction);
      try {
        if (!interaction.isChatInputCommand()) return;
        if (interaction.commandName === "init") {
          targetChannels.add(interaction.channelId);
          console.log("already here");
          await interaction.reply("Initialize!");
          console.log("but not here");
        }
      } catch (err) {
        console.log(err);
      }
    });

    setInterval(() => {
      console.log([...targetChannels]);
      [...targetChannels]
        .map((channelId) => client.channels.cache.get(channelId))
        .forEach((channel) => {
          channel.send("Hayloooo");
        });
    }, 5000);
  };

  bot();
}
