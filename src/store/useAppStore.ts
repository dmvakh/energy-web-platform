import { create } from "zustand";
import type { TAppStore } from ".";
import {
  deleteTaskById,
  fetchRawDocuments,
  fetchTaskById,
  fetchTasks,
} from "../api";
import { SYSTEM, LANG } from "../lang";
import { fetchUnits } from "../api";

export const useAppStore = create<TAppStore>((set, get) => {
  const updateGlobalLoading = () => {
    const {
      tasksStore: { loading: tasksLoading, unitsLoading },
      documentsStore: { loading: documentsLoading },
    } = get();
    const anyLoading = tasksLoading || unitsLoading || documentsLoading;

    set({ globalLoading: anyLoading });
  };

  return {
    globalLoading: false,

    tasksStore: {
      tasks: [],
      units: [],
      loading: false,
      unitsLoading: false,
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

      getUnits: async (): Promise<void> => {
        set((state) => ({
          tasksStore: { ...state.tasksStore, unitsLoading: true },
        }));
        updateGlobalLoading();

        try {
          const data = await fetchUnits();
          set((state) => ({
            tasksStore: {
              ...state.tasksStore,
              units: data,
              unitsLoading: false,
            },
          }));
        } catch (error) {
          console.error(SYSTEM.ERROR_DATA_LOADING[LANG], error);
          set((state: TAppStore) => ({
            tasksStore: {
              ...state.tasksStore,
              unitsLoading: false,
            },
          }));
        } finally {
          updateGlobalLoading();
        }
      },

      deleteTask: async (id: string): Promise<void> => {
        set((state) => ({
          tasksStore: { ...state.tasksStore, loading: true },
        }));
        updateGlobalLoading();

        try {
          const deletedId = await deleteTaskById(id);
          set((state) => ({
            tasksStore: {
              ...state.tasksStore,
              tasks: state.tasksStore.tasks.filter(
                (it) => it.id !== deletedId.id,
              ),
            },
          }));
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
        tasks: {},
        personal: [],
      },
      getTaskDocuments: async (taskId: string): Promise<void> => {
        set((state) => ({
          documentsStore: { ...state.documentsStore, loading: true },
        }));
        updateGlobalLoading();

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
