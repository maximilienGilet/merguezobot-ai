import dotenv from "dotenv";

dotenv.config();

const { DISCORD_TOKEN, DISCORD_CLIENT_ID } = process.env;

if (!DISCORD_TOKEN || !DISCORD_CLIENT_ID) {
  throw new Error("Missing environment variables");
}

const francois = "fr.popeye";

const abregeMessagesPrompt = `
Abrège les messages de manière concise en faisant des phrases. Les messages sont formatés comme suit :
Auteur : <nom de l'auteur>
Message : <message>
Attachements : <liste des attachements>

Aide toi de ces informations pour résumer et expliquer la situation.

Tu DOIS répondre en faisant une ou plusieurs phrases, ne fais PAS de liste.


Messages : 

`;

export const config = {
  DISCORD_TOKEN,
  DISCORD_CLIENT_ID,
  francois,
  abregeMessagesPrompt,
};
