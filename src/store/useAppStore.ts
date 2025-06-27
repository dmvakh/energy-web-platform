import { create } from "zustand";
import type { TAppStore } from ".";
import { fetchRawDocuments, fetchTaskById, fetchTasks } from "../api";
import { SYSTEM, LANG } from "../lang";

export const useAppStore = create<TAppStore>((set, get) => {
  const updateGlobalLoading = () => {
    const {
      tasksStore: { loading: tasksLoading },
      documentsStore: { loading: documentsLoading },
    } = get();
    const anyLoading = tasksLoading || documentsLoading;

    set({ globalLoading: anyLoading });
  };

  return {
    globalLoading: false,

    tasksStore: {
      tasks: [],
      loading: false,
      fetched: false,
      selectedTask: null,
      setTask: (id) => {
        set((state) => ({
          tasksStore: {
            ...state.tasksStore,
            selectedTask:
              state.tasksStore.tasks.find((t) => t.id === id) ?? null,
          },
        }));
      },

      resetTask: () => {
        set((state) => ({
          tasksStore: {
            ...state.tasksStore,
            selectedTask: null,
          },
        }));
      },
      getTasks: async (): Promise<void> => {
        set((state) => ({
          tasksStore: { ...state.tasksStore, loading: true },
        }));
        updateGlobalLoading();

        try {
          const data = await fetchTasks("PROJECT");
          set((state) => ({
            tasksStore: {
              ...state.tasksStore,
              tasks: data,
              loading: false,
              fetched: true,
            },
          }));
        } catch (error) {
          console.error(SYSTEM.ERROR_DATA_LOADING[LANG], error);
          set((state: TAppStore) => ({
            tasksStore: {
              ...state.tasksStore,
              loading: false,
              fetched: true,
            },
          }));
        } finally {
          updateGlobalLoading();
        }
      },
      getTaskById: async (id: string): Promise<void> => {
        set((state) => ({
          tasksStore: { ...state.tasksStore, loading: true },
        }));
        updateGlobalLoading();

        try {
          const task = await fetchTaskById(id);

          set((state) => {
            const existingIndex = state.tasksStore.tasks.findIndex(
              (t) => t.id === id,
            );
            const updatedTasks = [...state.tasksStore.tasks];

            if (existingIndex !== -1) {
              updatedTasks[existingIndex] = task;
            } else {
              updatedTasks.push(task);
            }

            return {
              tasksStore: {
                ...state.tasksStore,
                tasks: updatedTasks,
                selectedTask: task,
                loading: false,
                fetched: true,
              },
            };
          });
        } catch (error) {
          console.error(SYSTEM.ERROR_DATA_LOADING[LANG], error);
          set((state) => ({
            tasksStore: {
              ...state.tasksStore,
              loading: false,
              fetched: true,
            },
          }));
        } finally {
          updateGlobalLoading();
        }
      },
    },
    documentsStore: {
      loading: false,
      fetched: false,
      documents: {
        tasks: [],
        personal: [],
      },
      getTaskDocuments: async (taskId: string): Promise<void> => {
        set((state) => ({
          documentsStore: { ...state.documentsStore, loading: true },
        }));
        try {
          const taskDocuments = await fetchRawDocuments(`tasks/${taskId}`);
          set((state) => ({
            documentsStore: {
              ...state.documentsStore,
              documents: {
                ...state.documentsStore.documents,
                tasks: {
                  [taskId]: taskDocuments.filter(
                    (file) => file.name !== ".keep",
                  ),
                },
              },
              loading: false,
              fetched: true,
            },
          }));
        } catch (error) {
          console.error(SYSTEM.ERROR_DATA_LOADING[LANG], error);
          set((state) => ({
            documentsStore: {
              ...state.documentsStore,
              loading: false,
              fetched: true,
            },
          }));
        } finally {
          updateGlobalLoading();
        }
      },
    },
  };
});
