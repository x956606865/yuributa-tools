import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { getDatabaseList } from '~/utils/client/utils';

export const useNotionStore = create(
  devtools(
    (set, get) => ({
      token: null,
      selectedDBId: null,
      selectedPreset: null,
      currentNotionDBList: [],
      currentSelectedDB: null,
      isLoadingDBList: false,
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
    }),
    { store: 'notionStore' }
  )
);
