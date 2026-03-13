import { Activity, IActivity } from './activity.models';

export const ActivityService = {
    async create(data: Partial<IActivity>): Promise<IActivity> {
        return Activity.create(data);
    },

    async findByBoardId(boardId: string): Promise<IActivity[]> {
        return Activity.find({ boardId }).sort({ createdAt: -1 }).exec();
    },

    async deleteByBoardId(boardId: string): Promise<void> {
        await Activity.deleteMany({ boardId }).exec();
    },
};
