import { randomUUID } from "node:crypto";
import type { RowDataPacket } from "mysql2";
import { AppError } from "../shared/errors.js";
import type { User, UserRole } from "../domain/types.js";
import { pool } from "./db.js";
import { verifyPassword } from "./password.js";

type UserRow = RowDataPacket & {
  id: string;
  family_id: string;
  role: UserRole;
  username: string;
  password_hash: string;
  nickname: string;
};

const sessions = new Map<string, string>();

export async function login(username: string, password: string) {
  const user = await findUserByUsername(username);

  if (!user || !verifyPassword(password, user.passwordHash)) {
    throw new AppError(401, "INVALID_CREDENTIALS", "Invalid username or password");
  }

  const token = randomUUID();
  sessions.set(token, user.id);

  return {
    token,
    user: sanitizeUser(user)
  };
}

export async function requireUser(authorization?: string): Promise<User> {
  const token = authorization?.startsWith("Bearer ") ? authorization.slice("Bearer ".length) : "";
  const userId = sessions.get(token);

  if (!userId) {
    throw new AppError(401, "UNAUTHENTICATED", "Authentication is required");
  }

  const user = await findUserById(userId);

  if (!user) {
    sessions.delete(token);
    throw new AppError(401, "UNAUTHENTICATED", "Authentication is invalid");
  }

  return user;
}

export async function requireRole(authorization: string | undefined, role: UserRole): Promise<User> {
  const user = await requireUser(authorization);

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

async function findUserByUsername(username: string) {
  const [rows] = await pool.execute<UserRow[]>(
    `select id, family_id, role, username, password_hash, nickname
     from \`user\`
     where username = :username and deleted_at is null
     limit 1`,
    { username }
  );

  return rows[0] ? mapUser(rows[0]) : undefined;
}

async function findUserById(userId: string) {
  const [rows] = await pool.execute<UserRow[]>(
    `select id, family_id, role, username, password_hash, nickname
     from \`user\`
     where id = :userId and deleted_at is null
     limit 1`,
    { userId }
  );

  return rows[0] ? mapUser(rows[0]) : undefined;
}

function mapUser(row: UserRow): User {
  return {
    id: row.id,
    familyId: row.family_id,
    role: row.role,
    username: row.username,
    passwordHash: row.password_hash,
    nickname: row.nickname
  };
}
