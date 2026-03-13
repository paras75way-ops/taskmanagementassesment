import { Task } from '../../../task/task.models';

export async function detectCycle(
    taskId: string,
    proposedBlockers: string[]
): Promise<boolean> {

    const allTasks = await Task.find({}, { _id: 1, blockedBy: 1 }).lean().exec();
    const blockedByMap = new Map<string, string[]>();
    for (const t of allTasks) {
        blockedByMap.set(t._id.toString(), (t.blockedBy ?? []) as string[]);
    }

    
    blockedByMap.set(taskId, proposedBlockers);

    // BFS from taskId upward through blockedBy edges.

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
