import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "./baseApi";
import type { IBoard, CreateBoardInput, UpdateBoardInput, IBoardMember } from "../../types/board";

export const boardApi = createApi({
    reducerPath: "boardApi",
    baseQuery: baseQueryWithReauth,
    tagTypes: ["Board"],
    endpoints: (builder) => ({
        getBoards: builder.query<IBoard[], void>({
            query: () => "/boards",
            providesTags: (result) =>
                result
                    ? [
                        ...result.map(({ _id }) => ({ type: "Board" as const, id: _id })),
                        { type: "Board", id: "LIST" },
                    ]
                    : [{ type: "Board", id: "LIST" }],
        }),

        createBoard: builder.mutation<IBoard, CreateBoardInput>({
            query: (body) => ({
                url: "/boards",
                method: "POST",
                body,
            }),
            invalidatesTags: [{ type: "Board", id: "LIST" }],
        }),

        updateBoard: builder.mutation<IBoard, { id: string; body: UpdateBoardInput }>({
            query: ({ id, body }) => ({
                url: `/boards/${id}`,
                method: "PATCH",
                body,
            }),
            async onQueryStarted({ id, body }, { dispatch, queryFulfilled }) {
                const patchResult = dispatch(
                    boardApi.util.updateQueryData("getBoards", undefined, (draft) => {
                        const board = draft.find((b) => b._id === id);
                        if (board) {
                            Object.assign(board, body);
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
                { type: "Board", id },
                { type: "Board", id: "LIST" },
            ],
        }),

        deleteBoard: builder.mutation<{ message: string }, string>({
            query: (id) => ({
                url: `/boards/${id}`,
                method: "DELETE",
            }),
            async onQueryStarted(id, { dispatch, queryFulfilled }) {
                const patchResult = dispatch(
                    boardApi.util.updateQueryData("getBoards", undefined, (draft) => {
                        const index = draft.findIndex((b) => b._id === id);
                        if (index !== -1) draft.splice(index, 1);
                    })
                );
                try {
                    await queryFulfilled;
                } catch {
                    patchResult.undo();
                }
            },
            invalidatesTags: [{ type: "Board", id: "LIST" }],
        }),

        getMembers: builder.query<IBoardMember[], string>({
            query: (boardId) => `/boards/${boardId}/members`,
            providesTags: (_result, _error, boardId) => [{ type: "Board", id: `MEMBERS-${boardId}` }],
        }),

        addMember: builder.mutation<IBoardMember, { boardId: string, email: string, role?: string }>({
            query: ({ boardId, email, role }) => ({
                url: `/boards/${boardId}/members`,
                method: 'POST',
                body: { email, role }
            }),
            invalidatesTags: (_r, _e, { boardId }) => [{ type: "Board", id: `MEMBERS-${boardId}` }]
        }),

        removeMember: builder.mutation<{ message: string }, { boardId: string, userId: string }>({
            query: ({ boardId, userId }) => ({
                url: `/boards/${boardId}/members/${userId}`,
                method: 'DELETE'
            }),
            invalidatesTags: (_r, _e, { boardId }) => [{ type: "Board", id: `MEMBERS-${boardId}` }]
        })
    }),
});

export const {
    useGetBoardsQuery,
    useCreateBoardMutation,
    useUpdateBoardMutation,
    useDeleteBoardMutation,
    useGetMembersQuery,
    useAddMemberMutation,
    useRemoveMemberMutation
} = boardApi;
