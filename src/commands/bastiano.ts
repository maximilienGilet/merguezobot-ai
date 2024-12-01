import { CommandInteraction, SlashCommandBuilder } from "discord.js";
import { bastianoQuotes } from "../replies";

export const data = new SlashCommandBuilder()
  .setName("bastiano")
  .setDescription("Studio Bastiano");

export async function execute(interaction: CommandInteraction) {
  return interaction.reply(
    bastianoQuotes[Math.floor(Math.random() * bastianoQuotes.length)],
  );
}
