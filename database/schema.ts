import { sql } from 'drizzle-orm'
import {
    foreignKey,
    index,
    integer,
    sqliteTable as table,
    text,
    type SQLiteTableExtraConfigValue,
    uniqueIndex,
} from 'drizzle-orm/sqlite-core'

export const users = table('users', {
    id: text().primaryKey(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
        .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
        .notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
        .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
        .$onUpdate(() => /* @__PURE__ */ new Date())
        .notNull(),
    name: text().notNull(),
    email: text().notNull().unique(),
    emailVerified: integer('email_verified', { mode: 'boolean' }).default(false).notNull(),
    image: text(),
    role: text(),
    banned: integer({ mode: 'boolean' }).default(false),
    banReason: text('ban_reason'),
    banExpires: integer('ban_expires', { mode: 'timestamp_ms' }),
})

export const accounts = table(
    'accounts',
    {
        id: text().primaryKey(),
        issuer: text().notNull(),
        providerAccountId: text('provider_account_id').notNull(),
        providerId: text('provider_id').notNull(),
        userId: text('user_id').notNull(),
        accessToken: text('access_token'),
        refreshToken: text('refresh_token'),
        idToken: text('id_token'),
        accessTokenExpiresAt: integer('access_token_expires_at', {
            mode: 'timestamp_ms',
        }),
        refreshTokenExpiresAt: integer('refresh_token_expires_at', {
            mode: 'timestamp_ms',
        }),
        scope: text(),
        password: text(),
        createdAt: integer('created_at', { mode: 'timestamp_ms' })
            .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
            .notNull(),
        updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
            .$onUpdate(() => /* @__PURE__ */ new Date())
            .notNull(),
    },
    (table): SQLiteTableExtraConfigValue[] => [
        uniqueIndex('accounts_issuer_providerAccountId_uidx').on(
            table.issuer,
            table.providerAccountId,
        ),
        index('accounts_userId_idx').on(table.userId),
        foreignKey({
            name: 'accounts_userId_fkey',
            columns: [table.userId],
            foreignColumns: [users.id],
        }).onDelete('cascade'),
    ],
)

export const sessions = table(
    'sessions',
    {
        id: text().primaryKey(),
        expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
        token: text().notNull().unique(),
        createdAt: integer('created_at', { mode: 'timestamp_ms' })
            .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
            .notNull(),
        updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
            .$onUpdate(() => /* @__PURE__ */ new Date())
            .notNull(),
        ipAddress: text('ip_address'),
        userAgent: text('user_agent'),
        userId: text('user_id').notNull(),
        impersonatedBy: text('impersonated_by'),
    },
    (table): SQLiteTableExtraConfigValue[] => [
        index('sessions_userId_idx').on(table.userId),
        foreignKey({
            name: 'sessions_userId_fkey',
            columns: [table.userId],
            foreignColumns: [users.id],
        }).onDelete('cascade'),
    ],
)

export const verifications = table(
    'verifications',
    {
        id: text().primaryKey(),
        identifier: text().notNull(),
        value: text().notNull(),
        expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
        createdAt: integer('created_at', { mode: 'timestamp_ms' })
            .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
            .notNull(),
        updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
            .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
            .$onUpdate(() => /* @__PURE__ */ new Date())
            .notNull(),
    },
    (table): SQLiteTableExtraConfigValue[] => [
        index('verifications_identifier_idx').on(table.identifier),
    ],
)

export const passkeys = table(
    'passkeys',
    {
        id: text().primaryKey(),
        createdAt: integer('created_at', { mode: 'timestamp_ms' }),
        name: text(),
        publicKey: text('public_key').notNull(),
        userId: text('user_id').notNull(),
        credentialID: text('credential_id').notNull(),
        counter: integer().notNull(),
        deviceType: text('device_type').notNull(),
        backedUp: integer('backed_up', { mode: 'boolean' }).notNull(),
        transports: text(),
        aaguid: text(),
    },
    (table): SQLiteTableExtraConfigValue[] => [
        index('passkeys_userId_idx').on(table.userId),
        index('passkeys_credentialID_idx').on(table.credentialID),
        foreignKey({
            name: 'passkeys_userId_fkey',
            columns: [table.userId],
            foreignColumns: [users.id],
        }).onDelete('cascade'),
    ],
)

export const rateLimits = table('rate_limits', {
    id: text().primaryKey(),
    key: text().notNull().unique(),
    count: integer().notNull(),
    lastRequest: integer('last_request').notNull(),
})

export const socials = table(
    'socials',
    {
        id: integer({ mode: 'number' }).primaryKey({ autoIncrement: true }),
        href: text().notNull(),
        alias: text(),
        icon: text().notNull(),
        label: text().notNull(),
        sortIndex: integer('sort_index', { mode: 'number' }).notNull().default(0),
    },
    (table): SQLiteTableExtraConfigValue[] => [
        index('socials_alias_idx').on(table.alias),
        index('socials_sortIndex_idx').on(table.sortIndex),
    ],
)

export const careers = table(
    'careers',
    {
        id: integer({ mode: 'number' }).primaryKey({ autoIncrement: true }),
        period: text().notNull(),
        position: text().notNull(),
        company: text().notNull(),
        sortIndex: integer('sort_index', { mode: 'number' }).notNull().default(0),
    },
    (table): SQLiteTableExtraConfigValue[] => [index('careers_sortIndex_idx').on(table.sortIndex)],
)

export const works = table(
    'works',
    {
        slug: text().primaryKey(),
        createdAt: integer('created_at', { mode: 'timestamp_ms' })
            .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
            .notNull(),
        title: text().notNull(),
        description: text(),
        category: text(),
        image: text(),
        icon: text(),
        href: text(),
        sortIndex: integer('sort_index', { mode: 'number' }).notNull().default(0),
    },
    (table): SQLiteTableExtraConfigValue[] => [
        index('works_sortIndex_createdAt_idx').on(table.sortIndex, table.createdAt),
    ],
)

export const arts = table(
    'arts',
    {
        slug: text().primaryKey(),
        createdAt: integer('created_at', { mode: 'timestamp_ms' })
            .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
            .notNull(),
        title: text().notNull(),
        description: text(),
        href: text(),
        sortIndex: integer('sort_index', { mode: 'number' }).notNull().default(0),
    },
    (table): SQLiteTableExtraConfigValue[] => [
        index('arts_sortIndex_createdAt_idx').on(table.sortIndex, table.createdAt),
    ],
)

export const artImages = table(
    'art_images',
    {
        id: integer({ mode: 'number' }).primaryKey({ autoIncrement: true }),
        artSlug: text('art_slug').notNull(),
        src: text().notNull(),
        alt: text(),
    },
    (table): SQLiteTableExtraConfigValue[] => [
        index('art_images_artSlug_idx').on(table.artSlug),
        foreignKey({
            name: 'art_images_artSlug_fkey',
            columns: [table.artSlug],
            foreignColumns: [arts.slug],
        }).onDelete('cascade'),
    ],
)

export const skills = table(
    'skills',
    {
        id: integer({ mode: 'number' }).primaryKey({ autoIncrement: true }),
        name: text().notNull(),
        icon: text().notNull(),
        category: text(),
        sortIndex: integer('sort_index', { mode: 'number' }).notNull().default(0),
    },
    (table): SQLiteTableExtraConfigValue[] => [index('skills_sortIndex_idx').on(table.sortIndex)],
)

export const ranks = table(
    'ranks',
    {
        id: integer({ mode: 'number' }).primaryKey({ autoIncrement: true }),
        game: text().notNull(),
        season: text(),
        rank: text().notNull(),
        imageUrl: text('image_url').notNull(),
        href: text(),
        sortIndex: integer('sort_index', { mode: 'number' }).notNull().default(0),
    },
    (table): SQLiteTableExtraConfigValue[] => [index('ranks_sortIndex_idx').on(table.sortIndex)],
)

export const posts = table(
    'posts',
    {
        slug: text().primaryKey(),
        createdAt: integer('created_at', { mode: 'timestamp_ms' })
            .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
            .notNull(),
        updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
            .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
            .$onUpdate(() => /* @__PURE__ */ new Date())
            .notNull(),
        title: text().notNull(),
        content: text().notNull(),
    },
    (table): SQLiteTableExtraConfigValue[] => [index('posts_createdAt_idx').on(table.createdAt)],
)

export const postTags = table(
    'post_tags',
    {
        postSlug: text('post_slug').notNull(),
        tag: text().notNull(),
    },
    (table): SQLiteTableExtraConfigValue[] => [
        index('post_tags_postSlug_idx').on(table.postSlug),
        foreignKey({
            name: 'post_tags_postSlug_fkey',
            columns: [table.postSlug],
            foreignColumns: [posts.slug],
        }).onDelete('cascade'),
    ],
)
