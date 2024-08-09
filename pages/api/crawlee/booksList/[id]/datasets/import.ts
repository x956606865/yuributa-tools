import { LogsDBData, CacheDBData, ImportLogsDBData } from './../../../../../../utils/server/db';
import { isObject } from 'lodash';
import {
  getBookListDBClient,
  BookListData,
  getCrawleeStatusDBClient,
  CrawleeInfoDBData,
  getImportCacheDBClient,
  getImportLogsDBClient,
} from '~/utils/server/db';
import { bookListStatus, crawleeStatus } from '~/constant';
import { Dataset } from 'crawlee';
import { isStringAndNotEmpty } from '~/utils/server/utils';
import { Client } from '@notionhq/client';
import { retry, tryit } from 'radash';
// import * as _ from 'radash'

export default async function handler(req: any, res: any) {
  if (req.method === 'POST') {
    const { id } = req.query;
    const { preset, token, databaseId } = req.body;
    const notion = new Client({
      auth: token,
    });
    if (!isStringAndNotEmpty(id) || !isObject(preset)) {
      return res.status(400).json({ error: '参数不完整' });
    }
    const bookListDB = await getBookListDBClient();
    const target = bookListDB.data.list.find((item: BookListData) => item.id === id);
    if (!target) {
      throw new Error('书单不存在');
    }
    if (target.status !== bookListStatus.FETCH_FINISHED) {
      return res.status(400).json({ error: '书单不可导入' });
    }
    const crawleeStatusDB = await getCrawleeStatusDBClient();

    //   return;
    if (crawleeStatusDB.data.status === crawleeStatus.RUNNING) {
      return res.status(400).json({ error: '导入器忙碌中' });
    }
    await crawleeStatusDB.update((crawlee: CrawleeInfoDBData) => {
      crawlee.status = crawleeStatus.RUNNING;
      crawlee.runningFor = target;
    });
    importAll(id, preset, notion, databaseId);
    return res.status(200).json({ data: '添加导入任务成功' });
  } else {
    // 处理其他方法请求
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `方法 ${req.method} 不被允许` });
  }
}
async function importAll(id: any, preset: any, notion: any, databaseId: any) {
  const ds = await Dataset.open(`douban_list_${id}`);

  await ds.forEach(async (item, index) => {
    // console.log(`Item at ${index}: ${JSON.stringify(item)}`);
    if (index === 2) {
      const [err, result] = await tryit(importItem)(id, preset, item, notion, databaseId);
      console.log('%c [ err ]-59', 'font-size:13px; background:pink; color:#bf2c9f;', err);
      if (err) {
        const importLogsClient = await getImportLogsDBClient();
        const logs = importLogsClient.data[id] || [];

        await importLogsClient.update(() => {
          logs.push(err?.message || '未知错误');
        });
      }
    }
  });
  const crawleeStatusDB = await getCrawleeStatusDBClient();

  await crawleeStatusDB.update((crawlee: CrawleeInfoDBData) => {
    crawlee.status = crawleeStatus.NORMAL;
    crawlee.runningFor = null;
  });
  // 暂不清除cache
  // const importCacheClient = await getImportCacheDBClient();
  // await importCacheClient.update((importCache: ImportCacheDBData) => {
  //   importCache[id] = [];
  // });
}
async function importItem(
  bookListId: string,
  preset: any,
  content: any,
  notion: any,
  databaseId: string,
  isMarkNew = false
) {
  const importCacheClient = await getImportCacheDBClient();
  const cache = importCacheClient.data[bookListId] || [];
  const importLogsClient = await getImportLogsDBClient();
  const logs = importLogsClient.data[bookListId] || [];
  if (cache.includes(content.title)) {
    // console.log(`Page "${content.title}" already exists.`);
    logs.push(`Page "${content.title}" already exists.`);
    await importLogsClient.update((logsDB: ImportLogsDBData) => {
      logsDB[bookListId] = logs;
    });
    return;
  }
  const [err, existData] = await tryit(checkIsExist)(content, notion, databaseId);
  // console.log(
  //   '%c [ existData ]-72',
  //   'font-size:13px; background:pink; color:#bf2c9f;',
  //   existData
  // );
  if (err) {
    logs.push(`${err.message}.`);
    await importLogsClient.update((logsDB: ImportLogsDBData) => {
      logsDB[bookListId] = logs;
    });
    throw err;
  }

  if (!existData) {
    const payload: any = {
      parent: {
        type: 'database_id',
        database_id: databaseId,
      },
      properties: {},
    };
    if (isStringAndNotEmpty(content.title) && preset.title) {
      if (preset.title?.type === 'title') {
        payload.properties['Name'] = {
          title: [
            {
              text: {
                content: content.title,
              },
            },
          ],
        };
      } else if (preset.title?.type === 'rich_text') {
        appendRichText(preset.title, payload.properties, content.title);
      }
    }

    if (isStringAndNotEmpty(content.originTitle) && preset.originTitle) {
      if (preset.originTitle?.type === 'title') {
        payload.properties['Name'] = {
          title: [
            {
              text: {
                content: content.originTitle,
              },
            },
          ],
        };
      } else if (preset.title?.type === 'rich_text') {
        appendRichText(preset.title, payload.properties, content.originTitle);
      }
    }

    if (isStringAndNotEmpty(content.commentText) && preset.commentText) {
      if (preset.commentText?.type === 'rich_text') {
        appendRichText(preset.commentText, payload.properties, content.commentText);
      } else if (preset.commentText?.type === 'block') {
        payload.children = [
          {
            object: 'block',
            paragraph: {
              rich_text: [
                {
                  text: {
                    content: `评语：${content.commentText}`,
                  },
                },
              ],
            },
          },
        ];
      }
    }
    if (isStringAndNotEmpty(content.coverUrl) && preset.coverUrl) {
      if (preset.coverUrl?.type === 'file') {
        appendFiles(preset.coverUrl, payload.properties, content.coverUrl);
      } else if (preset.coverUrl?.type === 'cover') {
        payload.cover = {
          type: 'external',
          external: {
            url: content.coverUrl,
          },
        };
      }
    }
    // if (isMarkNew) {
    //   payload.properties['标记【单独片单】'] = {
    //     select: {
    //       name: '标记【单独片单】',
    //     },
    //   };
    // }
    let firstPublishDate = null;
    if (
      Array.isArray(content?.['上映日期']) &&
      content?.['上映日期'].length > 0 &&
      preset['上映日期']
    ) {
      firstPublishDate = getEarliestDate(content?.['上映日期']);
      if (preset.type === 'date') {
      } else if (preset.type === 'rich_text') {
        appendRichText(
          preset['上映日期'],
          payload.properties,
          content?.['上映日期']
            .map((obj: any) => obj?.text)
            .filter((text: any) => isStringAndNotEmpty(text))
            ?.join(', ')
        );
      }
    } else if (Array.isArray(content?.['首播']) && content?.['首播'].length > 0 && preset['首播']) {
      firstPublishDate = getEarliestDate(content?.['首播']);
      appendRichText(
        preset['首播'],
        payload.properties,
        content?.['首播']
          .map((obj: any) => obj?.text)
          .filter((text: any) => isStringAndNotEmpty(text))
          ?.join(', ')
      );
    }
    if (isStringAndNotEmpty(firstPublishDate?.extra?.pureDate) && preset?.['最早开播时间']) {
      if (preset?.['最早开播时间'].type === 'date') {
        appendDate(preset['最早开播时间'], payload.properties, firstPublishDate?.extra?.pure);
      } else if (preset?.['最早开播时间'].type === 'rich_text') {
        appendRichText(
          preset['最早开播时间'],
          payload.properties,
          firstPublishDate?.extra?.pureDate
        );
      }
    }
    if (isStringAndNotEmpty(content?.year) && preset?.year) {
      if (preset?.year.type === 'rich_text') {
        appendRichText(preset?.year, payload.properties, content?.year);
      }
    }
    if (Array.isArray(content?.['导演']) && content?.['导演']?.length > 0 && preset?.['导演']) {
      if (preset?.['导演']?.type === 'rich_text') {
        appendRichTextArray(preset?.['导演'], payload.properties, content?.['导演']);
      } else if (preset?.['导演']?.type === 'multi_select') {
        appendMultiSelect(
          preset?.['导演'],
          payload.properties,
          content?.['导演']?.map((obj: any) => obj?.text)
        );
      }
    }

    if (Array.isArray(content?.['编剧']) && content?.['编剧']?.length > 0 && preset?.['编剧']) {
      if (preset?.['编剧']?.type === 'rich_text') {
        appendRichTextArray(preset?.['编剧'], payload.properties, content?.['编剧']);
      } else if (preset?.['编剧']?.type === 'multi_select') {
        appendMultiSelect(
          preset?.['编剧'],
          payload.properties,
          content?.['编剧']?.map((obj: any) => obj?.text)
        );
      }
    }

    if (Array.isArray(content?.['主演']) && content?.['主演']?.length > 0 && preset?.['主演']) {
      if (preset?.['主演']?.type === 'rich_text') {
        appendRichTextArray(preset?.['主演'], payload.properties, content?.['主演']);
      } else if (preset?.['主演']?.type === 'multi_select') {
        appendMultiSelect(
          preset?.['主演'],
          payload.properties,
          content?.['主演']?.map((obj: any) => obj?.text)
        );
      }
    }

    if (
      Array.isArray(content?.['制片国家/地区']) &&
      content?.['制片国家/地区']?.length > 0 &&
      preset?.['制片国家/地区']
    ) {
      if (preset?.['制片国家/地区']?.type === 'rich_text') {
        appendRichText(
          preset?.['制片国家/地区'],
          payload.properties,
          content?.['制片国家/地区']?.join(' / ')
        );
      } else if (preset?.['制片国家/地区']?.type === 'multi_select') {
        appendMultiSelect(
          preset?.['制片国家/地区'],
          payload.properties,
          content?.['制片国家/地区']
        );
      }
    }
    if (isStringAndNotEmpty(content.url) && preset.url) {
      if (preset.url.type === 'rich_text') {
        appendRichText(preset.url, payload.properties, content.url, content.url);
      }
    }
    if (Array.isArray(content?.['又名']) && content?.['又名'].length > 0 && preset?.['又名']) {
      if (preset?.['又名'].type === 'rich_text') {
        appendRichText(
          preset['又名'],
          payload.properties,
          content?.['又名'].filter((obj) => isStringAndNotEmpty(obj)).join(' / ')
        );
      } else if (preset?.['又名'].type === 'multi_select') {
        appendMultiSelect(
          preset['又名'],
          payload.properties,
          content?.['又名'].filter((obj) => isStringAndNotEmpty(obj))
        );
      }
    }
    if (
      Array.isArray(content?.['官方网站']) &&
      content?.['官方网站'].length > 0 &&
      preset?.['官方网站']
    ) {
      appendRichTextArray(preset['官方网站'], payload.properties, content?.['官方网站']);
    } else if (
      Array.isArray(content?.['官方小站']) &&
      content?.['官方小站'].length > 0 &&
      preset?.['官方网站']
    ) {
      appendRichTextArray(preset['官方网站'], payload.properties, content?.['官方小站']);
    }

    if (Array.isArray(content?.['类型']) && content?.['类型'].length > 0 && preset['类型']) {
      if (preset['类型'].type === 'rich_text') {
        appendRichTextArray(preset['类型'], payload.properties, content?.['类型']);
      } else if (preset['类型'].type === 'multi_select') {
        appendMultiSelect(
          preset['类型'],
          payload.properties,
          content?.['类型']?.map((obj) => obj.text)
        );
      }
    }
    if (isStringAndNotEmpty(content.desc) && preset.desc) {
      if (preset.desc.type === 'rich_text') {
        appendRichText(preset.desc, payload.properties, content.desc);
      }
    }

    if (typeof content.rating_num === 'number' && preset.rating_num) {
      if (preset.rating_num?.type === 'rich_text') {
        appendRichText(preset.rating_num, payload.properties, content.rating_num.toString());
      } else if (preset.rating_num?.type === 'number') {
        appendNumber(preset.rating_num, payload.properties, content.rating_num);
      }
    }
    if (isStringAndNotEmpty(content.rating_num_graphic) && preset?.rating_num_graphic) {
      if (preset.rating_num_graphic?.type === 'rich_text') {
        appendRichText(preset.rating_num_graphic, payload.properties, content.rating_num_graphic);
      }
    }
    if (Array.isArray(content?.['片长']) && content?.['片长'].length > 0 && preset?.['集数/时长']) {
      if (preset?.['集数/时长']?.type === 'rich_text') {
        appendRichTextArray(
          preset['片长'],
          payload.properties,
          content?.['片长']
            .map((obj) => {
              if (isStringAndNotEmpty(obj)) {
                return {
                  text: { content: obj },
                };
              } else if (isStringAndNotEmpty(obj?.text)) {
                return {
                  text: { content: obj?.text },
                };
              } else {
                return null;
              }
            })
            .filter((item) => item)
        );
      } else if (preset?.['集数/时长']?.type === 'multi_select') {
        appendMultiSelect(
          preset['片长'],
          payload.properties,
          content?.['片长']
            .map((obj) => {
              if (isStringAndNotEmpty(obj)) {
                return obj;
              } else if (isStringAndNotEmpty(obj?.text)) {
                return obj?.text;
              } else {
                return null;
              }
            })
            .filter((item) => typeof item === 'string')
        );
      }
    } else if (
      Array.isArray(content?.['集数']) &&
      content?.['集数'].length > 0 &&
      preset?.['集数/时长']
    ) {
      if (preset?.['集数/时长']?.type === 'rich_text') {
        appendRichTextArray(
          preset['集数'],
          payload.properties,
          content?.['集数']
            .map((obj) => {
              if (isStringAndNotEmpty(obj)) {
                return {
                  text: { content: obj },
                };
              } else if (isStringAndNotEmpty(obj?.text)) {
                return {
                  text: { content: obj?.text },
                };
              } else {
                return null;
              }
            })
            .filter((item) => item)
        );
      } else if (preset?.['集数/时长']?.type === 'multi_select') {
        appendMultiSelect(
          preset['集数'],
          payload.properties,
          content?.['集数']
            .map((obj) => {
              if (isStringAndNotEmpty(obj)) {
                return obj;
              } else if (isStringAndNotEmpty(obj?.text)) {
                return obj?.text;
              } else {
                return null;
              }
            })
            .filter((item) => typeof item === 'string')
        );
      }
    }
    console.log('%c [ payload ]-427', 'font-size:13px; background:pink; color:#bf2c9f;', payload);

    await retry({ times: 3, delay: 1000 }, async () => notion.pages.create(payload));

    cache.push(content.title);

    await importCacheClient.update((logsDB: ImportCacheDBData) => {
      logsDB[bookListId] = cache;
    });
    // console.log(response);
  } else {
    if (!isStringAndNotEmpty(content.commentText)) {
      console.log('无评语，跳过');
      cache.push(content.title);
      await importCacheClient.update((cacheDB: ImportCacheDBData) => {
        cacheDB[bookListId] = cache;
      });
      return;
    } else if (!preset.commentText || preset.commentText?.type !== 'block') {
      console.log('无需插入，跳过');
      cache.push(content.title);
      await importCacheClient.update((cacheDB: ImportCacheDBData) => {
        cacheDB[bookListId] = cache;
      });
      return;
    }
    const targetBlocks = await notion.blocks.children.list({
      block_id: existData.id,
      page_size: 20,
    });
    const children = targetBlocks?.results;
    if (children?.length > 0) {
      const paragraphs = children.filter((child: any) => child.type === 'paragraph');
      const isExistSame = paragraphs.find((paragraph: any) => {
        return (
          paragraph?.paragraph?.rich_text?.[0]?.text?.content === `评语：${content.commentText}`
        );
      });
      if (isExistSame) {
        console.log('存在相同comment，不再插入');
        cache.push(content.title);
        return;
      } else {
        console.log('不存在相同comment，插入');
        const blockId = existData.id;
        //@ts-ignore
        await retry(
          { times: 3, delay: 1000 },
          notion.blocks.children.append
        )({
          block_id: blockId,
          children: [
            {
              //...other keys excluded
              type: 'divider',
              //...other keys excluded
              divider: {},
            },
            {
              paragraph: {
                rich_text: [
                  {
                    text: {
                      content: `评语：${content.commentText}`,
                    },
                  },
                ],
              },
            },
          ],
        });
        cache.push(content.title);
      }
    } else {
      console.log('无Children 直接添加');
      const blockId = existData.id;
      //@ts-ignore
      await retry(
        { times: 3, delay: 1000 },
        notion.blocks.children.append
      )({
        block_id: blockId,
        children: [
          {
            paragraph: {
              rich_text: [
                {
                  text: {
                    content: `评语：${content.commentText}`,
                  },
                },
              ],
            },
          },
        ],
      });
      cache.push(content.title);
    }
    await importCacheClient.update((cacheDB: ImportCacheDBData) => {
      cacheDB[bookListId] = cache;
    });
    // console.log([0]?.paragraph?.rich_text[0]?.text);
    return;
  }
}

