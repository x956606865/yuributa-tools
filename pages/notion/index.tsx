/* eslint-disable no-restricted-syntax */
/* eslint-disable wrap-iife */
/* eslint-disable no-await-in-loop */
import { Box, Button, Center, Container, Group, LoadingOverlay, Title } from '@mantine/core';
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
import PresetManage from './components/PresetManage/PresetManage';
import FetchNew from './components/FetchNew/FetchNew';
import { useBGMStore } from '~/stores/bgm.store';
import { useNotionStore } from '~/stores/notion.store';

export default function NotionHomePage() {
  //   const [token, setToken] = useState<string | undefined>(undefined);
  const [loadingState, setLoadingState] = useState<any>({
    testNotion: false,
  });
  const [stepName, setStepName] = useState<String>('checkToken');
  // const [token, setToken] = useState<string | undefined>(undefined);
  const selectedPreset = useNotionStore((store: any) => store.selectedPreset);
  const setToken = useNotionStore((store: any) => store.setNotionToken);
  const token = useNotionStore((store: any) => store.token);

  const [localToken, setLocalToken] = useLocalStorage<string | undefined>({
    key: 'yuri-tool-notion-token',
    defaultValue: undefined,
    getInitialValueInEffect: false,
  });
  const currentBGMList = useBGMStore((store: any) => store.currentBGMList);

  useEffect(() => {
    (async function () {
      console.log('%c [ token ]-30', 'font-size:13px; background:pink; color:#bf2c9f;', localToken);
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
          notifications.update({
            id: 'check-notion-token',
            color: 'teal',
            title: '测试通过！',
            message: '该Token可以正常使用',
            icon: <IconCheck size="1rem" />,
            autoClose: 2000,
          });
          setStepName('selectDBAndOperator');
          setToken(localToken);
        } else {
          notifications.update({
            id: 'check-notion-token',
            color: 'red',
            title: '测试失败！',
            message: error,
            icon: <IconExclamationCircle size="1rem" />,
            autoClose: 2000,
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
            Notion工具
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
          <Group>
            {(stepName === 'selectDBAndOperator' || stepName === 'startFetch') && (
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
            {stepName === 'startFetch' && (
              <Button
                mt={10}
                onClick={() => {
                  setStepName('selectDBAndOperator');
                }}
              >
                重选preset
              </Button>
            )}
          </Group>
          {stepName === 'selectDBAndOperator' && <SelectDBAndOperator token={token} form={form} />}
          {stepName === 'selectDBAndOperator' && (
            <PresetManage
              form={form}
              onFinished={() => {
                setStepName('startFetch');
              }}
            />
          )}
          {stepName === 'startFetch' && (
            <FetchNew
              onSave={async (selectedData) => {
                const mapping = getFetcherMappingByName(selectedPreset.fetcher);
                const nameMapping = mapping.find((m: any) => m.keyProp === 'name');
                const originData = currentBGMList.filter((d: any) =>
                  selectedData.includes(d[nameMapping.fieldName])
                );
                // console.log(
                //   '%c [ originData ]-138',
                //   'font-size:13px; background:pink; color:#bf2c9f;',
                //   originData
                // );
                const waitingList = convertDataToNotion({
                  dataList: originData,
                  preset: selectedPreset,
                });
                // console.log(
                //   '%c [ test ]-150',
                //   'font-size:13px; background:pink; color:#bf2c9f;',
                //   waitingList
                // );
                let currentNum = 0;
                notifications.show({
                  id: 'upload-notion-page-progress',
                  title: '开始导入...',
                  message: `当前进度${currentNum}/${waitingList.length}`,
                  withCloseButton: true,
                  loading: true,
                  autoClose: false,
                });
                for (const item of waitingList) {
                  const result = await createNotionPage(token, item);
                  const title = item.properties?.title?.title?.[0]?.plain_text;
                  if (result.valid) {
                    notifications.show({
                      color: 'green',
                      title: '导入成功！',
                      message: `成功导入${title || 'unknown'}`,
                      withCloseButton: true,
                      autoClose: 2000,
                    });
                  } else {
                    notifications.show({
                      color: 'red',
                      title: '导入失败！',
                      message: '123导入失败',
                      withCloseButton: true,
                      autoClose: 2000,
                    });
                  }
                  currentNum += 1;
                  notifications.update({
                    id: 'upload-notion-page-progress',
                    message: `当前进度${currentNum}/${waitingList.length}`,
                  });
                }
                notifications.update({
                  color: 'green',
                  id: 'upload-notion-page-progress',
                  message: '全部导入完成',
                  autoClose: 2000,
                });
              }}
              dateString={form.values.dateFrom}
            />
          )}
        </Container>
      </Center>
    </Box>
  );
}
