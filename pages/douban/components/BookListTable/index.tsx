import { Box, Button, Flex, LoadingOverlay, Table } from '@mantine/core';

import { useEffect, useState } from 'react';
import {
  deleteBookList,
  deleteDatasets,
  fetchBookList,
  getBookList,
} from '~/utils/client/douban_book';
import { notifications } from '@mantine/notifications';
import { IconExclamationCircle } from '@tabler/icons-react';
import { IconCheck } from '@tabler/icons';
import { bookListStatus, bookListStatusText } from '~/constant';
import moment from 'moment';
import ViewBookListDataModal from '../ViewBookListDataModal';
import ImportToNotionModal from '../ImportToNotionModal';

export default function BookListTable({ onFinished = () => {} }: any) {
  const [tableData, setTableData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pageInfo, setPageInfo] = useState({
    page: 1,
    pageSize: 10,
  });
  const [extraPageInfo, setExtraPageInfo] = useState({ has_more: false, total: 0 });
  const fetchTableData = async (page: number, pageSize: number) => {
    setIsLoading(true);
    const r = await getBookList(page, pageSize);
    console.log('%c [ r ]-21', 'font-size:13px; background:pink; color:#bf2c9f;', r);
    if (r.success) {
      setTableData(r.data);
      setExtraPageInfo({
        has_more: r.has_more,
        total: r.total,
      });
    } else {
      notifications.show({
        id: 'get-douban-list',
        color: 'red',
        title: '获取列表失败！',
        message: r.error,
        icon: <IconExclamationCircle size="1rem" />,
        autoClose: 2000,
      });
    }
    setIsLoading(false);
  };
  useEffect(() => {
    (async () => {
      console.log('effect');
      await fetchTableData(pageInfo.page, pageInfo.pageSize);
    })();
  }, [pageInfo]);
  const rows = tableData.map((element: any) => (
    <tr key={element.name}>
      <td>{element.name}</td>
      <td>
        <a style={{ color: '#1c7ed6', textDecoration: 'none' }} href={element.link}>
          链接
        </a>{' '}
      </td>
      <td>{bookListStatusText[element.status]}</td>
      <td>{moment(element.createdAt).format('yyyy-MM-DD')}</td>
      <td>
        {element.lastFetchedAt ? moment(element.lastFetchedAt).format('yyyy-MM-DD') : '未采集'}
      </td>
      <td>
        <Flex gap="sm" justify="flex-start" align="center" direction="row" wrap="wrap">
          <Button
            size="xs"
            // disabled={element.status !== bookListStatus.NORMAL}
            onClick={async () => {
              setIsLoading(true);
              const { success, error } = await fetchBookList(element.id);
              if (success) {
                notifications.show({
                  id: 'delete-book-list',
                  title: '成功！',
                  message: '已开始采集',
                  icon: <IconCheck size="1rem" />,
                  color: 'teal',
                  autoClose: 2000,
                });
                await fetchTableData(pageInfo.page, pageInfo.pageSize);
              } else {
                notifications.show({
                  id: 'delete-book-list',
                  title: '失败！',
                  message: error,
                  icon: <IconExclamationCircle size="1rem" />,
                  color: 'red',
                  autoClose: 2000,
                });
              }
              setIsLoading(false);
            }}
          >
            {element.status !== bookListStatus.FETCH_FINISHED ? '开始采集' : '重新采集'}
          </Button>
          {element.status === bookListStatus.FETCH_FINISHED && (
            // <Button
            //   disabled={element.status !== bookListStatus.FETCH_FINISHED}
            //   size="xs"
            //   color="green"
            //   onClick={async () => {}}
            // >
            //   查看数据
            // </Button>
            <ViewBookListDataModal
              disabled={element.status !== bookListStatus.FETCH_FINISHED}
              size="xs"
              color="green"
              btnText="查看数据"
              bookListId={element.id}
            />
          )}
          {element.status === bookListStatus.FETCH_FINISHED && (
            <ImportToNotionModal
              disabled={element.status !== bookListStatus.FETCH_FINISHED}
              size="xs"
              color="green"
              bookListId={element.id}
            />
          )}
          {element.status === bookListStatus.FETCH_FINISHED && (
            <Button
              hidden={element.status !== bookListStatus.FETCH_FINISHED}
              disabled={element.status !== bookListStatus.FETCH_FINISHED}
              size="xs"
              color="red"
              onClick={async () => {
                setIsLoading(true);
                const { success, error } = await deleteDatasets(element.id);
                if (success) {
                  notifications.show({
                    id: 'delete-book-list',
                    title: '删除数据成功！',
                    message: '已删除',
                    icon: <IconCheck size="1rem" />,
                    color: 'teal',
                    autoClose: 2000,
                  });
                  await fetchTableData(pageInfo.page, pageInfo.pageSize);
                } else {
                  notifications.show({
                    id: 'delete-book-list',
                    title: '删除数据失败！',
                    message: error,
                    icon: <IconExclamationCircle size="1rem" />,
                    color: 'red',
                    autoClose: 2000,
                  });
                }
                setIsLoading(false);
              }}
            >
              删除数据
            </Button>
          )}

          <Button
            disabled={element.status === bookListStatus.RUNNING}
            size="xs"
            color="red"
            onClick={async () => {
              setIsLoading(true);
              const { success, error } = await deleteBookList(element.id);
              if (success) {
                notifications.show({
                  id: 'delete-book-list',
                  title: '删除书单成功！',
                  message: '已删除该书单',
                  icon: <IconCheck size="1rem" />,
                  color: 'teal',
                  autoClose: 2000,
                });
                await fetchTableData(pageInfo.page, pageInfo.pageSize);
              } else {
                notifications.show({
                  id: 'delete-book-list',
                  title: '删除书单失败！',
                  message: error,
                  icon: <IconExclamationCircle size="1rem" />,
                  color: 'red',
                  autoClose: 2000,
                });
              }
              setIsLoading(false);
            }}
          >
            删除
          </Button>
        </Flex>
      </td>
    </tr>
  ));
  return (
    <Box mx="auto" mt={20} pos="relative" mih={500}>
      <LoadingOverlay visible={isLoading} overlayBlur={2} />
      <Table>
        <thead>
          <tr>
            <th>书单名称</th>
            <th>书单链接</th>
            <th style={{ minWidth: 80 }}>状态</th>
            <th>创建时间</th>
            <th>上次采集时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>{rows}</tbody>
      </Table>
    </Box>
  );
}
