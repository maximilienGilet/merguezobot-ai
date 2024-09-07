// Require the necessary discord.js classes
const { Client, Events, GatewayIntentBits } = require("discord.js");
// add stealth plugin and use defaults (all evasion techniques)
require("dotenv").config();

const fetch = require("node-fetch");

// Store conversations in memory
const conversations = {};

console.log("Starting bot...");
const discordToken = process.env.DISCORD_TOKEN;
const difyToken = process.env.DIFY_TOKEN;
const errorMessage = process.env.ERROR_MESSAGE;
const http = require("http");

const insults = [
  "On s'en branle, on s'en branle, on s'en branle.",
  "Ta gueule avec ta CX",
  "Oui c'est bien, allez ta gueule avec ta CX",
  "Chut chut, chuuuuuuut.",
  "Stoooooooooooooop",
  "Ça part sur un mute hein ?",
  "Va plutôt faire la carte grise au lieu de nous casser les couilles",
  "Euh, ta gueule pour voir ?",
  "C'était mieux quand t'étais mute",
];

const aiResponse = async (message) => {
  message.channel.sendTyping();

  // get the server name
  const serverName = message.guild.name;

  try {
    // send POST request to https://api.dify.ai/v1 to get response
    const response = await fetch("https://api.dify.ai/v1/chat-messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${difyToken}`,
      },
      body: JSON.stringify({
        inputs: [],
        query: message.content,
        response_mode: "blocking",
        conversation_id: conversations[serverName] || "",
        user: serverName,
      }),
    });

    if (!response.ok)
      throw new Error(response.statusText || `HTTP error ${response.status}`);

    // extract JSON from the http response
    const data = await response.json();

    // store the conversation id
    if (!conversations[serverName]) {
      conversations[serverName] = data.conversation_id;
    }

    return message.reply(data.answer);
  } catch (error) {
    console.log(error);
    return message.reply(errorMessage);
  }
};

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
    message.type == "REPLY"
  )
    return false;

  // When talking to the bot
  if (
    message.mentions.has(client.user.id) ||
    message.replyTo?.id == client.user.id
  ) {
    return await aiResponse(message);
  }

  // If the message is send by François and it talks about his CX, reply with a random insult
  const francois = message.author.username === "fr.popeye";
  if (francois && message.content.toLowerCase().includes("cx")) {
    const insult = insults[Math.floor(Math.random() * insults.length)];
    return message.reply(insult);
  }

  // reply "ouais fin raconte pas ta vie" randomly with a probability of 1 in 1000
  const random = Math.floor(Math.random() * 1000);
  if (random == 1) {
    return message.reply("ouais fin raconte pas ta vie");
  }
});

// Respond to health checks
http
  .createServer(function (req, res) {
    res.write("I'm alive");
    res.end();
  })
  .listen(8080);
