// Require the necessary discord.js classes
const { Client, Events, GatewayIntentBits } = require('discord.js');
require('dotenv').config();
const fetch = require('node-fetch');
console.log("Starting bot...");
const discordToken = process.env.DISCORD_TOKEN;
const difyToken = process.env.DIFY_TOKEN;
let conversationId = process.env.CONVERSATION_ID || null;

// Create a new client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

// When the client is ready, run this code (only once)
// We use 'c' for the event parameter to keep it separate from the already defined 'client'
client.once(Events.ClientReady, c => {
  console.log(`Ready! Logged in as ${c.user.tag}`);
});

// Log in to Discord with your client's token
client.login(discordToken);

client.on(Events.MessageCreate, async message => {
  if (message.author.bot) return false;

  if (message.content.includes("@here") || message.content.includes("@everyone") || message.type == "REPLY") return false;

  if (message.mentions.has(client.user.id)) {
    message.channel.sendTyping();

    try {
      // send POST request to https://api.dify.ai/v1 to get response
      const response = await fetch('https://api.dify.ai/v1/chat-messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${difyToken}`
        },
        body: JSON.stringify({
          "inputs": [],
          "query": message.content,
          "response_mode": "blocking",
          "conversation_id": conversationId,
          "user": message.author.id,
        })
      });
      // extract JSON from the http response
      const data = await response.json();
      conversationId = data.conversation_id;
      console.log(data);

      return message.reply(data.answer);
    } catch (error) {
      console.log(error);
      return message.reply("J'ai pas envie de te parler là");
    }

  }
});