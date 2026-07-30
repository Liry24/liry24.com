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
    posts: {
        tags: r.many.postTags({
            from: r.posts.slug,
            to: r.postTags.postSlug,
        }),
    },
    postTags: {
        post: r.one.posts({
            from: r.postTags.postSlug,
            to: r.posts.slug,
            optional: false,
        }),
    },
}))
