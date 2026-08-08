import { sql } from 'drizzle-orm'
import {
    foreignKey,
    index,
    integer,
    sqliteTable as table,
    text,
    type SQLiteTableExtraConfigValue,
} from 'drizzle-orm/sqlite-core'
import { nanoid } from 'nanoid'

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
        accountId: text('account_id').notNull(),
        issuer: text().notNull(),
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

export const jwks = table('jwks', {
    id: text().primaryKey(),
    publicKey: text('public_key').notNull(),
    privateKey: text('private_key').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
    expiresAt: integer('expires_at', { mode: 'timestamp_ms' }),
    alg: text(),
    crv: text(),
})

export const oauthClients = table(
    'oauth_clients',
    {
        id: text().primaryKey(),
        clientId: text('client_id').notNull().unique(),
        clientSecret: text('client_secret'),
        clientDiscoveryId: text('client_discovery_id'),
        disabled: integer({ mode: 'boolean' }).default(false),
        skipConsent: integer('skip_consent', { mode: 'boolean' }),
        enableEndSession: integer('enable_end_session', { mode: 'boolean' }),
        subjectType: text('subject_type'),
        scopes: text({ mode: 'json' }),
        clientCredentialsScopes: text('client_credentials_scopes', { mode: 'json' }).default([]),
        userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),
        createdAt: integer('created_at', { mode: 'timestamp_ms' }),
        updatedAt: integer('updated_at', { mode: 'timestamp_ms' }),
        name: text(),
        uri: text(),
        icon: text(),
        contacts: text({ mode: 'json' }),
        tos: text(),
        policy: text(),
        softwareId: text('software_id'),
        softwareVersion: text('software_version'),
        softwareStatement: text('software_statement'),
        redirectUris: text('redirect_uris', { mode: 'json' }).notNull(),
        postLogoutRedirectUris: text('post_logout_redirect_uris', { mode: 'json' }),
        backchannelLogoutUri: text('backchannel_logout_uri'),
        backchannelLogoutSessionRequired: integer('backchannel_logout_session_required', {
            mode: 'boolean',
        }),
        tokenEndpointAuthMethod: text('token_endpoint_auth_method'),
        applicationType: text('application_type'),
        jwks: text(),
        jwksUri: text('jwks_uri'),
        grantTypes: text('grant_types', { mode: 'json' }),
        responseTypes: text('response_types', { mode: 'json' }),
        requirePKCE: integer('require_pkce', { mode: 'boolean' }),
        dpopBoundAccessTokens: integer('dpop_bound_access_tokens', { mode: 'boolean' }).default(
            false,
        ),
        referenceId: text('reference_id'),
        metadata: text({ mode: 'json' }),
    },
    (table): SQLiteTableExtraConfigValue[] => [
        index('oauth_clients_userId_idx').on(table.userId),
        foreignKey({
            name: 'oauth_clients_userId_fkey',
            columns: [table.userId],
            foreignColumns: [users.id],
        }).onDelete('cascade'),
    ],
)

export const oauthResources = table('oauth_resources', {
    id: text().primaryKey(),
    identifier: text().notNull().unique(),
    name: text().notNull(),
    accessTokenTtl: integer('access_token_ttl'),
    refreshTokenTtl: integer('refresh_token_ttl'),
    signingAlgorithm: text('signing_algorithm'),
    signingKeyId: text('signing_key_id'),
    allowedScopes: text('allowed_scopes', { mode: 'json' }).$type<string[]>(),
    customClaims: text('custom_claims', { mode: 'json' }).$type<Record<string, unknown>>(),
    dpopBoundAccessTokensRequired: integer('dpop_bound_access_tokens_required', {
        mode: 'boolean',
    }).default(false),
    disabled: integer({ mode: 'boolean' }).default(false),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' }),
    policyVersion: integer('policy_version').default(1),
    metadata: text({ mode: 'json' }).$type<Record<string, unknown>>(),
})

export const oauthClientResources = table(
    'oauth_client_resources',
    {
        id: text().primaryKey(),
        clientId: text('client_id').notNull(),
        resourceId: text('resource_id').notNull(),
        metadata: text({ mode: 'json' }).$type<Record<string, unknown>>(),
        createdAt: integer('created_at', { mode: 'timestamp_ms' }),
    },
    (table): SQLiteTableExtraConfigValue[] => [
        index('oauth_client_resources_clientId_idx').on(table.clientId),
        index('oauth_client_resources_resourceId_idx').on(table.resourceId),
        foreignKey({
            name: 'oauth_client_resources_clientId_fkey',
            columns: [table.clientId],
            foreignColumns: [oauthClients.clientId],
        }).onDelete('cascade'),
        foreignKey({
            name: 'oauth_client_resources_resourceId_fkey',
            columns: [table.resourceId],
            foreignColumns: [oauthResources.identifier],
        }).onDelete('cascade'),
    ],
)

