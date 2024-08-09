import { useDisclosure, useLocalStorage } from '@mantine/hooks';
import {
  Modal,
  Group,
  Button,
  ScrollArea,
  LoadingOverlay,
  Table,
  Rating,
  Badge,
  Radio,
} from '@mantine/core';
import { useEffect, useState } from 'react';
import { getDatasets } from '~/utils/client/douban_book';
import { notifications } from '@mantine/notifications';
import { IconExclamationCircle } from '@tabler/icons-react';
import DoubanPresetManager from './PresetManage';
import DoubanCreatePreset from './CreatePreset';

export default function ImportToNotionModal(props: any) {
  const {
    disabled = false,
    size = 'xs',
    color = 'Blue',
    btnText = '导入Notion',
    modalTitle = '导入',
    bookListId = null,
  } = props;
  const [opened, { open, close }] = useDisclosure(false);
  const [isLoading, setIsLoading] = useState(false);

  const [op, setOp] = useState('useCurrent');

  const openModal = () => {
    // setIsLoading(true);
    open();
    // getData();
  };
  const closeModal = () => {
    close();
    // setTableData([]);
  };

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
        <Radio.Group
          mt={20}
          name="selectNotionImportOperatorName"
          label="选择想要进行的操作"
          withAsterisk
          value={op}
          onChange={setOp}
        >
          <Group mt="xs">
            <Radio value="useCurrent" label="使用已有Preset" />
            <Radio value="createNew" label="新建Preset" />
          </Group>
        </Radio.Group>
        {op === 'useCurrent' && (
          <DoubanPresetManager closeModalFunc={closeModal} bookListId={bookListId} />
        )}
        {op === 'createNew' && <DoubanCreatePreset />}
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
