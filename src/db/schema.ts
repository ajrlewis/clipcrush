import { relations } from 'drizzle-orm';
import { index, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

export const trackProviderEnum = pgEnum('track_provider', ['deezer']);

export const tracks = pgTable(
  'tracks',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    provider: trackProviderEnum('provider').notNull().default('deezer'),
    externalTrackId: text('external_track_id').notNull(),
    title: text('title').notNull(),
    artist: text('artist').notNull(),
    album: text('album'),
    previewUrl: text('preview_url').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('tracks_provider_external_track_id_uidx').on(table.provider, table.externalTrackId),
    index('tracks_title_idx').on(table.title),
    index('tracks_artist_idx').on(table.artist),
  ],
);

export const sessions = pgTable(
  'sessions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id'),
    startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
    lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('sessions_user_id_idx').on(table.userId)],
);

export const sessionTracks = pgTable(
  'session_tracks',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    sessionId: uuid('session_id')
      .notNull()
      .references(() => sessions.id, { onDelete: 'cascade' }),
    trackId: uuid('track_id')
      .notNull()
      .references(() => tracks.id, { onDelete: 'cascade' }),
    source: text('source').notNull().default('search'),
    searchQuery: text('search_query'),
    addedAt: timestamp('added_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('session_tracks_session_id_added_at_idx').on(table.sessionId, table.addedAt),
    index('session_tracks_track_id_idx').on(table.trackId),
  ],
);

export const sessionsRelations = relations(sessions, ({ many }) => ({
  sessionTracks: many(sessionTracks),
}));

export const tracksRelations = relations(tracks, ({ many }) => ({
  sessionTracks: many(sessionTracks),
}));

export const sessionTracksRelations = relations(sessionTracks, ({ one }) => ({
  session: one(sessions, {
    fields: [sessionTracks.sessionId],
    references: [sessions.id],
  }),
  track: one(tracks, {
    fields: [sessionTracks.trackId],
    references: [tracks.id],
  }),
}));

export type Track = typeof tracks.$inferSelect;
export type NewTrack = typeof tracks.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type SessionTrack = typeof sessionTracks.$inferSelect;
export type NewSessionTrack = typeof sessionTracks.$inferInsert;