export const oauthRefreshTokens = table(
    'oauth_refresh_tokens',
    {
        id: text().primaryKey(),
        token: text().notNull().unique(),
        clientId: text('client_id').notNull(),
        sessionId: text('session_id'),
        userId: text('user_id').notNull(),
        referenceId: text('reference_id'),
        authorizationCodeId: text('authorization_code_id'),
        resources: text({ mode: 'json' }).$type<string[]>(),
        requestedUserInfoClaims: text('requested_user_info_claims', { mode: 'json' }).$type<
            Record<string, unknown>
        >(),
        expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
        createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
        revoked: integer({ mode: 'timestamp_ms' }),
        rotatedAt: integer('rotated_at', { mode: 'timestamp_ms' }),
        rotationReplayResponse: text('rotation_replay_response'),
        rotationReplayExpiresAt: integer('rotation_replay_expires_at', {
            mode: 'timestamp_ms',
        }),
        authTime: integer('auth_time', { mode: 'timestamp_ms' }),
        confirmation: text({ mode: 'json' }).$type<Record<string, unknown>>(),
        scopes: text({ mode: 'json' }).$type<string[]>().notNull(),
    },
    (table): SQLiteTableExtraConfigValue[] => [
        index('oauth_refresh_tokens_clientId_idx').on(table.clientId),
        index('oauth_refresh_tokens_sessionId_idx').on(table.sessionId),
        index('oauth_refresh_tokens_userId_idx').on(table.userId),
        index('oauth_refresh_tokens_authorizationCodeId_idx').on(table.authorizationCodeId),
        foreignKey({
            name: 'oauth_refresh_tokens_clientId_fkey',
            columns: [table.clientId],
            foreignColumns: [oauthClients.clientId],
        }).onDelete('cascade'),
        foreignKey({
            name: 'oauth_refresh_tokens_sessionId_fkey',
            columns: [table.sessionId],
            foreignColumns: [sessions.id],
        }).onDelete('set null'),
        foreignKey({
            name: 'oauth_refresh_tokens_userId_fkey',
            columns: [table.userId],
            foreignColumns: [users.id],
        }).onDelete('cascade'),
    ],
)

export const oauthAccessTokens = table(
    'oauth_access_tokens',
    {
        id: text().primaryKey(),
        token: text().notNull().unique(),
        clientId: text('client_id').notNull(),
        sessionId: text('session_id'),
        userId: text('user_id'),
        referenceId: text('reference_id'),
        authorizationCodeId: text('authorization_code_id'),
        resources: text({ mode: 'json' }).$type<string[]>(),
        requestedUserInfoClaims: text('requested_user_info_claims', { mode: 'json' }).$type<
            Record<string, unknown>
        >(),
        refreshId: text('refresh_id'),
        expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
        createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
        revoked: integer({ mode: 'timestamp_ms' }),
        confirmation: text({ mode: 'json' }).$type<Record<string, unknown>>(),
        scopes: text({ mode: 'json' }).$type<string[]>().notNull(),
    },
    (table): SQLiteTableExtraConfigValue[] => [
        index('oauth_access_tokens_clientId_idx').on(table.clientId),
        index('oauth_access_tokens_sessionId_idx').on(table.sessionId),
        index('oauth_access_tokens_userId_idx').on(table.userId),
        index('oauth_access_tokens_authorizationCodeId_idx').on(table.authorizationCodeId),
        index('oauth_access_tokens_refreshId_idx').on(table.refreshId),
        foreignKey({
            name: 'oauth_access_tokens_clientId_fkey',
            columns: [table.clientId],
            foreignColumns: [oauthClients.clientId],
        }).onDelete('cascade'),
        foreignKey({
            name: 'oauth_access_tokens_sessionId_fkey',
            columns: [table.sessionId],
            foreignColumns: [sessions.id],
        }).onDelete('set null'),
        foreignKey({
            name: 'oauth_access_tokens_userId_fkey',
            columns: [table.userId],
            foreignColumns: [users.id],
        }).onDelete('cascade'),
        foreignKey({
            name: 'oauth_access_tokens_refreshId_fkey',
            columns: [table.refreshId],
            foreignColumns: [oauthRefreshTokens.id],
        }).onDelete('cascade'),
    ],
)

