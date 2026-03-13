import { db } from "./db";
import { store } from "../store";
import { taskApi } from "../store/api/taskApi";
import { boardApi } from "../store/api/boardApi";
import { activityApi } from "../store/api/activityApi";
import type { ITask, CreateTaskInput, ActivityAction, ActivityRecord } from "../types/task";
import type { IBoard, CreateBoardInput, UpdateBoardInput, IBoardMember } from "../types/board";

function isMongoId(id: string): boolean {
  return /^[a-f\d]{24}$/i.test(id);
}

export async function pullData() {
  if (!navigator.onLine) return;

  try {
    const boardResult = await store.dispatch(
      boardApi.endpoints.getBoards.initiate(undefined, { forceRefetch: true })
    );

    if (boardResult.isError || !boardResult.data) return;

    const serverBoards: IBoard[] = boardResult.data;
    const localBoards = await db.boards.toArray();
    const boardTransactions: Promise<unknown>[] = [];

    const localBoardsMap = new Map(localBoards.map((b) => [b._id, b]));
    const serverBoardIds = new Set(serverBoards.map((b) => b._id));

    for (const serverBoard of serverBoards) {
      const localBoard = localBoardsMap.get(serverBoard._id);

      if (!localBoard) {
        boardTransactions.push(db.boards.put({ ...serverBoard, syncStatus: "synced" }));
      } else if (localBoard.syncStatus === "synced") {
        boardTransactions.push(db.boards.put({ ...serverBoard, syncStatus: "synced" }));
      } else {
        const serverTime = new Date(serverBoard.updatedAt || 0).getTime();
        const localTime = new Date(localBoard.updatedAt || 0).getTime();

        if (serverTime > localTime) {
          boardTransactions.push(db.boards.put({ ...serverBoard, syncStatus: "synced" }));

          boardTransactions.push(
            db.conflicts.add({
              taskId: serverBoard._id,
              taskTitle: serverBoard.name,
              resolvedAt: Date.now(),
              message: `Local changes to board "${serverBoard.name}" were overwritten by a newer version from the server.`,
            })
          );

          const pendingOps = await db.boardMutations.where("boardId").equals(serverBoard._id).toArray();
          for (const op of pendingOps) {
            boardTransactions.push(db.boardMutations.delete(op.id!));
          }
        }
      }
    }

    for (const localBoard of localBoards) {
      if (!serverBoardIds.has(localBoard._id) && localBoard.syncStatus === "synced") {
        boardTransactions.push(db.boards.delete(localBoard._id));
        boardTransactions.push(db.boardMembers.where("boardId").equals(localBoard._id).delete());
        const localTasksInBoard = await db.tasks.where("boardId").equals(localBoard._id).toArray();
        for (const task of localTasksInBoard) {
          boardTransactions.push(db.tasks.delete(task._id));
          boardTransactions.push(db.mutations.where("taskId").equals(task._id).delete());
        }
      }
    }

    await Promise.all(boardTransactions);

    const memberTransactions: Promise<unknown>[] = [];
    const serverMembersMap = new Map<string, IBoardMember[]>();
    for (const board of serverBoards) {
      const memberResult = await store.dispatch(
        boardApi.endpoints.getMembers.initiate(board._id, { forceRefetch: true })
      );
      if (!memberResult.isError && memberResult.data) {
        serverMembersMap.set(board._id, memberResult.data);
        await db.boardMembers.where("boardId").equals(board._id).delete();

        for (const serverMember of memberResult.data) {
          memberTransactions.push(db.boardMembers.put({ ...serverMember, _id: serverMember._id || `${serverMember.boardId}_${serverMember.userId}` }));
        }
      }
    }
    await Promise.all(memberTransactions);

    const localTasks = await db.tasks.toArray();
    const taskTransactions: Promise<unknown>[] = [];
    const localTasksMap = new Map(localTasks.map((t) => [t._id, t]));
    const serverTaskIds = new Set<string>();

    for (const board of serverBoards) {
      const taskResult = await store.dispatch(
        taskApi.endpoints.getTasks.initiate(board._id, { forceRefetch: true })
      );

      if (taskResult.isError || !taskResult.data) continue;

      const serverTasks: ITask[] = taskResult.data;

      for (const serverTask of serverTasks) {
        serverTaskIds.add(serverTask._id);
        const localTask = localTasksMap.get(serverTask._id);

        if (!localTask) {
          taskTransactions.push(db.tasks.put({ ...serverTask, syncStatus: "synced" }));
        } else if (localTask.syncStatus === "synced") {
          taskTransactions.push(db.tasks.put({ ...serverTask, syncStatus: "synced" }));
        } else {
          const serverTime = new Date(serverTask.updatedAt || 0).getTime();
          const localTime = new Date(localTask.updatedAt || 0).getTime();

          if (serverTime > localTime) {
            taskTransactions.push(db.tasks.put({ ...serverTask, syncStatus: "synced" }));

            taskTransactions.push(
              db.conflicts.add({
                taskId: serverTask._id,
                taskTitle: serverTask.title,
                resolvedAt: Date.now(),
                message: `Local changes to task "${serverTask.title}" were overwritten by a newer version from the server.`,
              })
            );

            const pendingOps = await db.mutations.where("taskId").equals(serverTask._id).toArray();
            for (const op of pendingOps) {
              taskTransactions.push(db.mutations.delete(op.id!));
            }
          }
        }
      }
    }

    for (const localTask of localTasks) {
      if (!serverTaskIds.has(localTask._id) && localTask.syncStatus === "synced") {
        taskTransactions.push(db.tasks.delete(localTask._id));
      }
    }

    await Promise.all(taskTransactions);

    const updatedLocalTasks = await db.tasks.toArray();
    const taskStatusMap = new Map(updatedLocalTasks.map(t => [t._id, t.status]));
    const blockerCleanups: Promise<unknown>[] = [];

    for (const t of updatedLocalTasks) {
      if (t.blockedBy && t.blockedBy.length > 0) {
        const resolvedBlockers = t.blockedBy.filter(
          blockerId => taskStatusMap.get(blockerId) === "done" || !taskStatusMap.has(blockerId)
        );
        if (resolvedBlockers.length > 0) {
          const newBlockedBy = t.blockedBy.filter(id => !resolvedBlockers.includes(id));
          blockerCleanups.push(db.tasks.update(t._id, { blockedBy: newBlockedBy }));
        }
      }
    }
    await Promise.all(blockerCleanups);

    for (const board of serverBoards) {
      const actResult = await store.dispatch(
        activityApi.endpoints.getActivities.initiate(board._id, { forceRefetch: true })
      );
      if (!actResult.isError && actResult.data) {
        for (const serverAct of actResult.data) {
          const exists = await db.activities.where("_id").equals(serverAct._id).first();
          if (!exists) {
            await db.activities.add({
              _id: serverAct._id,
              boardId: serverAct.boardId,
              taskId: serverAct.taskId,
              taskTitle: serverAct.taskTitle,
              action: serverAct.action as ActivityAction,
              description: serverAct.description,
              snapshot: serverAct.snapshot,
              userId: serverAct.userId,
              createdAt: serverAct.createdAt,
              syncStatus: "synced",
            });
          }
        }
      }
    }

  } catch (error) {
    console.error("Failed to pull data:", error);
  }
}

