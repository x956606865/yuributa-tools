/* eslint-disable no-await-in-loop */
import { toNumber } from 'lodash';
import moment from 'moment';
import BGMMappingV1 from '~/pages/notion/components/PresetManage/fieldMapping/bgm.json';

export const fetcherMapping: Record<string, any> = {
  bgmV1: BGMMappingV1,
};
export async function checkToken(token: string | undefined) {
  const result = await fetch('/api/notion/databases', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      token,
      page_size: 1,
    }),
  });
  const jsonData = await result.json();
  if (result.status === 200) {
    return {
      valid: true,
      error: null,
    };
  }
  return {
    valid: false,
    error: jsonData.error,
  };
}

export async function getLastYuriBgmByDate(
  dateString: string,
  fetchType: string,
  { current = 1, pageSize = 30 }: any
) {
  const myHeaders = new Headers();
  const typeMap: Record<string, number> = {
    manga: 1,
    bangumi: 2,
  };
  myHeaders.append('User-Agent', 'Apifox/1.0.0 (https://apifox.com)');
  myHeaders.append('Content-Type', 'application/json');
  let startDate = null;
  switch (dateString) {
    case 'lastMonth':
      startDate = moment().subtract(1, 'month').format('YYYY-MM-DD');
      break;
    case 'last3Month':
      startDate = moment().subtract(3, 'month').format('YYYY-MM-DD');
      break;
    case 'last6Month':
      startDate = moment().subtract(6, 'month').format('YYYY-MM-DD');
      break;
    case 'last12Month':
      startDate = moment().subtract(12, 'month').format('YYYY-MM-DD');
      break;
    default:
    //
  }
  const raw = JSON.stringify({
    keyword: '',
    sort: 'rank',
    filter: {
      type: [typeMap[fetchType]],
      air_date: [`>=${startDate}`],
      tag: ['百合'],
    },
  });

  const requestOptions = {
    method: 'POST',
    headers: myHeaders,
    body: raw,
  };

  const result = await fetch(
    `https://api.bgm.tv/v0/search/subjects?limit=${pageSize}&offset=${(current - 1) * pageSize}`,
    requestOptions
  );
  const jsonData = await result.json();
  if (result.status === 200) {
    return {
      valid: true,
      data: jsonData,
      error: null,
    };
  }
  return {
    valid: false,
    error: jsonData.error,
  };
}
export async function fetchBGMDetailsByIds(ids: number[]) {
  const myHeaders = new Headers();
  const results = [];
  myHeaders.append('User-Agent', 'Apifox/1.0.0 (https://apifox.com)');
  myHeaders.append('Content-Type', 'application/json');

  const requestOptions = {
    method: 'GET',
    headers: myHeaders,
  };
  for (const id of ids) {
    const result = await fetch(`https://api.bgm.tv/v0/subjects/${id}`, requestOptions);
    const jsonData = await result.json();
    if (result.status === 200) {
      results.push({
        valid: true,
        data: jsonData,
        error: null,
        id,
      });
    } else {
      results.push({
        valid: false,
        id,
      });
    }
  }
  return results;
}
export async function getDatabaseList(token: string | undefined) {
  const result = await fetch('/api/notion/databases', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      token,
    }),
  });
  const jsonData = await result.json();
  if (result.status === 200) {
    return {
      valid: true,
      error: null,
      data: jsonData.data,
    };
  }
  return {
    valid: false,
    error: jsonData.error,
  };
}
export async function createNotionPage(token: string | undefined, createDto: any) {
  const result = await fetch('/api/notion/pages/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      token,
      createDto,
    }),
  });
  const jsonData = await result.json();
  if (result.status === 200) {
    return {
      valid: true,
      error: null,
      data: jsonData.data,
    };
  }
  return {
    valid: false,
    error: jsonData.error,
  };
}
export function getNotionDBTitle(dbObj: any) {
  return dbObj?.title?.[0]?.plain_text;
}

export function getFetcherMappingByName(name: string) {
  return fetcherMapping[name];
}

