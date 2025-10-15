import { file } from 'astro/loaders'
import { defineCollection, z } from 'astro:content'

const persona = defineCollection({
    loader: file('src/data/persona.json'),
    schema: z.object({
        url: z.string(),
        label: z.string(),
        icon: z.string(),
    }),
})

const skills = defineCollection({
    loader: file('src/data/skills.json'),
    schema: z.object({
        label: z.string(),
        icon: z.string(),
        iconSize: z.number().optional(),
        class: z.string().optional(),
    }),
})

const career = defineCollection({
    loader: file('src/data/career.json'),
    schema: z.object({
        period: z.string(),
        position: z.string(),
        company: z.string(),
    }),
})

const arts = defineCollection({
    loader: file('src/data/arts.json'),
    schema: z.object({
        url: z.string().url(),
        src: z.string(),
        alt: z.string(),
    }),
})

const ranks = defineCollection({
    loader: file('src/data/ranks.json'),
    schema: z.object({
        url: z.string().optional(),
        label: z.string(),
        season: z.string().optional(),
        rank: z.string(),
        image: z.string(),
    }),
})

const devices = defineCollection({
    loader: file('src/data/devices.json'),
    schema: z.object({
        category: z.string(),
        items: z.array(
            z.object({
                url: z.string().url().optional(),
                label: z.string(),
                image: z.string().optional(),
                description: z.string().optional(),
                modifiers: z.string().array().optional(),
            })
        ),
    }),
})

export const collections = { persona, skills, career, arts, ranks, devices }
