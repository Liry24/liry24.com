interface zenn {
    articles: {
        id: number
        post_type: 'Article'
        title: string
        slug: string
        comments_count: number
        liked_count: number
        bookmarked_count: number
        body_letters_count: number
        article_type: 'idea' | 'tech'
        emoji: string
        is_suspending_private: boolean
        published_at: string
        body_updated_at: string
        source_repo_updated_at: string
        pinned: boolean
        path: string
        user: {
            id: number
            username: string
            name: string
            avatar_small_url: string
        }
        publication: {
            id: number
            name: string
            display_name: string
            avatar_small_url: string
            avatar_url: string
            pro: boolean
            avatar_registered: boolean
        }
    }[]
    next_page: number | null
    total_count: number | null
}

interface avatio {
    slug: string
    created_at: string
    updated_at: string
    short_title?: string
    title: string
    description?: string
    thumbnail?: string | null
    category?: 'news' | 'update' | 'event' | 'blog'
    content: string
}

interface note {
    data: {
        contents: {
            id: number
            type: 'TextNote'
            status: 'published'
            name: string
            description: string | null
            likeCount: number
            key: string
            slug: string
            publishAt: string
            thumbnailExternalUrl: string
            eyecatch: string | null
            user: {
                id: number
                key: string
                name: string
                urlname: string
                nickname: string
                userProfileImagePath: string
                customDomain: string | null
            }
            canRead: boolean
            externalUrl: string | null
            customDomain: string | null
            body: string
            canUpdate: boolean
            commentCount: number
            anonymousLikeCount: number
            disableComment: boolean
            noteDraft: string | null
            noteUrl: string
            format: string
        }[]
        isLastPage: boolean
        totalCount: number
    }
}
