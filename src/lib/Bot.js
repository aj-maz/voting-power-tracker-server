const { REST, Routes, Client, GatewayIntentBits } = require("discord.js");
const config = require("../config.json");
const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const {
  Worker,
  isMainThread,
  parentPort,
  workerData,
} = require("node:worker_threads");
const LocalStorage = require("node-localstorage").LocalStorage;
const path = require("path");

const localStorage = new LocalStorage(
  path.resolve(__dirname, "..", "..", "data")
);

const commands = [
  {
    name: "init",
    description: "Init the bot in this channel",
  },
];

const rest = new REST({ version: "10" }).setToken(config.BOT_TOKEN);

const CLIENT_ID = config.CLIENT_ID;

const getActiveChannels = () => {
  return JSON.parse(localStorage.getItem("active_channels"));
};

const setActiveChannel = (channelId) => {
  const currentChannels = new Set(
    JSON.parse(localStorage.getItem("active_channels"))
  );
  currentChannels.add(channelId);

  localStorage.setItem("active_channels", JSON.stringify([...currentChannels]));
};

const runBot = async () => {
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

  client.on("interactionCreate", async (interaction) => {
    try {
      if (!interaction.isChatInputCommand()) return;
      if (interaction.commandName === "init") {
        setActiveChannel(interaction.channelId);
        await interaction.reply("Initialized!");
      }
    } catch (err) {
      console.log(err);
    }
  });

  const sendMessage = async (message) => {
    [...getActiveChannels()]
      .map((channelId) => {
        return client.channels.cache.get(channelId);
      })
      .forEach((channel) => {
        if (channel) {
          channel.send(message);
        }
      });
  };

  return {
    sendMessage,
  };
};

module.exports = runBot;
