// src/shared/errors/ErrorHandler.ts
// グローバルエラーハンドラ
// REFACTORING_PLAN.md Phase 2 準拠

import { ChatInputCommandInteraction, RepliableInteraction } from "discord.js";
import { NODE_ENV, env } from "../config/env";
import { tDefault } from "../locale";
import { logger } from "../utils/logger";
import { createErrorEmbed } from "../utils/messageResponse";
import { BaseError } from "./CustomErrors";

const ERROR_HANDLER_CONSTANTS = {
  GLOBAL_ALREADY_REGISTERED:
    "Global error handlers already registered, skipping.",
  SHUTDOWN_ALREADY_REGISTERED:
    "Graceful shutdown handlers already registered, skipping.",
  SHUTDOWN_IN_PROGRESS_SUFFIX: " (already shutting down)",
  PROCESS_EVENT: {
    UNHANDLED_REJECTION: "unhandledRejection",
    UNCAUGHT_EXCEPTION: "uncaughtException",
    WARNING: "warning",
  },
  SIGNAL: {
    SIGTERM: "SIGTERM",
    SIGINT: "SIGINT",
  },
  EXIT_CODE: {
    SUCCESS: 0,
    FAILURE: 1,
  },
} as const;

/**
 * unknown を Error | BaseError に変換するヘルパー
 */
export const toError = (error: unknown): Error | BaseError => {
  if (error instanceof BaseError || error instanceof Error) {
    return error;
  }
  return new Error(String(error));
};

/**
 * エラーログ出力
 */
export const logError = (error: Error | BaseError): void => {
  if (error instanceof BaseError) {
    if (error.isOperational) {
      logger.warn(`[${error.name}] ${error.message}`, {
        statusCode: error.statusCode,
        stack: error.stack,
      });
    } else {
      logger.error(`[${error.name}] ${error.message}`, {
        statusCode: error.statusCode,
        stack: error.stack,
      });
    }
  } else {
    logger.error(`[UnhandledError] ${error.message}`, {
      stack: error.stack,
    });
  }
};

/**
 * ユーザー向けエラーメッセージ取得
 */
export const getUserFriendlyMessage = (error: Error | BaseError): string => {
  if (error instanceof BaseError && error.isOperational) {
    return error.message;
  }

  // 本番環境では詳細を隠す
  if (env.NODE_ENV === NODE_ENV.PRODUCTION) {
    return tDefault("errors:general.unexpected_production");
  }

  return tDefault("errors:general.unexpected_with_message", {
    message: error.message,
  });
};

/**
 * エラーをインタラクションに返信する内部共通処理
 */
const replyWithError = async (
  interaction: RepliableInteraction,
  error: unknown,
): Promise<void> => {
  const err = toError(error);
  logError(err);

  const message = getUserFriendlyMessage(err);
  const title =
    err instanceof BaseError && err.name
      ? err.name
      : tDefault("errors:general.error_title");
  const embed = createErrorEmbed(message, { title });

  try {
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply({
        embeds: [embed],
      });
    } else {
      await interaction.reply({
        embeds: [embed],
        ephemeral: true,
      });
    }
  } catch (replyError) {
    logger.error(tDefault("system:error.reply_failed"), replyError);
  }
};

/**
 * コマンド実行時のエラーハンドラ
 */
export const handleCommandError = async (
  interaction: ChatInputCommandInteraction,
  error: unknown,
): Promise<void> => replyWithError(interaction, error);

/**
 * インタラクション全般のエラーハンドラ
 * （モーダル、ボタン、セレクトメニューなど）
 */
export const handleInteractionError = async (
  interaction: RepliableInteraction,
  error: unknown,
): Promise<void> => replyWithError(interaction, error);

/** 重複登録防止フラグ */
let _globalHandlersRegistered = false;
/** グレースフルシャットダウン重複登録防止フラグ */
let _gracefulShutdownRegistered = false;
/** シャットダウン処理の多重実行防止フラグ */
let _shutdownInProgress = false;

/**
 * グローバル未処理エラーハンドラ
 * 複数箇所から呼ばれても1回だけ登録する
 */
export const setupGlobalErrorHandlers = (): void => {
  if (_globalHandlersRegistered) {
    logger.warn(ERROR_HANDLER_CONSTANTS.GLOBAL_ALREADY_REGISTERED);
    return;
  }
  _globalHandlersRegistered = true;

  // Unhandled Promise Rejection
  process.on(
    ERROR_HANDLER_CONSTANTS.PROCESS_EVENT.UNHANDLED_REJECTION,
    (reason: unknown, promise: Promise<unknown>) => {
      logger.error(tDefault("system:error.unhandled_rejection_log"), {
        reason,
        promise,
      });

      if (reason instanceof Error) {
        logError(reason);
      }
    },
  );

  // Uncaught Exception
  process.on(
    ERROR_HANDLER_CONSTANTS.PROCESS_EVENT.UNCAUGHT_EXCEPTION,
    (error: Error) => {
      logger.error(tDefault("system:error.uncaught_exception_log"), error);
      logError(error);

      // 非運用エラーの場合はプロセスを終了
      if (error instanceof BaseError && !error.isOperational) {
        process.exit(1);
      }
    },
  );

  // ワーニング
  process.on(
    ERROR_HANDLER_CONSTANTS.PROCESS_EVENT.WARNING,
    (warning: Error) => {
      logger.warn(tDefault("system:error.node_warning"), {
        name: warning.name,
        message: warning.message,
        stack: warning.stack,
      });
    },
  );
};

/**
 * プロセス終了時の処理
 */
export const setupGracefulShutdown = (cleanup?: () => Promise<void>): void => {
  if (_gracefulShutdownRegistered) {
    logger.warn(ERROR_HANDLER_CONSTANTS.SHUTDOWN_ALREADY_REGISTERED);
    return;
  }
  _gracefulShutdownRegistered = true;

  const shutdown = async (signal: string) => {
    if (_shutdownInProgress) {
      logger.warn(
        tDefault("system:shutdown.signal_received", { signal }) +
          ERROR_HANDLER_CONSTANTS.SHUTDOWN_IN_PROGRESS_SUFFIX,
      );
      return;
    }
    _shutdownInProgress = true;

    logger.info(tDefault("system:shutdown.signal_received", { signal }));

    try {
      if (cleanup) {
        await cleanup();
      }
      logger.info(tDefault("system:error.cleanup_complete"));
      process.exit(ERROR_HANDLER_CONSTANTS.EXIT_CODE.SUCCESS);
    } catch (error) {
      logger.error(tDefault("system:error.cleanup_failed"), error);
      process.exit(ERROR_HANDLER_CONSTANTS.EXIT_CODE.FAILURE);
    }
  };

  process.once(ERROR_HANDLER_CONSTANTS.SIGNAL.SIGTERM, () => {
    void shutdown(ERROR_HANDLER_CONSTANTS.SIGNAL.SIGTERM);
  });
  process.once(ERROR_HANDLER_CONSTANTS.SIGNAL.SIGINT, () => {
    void shutdown(ERROR_HANDLER_CONSTANTS.SIGNAL.SIGINT);
  });
};
