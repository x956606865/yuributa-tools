import {
  Button,
  Card,
  Group,
  Image,
  LoadingOverlay,
  Pagination,
  SimpleGrid,
  Text,
  Tooltip,
} from '@mantine/core';

import { useEffect, useState } from 'react';
import { convertDataToStandard } from '~/utils/client/utils';
import { useBGMStore } from '~/stores/bgm.store';
import { useNotionStore } from '~/stores/notion.store';

interface FetchNewProps {
  dateString: string;
  onSave: (data: any) => void;
  fetchType: string;
}

interface StandardMangaProps {
  name: string;
  name_cn: string;
  summary: string;
  cover: string;
}

export default function FetchBGMV1New({ dateString, onSave, fetchType }: FetchNewProps) {
  // const selectedPreset = useNotionStore((store: any) => store.selectedPreset);
  // const setSelectedPreset = useNotionStore((store: any) => store.setSelectedPreset);
  const fetchBGMListByDate = useBGMStore((store: any) => store.fetchBGMListByDate);
  const isFetchingBGMList = useBGMStore((store: any) => store.isFetchingBGMList);
  const currentBGMList = useBGMStore((store: any) => store.currentBGMList);
  const pageInfo = useBGMStore((store: any) => store.pageInfo);
  const setPage = useBGMStore((store: any) => store.setPage);
  const [data, setData] = useState<any>([]);
  const [selectedData, setSelectedData] = useState<any>([]);
  const selectedPreset = useNotionStore((store: any) => store.selectedPreset);
  useEffect(() => {
    if (typeof dateString === 'string') {
      // fetchBGMListByDate(dateString, fetchType);
      setPage(1);
    }
  }, [dateString, fetchType]);
  useEffect(() => {
    if (typeof dateString === 'string') {
      fetchBGMListByDate(dateString, fetchType, pageInfo.current);
    }
  }, [pageInfo.current]);
  useEffect(() => {
    // console.log(
    //   '%c [ currentBGMList ]-73',
    //   'font-size:13px; background:pink; color:#bf2c9f;',
    //   convertDataToStandard(currentBGMList, form.values.fetcherName)
    // );
    // console.log(
    //   '%c [ setSelectedPreset ]-39',
    //   'font-size:13px; background:pink; color:#bf2c9f;',
    //   selectedPreset
    // );
    if (typeof selectedPreset?.fetcher === 'string') {
      const convertedData = convertDataToStandard(currentBGMList, selectedPreset.fetcher);
      setData(convertedData);
      setSelectedData([]);
    }
  }, [currentBGMList, selectedPreset.fetcher]);
  return (
    <div style={{ marginTop: 20 }}>
      <LoadingOverlay visible={isFetchingBGMList} />
      <Group>
        <Button
          size="xs"
          onClick={() => {
            setSelectedData(data.map((i: any) => i.name));
          }}
        >
          全选
        </Button>
        <Button
          size="xs"
          onClick={() => {
            setSelectedData([]);
          }}
        >
          {' '}
          取消选择
        </Button>
        <Button
          size="xs"
          onClick={() => {
            onSave(selectedData);
          }}
        >
          添加到notion
        </Button>
      </Group>
      <SimpleGrid cols={4} mt={10}>
        {data.map((m: StandardMangaProps) => {
          // asd
          const selected = selectedData.includes(m.name);
          return (
            <Card
              key={m.name}
              onClick={() => {
                if (selected) {
                  setSelectedData(selectedData.filter((item: any) => item !== m.name));
                } else {
                  setSelectedData(Array.from(new Set([...selectedData, m.name])));
                }
              }}
              shadow="sm"
              padding="lg"
              radius="md"
              withBorder
              style={{ cursor: 'pointer', borderColor: selected ? '#306eff' : 'transparent' }}
            >
              <Card.Section>
                <Image src={m.cover} height={160} alt="Norway" />
              </Card.Section>

              <Group position="apart" mt="md" mb="xs">
                <Tooltip multiline label={m.name_cn || m.name}>
                  <Text weight={500} lineClamp={1}>
                    {m.name_cn || m.name}
                  </Text>
                </Tooltip>

                {/* <Checkbox checked={selectedData.includes(m.name)} /> */}
              </Group>

              <Text size="sm" color="dimmed" lineClamp={4}>
                {m.summary}
              </Text>
            </Card>
          );
        })}
      </SimpleGrid>
      {}
      <Pagination mt={20} value={pageInfo.current} onChange={setPage} total={pageInfo.total} />
    </div>
  );
}
