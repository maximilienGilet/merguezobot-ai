import { Message, OmitPartialGroupDMChannel } from "discord.js";
import dotenv from "dotenv";
import { config } from "./config";
import { getLastNMessages, getMessagesSince } from "./discord-utils";
import { extractTextFromAttachmentsOrUrl } from "./ocr";
import { errorMessage } from "./replies";
dotenv.config(); // Load environment variables from .env file

interface N8nResponse {
  answer?: string;
  conversation_id?: string;
  [key: string]: unknown;
}

const callN8nAPI = async (
  query: string,
  conversationId = "",
  user = "",
): Promise<N8nResponse> => {
  try {
    const basicAuthToken = Buffer.from(
      `${config.n8n.username}:${config.n8n.password}`,
    ).toString("base64");

    const response = await fetch(config.n8n.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${basicAuthToken}`,
      },
      body: JSON.stringify({
        query: query,
        conversation_id: conversationId,
        user: user,
      }),
    });

    if (!response.ok)
      throw new Error(response.statusText || `HTTP error ${response.status}`);

    const raw = await response.text();
    console.log(raw);

    try {
      return JSON.parse(raw) as N8nResponse;
    } catch (parseError) {
      console.warn("n8n response was not JSON, using raw text");
      return {
        answer: raw,
        conversation_id: conversationId,
      };
    }
  } catch (error) {
    console.error("Error in callN8nAPI");
    console.error(error);
    throw error;
  }
};

const updateConversations = async (
  conversations: Record<string, string>,
  serverName: string,
  conversationId: string,
) => {
  if (!conversations[serverName]) {
    conversations[serverName] = conversationId;
  }

  return conversations;
};

const aiResponse = async (
  message: OmitPartialGroupDMChannel<Message<boolean>>,
  conversations: Record<string, string>,
) => {
  message.channel.sendTyping();

  const serverName = message.guild?.name ?? "";

  try {
    let context = "";

    const extractedTexts = await extractTextFromAttachmentsOrUrl(message);
    if (extractedTexts.length > 0) {
      context = `Contexte :\n\n${extractedTexts.join("\n\n")}`;
    }

    const data = (await callN8nAPI(
      message.content + context,
      serverName,
    )) as N8nResponse;

    if (data.conversation_id) {
      updateConversations(conversations, serverName, data.conversation_id);
    }

    const answer =
      typeof data.answer === "string" && data.answer.trim().length > 0
        ? data.answer
        : errorMessage;

    return message.reply(answer);
  } catch (error) {
    console.error("Error in aiResponse");
    console.error(error);
    return message.reply(errorMessage);
  }
};

const aiResponseAbrege = async (
  originalMessage: OmitPartialGroupDMChannel<Message<boolean>>,
  message: OmitPartialGroupDMChannel<Message<boolean>>,
) => {
  message.channel.sendTyping();

  let command =
    "Abrège en une seule phrase le message suivant : " + message.content;

  const extractedTexts = await extractTextFromAttachmentsOrUrl(message);
  if (extractedTexts.length > 0) {
    command = `${command}\n\n${extractedTexts.join("\n\n")}`;
  }

  try {
    const data = await callN8nAPI(command, "", "abrege");
    const answer =
      typeof data.answer === "string" && data.answer.trim().length > 0
        ? data.answer
        : errorMessage;
    return originalMessage.reply(answer);
  } catch (error) {
    console.log("Error in aiResponseAbrege");
    console.log(error);
    return originalMessage.reply(errorMessage);
  }
};

const aiResponseAbregeNMessages = async (
  message: OmitPartialGroupDMChannel<Message<boolean>>,
  n: number,
) => {
  message.channel.sendTyping();

  const lastMessages = await getLastNMessages(message.channel, n, message.id);

  let command = config.abregeMessagesPrompt;

  lastMessages.forEach((message) => {
    command += `${message}\n`;
  });

  try {
    const data = await callN8nAPI(command, "", "abrege");
    const answer =
      typeof data.answer === "string" && data.answer.trim().length > 0
        ? data.answer
        : errorMessage;
    return message.reply(answer);
  } catch (error) {
    console.error("Error in aiResponseAbregeNMessages");
    console.error(error);
    return message.reply(errorMessage);
  }
};

const aiResponseAbregeSince = async (
  message: OmitPartialGroupDMChannel<Message<boolean>>,
  sinceMessageId: string,
) => {
  message.channel.sendTyping();

  const messages = await getMessagesSince(message.channel, sinceMessageId);

  let command = config.abregeMessagesPrompt;

  messages.forEach((message) => {
    command += `${message}\n`;
  });

  try {
    const data = await callN8nAPI(command, "", "abrege");
    const answer =
      typeof data.answer === "string" && data.answer.trim().length > 0
        ? data.answer
        : errorMessage;
    return message.reply(answer);
  } catch (error) {
    console.error("Error in aiResponseAbregeSince");
    console.error(error);
    return message.reply(errorMessage);
  }
};

export {
  aiResponse,
  aiResponseAbrege,
  aiResponseAbregeNMessages,
  aiResponseAbregeSince,
};
