import { libName } from '~/constant';
import { KeyValueStore } from 'crawlee';

export default async function handler(req: any, res: any) {
  if (req.method === 'GET') {
    const kv = await KeyValueStore.open(libName.taskList);
    const result: any = {};
    await kv.forEachKey(async (key, index, info) => {
      console.log(`Key at ${index}: ${key} has size ${info.size}`);
      result[key] = await kv.getValue(key);
    });

    // 返回成功响应
    return res.status(200).json({ data: result });
  } else {
    // 处理其他方法请求
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: `方法 ${req.method} 不被允许` });
  }
}
