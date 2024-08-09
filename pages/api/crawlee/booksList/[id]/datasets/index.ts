import { getBookListDBClient, BookListData } from '~/utils/server/db';
import { bookListStatus } from '~/constant';
import { Dataset } from 'crawlee';
import { isStringAndNotEmpty } from '~/utils/server/utils';

export default async function handler(req: any, res: any) {
  if (req.method === 'DELETE') {
    const { id } = req.query;
    if (!isStringAndNotEmpty(id)) {
      return res.status(400).json({ error: '参数不完整' });
    }
    const ds = await Dataset.open(`douban_list_${id}`);
    await ds.drop();
    const bookListDB = await getBookListDBClient();
    await bookListDB.update((data) => {
      data.list = data.list.map((item: BookListData) =>
        item.id === id ? { ...item, status: bookListStatus.NORMAL } : item
      );
    });
    return res.status(200).json({ data: '删除成功' });
  } else if (req.method === 'GET') {
    const { id } = req.query;
    if (!isStringAndNotEmpty(id)) {
      return res.status(400).json({ error: '参数不完整' });
    }
    const ds = await Dataset.open(`douban_list_${id}`);
    const data = await ds.getData();
    return res.status(200).json({ data });
  } else {
    // 处理其他方法请求
    res.setHeader('Allow', ['GET', 'DELETE']);
    return res.status(405).json({ error: `方法 ${req.method} 不被允许` });
  }
}
