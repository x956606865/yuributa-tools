/* eslint-disable no-restricted-syntax */
/* eslint-disable no-await-in-loop */
import { notifications } from '@mantine/notifications';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import {
  convertDataToNotion,
  createNotionPage,
  fetchBGMDetailsByIds,
  getDatabaseList,
  getFetcherMappingByName,
} from '~/utils/client/utils';

export const useNotionStore = create(
  devtools(
    (set, get) => ({
      token: null,
      selectedDBId: null,
      selectedPreset: null,
      currentNotionDBList: [],
      currentSelectedDB: null,
      isLoadingDBList: false,
      isSavingToPage: false,
      setNotionToken: (token: string) => set({ token }),
      setCurrentNotionDBList: (list: any) => set({ currentNotionDBList: list }),
      setSelectedDBId: (selectedDBId: string) =>
        set((state: any) => ({
          selectedDBId,
          currentSelectedDB: state.currentNotionDBList.find((db: any) => db.id === selectedDBId),
        })),
      setSelectedPreset: (preset: any) => set({ selectedPreset: preset }),
      getNotionDBList: async () => {
        const { token } = get() as any;
        set({ isLoadingDBList: true, currentNotionDBList: [] });
        const list = await getDatabaseList(token);
        if (list.valid) {
          set({ isLoadingDBList: false, currentNotionDBList: list.data });
        } else {
          set({ isLoadingDBList: false, currentNotionDBList: [] });
          throw new Error(list.error);
        }
      },
      saveToNotion: async ({ selectedData, currentBGMList }: any) => {
        set({ isSavingToPage: true });
        const state: any = get();
        const mapping = getFetcherMappingByName(state.selectedPreset.fetcher);
        const nameMapping = mapping.find((m: any) => m.keyProp === 'name');
        const originData = currentBGMList.filter((d: any) =>
          selectedData.includes(d[nameMapping.fieldName])
        );
        notifications.show({
          id: 'upload-notion-page-progress',
          title: '正在采集详细信息...',
          message: '',
          // withCloseButton: true,
          loading: true,
          autoClose: false,
        });
        const detailData = await fetchBGMDetailsByIds(originData.map((d: any) => d.id));

        // console.log(
        //   '%c [ originData ]-138',
        //   'font-size:13px; background:pink; color:#bf2c9f;',
        //   originData
        // );
        const waitingList = convertDataToNotion({
          dataList: originData,
          preset: state.selectedPreset,
          detailData,
        });
        // console.log(
        //   '%c [ test ]-150',
        //   'font-size:13px; background:pink; color:#bf2c9f;',
        //   waitingList
        // );
        let currentNum = 0;
        notifications.update({
          id: 'upload-notion-page-progress',
          title: '开始导入...',
          message: `当前进度${currentNum}/${waitingList.length}`,
          loading: true,
          autoClose: false,
        });
        for (const item of waitingList) {
          const result = await createNotionPage(state.token, item);
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
              message: `${title || 'unknown'}导入失败`,
              withCloseButton: true,
              autoClose: 2000,
            });
          }
          currentNum += 1;
          notifications.update({
            id: 'upload-notion-page-progress',
            loading: true,
            message: `当前进度${currentNum}/${waitingList.length}`,
          });
        }
        notifications.update({
          color: 'green',
          id: 'upload-notion-page-progress',
          message: '全部导入完成',
          autoClose: 2000,
        });
        set({ isSavingToPage: false });
      },
    }),
    { store: 'notionStore' }
  )
);
