export type TaskStatus = 'todo' | 'inprogress' | 'done';

export interface TaskInput {
  title: string;
  description?: string;
  status?: TaskStatus;
  position: number;
  targetDate?: string;
  blockedBy?: string[];
  boardId: string;
}