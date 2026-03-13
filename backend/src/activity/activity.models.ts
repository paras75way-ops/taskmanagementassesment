import { Schema, model, Document } from 'mongoose';

export type ActivityAction = 'create' | 'update' | 'move' | 'delete' | 'dependency_add' | 'dependency_remove';

export interface IActivity extends Document {
    boardId: string;
    taskId: string;
    taskTitle: string;
    action: ActivityAction;
    description: string;
    snapshot: Record<string, unknown>;
    userId: string;
    createdAt: Date;
}

const activitySchema = new Schema<IActivity>(
    {
        boardId: { type: String, required: true, index: true },
        taskId: { type: String, required: true },
        taskTitle: { type: String, required: true },
        action: {
            type: String,
            enum: ['create', 'update', 'move', 'delete', 'dependency_add', 'dependency_remove'],
            required: true,
        },
        description: { type: String, required: true },
        snapshot: { type: Schema.Types.Mixed, default: {} },
        userId: { type: String, required: true },
    },
    { timestamps: true }
);

export const Activity = model<IActivity>('Activity', activitySchema);
