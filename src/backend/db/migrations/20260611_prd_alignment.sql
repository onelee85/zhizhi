use zhizhi;

set @schema_name = database();

update study_task
set status = 'parent_review'
where status in ('submitted', 'ai_checking');

set @task_note_exists = (
  select count(*)
  from information_schema.columns
  where table_schema = @schema_name
    and table_name = 'study_task'
    and column_name = 'note'
);
set @task_note_sql = if(
  @task_note_exists = 0,
  'alter table study_task add column note varchar(500) null after description',
  'select 1'
);
prepare task_note_stmt from @task_note_sql;
execute task_note_stmt;
deallocate prepare task_note_stmt;

alter table study_task
  modify column reward_points int not null default 1,
  modify column status enum('pending', 'parent_review', 'confirmed', 'needs_resubmit') not null default 'pending';

set @review_unique_exists = (
  select count(*)
  from information_schema.statistics
  where table_schema = @schema_name
    and table_name = 'parent_review'
    and index_name = 'uk_parent_review_submission'
);
set @review_unique_sql = if(
  @review_unique_exists = 0,
  'alter table parent_review add unique key uk_parent_review_submission (submission_id)',
  'select 1'
);
prepare review_unique_stmt from @review_unique_sql;
execute review_unique_stmt;
deallocate prepare review_unique_stmt;

create table if not exists wish_redeem_request (
  id varchar(64) primary key,
  wish_id varchar(64) not null,
  family_id varchar(64) not null,
  child_user_id varchar(64) not null,
  required_points int not null,
  status enum('pending', 'confirmed', 'rejected') not null default 'pending',
  reject_reason varchar(500) null,
  parent_user_id varchar(64) null,
  requested_at datetime(3) not null,
  resolved_at datetime(3) null,
  key idx_wish_redeem_request_wish (wish_id, requested_at),
  constraint fk_wish_redeem_request_wish foreign key (wish_id) references wish (id),
  constraint fk_wish_redeem_request_family foreign key (family_id) references family (id),
  constraint fk_wish_redeem_request_child foreign key (child_user_id) references `user` (id),
  constraint fk_wish_redeem_request_parent foreign key (parent_user_id) references `user` (id)
) engine = InnoDB;

insert ignore into wish_redeem_request (
  id, wish_id, family_id, child_user_id, required_points, status, requested_at
)
select
  current_redeem_request_id,
  id,
  family_id,
  child_user_id,
  required_points,
  'pending',
  updated_at
from wish
where status = 'redeem_requested'
  and current_redeem_request_id is not null
  and required_points is not null;

create table if not exists product_event (
  id varchar(64) primary key,
  family_id varchar(64) not null,
  user_id varchar(64) not null,
  child_user_id varchar(64) null,
  event_name varchar(64) not null,
  entity_type varchar(32) null,
  entity_id varchar(64) null,
  metadata_json json null,
  created_at datetime(3) not null,
  key idx_product_event_family_created (family_id, created_at),
  key idx_product_event_name_created (event_name, created_at),
  constraint fk_product_event_family foreign key (family_id) references family (id),
  constraint fk_product_event_user foreign key (user_id) references `user` (id),
  constraint fk_product_event_child foreign key (child_user_id) references `user` (id)
) engine = InnoDB;
