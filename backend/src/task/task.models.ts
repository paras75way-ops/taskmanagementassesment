import { Schema, model, Document } from 'mongoose';

export interface ITask extends Document {
  title: string;
  description?: string;
  status: 'todo' | 'inprogress' | 'done';
  position: number;
  targetDate?: string;
  blockedBy: string[];
  updatedAt: Date;
  createdAt: Date;
  userId: string;
  boardId: string;
}

const taskSchema = new Schema<ITask>(
  {
    title: { type: String, required: true },
    description: { type: String },
    status: { type: String, enum: ['todo', 'inprogress', 'done'], default: 'todo' },
    position: { type: Number, required: true },
    targetDate: { type: String },
    blockedBy: { type: [String], default: [] },
    userId: { type: String, required: true, index: true },
    boardId: { type: String, required: true, index: true },
  },
  { timestamps: true }
);

export const Task = model<ITask>('Task', taskSchema);