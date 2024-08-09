import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { getServerStatus } from '~/utils/client/douban_book';
import { getLastYuriBgmByDate, getLastYuriBgmByDateRange } from '~/utils/client/utils';
const serverStatusText: any = {
  normal: '正常',
  running: '忙碌',
  error: '出错',
  unknown: '未知',
};
export const useServerStore = create(
  devtools(
    (set, get) => ({
      serverStatus: 'unknown',
      isFetchingServerStatus: false,
      getServerStatus: async () => {
        set({ isFetchingServerStatus: true });

        const { success, data, error } = await getServerStatus();
        if (success) {
          set({
            isFetchingServerStatus: false,
            serverStatus: serverStatusText[data.status] ?? '未知',
          });
        } else {
          set({ isFetchingServerStatus: false, serverStatus: '出错' });
        }
      },
      // setSelectedPreset: (preset) => set({ selectedPreset: preset }),
    }),
    { store: 'ServerStore' }
  )
);