export function convertDataToStandard(data: any, fetcherName: string) {
  const mapping = fetcherMapping[fetcherName];
  const cover = mapping.find((item: any) => item.keyProp === 'cover');
  const summary = mapping.find((item: any) => item.keyProp === 'summary');
  const name = mapping.find((item: any) => item.keyProp === 'name');
  const name_cn = mapping.find((item: any) => item.keyProp === 'name_cn');
  return data.map((item: any) => ({
    cover: item[cover.fieldName],
    summary: item[summary.fieldName],
    name: item[name.fieldName],
    name_cn: item[name_cn.fieldName],
  }));
}
const string_to_date = (str: string) => ({
  date: {
    start: moment(str).format('YYYY-MM-DD'),
  },
});
const string_to_files = (str: string) => ({
  files: [
    {
      name: str,
      external: {
        url: str,
      },
    },
  ],
});
const string_to_cover = (str: string) => ({
  type: 'external',
  external: {
    url: str,
  },
});
const string_to_multi_select = (str: string) => ({
  multi_select: [
    {
      name: str,
    },
  ],
});
const string_to_number = (str: string) => ({
  number: toNumber(str),
});
const string_to_rich_text = (str: string) => ({
  rich_text: [
    {
      type: 'text',
      text: {
        content: str,
        link: null,
      },
      annotations: {
        bold: false,
        italic: false,
        strikethrough: false,
        underline: false,
        code: false,
        color: 'default',
      },
      plain_text: str,
      href: null,
    },
  ],
});
const string_to_title = (str: string) => ({
  id: 'title',
  type: 'title',
  title: [
    {
      type: 'text',
      text: {
        content: str,
        link: null,
      },
      annotations: {
        bold: false,
        italic: false,
        strikethrough: false,
        underline: false,
        code: false,
        color: 'default',
      },
      plain_text: str,
      href: null,
    },
  ],
});
const string_to_select = (str: string) => ({
  select: {
    name: str,
  },
});
const string_to_url = (str: string) => ({
  url: str,
});

const number_to_multi_select = (n: number) => string_to_multi_select(n.toString());
const number_to_number = (n: number) => ({
  number: n,
});
const number_to_rich_text = (n: number) => string_to_rich_text(n.toString());
const number_to_title = (n: number) => string_to_title(n.toString());
const number_to_select = (n: number) => string_to_select(n.toString());
const arrayObject_to_multi_select = (ao: any, extra: any) => {
  const arr = ao.map((item: any) => ({
    name: item[extra.keyName],
  }));
  return {
    multi_select: arr,
  };
};

const arrayString_to_multi_select = (as: any) => {
  const arr = as.map((item: any) => ({
    name: item,
  }));
  return {
    multi_select: arr,
  };
};
const bgmURL_to_multi_select = (_: any, extra: any) => string_to_multi_select(extra.BGM_URL);
const bgmURL_to_rich_text = (_: any, extra: any) => string_to_rich_text(extra.BGM_URL);
const bgmURL_to_title = (_: any, extra: any) => string_to_title(extra.BGM_URL);
const bgmURL_to_select = (_: any, extra: any) => string_to_select(extra.BGM_URL);
const bgmURL_to_url = (_: any, extra: any) => string_to_url(extra.BGM_URL);

const boolean_to_checkbox = (b: boolean) => ({
  checkbox: b,
});
const boolean_to_number = (b: boolean) => number_to_number(b ? 1 : 0);
const boolean_to_rich_text = (b: boolean) => string_to_rich_text(b ? 'TRUE' : 'FALSE');

