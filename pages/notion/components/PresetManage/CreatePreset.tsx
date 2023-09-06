import { Button, Group, Radio, Select, TextInput } from '@mantine/core';

import { useForm } from '@mantine/form';
import { randomId } from '@mantine/hooks';
import { useEffect, useMemo } from 'react';
import { isObject } from 'lodash';
import { getFetcherMappingByName, getNotionDBTitle } from '~/utils/client/utils';
import { useNotionStore } from '~/stores/notion.store';

interface CreatePresetProps {
  onSave: (data: any) => void;
}

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
  const form = useForm({
    initialValues: {
      presetName: '',
      fields: [],
      fetcherName: 'bgmV1',
    },
  });
  const fetcherMapping = useMemo(
    () => getFetcherMappingByName(form.values.fetcherName),
    [form.values.fetcherName]
  );
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
          <Radio value="bgmV1" label="bgm.tv" />
          {/* <Radio value="publicAuth" label="跳转认证" /> */}
        </Group>
      </Radio.Group>
      {form.values.fields.map((item: any, index) => (
        <Group align="flex-end" key={item.key}>
          <Select
            mt={20}
            label="请选择属性"
            data={fetcherMapping.map((fm: any) => ({
              value: fm.fieldName,
              label: fm.disPlayName,
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
                    ...Object.values(currentSelectedDB?.properties).map((p: any) => ({
                      label: p.name,
                      value: JSON.stringify(p),
                    })),
                    {
                      label: 'Notion封面',
                      value: JSON.stringify({ id: 'cover', name: 'cover', type: 'cover' }),
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
            onSave({
              fields: form.values.fields,
              presetName: form.values.presetName,
              selectedDBId,
              fetcher: form.values.fetcherName,
            })
          }
        >
          保存Preset
        </Button>
      </Group>
    </div>
  );
}