export const oauthConsents = table(
    'oauth_consents',
    {
        id: text().primaryKey(),
        clientId: text('client_id').notNull(),
        userId: text('user_id'),
        referenceId: text('reference_id'),
        resources: text({ mode: 'json' }).$type<string[]>(),
        requestedUserInfoClaims: text('requested_user_info_claims', { mode: 'json' }).$type<
            Record<string, unknown>
        >(),
        scopes: text({ mode: 'json' }).$type<string[]>().notNull(),
        createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
        updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
    },
    (table): SQLiteTableExtraConfigValue[] => [
        index('oauth_consents_clientId_idx').on(table.clientId),
        index('oauth_consents_userId_idx').on(table.userId),
        foreignKey({
            name: 'oauth_consents_clientId_fkey',
            columns: [table.clientId],
            foreignColumns: [oauthClients.clientId],
        }).onDelete('cascade'),
        foreignKey({
            name: 'oauth_consents_userId_fkey',
            columns: [table.userId],
            foreignColumns: [users.id],
        }).onDelete('cascade'),
    ],
)

export const oauthClientAssertions = table('oauth_client_assertions', {
    id: text().primaryKey(),
    expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
})

export const persons = table('persons', {
    id: text()
        .primaryKey()
        .$default(() => nanoid()),
    name: text().notNull(),
    description: text(),
    image: text(),
})

export const personLinks = table(
    'person_links',
    {
        id: text()
            .primaryKey()
            .$default(() => nanoid()),
        personId: text('person_id').notNull(),
        href: text().notNull(),
        label: text().notNull(),
    },
    (table): SQLiteTableExtraConfigValue[] => [
        index('person_links_personId_idx').on(table.personId),
        foreignKey({
            name: 'person_links_personId_fkey',
            columns: [table.personId],
            foreignColumns: [persons.id],
        }).onDelete('cascade'),
    ],
)

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
        price: text(),
        style: text({ enum: ['large', 'small'] })
            .default('small')
            .notNull(),
        sortIndex: integer('sort_index', { mode: 'number' }).notNull().default(0),
    },
    (table): SQLiteTableExtraConfigValue[] => [
        index('works_sortIndex_createdAt_idx').on(table.sortIndex, table.createdAt),
    ],
)

