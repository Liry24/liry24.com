import { defineLiveCollection } from 'astro:content'
import { articlesLoader } from './loader'

const articles = defineLiveCollection({
    loader: articlesLoader(),
})

export const collections = { articles }
