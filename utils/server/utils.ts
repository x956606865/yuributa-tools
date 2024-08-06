import { Client } from '@notionhq/client';

export function getNotionClient(token: string | undefined) {
  return new Client({ auth: token });
}

export async function getListPagesFromDB(options: any): Promise<any> {
  const {
    client,
    databaseId,
    filter = undefined,
    filter_properties = undefined,
    page_size = 10,
    nextCursor = undefined,
    retries = 2,
  } = options;
  try {
    const results = await client.databases.query({
      database_id: databaseId,
      filter,
      filter_properties,
      page_size,
      start_cursor: nextCursor,
    });
    return results;
  } catch (error: any) {
    if (retries > 0) {
      console.warn(`请求失败，重试中...剩余重试次数：${retries}`);
      return getListPagesFromDB({
        client,
        databaseId,
        filter,
        filter_properties,
        page_size,
        nextCursor,
        retries: retries - 1,
      });
    } else {
      throw new Error(`请求失败，重试次数已用尽：${error.message}`);
    }
  }
}
