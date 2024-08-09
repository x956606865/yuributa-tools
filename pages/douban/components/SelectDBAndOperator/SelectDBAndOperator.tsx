import { Group, Radio } from '@mantine/core';
import { DatePicker } from '@mantine/dates';

export default function SelectDBAndOperator({ form }: any) {
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
          <Radio value="fetchNew" label="采集新书单" />
          <Radio value="manageBookList" label="管理书单" />
          <Radio disabled value="updateScore" label="更新已有数据评分" />
        </Group>
      </Radio.Group>
      {/* {form.values.operatorName === 'fetchNew' && (
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
          </Group>
        </Radio.Group>
      )}
      {form.values.dateFrom === 'custom' && (
        <Group mt={15}>
          <DatePicker type="range" {...form.getInputProps('dateRange')} />
        </Group>
      )} */}
    </>
  );
}
