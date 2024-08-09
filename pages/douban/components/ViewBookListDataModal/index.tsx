import { useDisclosure } from '@mantine/hooks';
import {
  Modal,
  Group,
  Button,
  ScrollArea,
  LoadingOverlay,
  Table,
  Rating,
  Badge,
} from '@mantine/core';
import { useEffect, useState } from 'react';
import { getDatasets } from '~/utils/client/douban_book';
import { notifications } from '@mantine/notifications';
import { IconExclamationCircle } from '@tabler/icons-react';

export default function ViewBookListDataModal(props: any) {
  const {
    disabled = false,
    size = 'xs',
    color = 'green',
    btnText = '发送',
    modalTitle = '当前数据',
    bookListId = null,
    isOpen = false,
    onClick = () => {},
  } = props;
  const [opened, { open, close }] = useDisclosure(false);
  const [isLoading, setIsLoading] = useState(false);
  const [tableData, setTableData] = useState<any[]>([]);

  const getData = async () => {
    const r = await getDatasets(bookListId);
    // console.log('%c [ r ]-21', 'font-size:13px; background:pink; color:#bf2c9f;', r);
    setIsLoading(false);
    if (r.success) {
      //   setTableData(r.data);
      //   console.log('%c [ r.data ]-27', 'font-size:13px; background:pink; color:#bf2c9f;', r.data);
      setTableData(r.data.items);
    } else {
      notifications.show({
        id: 'get-datasets-list',
        color: 'red',
        title: '获取列表失败！',
        message: r.error,
        icon: <IconExclamationCircle size="1rem" />,
        autoClose: 2000,
      });
    }
  };
  const openModal = () => {
    setIsLoading(true);
    open();
    getData();
  };
  const closeModal = () => {
    close();
    setTableData([]);
  };
  const rows = tableData.map((element: any) => (
    <tr key={element.title}>
      <td>
        <a style={{ color: '#1c7ed6', textDecoration: 'none' }} href={element.url}>
          {' '}
          {element.title}
        </a>{' '}
      </td>
      <td>{element.originTitle}</td>
      <td>
        <Group spacing="xs">
          {element?.['又名']?.map((i: string) => (
            <Badge>{i}</Badge>
          ))}
        </Group>
      </td>
      {/* <td>{element?.['类型']?.map((i: any) => i?.text)?.join(', ')}</td> */}
      <td>
        {' '}
        {element.rating_num ? (
          <Rating defaultValue={element.rating_num / 2} fractions={2} readOnly />
        ) : null}
      </td>
    </tr>
  ));
  return (
    <>
      <Modal
        // scrollAreaComponent={ScrollArea.Autosize}
        opened={opened}
        onClose={closeModal}
        title={modalTitle}
        size="70%"
        centered
      >
        <LoadingOverlay visible={isLoading} overlayBlur={2} />
        <Table>
          <thead>
            <tr>
              <th>名称</th>
              <th>原名</th>
              <th>又名</th>
              {/* <th>类型</th> */}
              <th>评分</th>
            </tr>
          </thead>
          <tbody>{rows}</tbody>
        </Table>
      </Modal>

      <Button
        disabled={disabled}
        size={size}
        color={color}
        onClick={() => {
          openModal();
        }}
      >
        {btnText}
      </Button>
    </>
  );
}