export const workPersons = table(
    'work_persons',
    {
        id: text()
            .primaryKey()
            .$default(() => nanoid()),
        workSlug: text('work_slug').notNull(),
        personId: text('person_id').notNull(),
    },
    (table): SQLiteTableExtraConfigValue[] => [
        index('work_persons_workSlug_idx').on(table.workSlug),
        foreignKey({
            name: 'work_persons_workSlug_fkey',
            columns: [table.workSlug],
            foreignColumns: [works.slug],
        }).onDelete('cascade'),
        foreignKey({
            name: 'work_persons_personId_fkey',
            columns: [table.personId],
            foreignColumns: [persons.id],
        }).onDelete('cascade'),
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
        excerpt: text().default('').notNull(),
        content: text().notNull(),
        status: text({ enum: ['draft', 'scheduled', 'published'] })
            .default('published')
            .notNull(),
        scheduledAt: integer('scheduled_at', { mode: 'timestamp_ms' }),
        publishedAt: integer('published_at', { mode: 'timestamp_ms' }),
        // These fields make a scheduled publication independently addressable while
        // keeping the schema ready for a future scheduler migration.
        scheduleRevision: text('schedule_revision'),
        publishWorkflowInstanceId: text('publish_workflow_instance_id'),
        publishWorkflowEngine: text('publish_workflow_engine'),
        authorUserId: text('author_user_id'),
    },
    (table): SQLiteTableExtraConfigValue[] => [
        index('posts_createdAt_idx').on(table.createdAt),
        index('posts_status_publishedAt_idx').on(table.status, table.publishedAt),
        index('posts_status_scheduledAt_idx').on(table.status, table.scheduledAt),
        foreignKey({
            name: 'posts_authorUserId_fkey',
            columns: [table.authorUserId],
            foreignColumns: [users.id],
        }).onDelete('set null'),
    ],
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

export const postReviews = table(
    'post_reviews',
    {
        id: text().primaryKey(),
        postSlug: text('post_slug').notNull(),
        jobId: text('job_id'),
        model: text().notNull(),
        status: text({ enum: ['completed', 'failed'] }).notNull(),
        issues: text({ mode: 'json' })
            .$type<Array<{ severity: 'low' | 'medium' | 'high'; message: string }>>()
            .notNull(),
        suggestedContent: text('suggested_content'),
        sourceContent: text('source_content'),
        summary: text(),
        notes: text(),
        error: text(),
        createdAt: integer('created_at', { mode: 'timestamp_ms' })
            .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
            .notNull(),
    },
    (table): SQLiteTableExtraConfigValue[] => [
        index('post_reviews_postSlug_createdAt_idx').on(table.postSlug, table.createdAt),
        index('post_reviews_jobId_idx').on(table.jobId),
        foreignKey({
            name: 'post_reviews_postSlug_fkey',
            columns: [table.postSlug],
            foreignColumns: [posts.slug],
        }).onDelete('cascade'),
    ],
)

export const postReviewJobs = table(
    'post_review_jobs',
    {
        id: text().primaryKey(),
        postSlug: text('post_slug').notNull(),
        input: text({ mode: 'json' })
            .$type<{ title: string; excerpt: string; content: string }>()
            .notNull(),
        status: text({ enum: ['pending', 'running', 'completed', 'failed'] })
            .default('pending')
            .notNull(),
        attempts: integer().default(0).notNull(),
        availableAt: integer('available_at', { mode: 'timestamp_ms' }).notNull(),
        lockedAt: integer('locked_at', { mode: 'timestamp_ms' }),
        lastError: text('last_error'),
        createdAt: integer('created_at', { mode: 'timestamp_ms' })
            .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
            .notNull(),
        updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
            .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
            .$onUpdate(() => /* @__PURE__ */ new Date())
            .notNull(),
    },
    (table): SQLiteTableExtraConfigValue[] => [
        index('post_review_jobs_status_availableAt_idx').on(table.status, table.availableAt),
        index('post_review_jobs_postSlug_createdAt_idx').on(table.postSlug, table.createdAt),
        foreignKey({
            name: 'post_review_jobs_postSlug_fkey',
            columns: [table.postSlug],
            foreignColumns: [posts.slug],
        }).onDelete('cascade'),
    ],
)

export const adminActionPlans = table(
    'admin_action_plans',
    {
        id: text().primaryKey(),
        actorUserId: text('actor_user_id').notNull(),
        clientId: text('client_id').notNull(),
        operations: text({ mode: 'json' }).$type<unknown[]>().notNull(),
        snapshot: text({ mode: 'json' }).$type<unknown[]>().notNull(),
        snapshotHash: text('snapshot_hash').notNull(),
        status: text({
            enum: ['pending', 'applying', 'applied', 'partially_failed', 'expired'],
        })
            .default('pending')
            .notNull(),
        result: text({ mode: 'json' }).$type<Record<string, unknown>>(),
        expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
        retryExpiresAt: integer('retry_expires_at', { mode: 'timestamp_ms' }),
        createdAt: integer('created_at', { mode: 'timestamp_ms' })
            .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
            .notNull(),
        appliedAt: integer('applied_at', { mode: 'timestamp_ms' }),
    },
    (table): SQLiteTableExtraConfigValue[] => [
        index('admin_action_plans_actorUserId_createdAt_idx').on(
            table.actorUserId,
            table.createdAt,
        ),
        index('admin_action_plans_status_expiresAt_idx').on(table.status, table.expiresAt),
        foreignKey({
            name: 'admin_action_plans_actorUserId_fkey',
            columns: [table.actorUserId],
            foreignColumns: [users.id],
        }).onDelete('cascade'),
    ],
)

export const adminAuditEvents = table(
    'admin_audit_events',
    {
        id: text().primaryKey(),
        planId: text('plan_id'),
        actorUserId: text('actor_user_id').notNull(),
        clientId: text('client_id').notNull(),
        source: text({ enum: ['mcp', 'admin'] }).notNull(),
        action: text().notNull(),
        resource: text().notNull(),
        resourceId: text('resource_id'),
        before: text({ mode: 'json' }).$type<unknown>(),
        after: text({ mode: 'json' }).$type<unknown>(),
        outcome: text({ enum: ['succeeded', 'failed', 'skipped'] }).notNull(),
        error: text(),
        createdAt: integer('created_at', { mode: 'timestamp_ms' })
            .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
            .notNull(),
    },
    (table): SQLiteTableExtraConfigValue[] => [
        index('admin_audit_events_planId_idx').on(table.planId),
        index('admin_audit_events_actorUserId_createdAt_idx').on(
            table.actorUserId,
            table.createdAt,
        ),
        foreignKey({
            name: 'admin_audit_events_planId_fkey',
            columns: [table.planId],
            foreignColumns: [adminActionPlans.id],
        }).onDelete('set null'),
        foreignKey({
            name: 'admin_audit_events_actorUserId_fkey',
            columns: [table.actorUserId],
            foreignColumns: [users.id],
        }).onDelete('cascade'),
    ],
)
