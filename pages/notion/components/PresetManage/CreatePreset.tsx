import { Button, Group, MultiSelect, NumberInput, Radio, Select, TextInput } from '@mantine/core';

import { useForm } from '@mantine/form';
import { randomId } from '@mantine/hooks';
import { useEffect, useMemo, useState } from 'react';
import { isObject, uniq } from 'lodash';
import { DateInput } from '@mantine/dates';
import { getFetcherMappingByName, getNotionDBTitle } from '~/utils/client/utils';
import { useNotionStore } from '~/stores/notion.store';

interface CreatePresetProps {
  onSave: (data: any) => void;
}

const currentSupportedNotionTypes = [
  'select',
  'date',
  'multi_select',
  'number',
  'files',
  'rich_text',
  'title',
  'url',
  'cover',
];
const renderFormByNotionType = ({ notionData, formProps = {} }: any) => {
  switch (notionData.type) {
    // case 'checkbox':
    //   return <MultiSelect data={selectList} label="请选择" {...formProps} />;
    case 'select':
      return (
        <Select
          label="请选择"
          getCreateLabel={(query) => `+ 创建 ${query}`}
          data={notionData.select.options.map((o: any) => o.name)}
          {...formProps}
        />
      );
    case 'date':
      return <DateInput label="选择日期" {...formProps} />;
    case 'multi_select':
      return (
        <MultiSelect
          data={notionData.multi_select.options.map((o: any) => o.name)}
          label="请选择"
          {...formProps}
        />
      );
    case 'number':
      return <NumberInput defaultValue={0} label="输入值" {...formProps} />;
    case 'files':
    case 'rich_text':
    case 'title':
    case 'url':
    case 'cover':
      return <TextInput label="输入值" mt={20} {...formProps} />;

    default:
      return null;
  }
};

