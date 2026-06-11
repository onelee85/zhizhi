create database if not exists zhizhi
  default character set utf8mb4
  default collate utf8mb4_unicode_ci;

use zhizhi;

create table if not exists family (
  id varchar(64) primary key,
  name varchar(100) not null,
  created_at datetime(3) not null,
  updated_at datetime(3) not null
) engine = InnoDB;

create table if not exists `user` (
  id varchar(64) primary key,
  family_id varchar(64) not null,
  role enum('parent', 'child') not null,
  username varchar(64) not null,
  password_hash varchar(255) not null,
  nickname varchar(100) not null,
  avatar_url varchar(500) null,
  phone varchar(32) null,
  created_at datetime(3) not null,
  updated_at datetime(3) not null,
  deleted_at datetime(3) null,
  unique key uk_user_username (username),
  key idx_user_family_role (family_id, role),
  constraint fk_user_family foreign key (family_id) references family (id)
) engine = InnoDB;

create table if not exists family_member (
  id varchar(64) primary key,
  family_id varchar(64) not null,
  parent_user_id varchar(64) not null,
  child_user_id varchar(64) not null,
  created_at datetime(3) not null,
  unique key uk_family_member_pair (family_id, parent_user_id, child_user_id),
  key idx_family_member_child (child_user_id),
  constraint fk_family_member_family foreign key (family_id) references family (id),
  constraint fk_family_member_parent foreign key (parent_user_id) references `user` (id),
  constraint fk_family_member_child foreign key (child_user_id) references `user` (id)
) engine = InnoDB;

create table if not exists study_task (
  id varchar(64) primary key,
  family_id varchar(64) not null,
  child_user_id varchar(64) not null,
  creator_user_id varchar(64) not null,
  subject enum('语文', '数学', '英语', '其他') not null,
  task_type enum('作业', '预习', '复习', '错题', '阅读', '背诵', '练习') not null,
  title varchar(100) not null,
  description varchar(1000) not null,
  note varchar(500) null,
  due_date date not null,
  due_time char(5) null,
  need_photo boolean not null default true,
  reward_points int not null default 1,
  status enum('pending', 'parent_review', 'confirmed', 'needs_resubmit') not null default 'pending',
  created_at datetime(3) not null,
  updated_at datetime(3) not null,
  deleted_at datetime(3) null,
  key idx_study_task_family_due (family_id, due_date),
  key idx_study_task_child_due (child_user_id, due_date),
  constraint fk_study_task_family foreign key (family_id) references family (id),
  constraint fk_study_task_child foreign key (child_user_id) references `user` (id),
  constraint fk_study_task_creator foreign key (creator_user_id) references `user` (id)
) engine = InnoDB;

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
  reason enum('task_reward', 'wish_redeem', 'wish_refund') not null,
  source_type enum('task_review', 'wish') not null,
  source_id varchar(64) not null,
  operator_user_id varchar(64) not null,
  created_at datetime(3) not null,
  unique key uk_point_ledger_source_reason (family_id, source_type, source_id, reason),
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
  current_redeem_request_id varchar(64) null,
  created_at datetime(3) not null,
  updated_at datetime(3) not null,
  redeemed_at datetime(3) null,
  key idx_wish_family_status (family_id, status),
  key idx_wish_child_status (child_user_id, status),
  constraint fk_wish_family foreign key (family_id) references family (id),
  constraint fk_wish_child foreign key (child_user_id) references `user` (id),
  constraint fk_wish_parent foreign key (parent_user_id) references `user` (id)
) engine = InnoDB;

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

create table if not exists task_submission (
  id varchar(64) primary key,
  task_id varchar(64) not null,
  child_user_id varchar(64) not null,
  status enum('submitted', 'parent_confirmed', 'needs_resubmit') not null,
  child_note varchar(500) null,
  submitted_at datetime(3) not null,
  created_at datetime(3) not null,
  updated_at datetime(3) not null,
  key idx_task_submission_task (task_id, submitted_at),
  constraint fk_task_submission_task foreign key (task_id) references study_task (id),
  constraint fk_task_submission_child foreign key (child_user_id) references `user` (id)
) engine = InnoDB;

