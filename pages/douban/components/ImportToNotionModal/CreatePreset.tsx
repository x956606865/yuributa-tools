import {
  Button,
  Center,
  Group,
  MultiSelect,
  NumberInput,
  Radio,
  Select,
  Table,
  TextInput,
} from '@mantine/core';

import { useForm } from '@mantine/form';
import { randomId, useLocalStorage } from '@mantine/hooks';
import { useEffect, useMemo, useState } from 'react';
import { isObject, pick, uniq } from 'lodash';
import { DateInput } from '@mantine/dates';
import { getFetcherMappingByName, getNotionDBTitle } from '~/utils/client/utils';
import { useNotionStore } from '~/stores/notion.store';
import { notifications } from '@mantine/notifications';
import { IconExclamationCircle } from '@tabler/icons-react';
import { IconArrowsRight } from '@tabler/icons';

interface CreatePresetProps {
  onSave?: (data: any) => void;
}

const currentSupportedNotionTypes = [
  'select',
  'date',
  'multi_select',
  'number',
  'files',
  'rich_text',
  // 'title',
  'url',
  // 'cover',
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

export default function DoubanCreatePreset({ onSave = () => {} }: CreatePresetProps) {
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
  const [localPreset, setLocalPreset] = useLocalStorage<any[]>({
    key: 'yuri-tool-local-preset-for-douban',
    defaultValue: [],
    getInitialValueInEffect: false,
  });

  const form = useForm({
    initialValues: {
      name: '',
      desc: '',
      fields: [],
      doubanPreset: {},
    },
  });
  const fetcherMapping = useMemo(() => getFetcherMappingByName('douban'), []);
  // // console.log('%c [ form ]-74', 'font-size:13px; background:pink; color:#bf2c9f;', form.values);
  // useEffect(() => {
  //   const newSelectedNotionField: any = [];

  //   form.values.fields.forEach((f: any) => {
  //     try {
  //       const nd: any = JSON.parse(f.notionFieldName);

  //       newSelectedNotionField.push(nd.name);
  //     } catch (e) {
  //       //
  //     }
  //   });
  //   form.values.customFields.forEach((f: any) => {
  //     try {
  //       const nd: any = JSON.parse(f.notionFieldName);
  //       newSelectedNotionField.push(nd.name);
  //     } catch (e) {
  //       //
  //     }
  //   });

  //   setSelectedNotionField(uniq(newSelectedNotionField));
  // }, [form.values.fields, form.values.customFields]);
  useEffect(() => {
    if (typeof token === 'string' && token.length > 0) {
      getNotionDBList();
    }
  }, [token]);
  const rows = fetcherMapping.map((element: any) => (
    <tr key={element.fieldName}>
      <td>{element.disPlayName}</td>
      <td>
        <IconArrowsRight stroke={2} color="grey" />
      </td>
      <td>
        {/* <Center h="100%"> */}
        <Select
          key={`${element.fieldName}_notionField`}
          // label="请选择对应notion属性"
          disabled={!isObject(currentSelectedDB?.properties)}
          data={
            isObject(currentSelectedDB?.properties)
              ? [
                  {
                    label: '------不导入该属性------',
                    value: 'Not Bind',
                    group: 'Notion页面属性',
                  },
                  ...Object.values(currentSelectedDB?.properties)
                    .filter((p: any) => currentSupportedNotionTypes.includes(p.type))
                    .filter((p: any) => {
                      if (Array.isArray(element.support) && element.support.includes(p.type)) {
                        return true;
                      } else {
                        return false;
                      }
                    })
                    .map((p: any) => ({
                      label: p.name,
                      value: JSON.stringify(p),
                      disabled: selectedNotionField.includes(p.name),
                      group: 'Notion自定义属性',
                    })),
                  ...(Array.isArray(element.support) && element.support.includes('cover')
                    ? [
                        {
                          label: 'Notion封面',
                          value: JSON.stringify({ id: 'cover', name: 'cover', type: 'cover' }),
                          group: 'Notion页面属性',
                        },
                      ]
                    : []),
                  ...(Array.isArray(element.support) && element.support.includes('title')
                    ? [
                        {
                          label: 'Notion标题',
                          value: JSON.stringify({ name: 'Name', type: 'title' }),
                          group: 'Notion页面属性',
                        },
                      ]
                    : []),
                  ...(Array.isArray(element.support) && element.support.includes('block')
                    ? [
                        {
                          label: '插入到正文',
                          value: JSON.stringify({ type: 'block' }),
                          group: 'Notion页面属性',
                        },
                      ]
                    : []),
                ]
              : []
          }
          defaultValue="Not Bind"
          //   value={selectedPreset?.id}
          onChange={(value: any) => {
            // console.log(
            //   '%c [ value ]-157',
            //   'font-size:13px; background:pink; color:#bf2c9f;',
            //   value
            // );
            if (value === 'Not Bind') {
              form.setFieldValue(`doubanPreset`, {
                ...form.values.doubanPreset,
                [element.fieldName]: undefined,
              });
              return;
            }
            const targetInfo = JSON.parse(value);
            form.setFieldValue(`doubanPreset`, {
              ...form.values.doubanPreset,
              [element.fieldName]: pick(targetInfo, ['id', 'name', 'type']),
            });
            // const preset = localPreset.find((lp: any) => lp.id === value);
            // setSelectedPreset(preset);
          }}
          // {...form.getInputProps(`fields.${index}.notionFieldName`)}
        />
        {/* </Center> */}
      </td>
    </tr>
  ));
  return (
    <div style={{ marginTop: 20 }}>
      <TextInput label="输入名称" mt={20} {...form.getInputProps('name')} />
      <TextInput label="输入描述" mt={20} {...form.getInputProps('desc')} />

      {Array.isArray(currentNotionDBList) && (
        <Select
          mt={20}
          disabled={isLoadingDBList || currentNotionDBList.length === 0}
          label={`请选择要操作的数据库${isLoadingDBList ? '(加载中……)' : ''}`}
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
      <Table mt={20}>
        <thead>
          <tr>
            <th>数据字段</th>
            <th></th>
            <th>Notion字段</th>
          </tr>
        </thead>
        <tbody>{rows}</tbody>
      </Table>
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
          {/* <Select
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
          {(form.values.fields[index] as any)?.notionFieldName &&
            JSON.parse((form.values.fields[index] as any)?.notionFieldName ?? '{}').type ===
              'date' && (
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
                {...form.getInputProps(`fields.${index}.bindEndDateFieldName`)}
              />
            )} */}
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
      {/* {form.values.customFields.map((item: any, index) => (
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
      ))} */}
      <Group mt={10}>
        {/* <Button
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
        </Button> */}

        <Button
          mt={10}
          onClick={
            () => {
              console.log(form.values);
              const isExist = localPreset.some((lp: any) => lp.name === form.values.name);
              if (isExist) {
                notifications.show({
                  id: 'create-douban-preset',
                  color: 'red',
                  title: '创建Preset失败！',
                  message: '创建Preset失败！',
                  icon: <IconExclamationCircle size="1rem" />,
                  autoClose: 2000,
                });
                return;
              }
              setLocalPreset([
                ...localPreset,
                {
                  id: randomId(),
                  name: form.values.name,
                  desc: form.values.desc,
                  selectedDBId,
                  preset: form.values.doubanPreset,
                },
              ]);
              notifications.show({
                id: 'create-douban-preset',
                color: 'teal',
                title: '创建Preset成功！',
                message: '创建Preset成功！',
                icon: <IconExclamationCircle size="1rem" />,
                autoClose: 2000,
              });
              form.setValues({
                name: '',
                desc: '',
                fields: [],
                doubanPreset: {},
              });
            }
            // onSave({
            //   customFields: form.values.customFields,
            //   fields: form.values.fields,
            //   presetName: form.values.presetName,
            //   selectedDBId,
            //   fetcher: form.values.fetcherName,
            //   fetchType: form.values.fetchType,
            // })
          }
        >
          保存Preset
        </Button>
      </Group>
    </div>
  );
}
