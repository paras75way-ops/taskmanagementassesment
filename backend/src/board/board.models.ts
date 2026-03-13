import { Schema, model, Document } from 'mongoose';

export interface IBoard extends Document {
  name: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

const boardSchema = new Schema<IBoard>(
  {
    name: { type: String, required: true },
    userId: { type: String, required: true, index: true },
  },
  { timestamps: true }
);

export const Board = model<IBoard>('Board', boardSchema);

export interface IBoardMember extends Document {
  boardId: string;
  userId: string;
  role: 'admin' | 'member';
  createdAt: Date;
  updatedAt: Date;
}

const boardMemberSchema = new Schema<IBoardMember>(
  {
    boardId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    role: { type: String, enum: ['admin', 'member'], required: true },
  },
  { timestamps: true }
);


boardMemberSchema.index({ boardId: 1, userId: 1 }, { unique: true });

export const BoardMember = model<IBoardMember>('BoardMember', boardMemberSchema);