export default function CreatePreset({ onSave = () => {} }: CreatePresetProps) {
  // const selectedPreset = useNotionStore((store: any) => store.selectedPreset);
  // const setSelectedPreset = useNotionStore((store: any) => store.setSelectedPreset);
  const currentSelectedDB = useNotionStore((store: any) => store.currentSelectedDB);
  const currentNotionDBList = useNotionStore((store: any) => store.currentNotionDBList);
  const isLoadingDBList = useNotionStore((store: any) => store.isLoadingDBList);
  const getNotionDBList = useNotionStore((store: any) => store.getNotionDBList);
  const setSelectedDBId = useNotionStore((store: any) => store.setSelectedDBId);
  const selectedDBId = useNotionStore((store: any) => store.selectedDBId);
  const token = useNotionStore((store: any) => store.token);
  const [selectedNotionField, setSelectedNotionField] = useState<string[]>([]);

  const form = useForm({
    initialValues: {
      presetName: '',
      fields: [],
      customFields: [],
      fetcherName: 'bgmV1',
      fetchType: 'manga',
    },
  });
  const fetcherMapping = useMemo(
    () => getFetcherMappingByName(form.values.fetcherName),
    [form.values.fetcherName]
  );
  // console.log('%c [ form ]-74', 'font-size:13px; background:pink; color:#bf2c9f;', form.values);
  useEffect(() => {
    const newSelectedNotionField: any = [...selectedNotionField];
    form.values.fields.forEach((f: any) => {
      try {
        const nd: any = JSON.parse(f.notionFieldName);

        newSelectedNotionField.push(nd.name);
      } catch (e) {
        //
      }
    });
    form.values.customFields.forEach((f: any) => {
      try {
        const nd: any = JSON.parse(f.notionFieldName);
        newSelectedNotionField.push(nd.name);
      } catch (e) {
        //
      }
    });
    setSelectedNotionField(uniq(newSelectedNotionField));
  }, [form.values.fields, form.values.customFields]);
  useEffect(() => {
    if (typeof token === 'string' && token.length > 0) {
      getNotionDBList();
    }
  }, [token]);
  return (
    <div style={{ marginTop: 20 }}>
      <TextInput label="输入名称" mt={20} {...form.getInputProps('presetName')} />

      {Array.isArray(currentNotionDBList) && (
        <Select
          mt={20}
          disabled={isLoadingDBList || currentNotionDBList.length === 0}
          label="请选择要操作的数据库"
          data={currentNotionDBList.map((db: any) => ({
            label: getNotionDBTitle(db),
            value: db.id,
          }))}
          value={selectedDBId}
          onChange={(value: any) => {
            setSelectedDBId(value);
          }}
        />
      )}
      <Radio.Group
        mt={20}
        name="fetcherName"
        label="选择采集器"
        withAsterisk
        {...form.getInputProps('fetcherName')}
      >
        <Group mt="xs">
          <Radio value="bgmV1" label="bgm.tv (通过API)" />
          <Radio disabled value="webBgmV1" label="bgm.tv (通过网站) (开发中)" />
          <Radio disabled value="yurizukan" label="百合图鉴 (开发中)" />
        </Group>
      </Radio.Group>
      {form.values.fetcherName === 'bgmV1' && (
        <Radio.Group
          mt={20}
          name="fetchType"
          label="选择作品类型"
          withAsterisk
          {...form.getInputProps('fetchType')}
        >
          <Group mt="xs">
            <Radio value="manga" label="漫画" />
            <Radio value="bangumi" label="番剧" />
            {/* <Radio disabled value="yurizukan" label="百合图鉴 (开发中)" /> */}
          </Group>
        </Radio.Group>
      )}
      {form.values.fields.map((item: any, index) => (
        <Group align="flex-end" key={item.key}>
          <Select
            mt={20}
            label="请选择属性"
            data={fetcherMapping.map((fm: any) => ({
              value: fm.fieldName,
              label: fm.disPlayName,
              group: typeof fm.group === 'string' && fm.group,
            }))}
            //   value={selectedPreset?.id}
            //   onChange={(value: any) => {
            //     const preset = localPreset.find((lp: any) => lp.id === value);
            //     setSelectedPreset(preset);
            //   }}
            {...form.getInputProps(`fields.${index}.sourceFieldName`)}
          />
          <Select
            mt={20}
            label="请选择对应notion属性"
            disabled={!isObject(currentSelectedDB?.properties)}
            data={
              isObject(currentSelectedDB?.properties)
                ? [
                    ...Object.values(currentSelectedDB?.properties)
                      .filter((p: any) => currentSupportedNotionTypes.includes(p.type))
                      .map((p: any) => ({
                        label: p.name,
                        value: JSON.stringify(p),
                        disabled: selectedNotionField.includes(p.name),
                        group: 'Notion自定义属性',
                      })),
                    {
                      label: 'Notion封面',
                      value: JSON.stringify({ id: 'cover', name: 'cover', type: 'cover' }),
                      disabled: selectedNotionField.includes('cover'),
                      group: 'Notion页面属性',
                    },
                  ]
                : []
            }
            //   value={selectedPreset?.id}
            //   onChange={(value: any) => {
            //     const preset = localPreset.find((lp: any) => lp.id === value);
            //     setSelectedPreset(preset);
            //   }}
            {...form.getInputProps(`fields.${index}.notionFieldName`)}
          />
          <Button
            color="red"
            size="xs"
            onClick={() => {
              form.setFieldValue(
                'fields',
                form.values.fields.filter((_item: any, i: number) => index !== i)
              );
            }}
          >
            删除
          </Button>
        </Group>
      ))}
      {form.values.customFields.map((item: any, index) => (
        <Group align="flex-end" key={`custom-fields-${item.key}`}>
          <Select
            mt={20}
            label="请选择对应notion属性"
            disabled={!isObject(currentSelectedDB?.properties)}
            data={
              isObject(currentSelectedDB?.properties)
                ? [
                    ...Object.values(currentSelectedDB?.properties)
                      .filter((p: any) => currentSupportedNotionTypes.includes(p.type))
                      .map((p: any) => ({
                        label: p.name,
                        value: JSON.stringify(p),
                        disabled: selectedNotionField.includes(p.name),
                      })),
                  ]
                : []
            }
            //   value={selectedPreset?.id}
            //   onChange={(value: any) => {
            //     const preset = localPreset.find((lp: any) => lp.id === value);
            //     setSelectedPreset(preset);
            //   }}
            {...form.getInputProps(`customFields.${index}.notionFieldName`)}
          />
          {renderFormByNotionType({
            formProps: form.getInputProps(`customFields.${index}.defaultValue`),
            notionData: JSON.parse(
              (form.values.customFields[index] as any).notionFieldName || '{}'
            ),
          })}
          <Button
            color="red"
            size="xs"
            onClick={() => {
              form.setFieldValue(
                'customFields',
                form.values.customFields.filter((_item: any, i: number) => index !== i)
              );
            }}
          >
            删除
          </Button>
        </Group>
      ))}
      <Group mt={10}>
        <Button
          mt={10}
          onClick={() =>
            form.insertListItem('fields', {
              sourceFieldName: '',
              notionFieldName: '',
              key: randomId(),
            })
          }
        >
          添加属性
        </Button>
        <Button
          mt={10}
          onClick={() =>
            form.insertListItem('customFields', {
              defaultValue: '',
              notionFieldName: '',
              key: randomId(),
            })
          }
        >
          添加自定义值
        </Button>
        <Button
          mt={10}
          onClick={() =>
            onSave({
              customFields: form.values.customFields,
              fields: form.values.fields,
              presetName: form.values.presetName,
              selectedDBId,
              fetcher: form.values.fetcherName,
              fetchType: form.values.fetchType,
            })
          }
        >
          保存Preset
        </Button>
      </Group>
    </div>
  );
}