export function convertTypeToNotion(data: any, type: string, notionType: string, extra = {}) {
  const converterName = `${type}_to_${notionType}`;
  const invalidConverter = () => null;
  const converterMap: any = {
    boolean_to_checkbox,
    boolean_to_date: invalidConverter,
    boolean_to_files: invalidConverter,
    boolean_to_multi_select: invalidConverter,
    boolean_to_number,
    boolean_to_rich_text,
    boolean_to_title: invalidConverter,
    boolean_to_select: invalidConverter,
    boolean_to_url: invalidConverter,
    boolean_to_cover: invalidConverter,

    string_to_checkbox: invalidConverter,
    string_to_date,
    string_to_files,
    string_to_multi_select,
    string_to_number,
    string_to_rich_text,
    string_to_title,
    string_to_select,
    string_to_url,
    string_to_cover,
    number_to_checkbox: invalidConverter,
    number_to_date: invalidConverter,
    number_to_files: invalidConverter,
    number_to_multi_select,
    number_to_number,
    number_to_rich_text,
    number_to_title,
    number_to_select,
    number_to_url: invalidConverter,
    number_to_cover: invalidConverter,

    arrayObject_to_checkbox: invalidConverter,
    arrayObject_to_date: invalidConverter,
    arrayObject_to_files: invalidConverter,
    arrayObject_to_multi_select,
    arrayObject_to_number: invalidConverter,
    arrayObject_to_rich_text: invalidConverter,
    arrayObject_to_title: invalidConverter,
    arrayObject_to_select: invalidConverter,
    arrayObject_to_url: invalidConverter,
    arrayObject_to_cover: invalidConverter,

    arrayString_to_checkbox: invalidConverter,
    arrayString_to_date: invalidConverter,
    arrayString_to_files: invalidConverter,
    arrayString_to_multi_select,
    arrayString_to_number: invalidConverter,
    arrayString_to_rich_text: invalidConverter,
    arrayString_to_title: invalidConverter,
    arrayString_to_select: invalidConverter,
    arrayString_to_url: invalidConverter,
    arrayString_to_cover: invalidConverter,

    bgmURL_to_checkbox: invalidConverter,
    bgmURL_to_date: invalidConverter,
    bgmURL_to_files: invalidConverter,
    bgmURL_to_multi_select,
    bgmURL_to_number: invalidConverter,
    bgmURL_to_rich_text,
    bgmURL_to_title,
    bgmURL_to_select,
    bgmURL_to_url,
    bgmURL_to_cover: invalidConverter,
  };
  if (typeof converterMap[converterName] === 'function') {
    return converterMap[converterName](data, extra);
  }
  return null;
}
function processInfoBoxValueByType(value: string, type = 'string', extra = {}) {
  switch (type) {
    case 'string':
      return value.trim();
    default:
      return null;
  }
}
function getDataFromInfoBox(infoBox: any[], key: string, extra: any = {}) {
  const { mappingValue } = extra;
  const target = infoBox.find((item: any) => item.key === key);
  if (!target) {
    return null;
  }
  const targetMappingValue = mappingValue;
  if (!targetMappingValue) {
    return null;
  }
  const valueOrigin = target.value;
  const handledValue = processInfoBoxValueByType(
    valueOrigin,
    targetMappingValue.infoBoxProcessType
  );
  return handledValue;
}
export function convertDataToNotion({ dataList, preset, detailData }: any) {
  const mapping = fetcherMapping[preset.fetcher];
  const notionMapping = preset.mapping;
  return dataList.map((d: any) => {
    const result: any = {
      properties: {
        ...(preset?.customFields ?? {}),
      },
      parent: {
        type: 'database_id',
        database_id: preset.targetDbID,
      },
    };
    const bgmIDMapping = mapping.find((m: any) => m.keyProp === 'bgm_id');
    const bgmID = d?.[bgmIDMapping?.fieldName];
    const detail = detailData.find((dd: any) => dd.id === bgmID && dd.valid);

    const detailResult: any = {};
    if (detail) {
      detailResult.nsfw = detail.data.nsfw;
      const infoBoxFields = mapping.filter((m: any) => typeof m.infoBoxKey === 'string');
      infoBoxFields.forEach((infoBoxField: any) => {
        const infoBoxValue = getDataFromInfoBox(detail.data.infobox, infoBoxField.infoBoxKey, {
          mappingValue: infoBoxField,
        });
        if (infoBoxValue !== null) {
          detailResult[infoBoxField.fieldName] = infoBoxValue;
        }
      });
    }
    const BGM_URL = `https://bgm.tv/subject/${bgmID}`;

    Object.values(notionMapping).forEach((nm: any) => {
      const targetMapping = mapping.find((m: any) => m.fieldName === nm.fromFieldName);
      const combinedData = {
        ...d,
        ...detailResult,
      };
      const data = combinedData[targetMapping.fieldName];

      const dataType = targetMapping.type;
      if (data !== undefined) {
        const r = convertTypeToNotion(data, dataType, nm.notionType, {
          ...targetMapping,
          BGM_URL,
        });
        if (nm.notionType === 'cover') {
          result.cover = r;
        } else {
          result.properties[nm.notionFieldId] = r;
        }
      }
    });
    return result;
  });
}
