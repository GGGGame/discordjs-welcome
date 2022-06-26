const { Client, Intents, Collection } = require("discord.js");
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");
const wait = require("node:timers/promises").setTimeout;
const { MessageEmbed } = require("discord.js");
const fs = require("fs");

require("dotenv/config"); // get .env items

const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
  ],
});

//#region initialize commands

const commands = [];

client.commands = new Collection();
const cmdFiles = fs
  .readdirSync("./commands")
  .filter((file) => file.endsWith(".js"));

for (const file of cmdFiles) {
  const command = require("./commands/" + file);
  commands.push(command.data.toJSON());
  client.commands.set(command.data.name, command);
}

//#endregion

client.once("ready", () => {
  console.log("Bot online!");

  //#region Initialize command handler

  const CLIENT_ID = client.user.id;

  const rest = new REST({ version: "9" }).setToken(process.env.TOKEN);

  rest
    .put(Routes.applicationGuildCommands(CLIENT_ID, process.env.GUILD_ID), {
      body: commands,
    })
    .then(() => {
      console.log("Successfully registered application commands.");
    })
    .catch(console.error);

  //#endregion
});

client.on("interactionCreate", async (interaction) => {
  const command = client.commands.get(interaction.commandName);

  if (!interaction.isCommand() || !command) return;

  try {
    await command.execute(interaction);
  } catch (exception) {
    console.error(new Error(error));

    await interaction.reply({
      content: "An error occurred while executing that command.",
      ephemeral: true,
    });
  }
});

client.login(process.env.TOKEN);
