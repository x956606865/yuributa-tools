import { KeyValueStore } from 'crawlee';

export default async function handler(req: any, res: any) {
  if (req.method === 'DELETE') {
    const { taskid } = req.query;
    const kv = await KeyValueStore.open(`update-douban-score-running-status`);
    const isRecordExist = await kv.recordExists(taskid);
    if (!isRecordExist) {
      return res.status(404).json({
        success: false,
        error: '任务不存在',
      });
    }
    const result: any = await kv.setValue(taskid, null);

    // 返回成功响应
    return res.status(200).json({ data: result });
  } else {
    // 处理其他方法请求
    res.setHeader('Allow', ['DELETE']);
    return res.status(405).json({ error: `方法 ${req.method} 不被允许` });
  }
}
