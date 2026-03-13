import { db } from "./db";
import type { UpdateTaskInput } from "../types/task";
import { processMutations } from "./sync";

export const triggerSyncIfOnline = () => {
    if (navigator.onLine) {
        processMutations().catch(console.error);
    }
};

export async function queueTaskCreate(boardId: string, data: { title: string; description?: string; status?: "todo" | "inprogress" | "done"; position: number; targetDate?: string }): Promise<string> {
    const tempId = `temp_${Date.now()}`;
    const newTask = {
        _id: tempId,
        boardId,
        title: data.title,
        description: data.description,
        status: data.status || "todo",
        position: data.position,
        targetDate: data.targetDate,
        userId: "local", // will be overridden by server
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        syncStatus: "created" as const,
    };

    await db.transaction('rw', db.tasks, db.mutations, async () => {
        await db.tasks.put(newTask);
        await db.mutations.add({
            action: "create",
            taskId: tempId,
            payload: { ...data, boardId },
            timestamp: Date.now(),
        });
    });

    triggerSyncIfOnline();
    return tempId;
}

export async function queueTaskUpdate(taskId: string, payload: Partial<UpdateTaskInput> & { boardId?: string }): Promise<void> {
    await db.transaction("rw", db.tasks, db.mutations, async () => {
        const existingTask = await db.tasks.get(taskId);
        if (existingTask) {
            await db.tasks.update(taskId, {
                ...payload,
                syncStatus: existingTask.syncStatus === "created" ? "created" : "updated",
                updatedAt: new Date().toISOString(),
            });
        }
        await db.mutations.add({
            action: "update",
            taskId,
            payload,
            timestamp: Date.now(),
        });
    });

    triggerSyncIfOnline();
}

export async function queueTaskDelete(taskId: string): Promise<void> {
    await db.transaction('rw', db.tasks, db.mutations, async () => {
        const task = await db.tasks.get(taskId);

        const allTasks = await db.tasks.toArray();
        for (const t of allTasks) {
            if (t.blockedBy && t.blockedBy.includes(taskId)) {
                const updatedBlockedBy = t.blockedBy.filter(id => id !== taskId);
                await db.tasks.update(t._id, { blockedBy: updatedBlockedBy });
            }
        }

        if (task?.syncStatus === "created") {
            await db.tasks.delete(taskId);
            const pendingMutations = await db.mutations.where('taskId').equals(taskId).toArray();
            const mutationIds = pendingMutations.map(m => m.id!);
            await db.mutations.bulkDelete(mutationIds);
        } else {
            await db.tasks.update(taskId, { syncStatus: "deleted" });
            await db.mutations.add({
                action: "delete",
                taskId,
                timestamp: Date.now(),
            });
        }
    });

    triggerSyncIfOnline();
}

export async function detectCycleFrontend(
    taskId: string,
    proposedBlockers: string[]
): Promise<boolean> {
    const allTasks = await db.tasks.toArray();
    const blockedByMap = new Map<string, string[]>();
    for (const t of allTasks) {
        blockedByMap.set(t._id, t.blockedBy ?? []);
    }
    blockedByMap.set(taskId, proposedBlockers);

    const visited = new Set<string>();
    const queue = [...proposedBlockers];

    while (queue.length > 0) {
        const current = queue.shift()!;
        if (current === taskId) return true;
        if (visited.has(current)) continue;
        visited.add(current);
        const parents = blockedByMap.get(current) ?? [];
        queue.push(...parents);
    }
    return false;
}

export async function queueAddDependency(
    taskId: string,
    blockerTaskId: string
): Promise<void> {
    const task = await db.tasks.get(taskId);
    if (!task) return;

    const currentBlockedBy = task.blockedBy ?? [];
    if (currentBlockedBy.includes(blockerTaskId)) return;

    const newBlockedBy = [...currentBlockedBy, blockerTaskId];

    const hasCycle = await detectCycleFrontend(taskId, newBlockedBy);
    if (hasCycle) {
        throw new Error("Circular dependency detected. This change would create a cycle.");
    }

    await queueTaskUpdate(taskId, { blockedBy: newBlockedBy });
}

export async function queueRemoveDependency(
    taskId: string,
    blockerTaskId: string
): Promise<void> {
    const task = await db.tasks.get(taskId);
    if (!task) return;

    const currentBlockedBy = task.blockedBy ?? [];
    const newBlockedBy = currentBlockedBy.filter(id => id !== blockerTaskId);

    await queueTaskUpdate(taskId, { blockedBy: newBlockedBy });
}
