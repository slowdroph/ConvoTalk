import { Response } from "express";
import User from "../models/User";
import { AuthRequest } from "../middleware/auth";
import { handleError } from "../utils/errors";
import { escapeRegex } from "../utils/regex";

export async function searchUsers(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { q } = req.query as { q: string };

    const safe = escapeRegex(q.trim());
    const regex = new RegExp(safe, "i");

    const me = await User.findById(req.user!._id).select("blockedUsers").lean();

    const blocked = new Set(
      (me?.blockedUsers ?? []).map((id) => id.toString()),
    );

    const users = await User.find({
      _id: { $ne: req.user!._id },
      blockedUsers: { $ne: req.user!._id },
      $or: [{ name: regex }, { email: regex }],
    })
      .select("name email avatar")
      .limit(20)
      .lean();

    const result = users.filter((u) => !blocked.has(u._id.toString()));

    res.json(result);
  } catch (error) {
    handleError(error, res, "Erro ao buscar usuários.");
  }
}
