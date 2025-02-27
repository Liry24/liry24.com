import { loadEnv } from 'vite';
import { createClient } from 'microcms-js-sdk';

const { MICROCMS_SERVICE_DOMAIN, MICROCMS_API_KEY } = loadEnv(
    process.env.NODE_ENV || 'development',
    process.cwd(),
    ''
);

const client = createClient({
    serviceDomain: MICROCMS_SERVICE_DOMAIN,
    apiKey: MICROCMS_API_KEY,
});

type Link = {
    slug: string;
    url: string;
    title: string;
    icon: string;
    iconSize?: number;
    hidden: boolean;
};
interface Links {
    liria: string;
    booth: string;
    avatio: string;
    create: Link[];
    persona: Link[];
}

const links = await client.get<Links>({
    endpoint: 'links',
});

export { client, links };
