import dotenv from "dotenv";

dotenv.config();

const {
  DISCORD_TOKEN,
  DISCORD_CLIENT_ID,
  N8N_URL,
  N8N_USERNAME,
  N8N_PASSWORD,
} = process.env;

if (!DISCORD_TOKEN || !DISCORD_CLIENT_ID) {
  throw new Error("Missing environment variables");
}

if (!N8N_URL || !N8N_USERNAME || !N8N_PASSWORD) {
  throw new Error("Missing n8n configuration variables");
}

const francois = "fr.popeye";
const lgd = "carpetubage";

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
  lgd,
  n8n: {
    url: N8N_URL,
    username: N8N_USERNAME,
    password: N8N_PASSWORD,
  },
};
