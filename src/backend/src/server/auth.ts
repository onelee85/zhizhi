import { randomUUID } from "node:crypto";
import { AppError } from "../shared/errors.js";
import { db } from "./db.js";
import type { User, UserRole } from "../domain/types.js";

const sessions = new Map<string, string>();

export function login(username: string, password: string) {
  const user = db.users.find((candidate) => candidate.username === username);

  if (!user || user.password !== password) {
    throw new AppError(401, "INVALID_CREDENTIALS", "Invalid username or password");
  }

  const token = randomUUID();
  sessions.set(token, user.id);

  return {
    token,
    user: sanitizeUser(user)
  };
}

export function requireUser(authorization?: string): User {
  const token = authorization?.startsWith("Bearer ") ? authorization.slice("Bearer ".length) : "";
  const userId = sessions.get(token);

  if (!userId) {
    throw new AppError(401, "UNAUTHENTICATED", "Authentication is required");
  }

  const user = db.users.find((candidate) => candidate.id === userId);

  if (!user) {
    throw new AppError(401, "UNAUTHENTICATED", "Authentication is invalid");
  }

  return user;
}

export function requireRole(authorization: string | undefined, role: UserRole): User {
  const user = requireUser(authorization);

  if (user.role !== role) {
    throw new AppError(403, "FORBIDDEN", "Current user does not have permission");
  }

  return user;
}

export function sanitizeUser(user: User) {
  return {
    id: user.id,
    familyId: user.familyId,
    role: user.role,
    username: user.username,
    nickname: user.nickname
  };
}
