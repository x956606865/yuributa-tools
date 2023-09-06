// import { getNotionClient } from '../../../../utils/server/utils';
import { getNotionClient } from '~/utils/server/utils';

export default async function handler(req: any, res: any) {
  if (typeof req.body.token === 'string' && req.body.token.length > 0) {
    const notionClient = getNotionClient(req.body.token);
    try {
      const createResult = await notionClient.pages.create(req.body.createDto);
      res.status(200).json({
        success: true,
        data: createResult?.id,
      });
    } catch (error) {
      console.log('%c [ error ]-23', 'font-size:13px; background:pink; color:#bf2c9f;', error);
      res.status(500).json({
        success: false,
        error: '创建失败',
      });
    }
  } else {
    res.status(400).json({
      success: false,
      error: '参数不正确',
    });
  }
}
