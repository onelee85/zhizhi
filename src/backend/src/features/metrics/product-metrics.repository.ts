import { randomUUID } from "node:crypto";
import type { RowDataPacket, ResultSetHeader } from "mysql2";
import type { DbPool } from "../../server/db.js";
import type { ProductEventName } from "../../domain/types.js";

type CountRow = RowDataPacket & {
  created_tasks: number;
  task_creation_days: number;
  due_tasks: number;
  submitted_tasks: number;
  confirmed_tasks: number;
  confirmed_within_24h: number;
  resubmit_requests: number;
  resubmitted_tasks: number;
  wishes_created: number;
  wishes_approved: number;
  wishes_rejected: number;
  redeem_requested: number;
  redeem_confirmed: number;
  redeem_rejected: number;
  wishes_redeemed: number;
};

export class ProductMetricsRepository {
  constructor(private readonly db: DbPool) {}

  async record(input: {
    familyId: string;
    userId: string;
    childUserId?: string;
    eventName: ProductEventName;
    entityType?: string;
    entityId?: string;
    metadata?: Record<string, unknown>;
  }) {
    await this.db.execute<ResultSetHeader>(
      `insert into product_event (
         id, family_id, user_id, child_user_id, event_name,
         entity_type, entity_id, metadata_json, created_at
       ) values (
         :id, :familyId, :userId, :childUserId, :eventName,
         :entityType, :entityId, :metadataJson, utc_timestamp(3)
       )`,
      {
        id: randomUUID(),
        familyId: input.familyId,
        userId: input.userId,
        childUserId: input.childUserId ?? null,
        eventName: input.eventName,
        entityType: input.entityType ?? null,
        entityId: input.entityId ?? null,
        metadataJson: input.metadata ? JSON.stringify(input.metadata) : null
      }
    );
  }

  async getSummary(
    familyId: string,
    childUserId: string,
    startDate: string,
    endDate: string,
    startTimestamp: string
  ) {
    const [rows] = await this.db.execute<CountRow[]>(
      `select
         (
           select count(*)
           from study_task st
           where st.family_id = :familyId
             and st.child_user_id = :childUserId
             and st.deleted_at is null
             and st.created_at >= :startTimestamp
         ) as created_tasks,
         (
           select count(distinct date(st.created_at))
           from study_task st
           where st.family_id = :familyId
             and st.child_user_id = :childUserId
             and st.deleted_at is null
             and st.created_at >= :startTimestamp
         ) as task_creation_days,
         (
           select count(*)
           from study_task st
           where st.family_id = :familyId
             and st.child_user_id = :childUserId
             and st.deleted_at is null
             and st.due_date >= :startDate
             and st.due_date <= :endDate
         ) as due_tasks,
         (
           select count(distinct ts.task_id)
           from task_submission ts
           join study_task st on st.id = ts.task_id
           where st.family_id = :familyId
             and st.child_user_id = :childUserId
             and ts.submitted_at >= :startTimestamp
         ) as submitted_tasks,
         (
           select count(distinct pr.task_id)
           from parent_review pr
           join study_task st on st.id = pr.task_id
           where st.family_id = :familyId
             and st.child_user_id = :childUserId
             and pr.review_result = 'pass'
             and pr.reviewed_at >= :startTimestamp
         ) as confirmed_tasks,
         (
           select count(distinct pr.task_id)
           from parent_review pr
           join task_submission ts on ts.id = pr.submission_id
           join study_task st on st.id = pr.task_id
           where st.family_id = :familyId
             and st.child_user_id = :childUserId
             and pr.review_result = 'pass'
             and pr.reviewed_at >= :startTimestamp
             and timestampdiff(hour, ts.submitted_at, pr.reviewed_at) <= 24
         ) as confirmed_within_24h,
         (
           select count(*)
           from parent_review pr
           join study_task st on st.id = pr.task_id
           where st.family_id = :familyId
             and st.child_user_id = :childUserId
             and pr.review_result = 'need_resubmit'
             and pr.reviewed_at >= :startTimestamp
         ) as resubmit_requests,
         (
           select count(*)
           from (
             select ts.task_id
             from task_submission ts
             join study_task st on st.id = ts.task_id
             where st.family_id = :familyId
               and st.child_user_id = :childUserId
               and ts.submitted_at >= :startTimestamp
             group by ts.task_id
             having count(*) > 1
           ) resubmitted
         ) as resubmitted_tasks,
         (
           select count(*)
           from wish w
           where w.family_id = :familyId
             and w.child_user_id = :childUserId
             and w.created_at >= :startTimestamp
         ) as wishes_created,
         (
           select count(*)
           from product_event pe
           where pe.family_id = :familyId
             and pe.child_user_id = :childUserId
             and pe.event_name = 'wish_approved'
             and pe.created_at >= :startTimestamp
         ) as wishes_approved,
         (
           select count(*)
           from product_event pe
           where pe.family_id = :familyId
             and pe.child_user_id = :childUserId
             and pe.event_name = 'wish_rejected'
             and pe.created_at >= :startTimestamp
         ) as wishes_rejected,
         (
           select count(*)
           from wish_redeem_request wrr
           where wrr.family_id = :familyId
             and wrr.child_user_id = :childUserId
             and wrr.requested_at >= :startTimestamp
         ) as redeem_requested,
         (
           select count(*)
           from wish_redeem_request wrr
           where wrr.family_id = :familyId
             and wrr.child_user_id = :childUserId
             and wrr.status = 'confirmed'
             and wrr.resolved_at >= :startTimestamp
         ) as redeem_confirmed,
         (
           select count(*)
           from wish_redeem_request wrr
           where wrr.family_id = :familyId
             and wrr.child_user_id = :childUserId
             and wrr.status = 'rejected'
             and wrr.resolved_at >= :startTimestamp
         ) as redeem_rejected,
         (
           select count(*)
           from wish w
           where w.family_id = :familyId
             and w.child_user_id = :childUserId
             and w.redeemed_at >= :startTimestamp
         ) as wishes_redeemed`,
      {
        familyId,
        childUserId,
        startDate,
        endDate,
        startTimestamp
      }
    );

    return rows[0];
  }
}
