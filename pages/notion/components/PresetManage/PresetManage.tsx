import { Button, Group, Select, Text } from '@mantine/core';

import { useLocalStorage } from '@mantine/hooks';
import { useState } from 'react';
import { uniqBy } from 'lodash';
import { useNotionStore } from '~/stores/notion.store';

import CreatePreset from './CreatePreset';

interface GenPresetProps {
  fields: any;
  presetName: string;
  selectedDBId: string;
  fetcher: any;
}

const genPreset = ({ fields, presetName, selectedDBId, fetcher }: GenPresetProps) => {
  // console.log(
  //   '%c [ fields,presetName ]-121',
  //   'font-size:13px; background:pink; color:#bf2c9f;',
  //   fields,
  //   presetName
  // );
  const preset: any = {
    name: presetName,
    mapping: {},
    fetcher,
    targetDbID: selectedDBId,
    id: `${presetName}-${selectedDBId}`,
  };
  fields.forEach((field: any) => {
    if (typeof field.sourceFieldName !== 'string' || field.sourceFieldName.length === 0) {
      return;
    }

    if (typeof field.notionFieldName !== 'string' || field.notionFieldName.length === 0) {
      return;
    }
    const JSONInfo = JSON.parse(field.notionFieldName);
    preset.mapping[JSONInfo.name] = {
      fromFieldName: field.sourceFieldName,
      notionInfo: JSONInfo,
      notionType: JSONInfo.type,
      notionName: JSONInfo.name,
      notionFieldId: JSONInfo.id,
    };
  });
  return preset;
};
export default function PresetManage({ onFinished = () => {} }: any) {
  const [localPreset, setLocalPreset] = useLocalStorage<any[]>({
    key: 'yuri-tool-local-preset',
    defaultValue: [],
    getInitialValueInEffect: false,
  });
  const [isCreatingPreset, setIsCreatingPreset] = useState(false);
  const selectedPreset = useNotionStore((store: any) => store.selectedPreset);
  const setSelectedPreset = useNotionStore((store: any) => store.setSelectedPreset);

  return (
    <>
      <Group align="flex-end">
        {Array.isArray(localPreset) && (
          <Select
            mt={20}
            disabled={localPreset?.length === 0}
            label="请选择预设"
            data={localPreset.map((lp: any) => ({
              label: lp.name,
              value: lp.id,
            }))}
            value={selectedPreset?.id}
            onChange={(value: any) => {
              const preset = localPreset.find((lp: any) => lp.id === value);
              setSelectedPreset(preset);
            }}
          />
        )}
        <Text>或者：</Text>
        <Button
          onClick={() => {
            setIsCreatingPreset(true);
          }}
        >
          创建Preset
        </Button>
        <Button
          disabled={!selectedPreset}
          onClick={() => {
            onFinished();
          }}
        >
          确认
        </Button>
      </Group>
      {isCreatingPreset && (
        <CreatePreset
          onSave={({ fields, presetName, selectedDBId, fetcher }) => {
            // console.log(
            //   '%c [ fields,presetName ]-121',
            //   'font-size:13px; background:pink; color:#bf2c9f;',
            //   fields,
            //   presetName
            // );
            const preset = genPreset({
              fields,
              presetName,
              selectedDBId,
              fetcher,
            });
            console.log(preset);

            setLocalPreset(uniqBy([...localPreset, preset], 'name'));
            setIsCreatingPreset(false);
          }}
          // fetcherMapping={mappingObj[form.values.fetcherName]}
          //   form={form}
          //   setIsCreatingPreset={setIsCreatingPreset}
          //   setLocalPreset={setLocalPreset}
        />
      )}
    </>
  );
}