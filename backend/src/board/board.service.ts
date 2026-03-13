
import { Board, BoardMember } from './board.models';
import type { IBoard, IBoardMember } from './board.models';
import type { BoardInput } from './board.types';

export const BoardService = {
  async findByUserId(userId: string): Promise<any[]> {
    const memberships = await BoardMember.find({ userId }).exec();
    const boardIds = memberships.map(m => m.boardId);

    const boards = await Board.find({ _id: { $in: boardIds } }).sort({ createdAt: 1 }).lean().exec();

    // Attach the user's role to each board
    return boards.map(board => {
      const membership = memberships.find(m => m.boardId === board._id.toString());
      return {
        ...board,
        myRole: membership?.role || 'member'
      };
    });
  },

  async findById(boardId: string, userId: string): Promise<any | null> {
    const membership = await BoardMember.findOne({ boardId, userId }).exec();
    if (!membership) return null;

    const board = await Board.findById(boardId).lean().exec();
    if (!board) return null;

    return { ...board, myRole: membership.role };
  },

  async create(userId: string, input: BoardInput): Promise<any> {
    const board = await Board.create({ ...input, userId });

    // Automatically add the creator as an admin
    await BoardMember.create({
      boardId: board._id.toString(),
      userId: userId,
      role: 'admin'
    });

    return { ...board.toObject(), myRole: 'admin' };
  },

  async updateOne(
    boardId: string,
    input: Partial<BoardInput>
  ): Promise<IBoard | null> {
    // Permission check is handled by middleware
    return Board.findOneAndUpdate({ _id: boardId }, input, { returnDocument: "after" }).lean().exec();
  },

  async deleteOne(boardId: string): Promise<IBoard | null> {
    // Permission check handled by middleware
    const board = await Board.findOneAndDelete({ _id: boardId }).exec();
    if (board) {
      await BoardMember.deleteMany({ boardId }).exec();
    }
    return board;
  },

  // --- Member Management ---
  async getMembers(boardId: string) {
    const members = await BoardMember.find({ boardId }).lean().exec();
    // Ideally we would populate or aggregate user details (name, email)
    return members;
  },

  async addMember(boardId: string, userId: string, role: 'admin' | 'member'): Promise<IBoardMember> {
    const member = new BoardMember({ boardId, userId, role });
    await member.save();
    return member;
  },

  async removeMember(boardId: string, userId: string): Promise<void> {
    await BoardMember.findOneAndDelete({ boardId, userId }).exec();
  },

  async getMembership(boardId: string, userId: string): Promise<IBoardMember | null> {
    return BoardMember.findOne({ boardId, userId }).exec();
  }
};
