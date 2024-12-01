import { Message, OmitPartialGroupDMChannel } from "discord.js";
import { errorMessage } from "./replies";
import { extractTextFromAttachmentsOrUrl } from "./ocr";
import dotenv from "dotenv";
dotenv.config(); // Load environment variables from .env file

const difyToken = process.env.DIFY_TOKEN;

interface DifyResponse {
  answer: string;
  conversation_id: string;
}

const callDifyAPI = async (
  query: string,
  conversationId = "",
  user = "",
): Promise<DifyResponse> => {
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

    return (await response.json()) as DifyResponse;
  } catch (error) {
    console.log(error);
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
    const data = (await callDifyAPI(
      message.content,
      conversations[serverName] || "",
      serverName,
    )) as DifyResponse;

    updateConversations(conversations, serverName, data.conversation_id);

    return message.reply(data.answer);
  } catch (error) {
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
