import { libName } from '~/constant';
import { CheerioCrawler, log, Configuration, useState, KeyValueStore, Dataset } from 'crawlee';
import { router } from '../../../utils/server/routes';
import { getNotionClient, getListPagesFromDB } from '../../../utils/server/utils';

export default async function handler(req: any, res: any) {
  const { token, databaseId, isKeepCache = false } = req.body;
  const datasetsId = `update-douban-score_${databaseId}`;
  // 检查是否有运行中的任务
  const kv = await KeyValueStore.open(libName.taskList);
  const isRecordExist = await kv.recordExists(databaseId);
  const task: any = isRecordExist ? await kv.getValue(databaseId) : null;
  const dataset: Dataset = await Dataset.open(datasetsId);

  if (task && task?.status === 'running') {
    return res.status(200).json({
      success: false,
      error: '任务已在运行中',
    });
  }
  if (!isKeepCache) {
    await dataset.drop();
  }
  await kv.setValue(databaseId, {
    status: 'running',
    createdAt: new Date(),
  });
  try {
    // 准备notion的数据
    const notionClient = getNotionClient(token);
    let notionPayload: any = {
      client: notionClient,
      databaseId,
      filter: undefined,
      filter_properties: ['%40%5C%5Cz', '%5DR%7CY', '_%3FPV'],
      page_size: 100,
    };
    let notionResult = await getListPagesFromDB(notionPayload);
    let hasMore = notionResult.has_more;
    let nextCursor = notionResult.next_cursor;

    const result: any[] = [];
    if (Array.isArray(notionResult.results) && notionResult.results.length > 0) {
      notionResult.results.forEach((page: any) => {
        const url = page?.properties?.['⭐豆瓣地址']?.rich_text?.[0]?.plain_text;
        const old_score = page?.properties?.['评分1']?.rich_text?.[0]?.plain_text;
        result.push({ url, old_score });
      });
    }
    while (hasMore) {
      console.log(`开始获取下一页：${nextCursor}`);
      notionPayload.nextCursor = nextCursor;
      notionResult = await getListPagesFromDB(notionPayload);
      hasMore = notionResult.has_more;
      nextCursor = notionResult.next_cursor;
      if (Array.isArray(notionResult.results) && notionResult.results.length > 0) {
        notionResult.results.forEach((page: any) => {
          const url = page?.properties?.['⭐豆瓣地址']?.rich_text?.[0]?.plain_text;
          const old_score = page?.properties?.['评分1']?.rich_text?.[0]?.plain_text;
          result.push({ url, old_score });
        });
      }
    }
    // 准备crawlee
    const config = new Configuration({ defaultDatasetId: datasetsId });

    // config.set('defaultDatasetId', `${dou_id}`);
    const startUrls = result.map((item: any) => item.url);
    const crawler = new CheerioCrawler(
      {
        // proxyConfiguration: new ProxyConfiguration({ proxyUrls: ['...'] }),
        requestHandler: router,
        // Comment this option to scrape the full website.
        maxRequestsPerCrawl: result.length + 1,
        // Let the crawler know it can run up to 100 requests concurrently at any time
        maxConcurrency: 10,
        // ...but also ensure the crawler never exceeds 250 requests per minute
        maxRequestsPerMinute: 60,
        // failedRequestHandler({ request }) {
        //   log.debug(`Request ${request.url} failed twice.`);
        //   await kv.setValue(databaseId, {
        //     status: 'error',
        //     message: e?.message,
        //     createdAt: new Date(),
        //   });
        // },
      },
      config
    );

    await crawler.run(startUrls);

    await kv.setValue(databaseId, {
      status: 'finished',
      createdAt: new Date(),
    });
    res.status(200).json({
      success: true,
      error: '任务执行完成',
    });
  } catch (e: any) {
    console.error('任务执行出错：', e);
    await kv.setValue(databaseId, {
      status: 'error',
      message: e?.message,
      createdAt: new Date(),
    });
    return res.status(500).json({
      success: false,
      error: '任务执行出错',
    });
  }
}
