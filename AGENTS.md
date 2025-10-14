# Repository Guidelines

## Project Structure & Module Organization
- Core entry point lives in `src/index.ts`; it boots the Discord bot, registers guild commands, and wires events.
- Slash command handlers stay under `src/commands/` and are exported via `src/commands/index.ts` for discovery.
- AI helpers (prompts, canned replies) reside in `src/ai.ts` and `src/replies.ts`; shared utilities such as config loading, Discord helpers, and OCR logic sit in `src/config.ts`, `src/discord-utils.ts`, and `src/ocr.ts`.
- TypeScript sources compile into `dist/`; keep deployment knobs in `nixpacks.toml`.

## Build, Test, and Development Commands
- `npm install` — pulls TypeScript, tsx, tsup, and other dev dependencies required by the bot.
- `npm run dev` — runs `tsx watch src/index.ts` for hot-reloading during local Discord testing.
- `npm run build` — cleans old artifacts and bundles sources to CommonJS in `dist/`.
- `npm start` — executes the compiled bot from `dist/index.js`, mirroring production behavior.

## Coding Style & Naming Conventions
- TypeScript throughout with 2-space indentation, double quotes, and trailing semicolons; match existing formatting.
- Prefer named exports and kebab-case filenames for multiword modules (e.g., `discord-utils.ts`).
- Keep constants near usage and route secrets exclusively through `src/config.ts`.

## Testing Guidelines
- No committed test suite yet; validate feature work on a staging Discord guild before shipping.
- For new pure helpers, add Vitest-based specs under `src/__tests__/` (e.g., `src/__tests__/config.test.ts`) and run with `npx vitest`.
- Document expected bot replies in PR descriptions when behavior changes.

## Commit & Pull Request Guidelines
- Write short, present-tense commit subjects (e.g., "Add LGD-specific insults"); reference related issues or Discord threads in bodies.
- PRs should list reproduction steps, screenshots of relevant Discord interactions, and any `.env` updates.
- Call out migrations, new commands, or external service integrations so reviewers can validate them quickly.

## Security & Configuration Tips
- Populate `.env` with `DISCORD_TOKEN`, `DISCORD_CLIENT_ID`, `N8N_URL`, `N8N_USERNAME`, and `N8N_PASSWORD`; the bot fails fast if any are missing.
- Never commit secrets; rotate credentials after testing in shared guilds.
- Document new external APIs or dependencies and update `nixpacks.toml` when runtime packages change.
