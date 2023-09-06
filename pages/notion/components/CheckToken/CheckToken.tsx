import { Button, Group, Radio, TextInput } from '@mantine/core';
import { useState } from 'react';
import { notifications } from '@mantine/notifications';
import { IconExclamationCircle } from '@tabler/icons-react';
import { checkToken } from '~/utils/client/utils';

export default function CheckToken({ onTokenValid = () => {}, form }: any) {
  //   const [token, setToken] = useState<string | undefined>(undefined);
  const [loadingState, setLoadingState] = useState<any>({
    testNotion: false,
  });
  const [token, setToken] = useState<string | undefined>(undefined);

  //   const form = useForm({
  //     initialValues: {
  //       authType: 'token',
  //     },
  //   });
  return (
    <>
      {' '}
      <Radio.Group
        mt={20}
        name="authType"
        label="选择notion授权的方式"
        withAsterisk
        {...form.getInputProps('authType')}
      >
        <Group mt="xs">
          <Radio value="token" label="使用Token" />
          <Radio disabled value="publicAuth" label="跳转认证(开发中)" />
        </Group>
      </Radio.Group>
      {form.values.authType === 'token' && (
        <>
          <TextInput
            mt={20}
            label="Notion Token"
            value={token}
            onChange={(e) => {
              setToken(e.target.value);
            }}
          />
          <Button
            mt={10}
            loading={loadingState.testNotion}
            onClick={async () => {
              setLoadingState({ ...loadingState, testNotion: true });
              notifications.show({
                id: 'check-notion-token',
                title: '开始检测...',
                message: '正在测试token是否可用',
                withCloseButton: true,
                loading: true,
                autoClose: false,
              });
              const { valid, error } = await checkToken(token);

              if (valid) {
                notifications.update({
                  id: 'check-notion-token',
                  color: 'teal',
                  title: '测试通过！',
                  message: '该Token可以正常使用',
                  icon: <IconExclamationCircle size="1rem" />,
                  autoClose: 2000,
                });
                onTokenValid(token);
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
              setLoadingState({ ...loadingState, testNotion: false });
            }}
          >
            测试
          </Button>
        </>
      )}
    </>
  );
}
