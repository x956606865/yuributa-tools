import { createCheerioRouter } from 'crawlee';

export const douban_list_router = createCheerioRouter();

douban_list_router.addDefaultHandler(
  async ({ request, enqueueLinks, log, $, addRequests, pushData }) => {
    log.info(`enqueueing new URLs`);
    const { userData } = request;

    //   await sleep(5000);
    //   log.info(`sleeping for 5 seconds...`);
    const listEl = $('.doulist-item');
    const list: any[] = [];
    log.info('List length:' + listEl.length);
    listEl.each(function () {
      const $this = $(this);
      const link = $this.find('.title a').attr('href');
      const id = $this.attr('id');
      const commentText = $(this)
        .find('.comment')
        .contents()
        .filter(function () {
          // log.info('Comment:' + this.nodeType);
          return this.nodeType === 3;
        })
        .map(function () {
          return $(this).text();
        })
        .get()
        .join('')
        .trim();
      list.push({
        url: link,
        label: 'detail',
        userData: {
          id,
          commentText,
        },
      });
    });
    // log.info(JSON.stringify(list));

    await addRequests(list.filter((item) => typeof item.url === 'string'));

    const nextButton = await $('.next a');
    if (nextButton) {
      await enqueueLinks({
        selector: '.next a',
      });
    }
  }
);

douban_list_router.addHandler('detail', async ({ request, $, log, pushData, enqueueLinks }) => {
  // await sleep(2000); // <= adding a delay to simulate real-world requests
  const title = $('title').text();
  //   log.info(`${title}`, { url: request.loadedUrl });
  const { userData } = request;
  const doubanTitle = title?.replace('(豆瓣)', '')?.trim();
  const combinedTitle = $('meta[property="og:title"]').attr('content')?.trim();
  const titleFromCombined = combinedTitle?.replace(doubanTitle, '')?.trim();
  const cover = $('#mainpic img').attr('src');
  const info: any = {};
  const infoEl = $('#info');
  infoEl
    .children()
    .children('.pl')
    .each(function () {
      const $this = $(this);
      const label = $this.text().replace(':', '');
      const value = $this
        .nextAll('.attrs')
        .children('span a')
        .map(function () {
          const link = $(this).attr('href');
          if (link?.startsWith('http')) {
            return {
              text: $(this).text().trim(),
              link,
            };
          } else {
            return {
              text: $(this).text().trim(),
              link: null,
            };
          }
        })
        .get();
      info[label] = value;
    });
  infoEl.children('.pl').each(function () {
    const label = $(this).text().replace(':', '');
    let nextEls = $(this).nextUntil('br');
    let value: any = nextEls
      .map(function () {
        if (this.tagName === 'a') {
          return {
            text: $(this).text().trim(),
            link: $(this).attr('href'),
          };
        }
        if (label === '首播' || label === '上映日期') {
          const dateText = $(this).text().trim();
          const regex = /(\d{4}-\d{2}-\d{2})\(([^)]+)\)/;
          const match = dateText.match(regex) ?? [];
          return {
            type: 'date',
            text: $(this).text().trim(),
            link: null,
            extra: {
              pureDate: match[1],
              region: match[2],
              type: 'douban_date',
            },
          };
        }
        return {
          text: $(this).text().trim(),
          link: null,
        };
      })
      .get();
    if (value.length === 0) {
      const nextEl = this.nextSibling;
      if (nextEl?.nodeType === 3) {
        value = $(nextEl)
          .text()
          .split(' / ')
          .map((item: string) => item.trim());
        //   if (label === '又名') {
        //     value = value.split(' / ').map((item: string) => item.trim());
        //   }
      }
      //   log.info(`${label}:${nextEl?.nodeType}`);
    }
    info[label] = value;
  });
  let desc = null;
  const totalDesc = $('#link-report-intra .all');
  if (totalDesc.length) {
    desc = totalDesc.text().trim();
  } else {
    const totalDesc = $(`#link-report-intra span[property="v:summary"]`);
    if (totalDesc.length) {
      desc = totalDesc.text().trim();
    }
  }
  let year: any = $('.year').text();
  if (typeof year === 'string' && year.trim().length > 0) {
    year = year.replace('(', '').replace(')', '').trim();
  } else {
    year = null;
  }
  const rating_num = $('.rating_num').text();
  const scoreFixed = Number.parseFloat(rating_num);

  const ratings = [
    '🌑🌑🌑🌑🌑', // 0.0
    '🌗🌑🌑🌑🌑', // 1.0
    '🌕🌑🌑🌑🌑', // 2.0
    '🌕🌗🌑🌑🌑', // 3.0
    '🌕🌕🌑🌑🌑', // 4.0
    '🌕🌕🌗🌑🌑', // 5.0
    '🌕🌕🌕🌑🌑', // 6.0
    '🌕🌕🌕🌗🌑', // 7.0
    '🌕🌕🌕🌕🌑', // 8.0
    '🌕🌕🌕🌕🌗', // 9.0
    '🌕🌕🌕🌕🌕', // 10.0
  ];

  function getRatingGraphic(score: number) {
    if (scoreFixed < 0 || scoreFixed > 10) {
      return null;
    }
    // 取大于等于 score 的最大整数
    const index = Math.ceil(score);

    return ratings[index];
  }

  const result: any = {
    title: doubanTitle,
    originTitle: titleFromCombined,
    coverUrl: cover,
    desc,
    rating_num: typeof scoreFixed === 'number' ? scoreFixed : null,
    rating_num_graphic: getRatingGraphic(scoreFixed),
    commentText: userData.commentText,
    year,
    ...info,
  };

  // log.info(JSON.stringify(result, null, 2));
  await pushData({
    url: request.loadedUrl,
    ...result,
  });
});
