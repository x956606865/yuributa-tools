import { BookListData } from '../../../../utils/server/db';
import { bookListStatus } from '../../../../constant';
import { base64EncodeName, isStringAndNotEmpty } from '~/utils/server/utils';
import { getBookListDBClient } from '~/utils/server/db';

export default async function handler(req: any, res: any) {
  if (req.method === 'DELETE') {
    const { id } = req.query;
    if (!isStringAndNotEmpty(id)) {
      return res.status(400).json({ error: '参数不完整' });
    }
    const bookListDB = await getBookListDBClient();
    const isExist = bookListDB.data.list.find((item: BookListData) => item.id === id);

    if (!isExist) {
      return res.status(400).json({ error: '书单不存在' });
    }
    try {
      await bookListDB.update(({ list }) => {
        list = list.filter((item: BookListData) => item.id !== id);
      });
      // 返回成功响应
      return res.status(200).json({ success: true });
    } catch (e: any) {
      console.log('%c [ e ]-25', 'font-size:13px; background:pink; color:#bf2c9f;', e);
      return res.status(500).json({ success: false, error: e.message });
    }
  } else {
    // 处理其他方法请求
    res.setHeader('Allow', ['DELETE']);
    return res.status(405).json({ error: `方法 ${req.method} 不被允许` });
  }
}
