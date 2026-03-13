import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "./baseApi";
import type { ActivityRecord } from "../../types/task";

interface ServerActivity {
    _id: string;
    boardId: string;
    taskId: string;
    taskTitle: string;
    action: string;
    description: string;
    snapshot: Record<string, unknown>;
    userId: string;
    createdAt: string;
}

export const activityApi = createApi({
    reducerPath: "activityApi",
    baseQuery: baseQueryWithReauth,
    tagTypes: ["Activity"],
    endpoints: (builder) => ({
        getActivities: builder.query<ServerActivity[], string>({
            query: (boardId) => `/activities?boardId=${boardId}`,
            providesTags: (_result, _error, boardId) => [
                { type: "Activity", id: boardId },
            ],
        }),

        createActivity: builder.mutation<ServerActivity, Omit<ActivityRecord, "id" | "syncStatus">>({
            query: (body) => ({
                url: "/activities",
                method: "POST",
                body,
            }),
            invalidatesTags: (_result, _error, { boardId }) => [
                { type: "Activity", id: boardId },
            ],
        }),
    }),
});

export const {
    useGetActivitiesQuery,
    useCreateActivityMutation,
} = activityApi;
