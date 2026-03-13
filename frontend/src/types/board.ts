export interface IBoard {
    _id: string;
    name: string;
    userId: string;
    myRole?: 'admin' | 'member';
    createdAt: string;
    updatedAt: string;
}

export interface IBoardMember {
    _id: string;
    boardId: string;
    userId: string;
    role: 'admin' | 'member';
    name?: string;
    email?: string;
    createdAt?: string;
}

export interface LocalBoard extends IBoard {
    syncStatus: "synced" | "created" | "updated" | "deleted";
}

export interface CreateBoardInput {
    name: string;
}

export type UpdateBoardInput = Partial<CreateBoardInput>;

export interface BoardMutationRecord {
    id?: number;
    action: "create" | "update" | "delete";
    boardId: string;
    payload?: Partial<CreateBoardInput>;
    timestamp: number;
}
