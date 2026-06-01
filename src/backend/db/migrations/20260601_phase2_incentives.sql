use zhizhi;

set @schema_name = database();
set @reward_points_exists = (
  select count(*)
  from information_schema.columns
  where table_schema = @schema_name
    and table_name = 'study_task'
    and column_name = 'reward_points'
);
set @reward_points_sql = if(
  @reward_points_exists = 0,
  'alter table study_task add column reward_points int not null default 0 after need_ai_check',
  'select 1'
);
prepare reward_points_stmt from @reward_points_sql;
execute reward_points_stmt;
deallocate prepare reward_points_stmt;

create table if not exists child_point_account (
  id varchar(64) primary key,
  family_id varchar(64) not null,
  child_user_id varchar(64) not null,
  balance int not null default 0,
  total_earned int not null default 0,
  total_spent int not null default 0,
  created_at datetime(3) not null,
  updated_at datetime(3) not null,
  unique key uk_child_point_account_child (family_id, child_user_id),
  constraint fk_child_point_account_family foreign key (family_id) references family (id),
  constraint fk_child_point_account_child foreign key (child_user_id) references `user` (id)
) engine = InnoDB;

create table if not exists point_ledger (
  id varchar(64) primary key,
  family_id varchar(64) not null,
  child_user_id varchar(64) not null,
  change_amount int not null,
  balance_after int not null,
  reason enum('task_reward', 'wish_redeem') not null,
  source_type enum('task_review', 'wish') not null,
  source_id varchar(64) not null,
  operator_user_id varchar(64) not null,
  created_at datetime(3) not null,
  unique key uk_point_ledger_source (family_id, source_type, source_id),
  key idx_point_ledger_child_created (child_user_id, created_at),
  constraint fk_point_ledger_family foreign key (family_id) references family (id),
  constraint fk_point_ledger_child foreign key (child_user_id) references `user` (id),
  constraint fk_point_ledger_operator foreign key (operator_user_id) references `user` (id)
) engine = InnoDB;

create table if not exists wish (
  id varchar(64) primary key,
  family_id varchar(64) not null,
  child_user_id varchar(64) not null,
  title varchar(100) not null,
  description text null,
  required_points int null,
  status enum('pending_review', 'approved', 'rejected', 'redeem_requested', 'redeemed') not null default 'pending_review',
  parent_user_id varchar(64) null,
  reject_reason varchar(500) null,
  created_at datetime(3) not null,
  updated_at datetime(3) not null,
  redeemed_at datetime(3) null,
  key idx_wish_family_status (family_id, status),
  key idx_wish_child_status (child_user_id, status),
  constraint fk_wish_family foreign key (family_id) references family (id),
  constraint fk_wish_child foreign key (child_user_id) references `user` (id),
  constraint fk_wish_parent foreign key (parent_user_id) references `user` (id)
) engine = InnoDB;
