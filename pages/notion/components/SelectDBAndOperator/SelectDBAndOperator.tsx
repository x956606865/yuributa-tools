import { Group, Radio } from '@mantine/core';
import { DatePicker } from '@mantine/dates';

export default function SelectDBAndOperator({ form }: any) {
  //   console.log('%c [ token ]-23', 'font-size:13px; background:pink; color:#bf2c9f;', token);
  //   const [token, setToken] = useState<string | undefined>(undefined);
  // const [loadingState, setLoadingState] = useState<any>({
  //   //   testNotion: false,
  // });
  // const { currentNotionDBList, selectedDBId } = useNotionStore(
  //   (store: any) => ({
  //     selectedDBId: store.selectedDBId,
  //     currentNotionDBList: store.currentNotionDBList,
  //   }),
  //   shallow
  // );
  // const setCurrentNotionDBList = useNotionStore((store: any) => store.setCurrentNotionDBList);
  // // const setSelectedDBId = useNotionStore((store: any) => store.setSelectedDBId);
  // const mangaListRes = useRequest(
  //   async () => {
  //     const list = await getDatabaseList(token);
  //     if (list.valid) {
  //       setCurrentNotionDBList(list.data);
  //       return list.data;
  //     } else {
  //       throw new Error(list.error);
  //     }
  //   },
  //   {
  //     debounceWait: 300,
  //     cacheKey: `database-list-cache_${token}`,
  //     staleTime: 60000,
  //     onError: (err: any) => {
  //       notifications.show({
  //         color: 'red',
  //         title: '获取数据库列表失败',
  //         message: err.message,
  //         icon: <IconExclamationCircle size="1rem" />,
  //         autoClose: 2000,
  //       });
  //     },
  //   }
  // );
  return (
    <>
      <Radio.Group
        mt={20}
        name="operatorName"
        label="选择想要进行的操作"
        withAsterisk
        {...form.getInputProps('operatorName')}
      >
        <Group mt="xs">
          <Radio value="fetchNew" label="采集最新百合作品" />
          <Radio disabled value="search" label="搜索并添加漫画到notion(开发中)" />
          <Radio disabled value="mergeDup" label="查询并合并notion中重复项(开发中)" />
          {/* <Radio value="publicAuth" label="跳转认证" /> */}
        </Group>
      </Radio.Group>
      {form.values.operatorName === 'fetchNew' && (
        <Radio.Group
          mt={20}
          name="dateFrom"
          label="选择时间范围"
          withAsterisk
          {...form.getInputProps('dateFrom')}
        >
          <Group mt="xs">
            <Radio value="lastMonth" label="最近一个月" />
            <Radio value="last3Month" label="最近三个月" />
            <Radio value="last6Month" label="最近半年" />
            <Radio value="last12Month" label="最近一年" />
            <Radio value="custom" label="自定义" />
            {/* <Radio value="publicAuth" label="跳转认证" /> */}
          </Group>
        </Radio.Group>
      )}
      {form.values.dateFrom === 'custom' && (
        <Group mt={15}>
          <DatePicker type="range" {...form.getInputProps('dateRange')} />
        </Group>
      )}
    </>
  );
}