create table if not exists submission_image (
  id varchar(64) primary key,
  submission_id varchar(64) not null,
  image_url varchar(1000) not null,
  image_thumb_url varchar(1000) null,
  sort_order int not null default 0,
  upload_status enum('uploaded') not null,
  created_at datetime(3) not null,
  key idx_submission_image_submission (submission_id, sort_order),
  constraint fk_submission_image_submission foreign key (submission_id) references task_submission (id)
) engine = InnoDB;

create table if not exists parent_review (
  id varchar(64) primary key,
  task_id varchar(64) not null,
  submission_id varchar(64) not null,
  parent_user_id varchar(64) not null,
  review_result enum('pass', 'need_resubmit') not null,
  comment varchar(500) null,
  reviewed_at datetime(3) not null,
  key idx_parent_review_task (task_id, reviewed_at),
  unique key uk_parent_review_submission (submission_id),
  constraint fk_parent_review_task foreign key (task_id) references study_task (id),
  constraint fk_parent_review_submission foreign key (submission_id) references task_submission (id),
  constraint fk_parent_review_parent foreign key (parent_user_id) references `user` (id)
) engine = InnoDB;

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

set @now = utc_timestamp(3);
set @password_hash = 'scrypt:zhizhi-demo-salt:de020e17045544921754a5419a8829a5ef07362f8ffdb17b785668674dfab5199352e3b665f3e91430482ec2cb139c992f19c2bd9e4e52a6776968e4d161c8ae';

insert into family (id, name, created_at, updated_at)
values ('family-1', 'Demo 家庭', @now, @now)
on duplicate key update name = values(name), updated_at = values(updated_at);

insert into `user` (id, family_id, role, username, password_hash, nickname, created_at, updated_at)
values
  ('parent-1', 'family-1', 'parent', 'parent_demo', @password_hash, '家长 Demo', @now, @now),
  ('child-1', 'family-1', 'child', 'child_demo', @password_hash, '孩子 Demo', @now, @now)
on duplicate key update
  family_id = values(family_id),
  role = values(role),
  password_hash = values(password_hash),
  nickname = values(nickname),
  updated_at = values(updated_at),
  deleted_at = null;

insert into family_member (id, family_id, parent_user_id, child_user_id, created_at)
values ('family-member-1', 'family-1', 'parent-1', 'child-1', @now)
on duplicate key update family_id = values(family_id);

insert into study_task (
  id, family_id, child_user_id, creator_user_id, subject, task_type,
  title, description, due_date, due_time, need_photo,
  reward_points, status, created_at, updated_at
) values
  (
    'task-math-1', 'family-1', 'child-1', 'parent-1', '数学', '练习',
    '完成数学计算练习第 3 页', '完成第 3 页全部计算题，订正错题并圈出不会的题。',
    current_date(), '20:30', true, 10, 'pending', @now, @now
  ),
  (
    'task-english-1', 'family-1', 'child-1', 'parent-1', '英语', '背诵',
    '默写 Unit 2 单词', '默写 Unit 2 重点单词 20 个，拍照上传默写纸。',
    current_date(), '21:00', true, 8, 'pending', @now, @now
  )
on duplicate key update
  due_date = values(due_date),
  due_time = values(due_time),
  reward_points = values(reward_points),
  status = values(status),
  updated_at = values(updated_at),
  deleted_at = null;

insert into child_point_account (
  id, family_id, child_user_id, balance, total_earned, total_spent, created_at, updated_at
) values (
  'point-account-child-1', 'family-1', 'child-1', 0, 0, 0, @now, @now
)
on duplicate key update updated_at = values(updated_at);
