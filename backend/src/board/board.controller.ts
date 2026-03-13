import { Request, Response } from "express";
import { BoardService } from "./board.service";
import { TaskService } from "../task/task.service";
import { AuthRequest } from "../common/middleware/auth.middleware";
import { BoardInput } from "./board.types";
import { asyncHandler } from "../common/utils/asyncHandler";
import { AppError } from "../common/utils/AppError";
import User from "../auth/auth.models";

export const BoardController = {
  getBoards: asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as AuthRequest).user?.id;
    if (!userId) throw new AppError("Unauthorized", 401);

    const boards = await BoardService.findByUserId(userId);
    res.json(boards);
  }),

  createBoard: asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as AuthRequest).user?.id;
    if (!userId) throw new AppError("Unauthorized", 401);

    const body = req.body as BoardInput;
    const board = await BoardService.create(userId, body);
    res.status(201).json(board);
  }),

  updateBoard: asyncHandler(async (req: Request, res: Response) => {
    const boardId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const body = req.body as Partial<BoardInput>;

    const board = await BoardService.updateOne(boardId, body);
    if (!board) throw new AppError("Board not found", 404);
    res.json(board);
  }),

  deleteBoard: asyncHandler(async (req: Request, res: Response) => {
    const boardId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    const board = await BoardService.deleteOne(boardId);
    if (!board) throw new AppError("Board not found", 404);

    // Cascade delete tasks
    await TaskService.deleteByBoardId(boardId);

    res.json({ message: "Board and all its tasks deleted" });
  }),

  //Member endpoints 
  getMembers: asyncHandler(async (req: Request, res: Response) => {
    const boardId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const members = await BoardService.getMembers(boardId);

    // Populate user emails
    const userIds = members.map(m => m.userId);
    const users = await User.find({ _id: { $in: userIds } }, 'email name').lean().exec();

    const enrichedMembers = members.map(m => {
      const u = users.find(user => user._id.toString() === m.userId);
      return { ...m, email: u?.email, name: u?.name };
    });

    res.json(enrichedMembers);
  }),

  addMember: asyncHandler(async (req: Request, res: Response) => {
    const boardId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { email, role = 'member' } = req.body;

    if (!email) throw new AppError("Email is required", 400);

    const user = await User.findOne({ email }).exec();
    if (!user) throw new AppError("User not found", 404);

    const existingMember = await BoardService.getMembership(boardId, user._id.toString());
    if (existingMember) throw new AppError("User is already a member", 400);

    const member = await BoardService.addMember(boardId, user._id.toString(), role as 'admin' | 'member');
    res.status(201).json({ ...member.toObject(), email: user.email, name: user.name });
  }),

  removeMember: asyncHandler(async (req: Request, res: Response) => {
    const boardId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const targetUserId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;

    if (!targetUserId) throw new AppError("User ID is required", 400);

        const members = await BoardService.getMembers(boardId);
    const memberToRemove = members.find(m => m.userId === targetUserId);

    if (!memberToRemove) throw new AppError("User is not a member of this board", 404);

    if (memberToRemove.role === 'admin') {
      const adminCount = members.filter(m => m.role === 'admin').length;
      if (adminCount <= 1) {
        throw new AppError("Cannot remove the last admin from the board", 400);
      }
    }

    await BoardService.removeMember(boardId, targetUserId);
    res.json({ message: "Member removed successfully" });
  }),
};
