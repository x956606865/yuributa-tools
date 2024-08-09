import {
  getBookListDBClient,
  getCrawleeStatusDBClient,
  BookListData,
  CrawleeInfoDBData,
} from '~/utils/server/db';
import { bookListStatus, crawleeStatus } from '~/constant';
import { Configuration, CheerioCrawler } from 'crawlee';

import { isStringAndNotEmpty } from '~/utils/server/utils';
import { douban_list_router } from '~/utils/server/douban_list_router';

export default async function handler(req: any, res: any) {
  if (req.method === 'POST') {
    const { name } = req.body;
    if (!isStringAndNotEmpty(name)) {
      return res.status(400).json({ error: '参数不完整' });
    }
    try {
      const bookListDB = await getBookListDBClient();
      const target = bookListDB.data.list.find((item: BookListData) => item.name === name);
      if (!target) {
        throw new Error('书单不存在');
      }
      if (target.status !== bookListStatus.NORMAL) {
        return res.status(400).json({ error: '书单已在运行中' });
      }
      const crawleeStatusDB = await getCrawleeStatusDBClient();
      if (crawleeStatusDB.data.status === crawleeStatus.RUNNING) {
        return res.status(400).json({ error: '采集器忙碌中' });
      }
      await bookListDB.update(({ list }) => {
        list = list.map((item: BookListData) =>
          item.name === name ? { ...item, status: bookListStatus.RUNNING } : item
        );
      });
      await crawleeStatusDB.update((crawlee: CrawleeInfoDBData) => {
        crawlee.status = crawleeStatus.RUNNING;
      });
      startFetch(target.link, name);
      console.log('finished');
      // 返回成功响应
      return res.status(200).json({ data: '启动采集成功' });
    } catch (e: any) {
      return res.status(400).json({ error: e.message });
    }
  } else {
    // 处理其他方法请求
    res.setHeader('Allow', ['GET', 'PUT']);
    return res.status(405).json({ error: `方法 ${req.method} 不被允许` });
  }
}
async function startFetch(startUrl: string, name: string) {
  const config = new Configuration({ defaultDatasetId: `douban_list_${name}` });

  // config.set('defaultDatasetId', `${dou_id}`);
  const startUrls = [startUrl];
  const crawler = new CheerioCrawler(
    {
      // proxyConfiguration: new ProxyConfiguration({ proxyUrls: ['...'] }),
      requestHandler: douban_list_router,
      // Comment this option to scrape the full website.
      maxRequestsPerCrawl: 2000,
      // Let the crawler know it can run up to 100 requests concurrently at any time
      maxConcurrency: 10,
      // ...but also ensure the crawler never exceeds 250 requests per minute
      maxRequestsPerMinute: 60,
    },
    config
  );
  await crawler.run(startUrls);
  const crawleeStatusDB = await getCrawleeStatusDBClient();
  await crawleeStatusDB.update((crawlee: CrawleeInfoDBData) => {
    crawlee.status = crawleeStatus.NORMAL;
  });
  const bookListDB = await getBookListDBClient();
  const target = bookListDB.data.list.find((item: BookListData) => item.name === name);

  if (target) {
    await bookListDB.update(({ list }) => {
      list = list.map((item: BookListData) =>
        item.name === name
          ? {
              ...item,
              status: bookListStatus.FETCH_FINISHED,
              lastFetchedAt: new Date(),
              isFetched: true,
            }
          : item
      );
    });
  }
}
