use zhizhi;

set @schema_name = database();

alter table point_ledger
  modify column reason enum('task_reward', 'wish_redeem', 'wish_refund') not null;

set @new_ledger_index_exists = (
  select count(*)
  from information_schema.statistics
  where table_schema = @schema_name
    and table_name = 'point_ledger'
    and index_name = 'uk_point_ledger_source_reason'
);
set @add_new_ledger_index_sql = if(
  @new_ledger_index_exists = 0,
  'alter table point_ledger add unique key uk_point_ledger_source_reason (family_id, source_type, source_id, reason)',
  'select 1'
);
prepare add_new_ledger_index_stmt from @add_new_ledger_index_sql;
execute add_new_ledger_index_stmt;
deallocate prepare add_new_ledger_index_stmt;

set @old_ledger_index_exists = (
  select count(*)
  from information_schema.statistics
  where table_schema = @schema_name
    and table_name = 'point_ledger'
    and index_name = 'uk_point_ledger_source'
);
set @drop_old_ledger_index_sql = if(
  @old_ledger_index_exists > 0,
  'alter table point_ledger drop index uk_point_ledger_source',
  'select 1'
);
prepare drop_old_ledger_index_stmt from @drop_old_ledger_index_sql;
execute drop_old_ledger_index_stmt;
deallocate prepare drop_old_ledger_index_stmt;

set @redeem_request_id_exists = (
  select count(*)
  from information_schema.columns
  where table_schema = @schema_name
    and table_name = 'wish'
    and column_name = 'current_redeem_request_id'
);
set @add_redeem_request_id_sql = if(
  @redeem_request_id_exists = 0,
  'alter table wish add column current_redeem_request_id varchar(64) null after reject_reason',
  'select 1'
);
prepare add_redeem_request_id_stmt from @add_redeem_request_id_sql;
execute add_redeem_request_id_stmt;
deallocate prepare add_redeem_request_id_stmt;

update wish
set status = 'approved',
    current_redeem_request_id = null,
    updated_at = utc_timestamp(3)
where status = 'redeem_requested'
  and current_redeem_request_id is null;
