import Dexie, { type Table } from "dexie";
import type { LocalTask, MutationRecord, ConflictRecord, ActivityRecord } from "../types/task";
import type { LocalBoard, BoardMutationRecord, IBoardMember } from "../types/board";

export class KanbanDB extends Dexie {
    tasks!: Table<LocalTask, string>;
    mutations!: Table<MutationRecord, number>;
    conflicts!: Table<ConflictRecord, number>;

    boards!: Table<LocalBoard, string>;
    boardMutations!: Table<BoardMutationRecord, number>;
    boardMembers!: Table<IBoardMember, string>;
    activities!: Table<ActivityRecord, number>;

    constructor() {
        super("KanbanDB");

        this.version(1).stores({
            tasks: "_id, status, position, syncStatus",
            mutations: "++id, action, taskId, timestamp",
        });

        this.version(2).stores({
            conflicts: "++id, taskId, resolvedAt",
        });

        this.version(3).stores({
            tasks: "_id, boardId, status, position, syncStatus",
            boards: "_id, syncStatus",
            boardMutations: "++id, action, boardId, timestamp",
        });

        this.version(4).stores({
            boardMembers: "_id, boardId, userId",
        });

        this.version(5).stores({
            tasks: "_id, boardId, status, position, syncStatus, *blockedBy",
        });

        this.version(6).stores({
            activities: "++id, _id, boardId, taskId, createdAt, syncStatus",
        });
    }
}

export const db = new KanbanDB();
