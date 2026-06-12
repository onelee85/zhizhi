# 项目文档

## 项目概述

知知小助手是单家庭、单孩子的学习打卡与积分激励 MVP：

```text
家长创建任务 -> 孩子打卡 -> 家长人工确认 -> 发放积分 -> 孩子兑换心愿
```

当前版本包含任务、提交照片、人工审核、积分流水、心愿兑换、日历、历史归档和 14 天指标。不接入 AI、对象存储、多孩子、模板或周报。

## 技术栈

- Next.js App Router、React、TypeScript
- Node.js 原生 HTTP 服务
- MySQL、mysql2
- Zod
- animal-island-ui、Tailwind CSS
- Node test、Playwright Test、GitHub Actions

## 目录

- `src/frontend/app/`：路由、布局、页面和同源代理。
- `src/frontend/features/`：前端业务模块与 API 客户端。
- `src/frontend/components/ui/`：可复用 UI。
- `src/backend/src/features/`：service + repository 业务模块。
- `src/backend/src/server/`：数据库、认证、上传等基础设施。
- `src/backend/db/schema.sql`：全新数据库 schema 和 Demo seed。
- `src/backend/db/migrations/`：已有数据库兼容迁移。
- `tests/integration/`：真实 API 路由集成测试。
- `tests/e2e/`：Playwright 浏览器流程。

## 认证与家庭隔离

- 家长和孩子使用 MySQL 应用用户的用户名、密码登录。
- 浏览器将 Bearer token 保存在 `localStorage`；服务重启后需重新登录。
- 所有任务、提交、图片、审核、积分、心愿、兑换和日历数据均归属家庭。
- 家长写操作校验家长角色和家庭；孩子只能访问自己的家庭任务。
- `GET /family/context` 返回当前家庭及唯一孩子，前端不硬编码孩子 ID。
- 图片读取必须携带 token，并通过任务、家庭和孩子归属校验。

## 任务规则

- 主状态：`pending`、`parent_review`、`confirmed`、`needs_resubmit`。
- 默认积分 1，可设置为 0。
- 任务支持可选备注，不包含 AI 选项。
- `pending`、`needs_resubmit` 可编辑。
- 只有无提交记录的 `pending` 可删除。
- 提交、图片和状态更新在同一事务中。
- 审核、任务状态、提交状态和积分发放在同一事务中，并使用行锁。
- 同一提交最多一条家长审核；重复确认返回已有结果。
- 要求补充时必须填写原因。
- `isOverdue` 按 `Asia/Shanghai` 日期和截止时间计算。

任务详情返回全部 `submissions[]`。每次提交包含自己的图片、孩子备注和家长审核；`submission` 暂时保留为最新提交兼容字段。

## 图片与打卡

- 图片保存在 `src/backend/storage/uploads/photos/`。
- 支持 jpg、jpeg、png、webp，单张最大 5MB，最多 9 张。
- `needPhoto=false` 的任务允许零图片提交。
- 打卡页提供本地预览、单张上传状态、失败原因和单张重试。
- 前端通过 `/api/backend/uploads/photos/:fileName` 携带 token 获取 Blob，不暴露匿名图片 URL。

## 积分与心愿

- 家长确认任务通过是任务积分的唯一发放点。
- 同一任务积分流水通过唯一来源约束保持幂等。
- 心愿驳回必须填写原因。
- 孩子申请兑换时在事务中锁定账户、预扣积分并写入流水。
- `wish_redeem_request` 保存请求 ID、预扣积分、处理结果、原因和时间。
- 兑换拒绝必须填写原因，退款流水使用同一请求 ID。
- 已兑换心愿不可删除；孩子仅可删除自己的 `rejected` 心愿。
- 孩子端展示当前积分、所需积分、差额、进度、完整流水和最近退款原因。
- 孩子端心愿卡的积分进度区横跨卡片宽度，不受待兑换操作按钮占位影响。
- 孩子兑换申请成功后展示一次约 2.2 秒的无文案奖励特效，仅包含透明 WebP 礼盒插画、柔光和星光。
- 奖励特效不展示心愿名称、扣除积分、剩余积分或状态说明；兑换状态由心愿卡“待家长确认”标签表达。
- 特效支持点击背景、`Escape` 或自动关闭；系统减少动态效果时仅保留轻量淡入。
- 奖励音效由 Web Audio API 合成，不依赖外部音频文件；音效默认开启，孩子可静音，选择保存在当前设备的 `localStorage`。
- 音效开关使用整行胶囊按钮和不收缩的圆形状态图标，保持至少 44px 触控高度；开启与静音状态使用不同表面颜色，并保留键盘焦点反馈。
- 兑换失败、积分不足、重复操作、刷新页面和家长确认兑现不会触发奖励反馈；动效或音效失败不影响兑换结果。

## 页面

家长端：

- `/parent`：任务、孩子积分、待确认缩略图和 14 天指标。
- `/parent/tasks/new`：创建任务。
- `/parent/tasks/[taskId]`：提交时间线与审核。
- `/parent/calendar`：家庭月历。
- `/parent/history`：归档只读任务。
- `/parent/wishes`：愿望审核和兑换处理。

孩子端：

- `/child`：今日、逾期和已处理任务。
- `/child/tasks/[taskId]/check-in`：打卡与图片重试。
- `/child/tasks/[taskId]/result`：全部提交和反馈。
- `/child/calendar`：只读月历。
- `/child/history`：自己的归档任务。
- `/child/wishes`：积分、心愿进度和兑换结果。

## 数据库

全新 schema 只创建当前 MVP 所需表：

- `family`
- `user`
- `family_member`
- `study_task`
- `task_submission`
- `submission_image`
- `parent_review`
- `child_point_account`
- `point_ledger`
- `wish`
- `wish_redeem_request`
- `product_event`

已有数据库中的 AI、错题和周报表不做破坏性删除，但运行时和公开接口不再使用。

## 指标

家长看板和 `GET /metrics/mvp` 提供默认 14 天汇总：

- 任务创建数和创建天数
- 到期、提交、确认、24 小时确认
- 要求补充和再次提交
- 心愿创建、通过、驳回
- 兑换申请、确认、拒绝和兑现

## 验证

```bash
pnpm typecheck
pnpm build
pnpm test:unit
pnpm test:integration
pnpm test:e2e
```

GitHub Actions 使用 Node 22 和 MySQL 8 执行相同检查。OpenAPI 入口为 `/docs` 和 `/openapi.json`。
