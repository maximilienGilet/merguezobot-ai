import {
  DMChannel,
  Message,
  NewsChannel,
  PartialDMChannel,
  PrivateThreadChannel,
  PublicThreadChannel,
  StageChannel,
  TextChannel,
  VoiceChannel,
} from "discord.js";
import { extractTextFromAttachmentsOrUrl } from "./ocr";

type Channel =
  | DMChannel
  | PartialDMChannel
  | NewsChannel
  | StageChannel
  | TextChannel
  | PublicThreadChannel<boolean>
  | PrivateThreadChannel
  | VoiceChannel;

const extractContent = async (message: Message) => {
  let content = `Auteur : ${message.author.username}\n`;
  content += `Message : ${message.content}\n`;
  const extractedTexts = await extractTextFromAttachmentsOrUrl(message);
  content += `Attachements : ${extractedTexts.join(", ")}\n`;
  return content;
};

// get last n messages from a channel
const getLastNMessages = async (channel: Channel, n: number) => {
  const messages = await channel.messages.fetch({ limit: n });
  return messages.map(extractContent);
};

// get messages since a message id
const getMessagesSince = async (channel: Channel, messageId: string) => {
  const messages = await channel.messages.fetch({ after: messageId });
  return messages.map(extractContent);
};

export { getLastNMessages, getMessagesSince };
