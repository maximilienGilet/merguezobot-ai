import { Client, Events, GatewayIntentBits } from "discord.js";
import dotenv from "dotenv";
import http from "http";
import {
  aiResponse,
  aiResponseAbrege,
  aiResponseAbregeNMessages,
  aiResponseAbregeSince,
} from "./ai";
import { commands } from "./commands";
import { config } from "./config";
import { deployCommands } from "./deploy-commands";
import { insults, insultsX, randomReplies } from "./replies";
dotenv.config(); // Load environment variables from .env file

// Store conversations in memory
const conversations = {};

console.log("Starting bot...");
const discordToken = process.env.DISCORD_TOKEN;

// Create a new client instance
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// When the client is ready, run this code (only once)
// We use 'c' for the event parameter to keep it separate from the already defined 'client'
client.once(Events.ClientReady, (c) => {
  console.log(`Ready! Logged in as ${c.user.tag}`);
  const guilds = c.guilds.cache.map((guild) => guild.id);
  // Deploy commands to the Guilds
  guilds.map((guildId) => deployCommands({ guildId }));
});

// Log in to Discord with your client's token
client.login(discordToken);

client.on(Events.MessageCreate, async (message) => {
  // Do not reply itself
  if (message.author.bot) {
    return false;
  }

  // Do not reply to @here, @everyone
  if (
    message.content.includes("@here") ||
    message.content.includes("@everyone")
  ) {
    return false;
  }

  // when asking "abrege" or "abrège", and the message is not a reply to the bot
  if (
    message.reference?.messageId &&
    (message.content.toLowerCase().includes("abrege") ||
      message.content.toLowerCase().includes("abrège") ||
      message.content.toLowerCase().includes("resume") ||
      message.content.toLowerCase().includes("résume")) &&
    !message.mentions.has(client.user!.id)
  ) {
    // do a recap since the replied message
    if (message.content.toLowerCase().includes("depuis")) {
      const referenceMessage = await message.fetchReference();
      const fetchedMessages = await referenceMessage.channel.messages.fetch({
        before: referenceMessage.id,
        limit: 1,
      });
      const lastMessage = fetchedMessages.first();
      if (lastMessage) {
        return await aiResponseAbregeSince(message, lastMessage.id);
      }
    }

    // do a recap of the replied message
    const referenceMessage = await message.fetchReference();
    return await aiResponseAbrege(message, referenceMessage);
  } else {
    // When talking to the bot
    if (message.mentions.has(client.user!.id)) {
      // do a recap of the last n messages
      // match the regex "abrege" or "abrège" with a number between 1 and 100 in the message
      const match = message.content
        .toLowerCase()
        .match(/(abrege|abrège|resume|résume).*?(\d{1,2}|100)/i);
      if (match) {
        const n = parseInt(match[2]);
        if (n > 0 && n < 100) {
          return await aiResponseAbregeNMessages(message, n);
        }
      } else {
        // Normal reply
        return await aiResponse(message, conversations);
      }
    }

    // If the message is send by François and it talks about his CX, reply with a random insult
    const isFrancois = message.author.username === config.francois;
    if (isFrancois && message.content.toLowerCase().includes("cx")) {
      const insult = insults[Math.floor(Math.random() * insults.length)];
      return message.reply(insult);
    }

    // If the message is send by LGD and it talks about X, reply with a random insult
    const isLGD = message.author.username === config.lgd;
    if (isLGD && message.content.toLowerCase().includes("https://x.com")) {
      const insult = insultsX[Math.floor(Math.random() * insultsX.length)];
      return message.reply(insult);
    }

    // reply a random message randomly with a probability of 1 in 500 for messages longer than 20 characters
    const random = Math.floor(Math.random() * 500);
    if (random == 1 && message.content.length > 20) {
      const randomReply =
        randomReplies[Math.floor(Math.random() * randomReplies.length)];
      return message.reply(randomReply);
    }

    // Auto summarize long messages
    if (message.content.length > 1000) {
      return await aiResponseAbrege(message, message);
    }
  }
});

// Handle slash commands
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isCommand()) return;

  const commandName = interaction.commandName;

  // dynamically call commands
  Object.values(commands).map((command) => {
    if (command.data.name === commandName) {
      command.execute(interaction);
    }
  });
});

// Respond to health checks
http
  .createServer(function (_req, res) {
    res.write("I'm alive");
    res.end();
  })
  .listen(8080);
