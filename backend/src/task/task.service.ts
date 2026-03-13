import { Task } from './task.models';
import type { ITask } from './task.models';
import type { TaskInput } from './task.types';

export const TaskService = {
  async findByBoardId(boardId: string): Promise<ITask[]> {
    return Task.find({ boardId }).sort({ position: 1 }).exec();
  },

  async create(userId: string, input: TaskInput): Promise<ITask> {
    const task = new Task({ ...input, userId });
    await task.save();
    return task;
  },

  async updateOne(
    taskId: string,
    input: Partial<TaskInput>
  ): Promise<ITask | null> {
    return Task.findOneAndUpdate({ _id: taskId }, input, { returnDocument: "after" }).exec();
  },

  async deleteOne(taskId: string): Promise<ITask | null> {
    return Task.findOneAndDelete({ _id: taskId }).exec();
  },

  async deleteByBoardId(boardId: string): Promise<void> {
    await Task.deleteMany({ boardId }).exec();
  },

  async findBlockedTasks(taskId: string): Promise<ITask[]> {
    return Task.find({ blockedBy: taskId }).exec();
  },

  async removeBlockerFromAll(taskId: string): Promise<void> {
    await Task.updateMany(
      { blockedBy: taskId },
      { $pull: { blockedBy: taskId } }
    ).exec();
  }
};