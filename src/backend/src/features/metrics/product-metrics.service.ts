import type { ProductEventName, User } from "../../domain/types.js";
import { AppError } from "../../shared/errors.js";
import type { ProductMetricsRepository } from "./product-metrics.repository.js";
import { getBusinessDate } from "../../shared/business-date.js";

export class ProductMetricsService {
  constructor(private readonly repository: ProductMetricsRepository) {}

  async record(
    user: User,
    input: {
      eventName: ProductEventName;
      childUserId?: string;
      entityType?: string;
      entityId?: string;
      metadata?: Record<string, unknown>;
    }
  ) {
    try {
      await this.repository.record({
        familyId: user.familyId,
        userId: user.id,
        ...input
      });
    } catch (error) {
      console.error("Failed to record product event", error);
    }
  }

  async getMvpSummary(parent: User, childUserId: string, days: number) {
    if (parent.role !== "parent") {
      throw new AppError(403, "FORBIDDEN", "Only parents can view MVP metrics");
    }

    const start = new Date();
    start.setUTCDate(start.getUTCDate() - days);
    const startTimestamp = start.toISOString().slice(0, 23).replace("T", " ");
    const startDate = subtractBusinessDays(getBusinessDate(), days - 1);
    const endDate = getBusinessDate();
    const counts = await this.repository.getSummary(
      parent.familyId,
      childUserId,
      startDate,
      endDate,
      startTimestamp
    );
    const dueTasks = Number(counts?.due_tasks ?? 0);
    const submittedTasks = Number(counts?.submitted_tasks ?? 0);
    const confirmedTasks = Number(counts?.confirmed_tasks ?? 0);
    const confirmedWithin24h = Number(counts?.confirmed_within_24h ?? 0);
    const resubmitRequests = Number(counts?.resubmit_requests ?? 0);
    const resubmittedTasks = Number(counts?.resubmitted_tasks ?? 0);

    return {
      days,
      counts: {
        createdTasks: Number(counts?.created_tasks ?? 0),
        taskCreationDays: Number(counts?.task_creation_days ?? 0),
        dueTasks,
        submittedTasks,
        confirmedTasks,
        confirmedWithin24h,
        resubmitRequests,
        resubmittedTasks,
        wishesCreated: Number(counts?.wishes_created ?? 0),
        wishesApproved: Number(counts?.wishes_approved ?? 0),
        wishesRejected: Number(counts?.wishes_rejected ?? 0),
        redeemRequested: Number(counts?.redeem_requested ?? 0),
        redeemConfirmed: Number(counts?.redeem_confirmed ?? 0),
        redeemRejected: Number(counts?.redeem_rejected ?? 0),
        wishesRedeemed: Number(counts?.wishes_redeemed ?? 0)
      },
      rates: {
        checkInCompletion: percentage(submittedTasks, dueTasks),
        confirmedWithin24h: percentage(confirmedWithin24h, submittedTasks),
        resubmitCompletion: percentage(resubmittedTasks, resubmitRequests)
      }
    };
  }
}

function percentage(numerator: number, denominator: number) {
  return denominator === 0 ? 0 : Math.round((numerator / denominator) * 1000) / 10;
}

function subtractBusinessDays(date: string, days: number) {
  const value = new Date(`${date}T00:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() - Math.max(0, days));
  return value.toISOString().slice(0, 10);
}
