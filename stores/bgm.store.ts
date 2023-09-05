import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { getLastYuriBgmByDate } from '~/pages/notion/utils';

export const useBGMStore = create(
  devtools(
    (set) => ({
      currentBGMList: [],
      isFetchingBGMList: false,
      fetchBGMListByDate: async (dateString: string) => {
        set({ isFetchingBGMList: true, currentBGMList: [] });
        const { valid, data } = await getLastYuriBgmByDate(dateString);
        if (valid) {
          set({ currentBGMList: data });
        }
        set({ isFetchingBGMList: false });
      },
      // setSelectedPreset: (preset) => set({ selectedPreset: preset }),
    }),
    { store: 'BGMStore' }
  )
);
