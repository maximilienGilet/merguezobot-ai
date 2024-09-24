// Require the necessary discord.js classes
const { Client, Events, GatewayIntentBits } = require("discord.js");
const tesseract = require("node-tesseract-ocr");
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

const randomReplies = [
  "Ouais fin raconte pas ta vie",
  "Ok tamere",
  "Manje moi lpoiro",
  "Sayer frr ftg",
  "Eh gros sayer",
  "On a déjà entendu cette histoire 40 fois.",
  "Les femmes te disent la même chose ?",
  "Quel est le rapport avec les Juifs ?",
  "Mais, du coup , t'as voté Marcon ?",
  "EH BEN MOI UNE FOIS J'AI PISSÉ PAR LA FENÊTRE",
  "Mais ma parole vous êtes beuré vous aussi.",
  "Qui s'en fout ?",
  "Ta geule ?",
];

const callDifyAPI = async (query, conversationId = "", user = "") => {
  try {
    const response = await fetch("https://api.dify.ai/v1/chat-messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${difyToken}`,
      },
      body: JSON.stringify({
        inputs: [],
        query: query,
        response_mode: "blocking",
        conversation_id: conversationId,
        user: user,
      }),
    });

    if (!response.ok)
      throw new Error(response.statusText || `HTTP error ${response.status}`);

    return await response.json();
  } catch (error) {
    console.log(error);
    throw error;
  }
};

const aiResponse = async (message) => {
  message.channel.sendTyping();

  const serverName = message.guild.name;

  try {
    const data = await callDifyAPI(
      message.content,
      conversations[serverName] || "",
      serverName,
    );

    if (!conversations[serverName]) {
      conversations[serverName] = data.conversation_id;
    }

    return message.reply(data.answer);
  } catch (error) {
    return message.reply(errorMessage);
  }
};

const recognizeFromUrl = async (url) => {
  const config = {
    lang: "fra",
    oem: 1,
    psm: 3,
  };

  const text = await tesseract.recognize(url, config);
  return text;
};

const aiResponseAbrege = async (originalMessage, message) => {
  message.channel.sendTyping();

  let command =
    "Abrège en une seule phrase le message suivant : " + message.content;

  const extractedTexts = await extractTextFromAttachmentsOrUrl(message);
  if (extractedTexts.length > 0) {
    command += "\n\n" + extractedTexts.join("\n\n");
  }

  try {
    const data = await callDifyAPI(command, "", "abrege");
    return originalMessage.reply(data.answer);
  } catch (error) {
    return originalMessage.reply(errorMessage);
  }
};

const extractTextFromAttachmentsOrUrl = async (message) => {
  const extractedTexts = [];

  if (message.attachments.size > 0) {
    for (const attachment of message.attachments.values()) {
      try {
        const text = await recognizeFromUrl(attachment.url);
        if (text) {
          extractedTexts.push(text);
        }
      } catch (error) {
        console.error("Error recognizing text from attachment:", error);
      }
    }
  } else if (message.content.startsWith("https://")) {
    try {
      const text = await recognizeFromUrl(message.content);
      if (text) {
        extractedTexts.push(text);
      }
    } catch (error) {
      console.error("Error recognizing text from URL:", error);
    }
  }

  return extractedTexts;
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
  if (message.mentions.has(client.user.id)) {
    return await aiResponse(message);
  }

  // when asking "abrege" or "abrège", and the message is not a reply to the bot
  if (
    ((message.reference?.messageId &&
      message.content.toLowerCase().includes("abrege")) ||
      message.content.toLowerCase().includes("abrège")) &&
    !message.mentions.has(client.user.id)
  ) {
    const referenceMessage = await message.fetchReference();
    return await aiResponseAbrege(message, referenceMessage);
  }

  // If the message is send by François and it talks about his CX, reply with a random insult
  const francois = message.author.username === "fr.popeye";
  if (francois && message.content.toLowerCase().includes("cx")) {
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
