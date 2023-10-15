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
import FetchBGMV1New from './components/FetchNew/FetchBGMV1New';
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
  const saveToNotion = useNotionStore((store: any) => store.saveToNotion);

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
      dateRange: [null, null],
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
            <FetchBGMV1New
              onSave={async (selectedData) => {
                await saveToNotion({ selectedData, currentBGMList });
              }}
              form={form}
              dateString={form.values.dateFrom}
              fetchType={selectedPreset.fetchType}
            />
          )}
        </Container>
      </Center>
    </Box>
  );
}
