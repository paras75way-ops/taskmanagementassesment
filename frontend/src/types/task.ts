export type TaskStatus = "todo" | "inprogress" | "done";

export interface ITask {
    _id: string;
    title: string;
    description?: string;
    status: TaskStatus;
    position: number;
    targetDate?: string;
    blockedBy?: string[];
    userId: string;
    boardId: string;
    createdAt: string;
    updatedAt: string;
}

export interface LocalTask extends ITask {
    syncStatus: "synced" | "created" | "updated" | "deleted";
}

export interface CreateTaskInput {
    title: string;
    description?: string;
    status?: TaskStatus;
    position: number;
    targetDate?: string;
    blockedBy?: string[];
    boardId: string;
}

export type UpdateTaskInput = Partial<CreateTaskInput>;

export interface MutationRecord {
    id?: number;
    action: "create" | "update" | "delete";
    taskId: string;
    payload?: Partial<CreateTaskInput> & { boardId?: string };
    timestamp: number;
}

export interface ConflictRecord {
    id?: number;
    taskId: string;
    taskTitle: string;
    resolvedAt: number;
    message: string;
}

export type ActivityAction = "create" | "update" | "move" | "delete" | "dependency_add" | "dependency_remove";

export interface ActivityRecord {
    id?: number;
    _id?: string;
    boardId: string;
    taskId: string;
    taskTitle: string;
    action: ActivityAction;
    description: string;
    snapshot: Record<string, unknown>;
    userId: string;
    createdAt: string;
    syncStatus: "pending" | "synced";
}
