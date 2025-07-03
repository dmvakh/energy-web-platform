import { create } from "zustand";
import type { TAppStore } from ".";
import {
  deleteTaskById,
  fetchAssignments,
  fetchRawDocuments,
  fetchTaskById,
  fetchTasks,
  saveAssignment,
  deleteAssignment as deleteAssignmentAPI,
  AssignmentStatus,
} from "../api";
import { SYSTEM, LANG } from "../lang";
import { fetchUnits } from "../api";

export const useAppStore = create<TAppStore>((set, get) => {
  const updateGlobalLoading = () => {
    const {
      tasksStore: { loading: tasksLoading, unitsLoading },
      documentsStore: { loading: docsLoading },
      assignmentsStore: { loading: assignsLoading },
    } = get();
    set({
      globalLoading:
        tasksLoading || unitsLoading || docsLoading || assignsLoading,
    });
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
            },
          }));
        } catch (error) {
          console.error(SYSTEM.ERROR_DATA_LOADING[LANG], error);
        } finally {
          set((state: TAppStore) => ({
            tasksStore: {
              ...state.tasksStore,
              loading: false,
              fetched: true,
            },
          }));
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
            },
          }));
        } catch (error) {
          console.error(SYSTEM.ERROR_DATA_LOADING[LANG], error);
        } finally {
          set((state: TAppStore) => ({
            tasksStore: {
              ...state.tasksStore,
              unitsLoading: false,
            },
          }));
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
        } finally {
          set((state) => ({
            tasksStore: {
              ...state.tasksStore,
              loading: false,
              fetched: true,
            },
          }));
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
              },
            };
          });
        } catch (error) {
          console.error(SYSTEM.ERROR_DATA_LOADING[LANG], error);
        } finally {
          set((state) => ({
            tasksStore: {
              ...state.tasksStore,
              loading: false,
              fetched: true,
            },
          }));
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
            },
          }));
        } catch (error) {
          console.error(SYSTEM.ERROR_DATA_LOADING[LANG], error);
        } finally {
          set((state) => ({
            documentsStore: {
              ...state.documentsStore,
              loading: false,
              fetched: true,
            },
          }));
          updateGlobalLoading();
        }
      },
    },
    assignmentsStore: {
      assignments: {},
      loading: false,
      getAssignments: async (taskId) => {
        set((s) => ({
          assignmentsStore: { ...s.assignmentsStore, loading: true },
        }));
        updateGlobalLoading();
        try {
          const list = await fetchAssignments(taskId);
          set((s) => ({
            assignmentsStore: {
              ...s.assignmentsStore,
              assignments: {
                ...s.assignmentsStore.assignments,
                [taskId]: list,
              },
            },
          }));
        } catch (e) {
          console.error(SYSTEM.ERROR_DATA_LOADING[LANG], e);
        } finally {
          set((s) => ({
            assignmentsStore: { ...s.assignmentsStore, loading: false },
          }));
          updateGlobalLoading();
        }
      },
      createAssignment: async (taskId, userId, startDate, endDate) => {
        set((s) => ({
          assignmentsStore: { ...s.assignmentsStore, loading: true },
        }));
        updateGlobalLoading();
        try {
          await saveAssignment(taskId, userId, startDate, endDate);
        } catch (e) {
          console.error(SYSTEM.ERROR_DATA_LOADING[LANG], e);
        } finally {
          set((s) => ({
            assignmentsStore: { ...s.assignmentsStore, loading: false },
          }));
          updateGlobalLoading();
        }
      },
      deleteAssignment: async (assignmentIds: string[]) => {
        set((s) => ({
          assignmentsStore: { ...s.assignmentsStore, loading: true },
        }));
        updateGlobalLoading();
        try {
          const deleted = await deleteAssignmentAPI(assignmentIds);
          const activeAssignmentId = deleted.find(
            (it) => it.status === AssignmentStatus.ACTIVE,
          )?.id;
          const removedAssignmentId =
            deleted.find((it) => it.status === AssignmentStatus.REMOVED)?.id ??
            null;
          set((s) => ({
            assignmentsStore: {
              ...s.assignmentsStore,
              assignments: {
                ...s.assignmentsStore.assignments,
                [deleted[0].taskId]: s.assignmentsStore.assignments[
                  deleted[0].taskId
                ].filter((a) => {
                  if (removedAssignmentId) {
                    if (
                      a.activeAssignmentId !== activeAssignmentId &&
                      a.removedAssignmentId !== removedAssignmentId
                    ) {
                      return true;
                    }
                    return false;
                  } else {
                    if (a.activeAssignmentId !== activeAssignmentId) {
                      return true;
                    }
                    return false;
                  }
                }),
              },
            },
          }));
        } catch (error) {
          console.error("Ошибка удаления назначения:", error);
        } finally {
          set((s) => ({
            assignmentsStore: { ...s.assignmentsStore, loading: false },
          }));
          updateGlobalLoading();
        }
      },
    },
  };
});
