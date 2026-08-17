interface AdminTarget {
  createdBy?: unknown;
  admins?: Array<{ toString(): string }>;
}

export function isRoomCreator(
  room: AdminTarget,
  userId: string,
): boolean {
  return !!room.createdBy && room.createdBy.toString() === userId;
}

export function isRoomAdmin(room: AdminTarget, userId: string): boolean {
  return (room.admins ?? []).some((a) => a.toString() === userId);
}

export function isRoomCreatorOrAdmin(
  room: AdminTarget,
  userId: string,
): boolean {
  return isRoomCreator(room, userId) || isRoomAdmin(room, userId);
}