import http from "http";
import { aiResponse, aiResponseAbrege } from "./ai";
import { config } from "./config";
import { insults, randomReplies } from "./replies";
import { Client, Events, GatewayIntentBits, MessageType } from "discord.js";
import { deployCommands } from "./deploy-commands";
require("dotenv").config();

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
  if (message.author.bot) return false;

  // Do not reply to @here, @everyone or basic replies
  if (
    message.content.includes("@here") ||
    message.content.includes("@everyone") ||
    message.type == MessageType.Reply
  )
    return false;

  // When talking to the bot
  if (message.mentions.has(client.user!.id)) {
    return await aiResponse(message, conversations);
  }

  // when asking "abrege" or "abrège", and the message is not a reply to the bot
  if (
    ((message.reference?.messageId &&
      message.content.toLowerCase().includes("abrege")) ||
      message.content.toLowerCase().includes("abrège")) &&
    !message.mentions.has(client.user!.id)
  ) {
    const referenceMessage = await message.fetchReference();
    return await aiResponseAbrege(message, referenceMessage);
  }

  // If the message is send by François and it talks about his CX, reply with a random insult
  const isFrancois = message.author.username === config.francois;
  if (isFrancois && message.content.toLowerCase().includes("cx")) {
    const insult = insults[Math.floor(Math.random() * insults.length)];
    return message.reply(insult);
  }

  // reply a random message randomly with a probability of 1 in 500 for messages longer than 20 characters
  const random = Math.floor(Math.random() * 500);
  if (random == 1 && message.content.length > 20) {
    const randomReply =
      randomReplies[Math.floor(Math.random() * randomReplies.length)];
    return message.reply(randomReply);
  }
});

// Respond to health checks
http
  .createServer(function (req, res) {
    res.write("I'm alive");
    res.end();
  })
  .listen(8080);
