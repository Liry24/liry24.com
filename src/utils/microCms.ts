import { createClient } from 'microcms-js-sdk';

const client = createClient({
    serviceDomain: import.meta.env.MICROCMS_SERVICE_DOMAIN,
    apiKey: import.meta.env.MICROCMS_API_KEY,
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
