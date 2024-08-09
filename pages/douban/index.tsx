/* eslint-disable no-restricted-syntax */
/* eslint-disable wrap-iife */
/* eslint-disable no-await-in-loop */
import {
  Badge,
  Box,
  Button,
  Center,
  Container,
  Group,
  Loader,
  LoadingOverlay,
  TextInput,
  Title,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useLocalStorage } from '@mantine/hooks';
import { useEffect, useState } from 'react';
// const { Client } = require('@notionhq/client');
import { notifications } from '@mantine/notifications';
import { IconCheck } from '@tabler/icons';
import { IconExclamationCircle } from '@tabler/icons-react';
import {
  checkToken,
  convertDataToNotion,
  createNotionPage,
  getFetcherMappingByName,
} from '~/utils/client/utils';
import CheckToken from './components/CheckToken/CheckToken';
import SelectDBAndOperator from './components/SelectDBAndOperator/SelectDBAndOperator';
import PresetManage from './components/ImportToNotionModal/PresetManage';
import FetchBGMV1New from './components/FetchNew/FetchBGMV1New';
import { useBGMStore } from '~/stores/bgm.store';
import { useNotionStore } from '~/stores/notion.store';
import { addNewBookList } from '~/utils/client/douban_book';
import BookListTable from './components/BookListTable';
import { useServerStore } from '~/stores/server.store';

