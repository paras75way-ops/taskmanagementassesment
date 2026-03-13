import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { ActivityRecord, UpdateTaskInput } from '../types/task';
import { db } from './db';
import {
    queueTaskUpdate,
    queueTaskDelete,
    queueAddDependency,
    queueRemoveDependency,
    triggerSyncIfOnline
} from './taskMutations';

const MAX_UNDO_STACK_SIZE = 5;

interface UndoContextType {
    undoStack: ActivityRecord[];
    pushUndo: (activity: ActivityRecord) => void;
    popUndo: () => Promise<void>;
    canUndo: boolean;
}

const UndoContext = createContext<UndoContextType | undefined>(undefined);

export function UndoProvider({ children }: { children: ReactNode }) {
    const [undoStack, setUndoStack] = useState<ActivityRecord[]>([]);

    const pushUndo = useCallback((activity: ActivityRecord) => {
        setUndoStack((prev) => {
            const newStack = [activity, ...prev];
            if (newStack.length > MAX_UNDO_STACK_SIZE) {
                return newStack.slice(0, MAX_UNDO_STACK_SIZE);
            }
            return newStack;
        });
    }, []);

    const popUndo = useCallback(async () => {
        if (undoStack.length === 0) return;

        const activityToUndo = undoStack[0];
        const remainingStack = undoStack.slice(1);

        try {
            switch (activityToUndo.action) {
                case "create": {
                    // Task was created -> Undo by deleting it
                    await queueTaskDelete(activityToUndo.taskId);
                    break;
                }
                case "delete": {
                    // Task was deleted -> Undo by recreating it from snapshot
                    const snap = activityToUndo.snapshot as any;
                    if (snap) {
                        // we need to somehow restore the EXACT same ID so it doesn't break relationships.
                        // queueTaskCreate generates a new ID. We must insert it directly to preserve the ID.
                        await db.transaction('rw', db.tasks, db.mutations, async () => {
                            const restoredTask = {
                                ...snap,
                                _id: activityToUndo.taskId,
                                syncStatus: "created" as const,
                                updatedAt: new Date().toISOString(),
                            };
                            await db.tasks.put(restoredTask);

                            // Rehydrate the create mutation for backend sync
                            await db.mutations.add({
                                action: "create",
                                taskId: activityToUndo.taskId,
                                payload: {
                                    title: snap.title,
                                    description: snap.description,
                                    status: snap.status,
                                    position: snap.position,
                                    targetDate: snap.targetDate,
                                    boardId: snap.boardId,
                                },
                                timestamp: Date.now(),
                            });
                        });
                        triggerSyncIfOnline();
                    }
                    break;
                }
                case "update":
                case "move": {
                    // Task was updated/moved -> Undo by restoring the snapshot state
                    const snap = activityToUndo.snapshot as any;
                    if (snap) {
                        const updateData: Partial<UpdateTaskInput> & { boardId?: string } = {
                            title: snap.title,
                            description: snap.description,
                            status: snap.status,
                            position: snap.position,
                            targetDate: snap.targetDate,
                            boardId: snap.boardId
                        };
                        await queueTaskUpdate(activityToUndo.taskId, updateData);
                    }
                    break;
                }
                case "dependency_add": {
                    // Blocker was added -> Undo by removing it
                    // The snapshot blockedBy had it without the new blocker, but queueRemoveDependency is cleaner
                    const currentTask = await db.tasks.get(activityToUndo.taskId);
                    if (currentTask) {
                        const snapBlockedBy = (activityToUndo.snapshot as any).blockedBy || [];
                        // Find what was added: current task's blockers minus snapshot blockers
                        const addedBlockers = (currentTask.blockedBy || []).filter(b => !snapBlockedBy.includes(b));

                        for (const b of addedBlockers) {
                            await queueRemoveDependency(activityToUndo.taskId, b);
                        }
                    }
                    break;
                }
                case "dependency_remove": {
                    // Blocker was removed -> Undo by adding it back
                    const currentTask = await db.tasks.get(activityToUndo.taskId);
                    if (currentTask) {
                        const snapBlockedBy = (activityToUndo.snapshot as any).blockedBy || [];
                        const removedBlockers = snapBlockedBy.filter((b: string) => !(currentTask.blockedBy || []).includes(b));

                        for (const b of removedBlockers) {
                            await queueAddDependency(activityToUndo.taskId, b);
                        }
                    }
                    break;
                }
            }

            // Delete the activity log entry from local DB if we undo'ed it immediately?
            // Actually, activity logs are immutable history, but we can optionally mark them as "undone" or just push a new activity. 
            // The prompt says "actions must be reversible", queue mutations will naturally log the reverse action as a NEW activity.

            setUndoStack(remainingStack);

        } catch (error) {
            console.error("Failed to undo action:", error);
            alert("Failed to undo action. The state might have changed.");
        }
    }, [undoStack]);

    React.useEffect(() => {
        const handleActivityLogged = ((e: CustomEvent<ActivityRecord>) => {
            pushUndo(e.detail);
        }) as EventListener;

        window.addEventListener('activityLogged', handleActivityLogged);
        return () => window.removeEventListener('activityLogged', handleActivityLogged);
    }, [pushUndo]);

    return (
        <UndoContext.Provider value={{ undoStack, pushUndo, popUndo, canUndo: undoStack.length > 0 }}>
            {children}
        </UndoContext.Provider>
    );
}

export function useUndo() {
    const context = useContext(UndoContext);
    if (context === undefined) {
        throw new Error('useUndo must be used within an UndoProvider');
    }
    return context;
}
