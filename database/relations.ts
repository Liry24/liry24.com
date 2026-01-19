import { defineRelations } from 'drizzle-orm'
import * as schema from './schema'

export const relations = defineRelations(schema, (r) => ({
    users: {
        sessions: r.many.sessions({
            from: r.users.id,
            to: r.sessions.userId,
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
}))
