import { AppError } from "../../shared/errors.js";
import type { User } from "../../domain/types.js";
import type { FamilyRepository } from "./family.repository.js";

export class FamilyService {
  constructor(private readonly repository: FamilyRepository) {}

  async getContext(user: User) {
    const context = await this.repository.getSingleChildContext(user.familyId);
    if (!context) {
      throw new AppError(409, "FAMILY_CONTEXT_INVALID", "Current family must have exactly one active child");
    }

    if (user.role === "child" && context.child.id !== user.id) {
      throw new AppError(403, "FORBIDDEN", "Child is outside current family context");
    }

    return context;
  }
}
