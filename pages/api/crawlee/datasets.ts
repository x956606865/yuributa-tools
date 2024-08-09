import { BookListData } from './../../../utils/server/db';
import { getBookListDBClient } from '~/utils/server/db';
import { bookListStatus } from '../../../constant';
import { Dataset } from 'crawlee';
import { isStringAndNotEmpty } from '~/utils/server/utils';

export default async function handler(req: any, res: any) {
  if (req.method === 'DELETE') {
    const { name } = req.body;
    if (!isStringAndNotEmpty(name)) {
      return res.status(400).json({ error: '参数不完整' });
    }
    const ds = await Dataset.open(`douban_list_${name}`);
    await ds.drop();
    const bookListDB = await getBookListDBClient();
    await bookListDB.update(({ list }) => {
      list = list.map((item: BookListData) =>
        item.name === name ? { ...item, status: bookListStatus.NORMAL } : item
      );
    });
    return res.status(200).json({ data: '删除成功' });
  } else if (req.method === 'GET') {
    const { name } = req.body;
    if (!isStringAndNotEmpty(name)) {
      return res.status(400).json({ error: '参数不完整' });
    }
    const ds = await Dataset.open(`douban_list_${name}`);
    const data = await ds.getData();
    return res.status(200).json({ data });
  } else {
    // 处理其他方法请求
    res.setHeader('Allow', ['GET', 'PUT']);
    return res.status(405).json({ error: `方法 ${req.method} 不被允许` });
  }
}
