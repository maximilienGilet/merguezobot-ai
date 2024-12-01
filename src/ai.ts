const fetch = require("node-fetch");
const extractTextFromAttachmentsOrUrl = require("./ocr");

const difyToken = process.env.DIFY_TOKEN;

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

const updateConversations = async (
  conversations,
  serverName,
  conversationId,
) => {
  if (!conversations[serverName]) {
    conversations[serverName] = conversationId;
  }

  return conversations;
};

const aiResponse = async (message, conversations) => {
  message.channel.sendTyping();

  const serverName = message.guild.name;

  try {
    const data = await callDifyAPI(
      message.content,
      conversations[serverName] || "",
      serverName,
    );

    updateConversations(conversations, serverName, data.conversation_id);

    return message.reply(data.answer);
  } catch (error) {
    return message.reply(errorMessage);
  }
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

export { aiResponse, aiResponseAbrege };
