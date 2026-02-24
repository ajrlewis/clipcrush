CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$
BEGIN
  CREATE TYPE "public"."track_provider" AS ENUM ('deezer');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

CREATE TABLE IF NOT EXISTS "tracks" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "provider" "track_provider" DEFAULT 'deezer' NOT NULL,
  "external_track_id" text NOT NULL,
  "title" text NOT NULL,
  "artist" text NOT NULL,
  "album" text,
  "preview_url" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "sessions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" text,
  "started_at" timestamp with time zone DEFAULT now() NOT NULL,
  "last_seen_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "session_tracks" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "session_id" uuid NOT NULL,
  "track_id" uuid NOT NULL,
  "source" text DEFAULT 'search' NOT NULL,
  "search_query" text,
  "added_at" timestamp with time zone DEFAULT now() NOT NULL
);

DO $$
BEGIN
  ALTER TABLE "session_tracks"
  ADD CONSTRAINT "session_tracks_session_id_sessions_id_fk"
  FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id")
  ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

DO $$
BEGIN
  ALTER TABLE "session_tracks"
  ADD CONSTRAINT "session_tracks_track_id_tracks_id_fk"
  FOREIGN KEY ("track_id") REFERENCES "public"."tracks"("id")
  ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

CREATE UNIQUE INDEX IF NOT EXISTS "tracks_provider_external_track_id_uidx"
  ON "tracks" USING btree ("provider", "external_track_id");

CREATE INDEX IF NOT EXISTS "tracks_title_idx"
  ON "tracks" USING btree ("title");

CREATE INDEX IF NOT EXISTS "tracks_artist_idx"
  ON "tracks" USING btree ("artist");

CREATE INDEX IF NOT EXISTS "sessions_user_id_idx"
  ON "sessions" USING btree ("user_id");

CREATE INDEX IF NOT EXISTS "session_tracks_session_id_added_at_idx"
  ON "session_tracks" USING btree ("session_id", "added_at");

CREATE INDEX IF NOT EXISTS "session_tracks_track_id_idx"
  ON "session_tracks" USING btree ("track_id");
