ALTER TABLE "sessions" ADD COLUMN "telegram_chat_id" bigint;--> statement-breakpoint
CREATE INDEX "sessions_telegram_chat_idx" ON "sessions" USING btree ("telegram_chat_id","expires_at");