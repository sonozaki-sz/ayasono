// src/bot/main.ts
// Discord Bot エントリーポイント

import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "@prisma/client";
import { Routes } from "discord.js";
import { env } from "../shared/config/env";
import { getGuildConfigRepository } from "../shared/database";
import {
  setupGlobalErrorHandlers,
  setupGracefulShutdown,
} from "../shared/errors/ErrorHandler";
import { localeManager, tDefault } from "../shared/locale";
import { registerBotEvent } from "../shared/types/discord";
import { logger } from "../shared/utils/logger";
import { setPrismaClient } from "../shared/utils/prisma";
import { createBotClient } from "./client";
import { commands } from "./commands";
import { events } from "./events";

const COMMAND_REGISTRATION_SCOPE = {
  GUILD: "Guild",
  GLOBAL: "Global",
} as const;

const PROCESS_EXIT_CODE = {
  FAILURE: 1,
} as const;

async function startBot() {
  const adapter = new PrismaLibSql({
    url: env.DATABASE_URL,
  });
  const prisma = new PrismaClient({ adapter });
  await prisma.$connect();

  // Prismaクライアントをモジュール内に登録（イベントハンドラーからアクセス可能にする）
  setPrismaClient(prisma);

  localeManager.setRepository(getGuildConfigRepository());

  // LocaleManagerを初期化
  await localeManager.initialize();

  logger.info(tDefault("system:bot.starting"));

  // クライアント作成
  const client = createBotClient();

  // グレースフルシャットダウンを設定
  setupGracefulShutdown(async () => {
    await client.shutdown();
    await prisma.$disconnect();
  });

  try {
    // RESTクライアントにトークンを設定
    client.rest.setToken(env.DISCORD_TOKEN);

    // コマンド登録
    logger.info(
      tDefault("system:bot.commands.registering", { count: commands.length }),
    );

    for (const command of commands) {
      client.commands.set(command.data.name, command);
    }

    // コマンドをDiscord APIに登録
    // 開発中はギルドコマンド（即座に反映）、本番はグローバルコマンド（反映に最大1時間）
    if (env.DISCORD_GUILD_ID) {
      // ギルドコマンドとして登録（開発用）
      await client.rest.put(
        Routes.applicationGuildCommands(
          env.DISCORD_APP_ID,
          env.DISCORD_GUILD_ID,
        ),
        {
          body: commands.map((cmd) => cmd.data.toJSON()),
        },
      );
      logger.info(
        `${tDefault("system:bot.commands.registered")} (${COMMAND_REGISTRATION_SCOPE.GUILD})`,
      );
    } else {
      // グローバルコマンドとして登録（本番用）
      await client.rest.put(Routes.applicationCommands(env.DISCORD_APP_ID), {
        body: commands.map((cmd) => cmd.data.toJSON()),
      });
      logger.info(
        `${tDefault("system:bot.commands.registered")} (${COMMAND_REGISTRATION_SCOPE.GLOBAL})`,
      );
    }

    // イベント登録
    logger.info(
      tDefault("system:bot.events.registering", { count: events.length }),
    );

    for (const event of events) {
      registerBotEvent(client, event);
      logger.debug(
        tDefault("system:ready.event_registered", { name: event.name }),
      );
    }

    logger.info(tDefault("system:bot.events.registered"));

    // Discordにログイン
    await client.login(env.DISCORD_TOKEN);
  } catch (error) {
    logger.error(tDefault("system:bot.startup.error"), error);
    await prisma.$disconnect();
    process.exit(PROCESS_EXIT_CODE.FAILURE);
  }
}

// グローバルエラーハンドラーを設定
setupGlobalErrorHandlers();

// 起動
startBot().catch((error) => {
  logger.error(tDefault("system:bot.startup.failed"), error);
  process.exit(PROCESS_EXIT_CODE.FAILURE);
});