let isProcessingMutations = false;

export async function processMutations() {
  if (!navigator.onLine) return;
  if (isProcessingMutations) return;

  isProcessingMutations = true;
  try {
    const boardMutations = await db.boardMutations.orderBy("timestamp").toArray();
    const boardIdSwaps: Record<string, string> = {};

    for (const mutation of boardMutations) {
      try {
        if (boardIdSwaps[mutation.boardId]) {
          mutation.boardId = boardIdSwaps[mutation.boardId];
        }

        if (mutation.action === "create") {
          const payload = mutation.payload as CreateBoardInput;
          if (!payload) continue;

          const tempId = mutation.boardId;
          const localBoard = await db.boards.get(tempId);

          if (!localBoard || localBoard.syncStatus === "deleted") {
            const futureMutations = await db.boardMutations.where("boardId").equals(tempId).toArray();
            for (const fm of futureMutations) { await db.boardMutations.delete(fm.id!); }
            await db.boardMutations.delete(mutation.id!);
            if (localBoard) await db.boards.delete(tempId);
            continue;
          }

          const result = await store.dispatch(boardApi.endpoints.createBoard.initiate(payload)).unwrap();

          await db.boards.delete(tempId);
          await db.boards.put({ ...localBoard, ...result, syncStatus: "synced" });

          const futureMutations = await db.boardMutations.where("boardId").equals(tempId).toArray();
          for (const fm of futureMutations) {
            await db.boardMutations.update(fm.id!, { boardId: result._id });
          }

          const taskMutationsWithTempBoard = await db.mutations.toArray();
          for (const tm of taskMutationsWithTempBoard) {
            if (tm.action === "create" && tm.payload && (tm.payload as { boardId?: string }).boardId === tempId) {
              const newPayload = { ...tm.payload, boardId: result._id };
              await db.mutations.update(tm.id!, { payload: newPayload });
            }
            if (tm.action === "update" && tm.payload && (tm.payload as { boardId?: string }).boardId === tempId) {
              const newPayload = { ...tm.payload, boardId: result._id };
              await db.mutations.update(tm.id!, { payload: newPayload });
            }
          }

          boardIdSwaps[tempId] = result._id;
        } else if (mutation.action === "update") {
          const payload = mutation.payload as UpdateBoardInput;
          if (!payload) continue;

          await store.dispatch(boardApi.endpoints.updateBoard.initiate({ id: mutation.boardId, body: payload })).unwrap();
          await db.boards.update(mutation.boardId, { syncStatus: "synced" });
        } else if (mutation.action === "delete") {
          if (!isMongoId(mutation.boardId)) {
            await db.boards.delete(mutation.boardId);
          } else {
            try {
              await store.dispatch(boardApi.endpoints.deleteBoard.initiate(mutation.boardId)).unwrap();
            } catch (e: unknown) {
              if ((e as { status?: number })?.status !== 404) throw e;
            }
            await db.boards.delete(mutation.boardId);
          }
        }

        await db.boardMutations.delete(mutation.id!);
      } catch (err) {
        console.error(`Failed to process board mutation: ${mutation.action}`, err);
        break;
      }
    }


    const taskMutations = await db.mutations.orderBy("timestamp").toArray();
    const taskIdSwaps: Record<string, string> = {};

    for (const mutation of taskMutations) {
      try {
        if (taskIdSwaps[mutation.taskId]) {
          mutation.taskId = taskIdSwaps[mutation.taskId];
        }

        if ((mutation.action === "create" || mutation.action === "update") && mutation.payload) {
          const payloadBoardId = (mutation.payload as { boardId?: string })?.boardId;
          if (payloadBoardId) {
            const actualBoardId = boardIdSwaps[payloadBoardId] || payloadBoardId;
            const targetBoard = await db.boards.get(actualBoardId);

            if (!targetBoard || targetBoard.syncStatus === "deleted") {
              const fallbackBoard = await db.boards.where("syncStatus").notEqual("deleted").first();

              if (fallbackBoard) {
                mutation.payload = { ...mutation.payload, boardId: fallbackBoard._id };
                await db.conflicts.add({
                  taskId: mutation.taskId,
                  taskTitle: "Cross Board Move Recovered",
                  resolvedAt: Date.now(),
                  message: `The target board for a task was deleted. The task was moved to "${fallbackBoard.name}".`
                });
              } else {
                await db.tasks.delete(mutation.taskId);
                await db.mutations.delete(mutation.id!);
                continue;
              }
            } else {
              mutation.payload = { ...mutation.payload, boardId: actualBoardId };
            }
          }
        }


        if (mutation.action === "create") {
          const payload = mutation.payload as CreateTaskInput;
          if (!payload) continue;

          const tempId = mutation.taskId;
          const localTask = await db.tasks.get(tempId);

          if (!localTask || localTask.syncStatus === "deleted") {
            const futureMutations = await db.mutations.where("taskId").equals(tempId).toArray();
            for (const fm of futureMutations) { await db.mutations.delete(fm.id!); }
            await db.mutations.delete(mutation.id!);
            if (localTask) await db.tasks.delete(tempId);
            continue;
          }

          const result = await store.dispatch(taskApi.endpoints.createTask.initiate(payload)).unwrap();

          await db.tasks.delete(tempId);
          await db.tasks.put({ ...localTask, ...result, syncStatus: "synced" });

          const futureMutations = await db.mutations.where("taskId").equals(tempId).toArray();
          for (const fm of futureMutations) {
            await db.mutations.update(fm.id!, { taskId: result._id });
          }

          taskIdSwaps[tempId] = result._id;
        } else if (mutation.action === "update") {
          const payload = mutation.payload;
          if (!payload) continue;

          const localTask = await db.tasks.get(mutation.taskId);
          const boardId = localTask ? localTask.boardId : (payload as { boardId?: string })?.boardId;

          if (!boardId) {
            console.warn("Could not determine boardId for task update", mutation.taskId);
            continue;
          }

          await store.dispatch(taskApi.endpoints.updateTask.initiate({
            id: mutation.taskId,
            boardId: boardId,
            body: payload
          })).unwrap();
          await db.tasks.update(mutation.taskId, { syncStatus: "synced" });
        } else if (mutation.action === "delete") {
          const taskId = mutation.taskId;
          const localTask = await db.tasks.get(taskId);
          const boardId = localTask ? localTask.boardId : null;

          if (!isMongoId(taskId)) {
            const relatedMutations = await db.mutations.where("taskId").equals(taskId).toArray();
            for (const m of relatedMutations) {
              if (m.id !== mutation.id) await db.mutations.delete(m.id!);
            }
            await db.tasks.delete(taskId);
          } else if (boardId) {
            try {
              await store.dispatch(taskApi.endpoints.deleteTask.initiate({ id: taskId, boardId })).unwrap();
            } catch (error: unknown) {
              if ((error as { status?: number })?.status !== 404) throw error;
            }
            await db.tasks.delete(taskId);
          } else {
            await db.tasks.delete(taskId);
          }
        }

        await db.mutations.delete(mutation.id!);
      } catch (err: unknown) {
        console.error(`Failed to process offline mutation: ${mutation.action}`, err);
        break;
      }
    }

    await pullData();

    const pendingActivities = await db.activities.where("syncStatus").equals("pending").toArray();
    for (const activity of pendingActivities) {
      try {
        const { id: _localId, syncStatus: _s, ...payload } = activity;
        await store.dispatch(activityApi.endpoints.createActivity.initiate(payload as Omit<ActivityRecord, 'id' | '_id' | 'syncStatus'>)).unwrap();
        if (activity.id) {
          await db.activities.update(activity.id, { syncStatus: "synced" });
        }
      } catch (err) {
        console.error("Failed to sync activity:", err);
      }
    }

  } finally {
    isProcessingMutations = false;
  }
}