function appendRichText(presetObj: any, targetObj: any, content: string, link?: string) {
  const textObj: any = {
    text: {
      content: content,
    },
  };
  if (isStringAndNotEmpty(link)) {
    textObj.text.link = {
      url: link,
    };
  }
  if (isStringAndNotEmpty(presetObj?.id)) {
    targetObj[presetObj?.id] = {
      rich_text: [textObj],
    };
  } else if (isStringAndNotEmpty(presetObj?.name)) {
    targetObj[presetObj?.name] = {
      rich_text: [textObj],
    };
  }
}
function appendRichTextArray(presetObj: any, targetObj: any, contentLinks: any) {
  const richArray: any = [];
  if (Array.isArray(contentLinks) && contentLinks.length > 0) {
    contentLinks.map((item) => {
      const textObj: any = {
        text: {
          content: item.text,
        },
      };
      if (isStringAndNotEmpty(item.link)) {
        textObj.text.link = {
          url: item.link,
        };
      }
      richArray.push(textObj);
      richArray.push({
        text: {
          content: ' / ',
        },
      });
    });
  }

  if (isStringAndNotEmpty(presetObj?.id)) {
    targetObj[presetObj?.id] = {
      rich_text: richArray,
    };
  } else if (isStringAndNotEmpty(presetObj?.name)) {
    targetObj[presetObj?.name] = {
      rich_text: richArray,
    };
  }
}
function appendMultiSelect(presetObj: any, targetObj: any, content: any[]) {
  let selectArr: any = [];
  if (Array.isArray(content) && content.length > 0) {
    selectArr = content
      .filter((name) => typeof name === 'string')
      .map((item) => ({
        name: item,
      }));
  }

  if (isStringAndNotEmpty(presetObj?.id)) {
    targetObj[presetObj?.id] = {
      multi_select: selectArr,
    };
  } else if (isStringAndNotEmpty(presetObj?.name)) {
    targetObj[presetObj?.name] = {
      multi_select: selectArr,
    };
  }
}
function appendNumber(presetObj: any, targetObj: any, content: any[]) {
  if (isStringAndNotEmpty(presetObj?.id)) {
    targetObj[presetObj?.id] = {
      number: content,
    };
  } else if (isStringAndNotEmpty(presetObj?.name)) {
    targetObj[presetObj?.name] = {
      number: content,
    };
  }
}
function appendFiles(presetObj: any, targetObj: any, content: string) {
  if (isStringAndNotEmpty(presetObj?.id)) {
    targetObj[presetObj?.id] = {
      files: [
        {
          name: content,
          external: {
            url: content,
          },
        },
      ],
    };
  } else if (isStringAndNotEmpty(presetObj?.name)) {
    targetObj[presetObj?.name] = {
      files: [
        {
          name: content,
          external: {
            url: content,
          },
        },
      ],
    };
  }
}
function appendDate(presetObj: any, targetObj: any, content: string) {
  if (isStringAndNotEmpty(presetObj?.id)) {
    targetObj[presetObj?.id] = {
      date: {
        start: content,
      },
    };
  } else if (isStringAndNotEmpty(presetObj?.name)) {
    targetObj[presetObj?.name] = {
      date: {
        start: content,
      },
    };
  }
}
async function checkIsExist(content: any, notion: any, databaseId: string) {
  const names = new Set();
  if (isStringAndNotEmpty(content.originTitle)) {
    names.add(content.originTitle);
  }
  if (isStringAndNotEmpty(content.title)) {
    names.add(content.title);
  }
  (content?.['又名'] ?? []).forEach((name: string) => {
    if (isStringAndNotEmpty(name)) {
      names.add(name);
    }
  });
  const orFilter: any[] = [];
  names.forEach((name) => {
    orFilter.push({
      property: 'Name',
      rich_text: {
        equals: name,
      },
    });
    // orFilter.push({
    //   property: '⭐原名',
    //   rich_text: {
    //     equals: name,
    //   },
    // });
  });
  // console.log(
  //   '%c [ orFilter ]-303',
  //   'font-size:13px; background:pink; color:#bf2c9f;',
  //   orFilter
  // );
  if (orFilter.length === 0) return null;
  const response = await notion.databases.query({
    database_id: databaseId,
    page_size: 1,
    filter: {
      or: orFilter,
    },
  });
  // return true;
  return response?.results?.[0];
  // console.log(response?.results?.[0]?.properties);
}

function getEarliestDate(data: any) {
  if (!Array.isArray(data) || data.length === 0) return null;

  // 初始化最早日期对象为数组中的第一个对象
  let earliestDateObject = data[0];
  let earliestDate = new Date(earliestDateObject.extra.pureDate);

  for (const item of data) {
    const currentDate = new Date(item.extra.pureDate);
    if (currentDate < earliestDate) {
      earliestDate = currentDate;
      earliestDateObject = item;
    }
  }

  return earliestDateObject;
}
