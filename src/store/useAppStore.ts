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
  fetchContracts,
  fetchContractById,
  createContractAPI,
  updateContractAPI,
  deleteContractAPI,
  uploadContractFile,
  type TContractPayload,
  type TContract,
  type Wallet,
  type Payment,
} from "../api";
import { SYSTEM, LANG } from "../lang";
import { fetchUnits } from "../api";
import {
  fetchPaymentsByProject,
  fetchMyPayments,
  fetchWallets,
  createPayment,
  updatePaymentStatus,
} from "../api";

export const useAppStore = create<TAppStore>((set) => {
  return {
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
        }
      },

      getUnits: async (): Promise<void> => {
        set((state) => ({
          tasksStore: { ...state.tasksStore, unitsLoading: true },
        }));

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
        }
      },

      deleteTask: async (id: string): Promise<void> => {
        set((state) => ({
          tasksStore: { ...state.tasksStore, loading: true },
        }));

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
        }
      },

      getTaskById: async (id: string): Promise<void> => {
        set((state) => ({
          tasksStore: { ...state.tasksStore, loading: true },
        }));

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
        }
      },
      createAssignment: async (taskId, userId, startDate, endDate) => {
        set((s) => ({
          assignmentsStore: { ...s.assignmentsStore, loading: true },
        }));
        try {
          await saveAssignment(taskId, userId, startDate, endDate);
        } catch (e) {
          console.error(SYSTEM.ERROR_DATA_LOADING[LANG], e);
        } finally {
          console.log("createAssignment - finaly");
          set((s) => ({
            assignmentsStore: { ...s.assignmentsStore, loading: false },
          }));
        }
      },
      deleteAssignment: async (assignmentIds: string[]) => {
        set((s) => ({
          assignmentsStore: { ...s.assignmentsStore, loading: true },
        }));
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
        }
      },
    },

    contractsStore: {
      contracts: [],
      selected: null,
      loading: false,
      fetched: false,

      getList: async () => {
        set((s) => ({
          contractsStore: { ...s.contractsStore, loading: true },
        }));
        try {
          const list = await fetchContracts();
          set((s) => ({
            contractsStore: {
              ...s.contractsStore,
              contracts: list,
            },
          }));
        } catch (e) {
          console.error("Ошибка загрузки контрактов:", e);
        } finally {
          set((s) => ({
            contractsStore: {
              ...s.contractsStore,
              loading: false,
              fetched: true,
            },
          }));
        }
      },

      getById: async (id) => {
        set((s) => ({
          contractsStore: { ...s.contractsStore, loading: true },
        }));
        try {
          const contract = await fetchContractById(id);
          set((s) => ({
            contractsStore: {
              ...s.contractsStore,
              selected: contract,
              contracts: [
                contract,
                ...s.contractsStore.contracts.filter((c) => c.id !== id),
              ],
            },
          }));
        } catch (e) {
          console.error("Ошибка загрузки контракта:", e);
        } finally {
          set((s) => ({
            contractsStore: {
              ...s.contractsStore,
              loading: false,
              fetched: true,
            },
          }));
        }
      },

      create: async (payload): Promise<TContract> => {
        // включаем лоадинг
        set((s) => ({
          contractsStore: { ...s.contractsStore, loading: true },
        }));

        try {
          // 1) создаём контракт
          const newC = await createContractAPI(payload);

          // 2) кладём его в стейт
          set((s) => ({
            contractsStore: {
              ...s.contractsStore,
              contracts: [newC, ...s.contractsStore.contracts],
            },
          }));

          // 3) возвращаем созданный объект
          return newC;
        } catch (e) {
          console.error("Ошибка создания контракта:", e);
          // контракт не вернётся — вызывающий код получит rejected promise
          throw e;
        } finally {
          // выключаем лоадинг
          set((s) => ({
            contractsStore: { ...s.contractsStore, loading: false },
          }));
        }
      },

      save: async (
        id: string,
        payload: Partial<TContractPayload>,
      ): Promise<TContract> => {
        set((s) => ({
          contractsStore: { ...s.contractsStore, loading: true },
        }));

        try {
          // 1) обновляем контракт
          const updated = await updateContractAPI(id, payload);

          // 2) «вшиваем» его в список и в selected
          set((s) => ({
            contractsStore: {
              ...s.contractsStore,
              contracts: s.contractsStore.contracts.map((c) =>
                c.id === id ? updated : c,
              ),
              selected:
                s.contractsStore.selected?.id === id
                  ? updated
                  : s.contractsStore.selected,
            },
          }));

          // 3) возвращаем обновлённый объект
          return updated;
        } catch (e) {
          console.error("Ошибка сохранения контракта:", e);
          throw e;
        } finally {
          set((s) => ({
            contractsStore: { ...s.contractsStore, loading: false },
          }));
        }
      },

      delete: async (id) => {
        set((s) => ({
          contractsStore: { ...s.contractsStore, loading: true },
        }));
        try {
          await deleteContractAPI(id);
          set((s) => ({
            contractsStore: {
              ...s.contractsStore,
              contracts: s.contractsStore.contracts.filter((c) => c.id !== id),
              selected:
                s.contractsStore.selected?.id === id
                  ? null
                  : s.contractsStore.selected,
            },
          }));
        } catch (e) {
          console.error("Ошибка удаления контракта:", e);
        } finally {
          set((s) => ({
            contractsStore: { ...s.contractsStore, loading: false },
          }));
        }
      },

      uploadFile: async (path: string, file: File): Promise<string> => {
        return await uploadContractFile(path, file);
      },
    },

    paymentsStore: {
      walletsByUser: {} as Record<string, Wallet[]>,
      paymentsByProject: {} as Record<string, Payment[]>,
      myPayments: [] as Payment[],
      loading: false,

      getWallets: async (userId: string): Promise<void> => {
        set((state) => ({
          paymentsStore: { ...state.paymentsStore, loading: true },
        }));
        try {
          const w = await fetchWallets(userId);
          set((state) => ({
            paymentsStore: {
              ...state.paymentsStore,
              walletsByUser: {
                ...state.paymentsStore.walletsByUser,
                [userId]: w,
              },
              loading: false,
            },
          }));
        } catch (e) {
          console.error(e);
          set((state) => ({
            paymentsStore: { ...state.paymentsStore, loading: false },
          }));
        }
      },

      getProjectPayments: async (projectId: string): Promise<void> => {
        set((state) => ({
          paymentsStore: { ...state.paymentsStore, loading: true },
        }));
        try {
          const p = await fetchPaymentsByProject(projectId);
          set((state) => ({
            paymentsStore: {
              ...state.paymentsStore,
              paymentsByProject: {
                ...state.paymentsStore.paymentsByProject,
                [projectId]: p,
              },
              loading: false,
            },
          }));
        } catch (e) {
          console.error(e);
          set((state) => ({
            paymentsStore: { ...state.paymentsStore, loading: false },
          }));
        }
      },

      getMyPayments: async (): Promise<void> => {
        set((state) => ({
          paymentsStore: { ...state.paymentsStore, loading: true },
        }));
        try {
          const p = await fetchMyPayments();
          set((state) => ({
            paymentsStore: {
              ...state.paymentsStore,
              myPayments: p,
              loading: false,
            },
          }));
        } catch (e) {
          console.error(e);
          set((state) => ({
            paymentsStore: { ...state.paymentsStore, loading: false },
          }));
        }
      },

      createPayment: async (
        payload: Parameters<typeof createPayment>[0],
      ): Promise<Payment> => {
        set((state) => ({
          paymentsStore: { ...state.paymentsStore, loading: true },
        }));
        try {
          const p = await createPayment(payload);
          set((state) => ({
            paymentsStore: {
              ...state.paymentsStore,
              paymentsByProject: {
                ...state.paymentsStore.paymentsByProject,
                [p.project_id]: [
                  p,
                  ...(state.paymentsStore.paymentsByProject[p.project_id] ??
                    []),
                ],
              },
              myPayments: [p, ...state.paymentsStore.myPayments],
              loading: false,
            },
          }));
          return p;
        } catch (e) {
          console.error(e);
          set((state) => ({
            paymentsStore: { ...state.paymentsStore, loading: false },
          }));
          throw e;
        }
      },

      updatePaymentStatus: async (
        id: string,
        status: "pending" | "captured" | "failed",
      ): Promise<Payment> => {
        set((state) => ({
          paymentsStore: { ...state.paymentsStore, loading: true },
        }));
        try {
          const p = await updatePaymentStatus(id, status);
          set((state) => ({
            paymentsStore: {
              ...state.paymentsStore,
              paymentsByProject: {
                ...state.paymentsStore.paymentsByProject,
                [p.projectId]: state.paymentsStore.paymentsByProject[
                  p.projectId
                ].map((x) => (x.id === id ? p : x)),
              },
              myPayments: state.paymentsStore.myPayments.map((x) =>
                x.id === id ? p : x,
              ),
              loading: false,
            },
          }));
          return p;
        } catch (e) {
          console.error(e);
          set((state) => ({
            paymentsStore: { ...state.paymentsStore, loading: false },
          }));
          throw e;
        }
      },
    },
  };
});
