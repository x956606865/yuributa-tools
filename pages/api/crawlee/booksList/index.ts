import { BookListData } from '../../../../utils/server/db';
import { bookListStatus } from '../../../../constant';
import { base64EncodeName, isStringAndNotEmpty } from '~/utils/server/utils';
import { getBookListDBClient } from '~/utils/server/db';

export default async function handler(req: any, res: any) {
  if (req.method === 'GET') {
    try {
      // console.log('%c [ req ]-8', 'font-size:13px; background:pink; color:#bf2c9f;', req);

      const { page, pageSize } = req.query;
      if (parseInt(page) <= 0 || parseInt(pageSize) <= 0) {
        return res.status(400).json({ error: '参数不合法' });
      }
      if (isNaN(parseInt(page)) || isNaN(parseInt(pageSize))) {
        return res.status(400).json({ error: '参数不合法' });
      }
      const bookListDB = await getBookListDBClient();
      const result: any = [];
      const from = (page - 1) * pageSize;
      const to = from + pageSize;
      let total = bookListDB.data.list.length;
      let has_more = true;
      bookListDB.data.list.forEach((value, index) => {
        if (index >= from && index < to) {
          result.push(value);
        }
        // total++;
      });
      if (to >= total) {
        has_more = false;
      }
      // 返回成功响应
      return res.status(200).json({ success: true, data: result, total, has_more });
    } catch (e: any) {
      console.log('%c [ e ]-25', 'font-size:13px; background:pink; color:#bf2c9f;', e);
      res.status(500).json({ success: false, error: e.message });
    }
  } else if (req.method === 'PUT') {
    const { name, link } = req.body;
    if (!isStringAndNotEmpty(name) || !isStringAndNotEmpty(link)) {
      return res.status(400).json({ error: '参数不完整' });
    }
    // 定义正则表达式
    const regex = /^https:\/\/www\.douban\.com\/doulist\/(\d+)$/;
    const match = link.match(regex);

    // 使用正则表达式进行匹配
    if (!match) {
      return res.status(400).json({ error: '链接格式不正确' });
    }
    let douban_book_id = match[1];
    if (!isStringAndNotEmpty(douban_book_id)) {
      return res.status(400).json({ error: '链接格式不正确,无法获取豆瓣id' });
    }
    const bookListDB = await getBookListDBClient();
    const isExist = bookListDB.data.list.find((item: BookListData) => item.name === name);

    if (isExist) {
      return res.status(400).json({ error: '书单已存在' });
    }
    await bookListDB.update(({ list }) => {
      list.push({
        id: base64EncodeName(name),
        name,
        link,
        createdAt: new Date(),
        isFetched: false,
        lastFetchedAt: null,
        douban_book_id,
        status: bookListStatus.NORMAL,
      });
    });

    // 返回成功响应
    return res.status(200).json({ data: '添加成功' });
  } else {
    // 处理其他方法请求
    res.setHeader('Allow', ['GET', 'PUT']);
    return res.status(405).json({ error: `方法 ${req.method} 不被允许` });
  }
}
