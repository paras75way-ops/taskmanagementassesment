import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useGetMembersQuery, useAddMemberMutation, useRemoveMemberMutation } from "../../store/api/boardApi";
import type { IBoardMember } from "../../types/board";
import toast from "react-hot-toast";
import { XIcon, DeleteActivityIcon } from "../../assets/icons";

const inviteSchema = z.object({
    email: z.string().email("Invalid email address"),
    role: z.enum(["admin", "member"])
});

type InviteFormData = z.infer<typeof inviteSchema>;

interface ShareBoardModalProps {
    boardId: string;
    onClose: () => void;
}

export default function ShareBoardModal({ boardId, onClose }: ShareBoardModalProps) {
    const { data: members, isLoading } = useGetMembersQuery(boardId);
    const [addMember, { isLoading: isInviting }] = useAddMemberMutation();
    const [removeMember] = useRemoveMemberMutation();

    const { register, handleSubmit, reset, formState: { errors } } = useForm<InviteFormData>({
        resolver: zodResolver(inviteSchema),
        defaultValues: { role: 'member' }
    });

    const onInvite = async (data: InviteFormData) => {
        try {
            await addMember({ boardId, ...data }).unwrap();
            reset();
        } catch (error: unknown) {
            toast.error((error as { data?: { message?: string } })?.data?.message || "Failed to invite user");
        }
    };

    const handleRemove = async (userId: string) => {
        if (!confirm("Remove this member from the board?")) return;
        try {
            await removeMember({ boardId, userId }).unwrap();
        } catch (error: unknown) {
            toast.error((error as { data?: { message?: string } })?.data?.message || "Failed to remove member");
        }
    };

    return (
        <div className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden flex flex-col border border-gray-200 dark:border-gray-700">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Share Board</h3>
                <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <XIcon className="w-5 h-5" />
                </button>
            </div>

            <div className="p-6">
                <form onSubmit={handleSubmit(onInvite)} className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Invite a new member
                    </label>
                    <div className="flex gap-2">
                        <div className="flex-1">
                            <input
                                {...register("email")}
                                type="email"
                                placeholder="Email address"
                                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                            {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
                        </div>
                        <select
                            {...register("role")}
                            className="w-28 px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        >
                            <option value="member">Member</option>
                            <option value="admin">Admin</option>
                        </select>
                        <button
                            type="submit"
                            disabled={isInviting}
                            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors whitespace-nowrap"
                        >
                            {isInviting ? "Sending..." : "Invite"}
                        </button>
                    </div>
                </form>

                <div className="h-px bg-gray-200 dark:bg-gray-700 my-6"></div>

                <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Current Members</h4>
                    {isLoading ? (
                        <p className="text-sm text-gray-500 text-center py-4">Loading members...</p>
                    ) : members?.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-4">No members found.</p>
                    ) : (
                        <ul className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                            {members?.map((member: IBoardMember) => (
                                <li key={member.userId} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/30">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-semibold text-sm">
                                            {member.name ? member.name.charAt(0).toUpperCase() : member.email?.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{member.name || "Unknown User"}</p>
                                            <p className="text-xs text-gray-500 truncate max-w-[180px]">{member.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${member.role === 'admin'
                                            ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                                            : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                                            }`}>
                                            {member.role === 'admin' ? 'Admin' : 'Member'}
                                        </span>
                                        <button
                                            onClick={() => handleRemove(member.userId)}
                                            className="text-gray-400 hover:text-red-600 transition-colors p-1"
                                            title="Remove member"
                                        >
                                            <DeleteActivityIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
}
