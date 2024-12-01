import { Message } from "discord.js";
import tesseract from "node-tesseract-ocr";

const recognizeFromUrl = async (url: string) => {
  const config = {
    lang: "fra",
    oem: 1,
    psm: 3,
  };

  const text = await tesseract.recognize(url, config);
  return text;
};

const extractTextFromAttachmentsOrUrl = async (message: Message) => {
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

export { extractTextFromAttachmentsOrUrl };
