import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "./baseApi";
import type { ITask, CreateTaskInput, UpdateTaskInput } from "../../types/task";

export const taskApi = createApi({
    reducerPath: "taskApi",
    baseQuery: baseQueryWithReauth,
    tagTypes: ["Task"],
    endpoints: (builder) => ({
        getTasks: builder.query<ITask[], string>({
            query: (boardId) => `/tasks?boardId=${boardId}`,
            providesTags: (result) =>
                result
                    ? [
                        ...result.map(({ _id }) => ({ type: "Task" as const, id: _id })),
                        { type: "Task", id: "LIST" },
                    ]
                    : [{ type: "Task", id: "LIST" }],
        }),

        createTask: builder.mutation<ITask, CreateTaskInput>({
            query: (body) => ({
                url: "/tasks",
                method: "POST",
                body,
            }),
            invalidatesTags: [{ type: "Task", id: "LIST" }],
        }),

        updateTask: builder.mutation<ITask, { id: string; boardId: string; body: UpdateTaskInput }>({
            query: ({ id, body }) => ({
                url: `/tasks/${id}`,
                method: "PATCH",
                body,
            }),
            async onQueryStarted({ id, boardId, body }, { dispatch, queryFulfilled }) {
                const patchResult = dispatch(
                    taskApi.util.updateQueryData("getTasks", boardId, (draft) => {
                        const task = draft.find((t) => t._id === id);
                        if (task) {
                            Object.assign(task, body);
                        }
                    })
                );
                try {
                    await queryFulfilled;
                } catch {
                    patchResult.undo();
                }
            },
            invalidatesTags: (_result, _error, { id }) => [
                { type: "Task", id },
                { type: "Task", id: "LIST" },
            ],
        }),

        deleteTask: builder.mutation<{ message: string }, { id: string; boardId: string }>({
            query: ({ id }) => ({
                url: `/tasks/${id}`,
                method: "DELETE",
            }),
            async onQueryStarted({ id, boardId }, { dispatch, queryFulfilled }) {
                const patchResult = dispatch(
                    taskApi.util.updateQueryData("getTasks", boardId, (draft) => {
                        const index = draft.findIndex((t) => t._id === id);
                        if (index !== -1) draft.splice(index, 1);
                    })
                );
                try {
                    await queryFulfilled;
                } catch {
                    patchResult.undo();
                }
            },
            invalidatesTags: [{ type: "Task", id: "LIST" }],
        }),
    }),
});

export const {
    useGetTasksQuery,
    useCreateTaskMutation,
    useUpdateTaskMutation,
    useDeleteTaskMutation,
} = taskApi;
