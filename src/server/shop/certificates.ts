import "server-only";
import { after } from "next/server";
import { CERTIFICATE_VALID_MONTHS } from "@/domain/certificates";
import { formatUsd, type Cents } from "@/domain/money";
import { sendMessage } from "../telegram/bot-api";
import { callManager } from "./orders";
import type { Session } from "./sessions";

/**
 * A certificate is issued by a manager (knowledge base, section 5), so a request is a call for
 * a human in the manager feed — the same path the assistant uses. In Telegram the buyer also
 * gets a confirmation from Sonya in the chat.
 */
export async function requestCertificate(session: Session, amount: Cents) {
  const price = formatUsd(amount);
  const result = await callManager(session, `Подарочный сертификат на ${price}`);
  const chatId = session.telegramChatId;
  if (chatId) {
    after(() =>
      sendMessage(chatId, `Передала менеджеру заявку на подарочный сертификат на ${price}. Он действует ${CERTIFICATE_VALID_MONTHS} месяцев.`).catch((err) =>
        console.error("[certificate notice]", err),
      ),
    );
  }
  return result;
}