interface UIDisplayProps {
  isShowResetTokenBtn: boolean;
  isShowReChoosePreset: boolean;
}
export default function NotionHomePage() {
  //   const [token, setToken] = useState<string | undefined>(undefined);
  const [loadingState, setLoadingState] = useState<any>({
    testNotion: false,
    addBookList: false,
    checkServerStatus: false,
  });
  const [UIDisplay, setUIDisplay] = useState<UIDisplayProps>({
    isShowResetTokenBtn: false,
    isShowReChoosePreset: false,
  });
  const [stepName, setStepName] = useState<String>('checkToken');
  // const [token, setToken] = useState<string | undefined>(undefined);
  const selectedPreset = useNotionStore((store: any) => store.selectedPreset);
  const setToken = useNotionStore((store: any) => store.setNotionToken);
  const token = useNotionStore((store: any) => store.token);
  const saveToNotion = useNotionStore((store: any) => store.saveToNotion);
  const getServerStatus = useServerStore((store: any) => store.getServerStatus);
  const isFetchingServerStatus = useServerStore((store: any) => store.isFetchingServerStatus);
  const serverStatus = useServerStore((store: any) => store.serverStatus);

  const [localToken, setLocalToken] = useLocalStorage<string | undefined>({
    key: 'yuri-tool-notion-token',
    defaultValue: undefined,
    getInitialValueInEffect: false,
  });
  const currentBGMList = useBGMStore((store: any) => store.currentBGMList);
  const fetchServerStatus = async () => {
    setLoadingState({
      ...loadingState,
      checkServerStatus: true,
    });
    await getServerStatus();
    setLoadingState({
      ...loadingState,
      checkServerStatus: false,
    });
  };
  useEffect(() => {
    (async function () {
      if (process.env.NEXT_PUBLIC_CURRENT_ENV === 'dev') {
        setStepName('selectDBAndOperator');
        setToken(localToken);
        setUIDisplay({
          ...UIDisplay,
          isShowResetTokenBtn: true,
        });
        return;
      }
      // console.log('%c [ token ]-30', 'font-size:13px; background:pink; color:#bf2c9f;', localToken);
      if (typeof localToken === 'string' && localToken.length > 0) {
        setLoadingState({
          ...loadingState,
          testNotion: true,
        });
        notifications.show({
          id: 'check-notion-token',
          title: '开始检测...',
          message: '正在测试token是否可用',
          withCloseButton: true,
          loading: true,
          autoClose: false,
        });
        const { valid, error } = await checkToken(localToken);

        if (valid) {
          notifications.show({
            id: 'check-notion-token',
            color: 'teal',
            title: '测试通过！',
            message: '该Token可以正常使用',
            icon: <IconCheck size="1rem" />,
            autoClose: 2000,
          });
          setStepName('selectDBAndOperator');
          setToken(localToken);
          setUIDisplay({
            isShowResetTokenBtn: true,
            isShowReChoosePreset: false,
          });
        } else {
          notifications.show({
            id: 'check-notion-token',
            color: 'red',
            title: '测试失败！',
            message: error,
            icon: <IconExclamationCircle size="1rem" />,
            autoClose: 2000,
          });
          setUIDisplay({
            ...UIDisplay,
            isShowResetTokenBtn: true,
          });
        }
        setLoadingState({
          ...loadingState,
          testNotion: false,
        });
      }
    })();
  }, []);

  const form = useForm({
    initialValues: {
      token: '',
      authType: 'token',
      operatorName: 'fetchNew',
      dateFrom: 'lastMonth',
      dateRange: [null, null],
      createBookProp: {
        name: '',
        link: '',
      },
    },
  });
  if (loadingState.testNotion) {
    return <LoadingOverlay visible />;
  }
  return (
    <Box pos="relative">
      <Center>
        <Container w="80%">
          {/* <LoadingOverlay visible={globalLoading} style={{ height: '100%' }} /> */}
          <Title ta="center" order={1}>
            豆瓣书单导入工具
          </Title>
          {stepName === 'checkToken' && (
            <CheckToken
              form={form}
              onTokenValid={(validToken: string) => {
                setToken(validToken);
                setStepName('selectDBAndOperator');
                setLocalToken(validToken);
              }}
            />
          )}
          {stepName !== 'checkToken' && (
            <Group>
              {UIDisplay.isShowResetTokenBtn && (
                <Button
                  onClick={() => {
                    setToken(undefined);
                    setStepName('checkToken');
                    setLocalToken(undefined);
                  }}
                  mt={10}
                >
                  重置认证
                </Button>
              )}
            </Group>
          )}
          {stepName !== 'checkToken' && (
            <Group mt={20}>
              <Title order={4}>服务器状态:</Title>
              {isFetchingServerStatus ? (
                <Loader size="xs" variant="bars" />
              ) : (
                <Badge color={serverStatus === '忙碌' || serverStatus === '出错' ? 'red' : 'green'}>
                  {serverStatus}
                </Badge>
              )}
              <Button size="xs" disabled={isFetchingServerStatus} onClick={getServerStatus}>
                刷新
              </Button>
              <Button size="xs" disabled={serverStatus !== '忙碌'} onClick={getServerStatus}>
                查看当前正在执行的任务
              </Button>
            </Group>
          )}

          {stepName === 'selectDBAndOperator' && <SelectDBAndOperator token={token} form={form} />}

          {stepName === 'selectDBAndOperator' && form.values.operatorName === 'fetchNew' && (
            <Box maw={500} mx="auto" mt={20}>
              <form
                onSubmit={form.onSubmit(async (values: any) => {
                  console.log(values);
                  setLoadingState({
                    ...loadingState,
                    addBookList: true,
                  });

                  const { success, error } = await addNewBookList(
                    values.createBookProp.name,
                    values.createBookProp.link
                  );
                  if (success) {
                    form.setFieldValue('createBookProp', {
                      name: '',
                      link: '',
                    });
                    notifications.show({
                      id: 'add-book-list',
                      title: '添加书单成功！',
                      message: '已添加该书单',
                      icon: <IconCheck size="1rem" />,
                      color: 'teal',
                      autoClose: 2000,
                    });
                  } else {
                    notifications.show({
                      id: 'add-book-list',
                      title: '添加书单失败！',
                      message: error,
                      icon: <IconExclamationCircle size="1rem" />,
                      color: 'red',
                      autoClose: 2000,
                    });
                  }
                  setLoadingState({
                    ...loadingState,
                    addBookList: false,
                  });
                })}
              >
                <TextInput
                  withAsterisk
                  label="书单名称"
                  placeholder="请不要使用特殊字符"
                  {...form.getInputProps('createBookProp.name')}
                />
                <TextInput
                  mt="md"
                  withAsterisk
                  label="书单链接"
                  placeholder="https://www.douban.com/doulist/xxxx"
                  {...form.getInputProps('createBookProp.link')}
                />
                <Group position="center" mt="md">
                  <Button type="submit" loading={loadingState.addBookList}>
                    提交
                  </Button>
                </Group>
              </form>
            </Box>
          )}
          {stepName === 'selectDBAndOperator' && form.values.operatorName === 'manageBookList' && (
            <BookListTable />
          )}
          {/* {stepName === 'selectDBAndOperator' && (
            <PresetManage
              form={form}
              onFinished={() => {
                setStepName('startFetch');
                setUIDisplay({
                  ...UIDisplay,
                  isShowReChoosePreset: true,
                });
              }}
            />
          )} */}
          {/* {stepName === 'startFetch' && (
            <FetchBGMV1New
              onSave={async (selectedData) => {
                await saveToNotion({ selectedData, currentBGMList });
              }}
              form={form}
              dateString={form.values.dateFrom}
              fetchType={selectedPreset.fetchType}
            />
          )} */}
        </Container>
      </Center>
    </Box>
  );
}
