import { defineRelations } from 'drizzle-orm'

import * as schema from './schema'

export const relations = defineRelations(schema, (r) => ({
    users: {
        sessions: r.many.sessions({
            from: r.users.id,
            to: r.sessions.userId,
        }),
        accounts: r.many.accounts({
            from: r.users.id,
            to: r.accounts.userId,
        }),
        passkeys: r.many.passkeys({
            from: r.users.id,
            to: r.passkeys.userId,
        }),
        oauthClients: r.many.oauthClients({
            from: r.users.id,
            to: r.oauthClients.userId,
        }),
        oauthRefreshTokens: r.many.oauthRefreshTokens({
            from: r.users.id,
            to: r.oauthRefreshTokens.userId,
        }),
        oauthAccessTokens: r.many.oauthAccessTokens({
            from: r.users.id,
            to: r.oauthAccessTokens.userId,
        }),
        oauthConsents: r.many.oauthConsents({
            from: r.users.id,
            to: r.oauthConsents.userId,
        }),
        posts: r.many.posts({
            from: r.users.id,
            to: r.posts.authorUserId,
        }),
        adminActionPlans: r.many.adminActionPlans({
            from: r.users.id,
            to: r.adminActionPlans.actorUserId,
        }),
        adminAuditEvents: r.many.adminAuditEvents({
            from: r.users.id,
            to: r.adminAuditEvents.actorUserId,
        }),
    },
    sessions: {
        user: r.one.users({
            from: r.sessions.userId,
            to: r.users.id,
            optional: false,
        }),
    },
    accounts: {
        user: r.one.users({
            from: r.accounts.userId,
            to: r.users.id,
            optional: false,
        }),
    },
    passkeys: {
        user: r.one.users({
            from: r.passkeys.userId,
            to: r.users.id,
            optional: false,
        }),
    },
    oauthClients: {
        user: r.one.users({
            from: r.oauthClients.userId,
            to: r.users.id,
        }),
        resources: r.many.oauthClientResources({
            from: r.oauthClients.clientId,
            to: r.oauthClientResources.clientId,
        }),
        refreshTokens: r.many.oauthRefreshTokens({
            from: r.oauthClients.clientId,
            to: r.oauthRefreshTokens.clientId,
        }),
        accessTokens: r.many.oauthAccessTokens({
            from: r.oauthClients.clientId,
            to: r.oauthAccessTokens.clientId,
        }),
        consents: r.many.oauthConsents({
            from: r.oauthClients.clientId,
            to: r.oauthConsents.clientId,
        }),
    },
    oauthResources: {
        clients: r.many.oauthClientResources({
            from: r.oauthResources.identifier,
            to: r.oauthClientResources.resourceId,
        }),
    },
    oauthClientResources: {
        client: r.one.oauthClients({
            from: r.oauthClientResources.clientId,
            to: r.oauthClients.clientId,
            optional: false,
        }),
        resource: r.one.oauthResources({
            from: r.oauthClientResources.resourceId,
            to: r.oauthResources.identifier,
            optional: false,
        }),
    },
    oauthRefreshTokens: {
        client: r.one.oauthClients({
            from: r.oauthRefreshTokens.clientId,
            to: r.oauthClients.clientId,
            optional: false,
        }),
        session: r.one.sessions({
            from: r.oauthRefreshTokens.sessionId,
            to: r.sessions.id,
        }),
        user: r.one.users({
            from: r.oauthRefreshTokens.userId,
            to: r.users.id,
            optional: false,
        }),
        accessTokens: r.many.oauthAccessTokens({
            from: r.oauthRefreshTokens.id,
            to: r.oauthAccessTokens.refreshId,
        }),
    },
    oauthAccessTokens: {
        client: r.one.oauthClients({
            from: r.oauthAccessTokens.clientId,
            to: r.oauthClients.clientId,
            optional: false,
        }),
        session: r.one.sessions({
            from: r.oauthAccessTokens.sessionId,
            to: r.sessions.id,
        }),
        user: r.one.users({
            from: r.oauthAccessTokens.userId,
            to: r.users.id,
        }),
        refreshToken: r.one.oauthRefreshTokens({
            from: r.oauthAccessTokens.refreshId,
            to: r.oauthRefreshTokens.id,
        }),
    },
    oauthConsents: {
        client: r.one.oauthClients({
            from: r.oauthConsents.clientId,
            to: r.oauthClients.clientId,
            optional: false,
        }),
        user: r.one.users({
            from: r.oauthConsents.userId,
            to: r.users.id,
        }),
    },
    arts: {
        images: r.many.artImages({
            from: r.arts.slug,
            to: r.artImages.artSlug,
        }),
    },
    artImages: {
        art: r.one.arts({
            from: r.artImages.artSlug,
            to: r.arts.slug,
            optional: false,
        }),
    },
    persons: {
        works: r.many.workPersons({
            from: r.persons.id,
            to: r.workPersons.personId,
        }),
        links: r.many.personLinks({
            from: r.persons.id,
            to: r.personLinks.personId,
        }),
    },
    personLinks: {
        person: r.one.persons({
            from: r.personLinks.personId,
            to: r.persons.id,
        }),
    },
    works: {
        persons: r.many.workPersons({
            from: r.works.slug,
            to: r.workPersons.workSlug,
        }),
    },
    posts: {
        author: r.one.users({
            from: r.posts.authorUserId,
            to: r.users.id,
        }),
        tags: r.many.postTags({
            from: r.posts.slug,
            to: r.postTags.postSlug,
        }),
        reviews: r.many.postReviews({
            from: r.posts.slug,
            to: r.postReviews.postSlug,
        }),
        reviewJobs: r.many.postReviewJobs({
            from: r.posts.slug,
            to: r.postReviewJobs.postSlug,
        }),
    },
    postTags: {
        post: r.one.posts({
            from: r.postTags.postSlug,
            to: r.posts.slug,
            optional: false,
        }),
    },
    postReviews: {
        post: r.one.posts({
            from: r.postReviews.postSlug,
            to: r.posts.slug,
            optional: false,
        }),
    },
    postReviewJobs: {
        post: r.one.posts({
            from: r.postReviewJobs.postSlug,
            to: r.posts.slug,
            optional: false,
        }),
    },
    adminActionPlans: {
        actor: r.one.users({
            from: r.adminActionPlans.actorUserId,
            to: r.users.id,
            optional: false,
        }),
        auditEvents: r.many.adminAuditEvents({
            from: r.adminActionPlans.id,
            to: r.adminAuditEvents.planId,
        }),
    },
    adminAuditEvents: {
        plan: r.one.adminActionPlans({
            from: r.adminAuditEvents.planId,
            to: r.adminActionPlans.id,
        }),
        actor: r.one.users({
            from: r.adminAuditEvents.actorUserId,
            to: r.users.id,
            optional: false,
        }),
    },
}))
