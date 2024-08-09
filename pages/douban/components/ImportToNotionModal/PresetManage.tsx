import { useLocalStorage } from '@mantine/hooks';
import { Button, Group, LoadingOverlay, Table } from '@mantine/core';
import { useState } from 'react';
import { importDatasets } from '~/utils/client/douban_book';
import { useNotionStore } from '~/stores/notion.store';
import { notifications } from '@mantine/notifications';
import { IconCheck } from '@tabler/icons';
import { IconExclamationCircle } from '@tabler/icons-react';

export default function DoubanPresetManager(props: any) {
  const { bookListId, closeModalFunc = () => {} } = props;
  const [isLoading, setIsLoading] = useState(false);
  const token = useNotionStore((store: any) => store.token);

  const [localPreset, setLocalPreset] = useLocalStorage<any[]>({
    key: 'yuri-tool-local-preset-for-douban',
    defaultValue: [],
    getInitialValueInEffect: false,
  });

  const rows = localPreset.map((element: any) => (
    <tr key={element.name}>
      <td>
        <a style={{ color: '#1c7ed6', textDecoration: 'none' }} href={element.url}>
          {' '}
          {element.name}
        </a>{' '}
      </td>
      <td>{element.desc}</td>

      <td>
        <Group align="center">
          <Button
            size="xs"
            // disabled={element.status !== bookListStatus.NORMAL}
            onClick={async () => {
              setIsLoading(true);
              const { success, error, data } = await importDatasets(
                bookListId,
                element.preset,
                token,
                element.selectedDBId
              );
              if (success) {
                notifications.show({
                  id: 'import-datasets',
                  title: '成功！',
                  message: '已开始导入',
                  icon: <IconCheck size="1rem" />,
                  autoClose: 2000,
                });
              } else {
                notifications.show({
                  id: 'import-datasets-failed',
                  title: '导入失败！',
                  message: error,
                  icon: <IconExclamationCircle size="1rem" />,
                  autoClose: 2000,
                });
              }
              setIsLoading(false);
              closeModalFunc();
            }}
          >
            导入
          </Button>
          <Button
            size="xs"
            color="red"
            // disabled={element.status !== bookListStatus.NORMAL}
            onClick={async () => {
              setLocalPreset(localPreset.filter((item) => item.name !== element.name));
            }}
          >
            删除
          </Button>
        </Group>
      </td>
    </tr>
  ));
  return (
    <>
      <LoadingOverlay visible={isLoading} overlayBlur={2} />

      <Table>
        <thead>
          <tr>
            <th>名称</th>
            <th>描述</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>{rows}</tbody>
      </Table>
    </>
  );
}
