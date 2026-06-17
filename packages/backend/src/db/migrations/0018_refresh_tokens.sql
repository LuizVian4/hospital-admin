CREATE TABLE IF NOT EXISTS "refresh_tokens" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "token_hash" text NOT NULL UNIQUE,
  "expires_at" timestamptz NOT NULL,
  "created_at" timestamptz DEFAULT now(),
  "revoked_at" timestamptz
);

CREATE INDEX IF NOT EXISTS "idx_refresh_tokens_user_id" ON "refresh_tokens" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_refresh_tokens_expires_at" ON "refresh_tokens" ("expires_at");
