import { Client } from '@notionhq/client';

export function getNotionClient(token: string | undefined) {
    return new Client({ auth: token });
}