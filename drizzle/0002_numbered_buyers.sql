-- Buyers are numbered instead of named: «Покупатель 12». New sessions take the next number
-- from a sequence; existing buyers are renumbered by arrival, and their orders and feed events
-- follow. Aliases are fictional and shown only in the demo feed, so there is nothing to roll back
-- beyond this cosmetic change (to undo: DROP SEQUENCE buyer_number_seq).
CREATE SEQUENCE IF NOT EXISTS "buyer_number_seq";
--> statement-breakpoint
CREATE TABLE "buyer_alias_map" AS
  SELECT "id", "alias" AS "old_alias", "created_at", 'Покупатель ' || row_number() OVER (ORDER BY "created_at", "id") AS "new_alias"
  FROM "sessions";
--> statement-breakpoint
UPDATE "sessions" s SET "alias" = m."new_alias" FROM "buyer_alias_map" m WHERE m."id" = s."id";
--> statement-breakpoint
UPDATE "orders" o SET "alias" = s."alias" FROM "sessions" s WHERE o."session_id" = s."id";
--> statement-breakpoint
UPDATE "events" e SET "payload" = jsonb_set(e."payload", '{alias}', to_jsonb(o."alias"))
  FROM "orders" o WHERE e."order_number" = o."number" AND e."payload" ? 'alias';
--> statement-breakpoint
-- Calls for a manager carry no session: match the old name to the latest buyer with it before the event.
UPDATE "events" e SET "payload" = jsonb_set(e."payload", '{alias}', to_jsonb(m."new_alias"))
  FROM "buyer_alias_map" m
  WHERE e."order_number" IS NULL AND e."payload" ? 'alias' AND m."old_alias" = e."payload"->>'alias'
    AND m."created_at" = (
      SELECT max(m2."created_at") FROM "buyer_alias_map" m2
      WHERE m2."old_alias" = e."payload"->>'alias' AND m2."created_at" <= e."created_at"
    );
--> statement-breakpoint
SELECT setval('"buyer_number_seq"', (SELECT count(*) FROM "buyer_alias_map") + 1, false);
--> statement-breakpoint
DROP TABLE "buyer_alias_map";
