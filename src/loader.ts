import type { LiveLoader } from 'astro/loaders'
import { ofetch } from 'ofetch'

interface Article {
    source: 'note' | 'zenn'
    url: string
    title: string
    publishedAt: Date
    likes: number
    comments: number
}

interface EntryFilter {
    id?: string
}

const getArticles = async () => {
    const [note, zenn] = await Promise.all([
        ofetch<note>(
            'https://note.com/api/v2/creators/liry24/contents?kind=note'
        ),
        ofetch<zenn>('https://zenn.dev/api/articles?username=liria'),
    ])

    return [
        ...note.data.contents.map((post) => ({
            id: post.key,
            data: {
                source: 'note' as const,
                url: `https://note.com/liry24/n/${post.key}`,
                icon: 'note',
                title: post.name,
                publishedAt: new Date(post.publishAt),
                likes: post.likeCount,
                comments: post.commentCount,
            },
        })),
        ...zenn.articles.map((post) => ({
            id: post.slug,
            data: {
                source: 'zenn' as const,
                url: `https://zenn.dev/${post.path}`,
                title: post.title,
                publishedAt: new Date(post.published_at),
                likes: post.liked_count,
                comments: post.comments_count,
            },
        })),
    ].sort(
        (a, b) =>
            new Date(b.data.publishedAt).getTime() -
            new Date(a.data.publishedAt).getTime()
    )
}

export const articlesLoader = (): LiveLoader<Article, EntryFilter> => ({
    name: 'articles-loader',
    loadCollection: async () => {
        try {
            const entries = await getArticles()
            return { entries }
        } catch (e) {
            return {
                error: new Error('Failed to fetch articles'),
            }
        }
    },
    loadEntry: async ({ filter }) => {
        try {
            const articles = await getArticles()
            const article = articles.find((article) => article.id === filter.id)

            if (article) {
                return article
            } else {
                return {
                    error: new Error('Article not found'),
                }
            }
        } catch (e) {
            return {
                error: new Error('Failed to fetch articles'),
            }
        }
    },
})
