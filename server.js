import express from "express";
import dotenv from "dotenv";
dotenv.config();

import { app, ensureReady, createBot } from "./lib/app.js";

// Local / Termux / VPS runner: serves the frontend statically and runs the
// Telegram bot in long-polling mode. Not used by Vercel (see api/index.js).
app.use(express.static("public"));

const PORT = Number(process.env.PORT || 3000);

const bot = createBot();
if (bot) {
  bot.launch().then(() => console.log("Telegram bot started (polling)"));
  process.once("SIGINT", () => bot.stop("SIGINT"));
  process.once("SIGTERM", () => bot.stop("SIGTERM"));
}

ensureReady()
  .then(() => app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`)))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
