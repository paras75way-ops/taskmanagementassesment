import { Task } from './task.models';

export async function detectCycle(
    taskId: string,
    proposedBlockers: string[]
): Promise<boolean> {
    // Fetch all tasks that could be part of the graph (light projection)
    const allTasks = await Task.find({}, { _id: 1, blockedBy: 1 }).lean().exec();
    const blockedByMap = new Map<string, string[]>();
    for (const t of allTasks) {
        blockedByMap.set(t._id.toString(), (t.blockedBy ?? []) as string[]);
    }

    // For the task being edited, use the proposed blockers (not the old ones)
    blockedByMap.set(taskId, proposedBlockers);

    // BFS from taskId upward through blockedBy edges.
    // If we revisit taskId, there's a cycle.
    const visited = new Set<string>();
    const queue: string[] = [...proposedBlockers];

    while (queue.length > 0) {
        const current = queue.shift()!;
        if (current === taskId) return true; // cycle detected
        if (visited.has(current)) continue;
        visited.add(current);

        const parents = blockedByMap.get(current) ?? [];
        queue.push(...parents);
    }

    return false;
}
