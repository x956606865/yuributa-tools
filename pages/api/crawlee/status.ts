import { BookListData } from './../../../utils/server/db';
import { getBookListDBClient, getCrawleeStatusDBClient } from '~/utils/server/db';
import { bookListStatus } from '../../../constant';
import { Dataset } from 'crawlee';
import { isStringAndNotEmpty } from '~/utils/server/utils';

export default async function handler(req: any, res: any) {
  if (req.method === 'GET') {
    const crawleeStatusDB = await getCrawleeStatusDBClient();
    return res.status(200).json({ data: crawleeStatusDB.data });
  } else {
    // 处理其他方法请求
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: `方法 ${req.method} 不被允许` });
  }
}
