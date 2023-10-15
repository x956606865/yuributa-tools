import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { getLastYuriBgmByDate, getLastYuriBgmByDateRange } from '~/utils/client/utils';

export const useBGMStore = create(
  devtools(
    (set, get) => ({
      currentBGMList: [],
      pageInfo: {
        current: 1,
        pageSize: 30,
        total: 0,
      },
      isFetchingBGMList: false,
      fetchBGMListByDate: async (dateString: string, fetchType: string, form: any, page = 1) => {
        const state: any = get();
        set({
          isFetchingBGMList: true,
          currentBGMList: [],
          pageInfo: {
            ...state.pageInfo,
            current: page,
          },
        });

        let valid = null;
        let data = null;
        if (dateString === 'custom') {
          const r = await getLastYuriBgmByDateRange(form.values.dateRange, fetchType, {
            current: state.pageInfo.current,
            pageSize: state.pageInfo.pageSize,
          });
          valid = r.valid;
          data = r.data;
        } else {
          const r = await getLastYuriBgmByDate(dateString, fetchType, {
            current: state.pageInfo.current,
            pageSize: state.pageInfo.pageSize,
          });
          valid = r.valid;
          data = r.data;
        }

        if (valid) {
          set({
            currentBGMList: data.data as any[],
            pageInfo: {
              ...state.pageInfo,
              total: Math.ceil(data.total / state.pageInfo.pageSize),
            },
          });
        }
        set({ isFetchingBGMList: false });
      },
      setPage: (page: number) => {
        const state: any = get();
        set({
          pageInfo: {
            ...state.pageInfo,
            current: page,
          },
        });
      },
      // setSelectedPreset: (preset) => set({ selectedPreset: preset }),
    }),
    { store: 'BGMStore' }
  )
);
