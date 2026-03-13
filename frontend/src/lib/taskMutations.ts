import { db } from "./db";
import type { UpdateTaskInput, ActivityAction, ActivityRecord } from "../types/task";
import { processMutations } from "./sync";

export const triggerSyncIfOnline = () => {
    if (navigator.onLine) {
        processMutations().catch(console.error);
    }
};

export async function logActivity(
    boardId: string,
    taskId: string,
    taskTitle: string,
    action: ActivityAction,
    description: string,
    snapshot: Record<string, unknown>
): Promise<void> {
    const activity: ActivityRecord = {
        boardId,
        taskId,
        taskTitle,
        action,
        description,
        snapshot,
        userId: "local",
        createdAt: new Date().toISOString(),
        syncStatus: "pending",
    };

    await db.activities.add(activity);

    window.dispatchEvent(new CustomEvent('activityLogged', { detail: activity }));
}

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
        userId: "local",
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

    await logActivity(boardId, tempId, data.title, "create", `Created task "${data.title}"`, {});

    triggerSyncIfOnline();
    return tempId;
}

export async function queueTaskUpdate(taskId: string, payload: Partial<UpdateTaskInput> & { boardId?: string }): Promise<void> {
    const existingTask = await db.tasks.get(taskId);
    const snapshot = existingTask ? { ...existingTask } : {};

    await db.transaction("rw", db.tasks, db.mutations, async () => {
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

    if (existingTask) {
        let action: ActivityAction = "update";
        let description = `Updated task "${existingTask.title}"`;

        if (payload.status && payload.status !== existingTask.status) {
            action = "move";
            description = `Moved "${existingTask.title}" to ${payload.status}`;
        }

        await logActivity(
            payload.boardId || existingTask.boardId,
            taskId,
            existingTask.title,
            action,
            description,
            snapshot
        );
    }

    triggerSyncIfOnline();
}

export async function queueTaskDelete(taskId: string): Promise<void> {
    const task = await db.tasks.get(taskId);
    const snapshot = task ? { ...task } : {};

    await db.transaction('rw', db.tasks, db.mutations, async () => {
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

    if (task) {
        await logActivity(
            task.boardId,
            taskId,
            task.title,
            "delete",
            `Deleted task "${task.title}"`,
            snapshot
        );
    }

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

    const blockerTask = await db.tasks.get(blockerTaskId);
    const snapshot = { ...task };

    const currentBlockedBy = task.blockedBy ?? [];
    if (currentBlockedBy.includes(blockerTaskId)) return;

    const newBlockedBy = [...currentBlockedBy, blockerTaskId];

    const hasCycle = await detectCycleFrontend(taskId, newBlockedBy);
    if (hasCycle) {
        throw new Error("Circular dependency detected. This change would create a cycle.");
    }

    await queueTaskUpdate(taskId, { blockedBy: newBlockedBy });

    await logActivity(
        task.boardId,
        taskId,
        task.title,
        "dependency_add",
        `Added blocker "${blockerTask?.title || blockerTaskId}" to "${task.title}"`,
        snapshot
    );
}

export async function queueRemoveDependency(
    taskId: string,
    blockerTaskId: string
): Promise<void> {
    const task = await db.tasks.get(taskId);
    if (!task) return;

    const blockerTask = await db.tasks.get(blockerTaskId);
    const snapshot = { ...task };

    const currentBlockedBy = task.blockedBy ?? [];
    const newBlockedBy = currentBlockedBy.filter(id => id !== blockerTaskId);

    await queueTaskUpdate(taskId, { blockedBy: newBlockedBy });

    await logActivity(
        task.boardId,
        taskId,
        task.title,
        "dependency_remove",
        `Removed blocker "${blockerTask?.title || blockerTaskId}" from "${task.title}"`,
        snapshot
    );
}
