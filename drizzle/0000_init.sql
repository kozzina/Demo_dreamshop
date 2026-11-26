CREATE TABLE "ai_usage" (
	"day" date NOT NULL,
	"session_id" uuid NOT NULL,
	"messages" integer DEFAULT 0 NOT NULL,
	"cost_usd" numeric(10, 4) DEFAULT '0' NOT NULL,
	CONSTRAINT "ai_usage_day_session_id_pk" PRIMARY KEY("day","session_id")
);
--> statement-breakpoint
CREATE TABLE "cart_lines" (
	"session_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"qty" integer NOT NULL,
	"night" date NOT NULL,
	CONSTRAINT "cart_lines_session_id_slug_pk" PRIMARY KEY("session_id","slug")
);
--> statement-breakpoint
CREATE TABLE "chat_messages" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"session_id" uuid NOT NULL,
	"role" text NOT NULL,
	"content" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"order_number" integer,
	"type" text NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"order_number" integer NOT NULL,
	"slug" text NOT NULL,
	"qty" integer NOT NULL,
	"night" date NOT NULL,
	"price_cents" integer NOT NULL,
	CONSTRAINT "order_items_order_number_slug_pk" PRIMARY KEY("order_number","slug")
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"number" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "orders_number_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1041 CACHE 1),
	"session_id" uuid,
	"channel" text NOT NULL,
	"alias" text NOT NULL,
	"telegram_chat_id" bigint,
	"total_cents" integer NOT NULL,
	"status" text DEFAULT 'new' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"status_changed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"channel" text NOT NULL,
	"alias" text NOT NULL,
	"lang" text DEFAULT 'ru' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cart_lines" ADD CONSTRAINT "cart_lines_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_order_number_orders_number_fk" FOREIGN KEY ("order_number") REFERENCES "public"."orders"("number") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_number_orders_number_fk" FOREIGN KEY ("order_number") REFERENCES "public"."orders"("number") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "chat_messages_session_idx" ON "chat_messages" USING btree ("session_id","id");--> statement-breakpoint
CREATE INDEX "events_created_idx" ON "events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "orders_session_idx" ON "orders" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "orders_status_changed_idx" ON "orders" USING btree ("status","status_changed_at");