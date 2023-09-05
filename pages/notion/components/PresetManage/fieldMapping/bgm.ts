export const BGMMappingV1 = [
  {
    fieldName: 'date',
    type: 'string',
    disPlayName: 'date',
  },
  {
    fieldName: 'image',
    type: 'string',
    disPlayName: '封面',
    keyProp: 'cover',
  },
  {
    fieldName: 'summary',
    type: 'string',
    disPlayName: '简介',
    keyProp: 'summary',
  },
  {
    fieldName: 'name',
    type: 'string',
    disPlayName: '原名',
    keyProp: 'name',
  },
  {
    fieldName: 'name_cn',
    type: 'string',
    disPlayName: '中文名',
    keyProp: 'name_cn',
  },
  {
    fieldName: 'tags',
    type: 'arrayObject',
    disPlayName: '标签',
    keyName: 'name',
  },
  {
    fieldName: 'score',
    type: 'number',
    disPlayName: '评分',
  },
  {
    fieldName: 'id',
    type: 'string',
    disPlayName: 'BGM ID',
    keyProp: 'bgm_id',
  },
  {
    fieldName: 'URL',
    type: 'bgmURL',
    disPlayName: 'BGM 链接',
  },
];