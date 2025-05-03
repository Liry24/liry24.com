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
