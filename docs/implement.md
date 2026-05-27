# 实施记录

## 2026-05-26

- 将登录方案明确为基于 MySQL 应用用户体系的用户名 + 密码登录。
- 更新 `AGENTS.md` 中孩子登录和家长操作认证规则，移除旧登录方案表述。
- 更新 `docs/prd.md` 中登录前置条件、第一阶段登录范围、用户表字段和推荐存储方案。
- 根据 `docs/prd.md` 完善 `docs/plan.md`、`docs/implement.md`、`docs/documentation.md`，形成 MVP 研发计划、实施基线和项目文档。
- 按阶段 1 创建前端项目骨架，代码放在 `src/frontend`。
- 前端使用 Next.js App Router、TypeScript、Tailwind CSS 和基础 UI 组件。
- 使用前端 mock 数据展示家长看板、创建任务页、任务详情页、孩子任务页、打卡页和提交结果页。
- 本轮未实现提交逻辑、后端 API、数据库、认证、真实图片上传和 AI 检查。
- 使用 `nvm use v22` 后通过 `pnpm install` 安装依赖，通过 `pnpm build` 完成生产构建验证。
- 已启动开发服务，访问地址为 `http://localhost:3000`。
- 新增 `src/frontend/README.md`，说明前端项目架构、技术栈版本、启动、打包、部署和页面验证方式。
- 按阶段 1 创建后端接口服务，代码放在 `src/backend`。
- 后端使用 TypeScript、Zod、原生 Node HTTP server、service + repository pattern。
- 当前后端使用内存数据实现登录、今日任务、创建任务、任务详情、编辑/删除未完成任务、孩子打卡提交、家长审核和今日看板接口。
- 本轮后端未接入 MySQL、Qiniu、Alibaba Bailian，也不做数据持久化。
- 使用 `nvm use v22` 后通过 `pnpm install` 安装依赖，通过 `pnpm build` 完成 TypeScript 构建验证。
- 已启动后端开发服务，访问地址为 `http://localhost:4000`。
- 完善 `src/backend/README.md`，补充后端项目架构、技术栈版本、启动、打包、部署、接口和验证说明。
- 后端新增 Swagger UI 和 OpenAPI JSON：`GET /docs`、`GET /openapi.json`。

## 2026-05-27

- 继续实现阶段 1 后端数据库对接。
- 新增 `src/backend/db/schema.sql`，包含 MySQL 建库、核心表结构和本地 Demo seed。
- 后端新增 `mysql2` 依赖，通过 `src/backend/src/server/db.ts` 创建 MySQL 连接池。
- 登录改为从 MySQL `user` 表读取应用用户，并使用 scrypt 密码哈希校验。
- 任务 repository 从内存数组改为 MySQL CRUD，覆盖今日任务、创建任务、任务详情、编辑、软删除、提交图片、家长审核等阶段 1 接口。
- 创建任务时新增同家庭孩子校验，避免家长给非本家庭孩子写入任务。
- 家长今日任务列表改为读取当前家庭当天全部任务，不再硬编码 `child-1`。
- 保留进程内存会话 token，服务重启后仍需重新登录；生产级会话持久化未实现。
- 使用 `nvm use v22` 后通过 `pnpm build` 完成后端 TypeScript 构建验证。
- 本轮未连接真实本地 MySQL 实例执行接口联调；`src/backend/db/schema.sql` 是完整初始化脚本，可运行 `mysql -h 127.0.0.1 -u root -p < db/schema.sql` 初始化数据库、表和 seed。
- 根据远程数据库执行反馈，将建库 collation 建议从 MySQL 8 专属的 `utf8mb4_0900_ai_ci` 改为兼容 MySQL 5.7/MariaDB 的 `utf8mb4_unicode_ci`。
- 根据项目初始化要求，保留 `src/backend/db/schema.sql` 中的 `CREATE DATABASE` 和 `USE`；图形 SQL 客户端需要用执行脚本或执行全部 SQL 模式运行。
- 远程 MySQL 初始化完成后，已启动后端服务并完成接口验证。
- 已验证 `GET /health`、`POST /auth/login`、`GET /auth/me`、`GET /tasks/today`、`GET /parent/dashboard`、`POST /tasks`、`GET /tasks/:taskId`、`POST /tasks/:taskId/submissions`、`POST /tasks/:taskId/reviews`。
- 已验证测试任务完整状态流转：`pending` -> `parent_review` -> `confirmed`。
- 已验证孩子账号调用家长创建任务接口会返回 `403 FORBIDDEN`。
- 修复本地 `pnpm dev` 不读取 `.env.local` 导致回退到 `root@localhost` 空密码的问题；新增后端 env loader，自动读取 `src/backend/.env.local` 和 `src/backend/.env`。
- 完成前端接入后端 API，新增同源代理路由 `src/frontend/app/api/backend/[...path]/route.ts`，默认转发到 `http://localhost:4000`，可用 `NEXT_PUBLIC_API_BASE_URL` 覆盖。
- 新增前端 API 客户端 `src/frontend/features/api/client.ts`，统一处理 Bearer Token、错误响应、登录、看板、任务、提交和审核接口。
- 登录页接入 `POST /auth/login`，登录成功后将 token 和用户信息存入浏览器 localStorage，并按角色跳转到家长端或孩子端。
- 家长今日看板接入 `GET /parent/dashboard` 和 `GET /tasks/today`，不再使用前端 mock 数据展示任务列表。
- 创建任务页接入 `POST /tasks`，孩子列表从家长看板接口读取，保存成功后进入任务详情。
- 家长任务详情页接入 `GET /tasks/:taskId` 和 `POST /tasks/:taskId/reviews`，支持确认通过和要求补充。
- 孩子今日任务页接入 `GET /tasks/today`，打卡页接入 `GET /tasks/:taskId` 和 `POST /tasks/:taskId/submissions`。
- Qiniu 未接入前，孩子打卡页按当前后端接口使用每行一个图片 URL 的方式提交 `imageUrls`。
- 前端通过 `pnpm typecheck` 和 `pnpm build` 验证；`pnpm build` 在沙箱内因 Turbopack 绑定端口限制失败，提权后构建成功。
- 联调发现当前后端 `GET /parent/dashboard` 实际返回 `summary + tasks`，已同步修正前端类型和 `docs/api.md`。
- 当前后端尚无家庭孩子列表接口，创建任务页阶段 1 使用 Demo seed 中的 `child-1` 作为默认孩子。

## 2026-05-27 (续)

- 实现前端任务编辑和删除功能。
- 新增 `updateTask` (PATCH) 和 `deleteTask` (DELETE) API 函数到 `src/frontend/features/api/client.ts`。
- 重构 `new-task-form.tsx` 为 `task-form.tsx`，导出 `TaskForm` 组件，支持创建和编辑两种模式。
- 编辑模式下隐藏孩子选择字段（`PATCH /tasks/:taskId` 不支持更新 childUserId），字段值从传入的 `task` 对象预填充。
- 新增编辑页面路由 `/parent/tasks/[taskId]/edit/page.tsx`（客户端组件），加载任务详情后传递给 `TaskForm`。
- `ParentTaskDetail` 增加编辑和删除按钮：仅对 `pending` 和 `needs_resubmit` 状态的任务显示，删除前弹出 `window.confirm` 确认。
- 家长今日看板任务列表增加删除按钮：仅对 `pending` 和 `needs_resubmit` 状态的任务显示，点击后本地删除并同步移除列表项。

## 2026-05-27 (续 2)

- 修复家长看板 `getParentDashboard` 只返回当天截止任务的 bug。
- 新增 `task.repository.ts` 的 `listFamilyTasks()` 方法（不含 `due_date` 过滤）。
- `getParentDashboard` 改为调用 `listFamilyTasks` 获取家庭全部任务，不再限于今日。
- 任务列表显示改为优先展示 `dueTime`，无具体时间时显示 `dueDate`，均无才显示"今日"。
- 更新 `docs/api.md` 中 `/parent/dashboard` 的描述。

## 当前状态

- 当前仓库已创建阶段 1 前端页面，并已接入本地后端 API。
- 前端应用位于 `src/frontend`。
- 当前仓库已创建阶段 1 后端接口服务，并已对接 MySQL repository。
- 后端应用位于 `src/backend`。
- `docs/prd.md` 是产品需求来源。
- `AGENTS.md` 是工程约束来源。
- 后续实现不得扩展 PRD 未定义的功能。

## 已确认技术决策

- 前端与后端框架：Next.js App Router + TypeScript。
- 数据库：MySQL。
- 登录：应用内用户体系，家长和孩子均使用用户名 + 密码。
- 图片存储：Qiniu Cloud Storage。
- AI 能力：Alibaba Bailian，多模态图片理解和文本生成。
- UI：Tailwind CSS + shadcn/ui。
- CI：GitHub Actions。

## 实施边界

- `src/frontend/app/` 只包含 routes、layouts、pages 和 route handlers。
- `src/frontend/features/` 放前端业务模块、API 客户端和任务类型。
- `src/frontend/components/ui/` 放可复用 UI 组件。
- `src/backend/src/features/` 放后端业务模块。
- `src/backend/src/server/` 放后端 MySQL 连接池、认证会话和密码校验基础设施。
- `src/backend/src/shared/` 放后端通用 HTTP、路由和错误处理。
- 页面文件不得直接放业务逻辑。
- 所有请求入参使用 Zod 校验。
- 业务模块使用 service + repository pattern。
- 所有数据库写入必须检查家庭权限。
- 所有 AI 输出必须保存 `raw_result`。

## 建议实施顺序

1. 接入 Qiniu 图片上传，保证提交图片可被家长查看。
2. 接入 Alibaba Bailian AI 检查，异步写入 AI 检查结果。
3. 实现错题记录和按科目查看。
4. 实现薄弱点统计和每周学习报告。
5. 补齐服务层单测、API 集成测试和核心 E2E 测试。

## 阶段 1 前端验证

前端说明文档：

- `src/frontend/README.md`

运行方式：

```bash
cd /Users/lijiao/Documents/AI/zhizhi/src/frontend
source ~/.nvm/nvm.sh
nvm use v22
pnpm install
pnpm dev
```

打包验证：

```bash
cd /Users/lijiao/Documents/AI/zhizhi/src/frontend
source ~/.nvm/nvm.sh
nvm use v22
pnpm build
```

页面验证：

- `http://localhost:3000`：首页和阶段说明。
- `http://localhost:3000/login`：用户名密码登录页。
- `http://localhost:3000/parent`：家长今日看板，需先用家长账号登录。
- `http://localhost:3000/parent/tasks/new`：创建任务表单，需先用家长账号登录。
- `http://localhost:3000/parent/tasks/<taskId>`：家长任务详情和审核页，需先用家长账号登录。
- `http://localhost:3000/child`：孩子今日任务页，需先用孩子账号登录。
- `http://localhost:3000/child/tasks/<taskId>/check-in`：孩子打卡页，需先用孩子账号登录。
- `http://localhost:3000/child/tasks/<taskId>/result`：提交结果页，需先用孩子账号登录。

## 阶段 1 后端接口验证

后端说明文档：

- `src/backend/README.md`

运行方式：

```bash
cd /Users/lijiao/Documents/AI/zhizhi/src/backend
source ~/.nvm/nvm.sh
nvm use v22
pnpm install
mysql -h 127.0.0.1 -u root -p < db/schema.sql
pnpm dev
```

打包验证：

```bash
cd /Users/lijiao/Documents/AI/zhizhi/src/backend
source ~/.nvm/nvm.sh
nvm use v22
pnpm build
```

服务地址：

- `http://localhost:4000`

测试账号：

- 家长：`parent_demo` / `password123`
- 孩子：`child_demo` / `password123`

已验证接口：

- `GET /health`
- `GET /docs`
- `GET /openapi.json`
- `POST /auth/login`
- `GET /tasks/today`
- `GET /parent/dashboard`
- `GET /tasks/:taskId`
- `POST /tasks/:taskId/submissions`
- `POST /tasks/:taskId/reviews`

## 核心模块清单

- 认证模块：用户名密码登录、退出、当前用户、角色判断。
- 家庭模块：家庭成员关系、家长和孩子绑定关系、权限校验。
- 任务模块：创建、编辑、删除未完成任务、今日任务查询、任务详情。
- 提交模块：孩子打卡、图片记录、补充上传、提交状态流转。
- 审核模块：家长确认通过、要求补充、标记 AI 不准确、备注。
- AI 检查模块：提交后触发检查、结果入库、失败兜底、原始结果保存。
- 错题模块：手动添加、AI 候选、按科目查看、掌握状态。
- 周报模块：周统计、薄弱点分析、AI 周报生成、历史报告查看。

## 状态流转约束

任务状态：

```text
待完成 -> 孩子已提交 -> AI 检查中 -> 待家长确认 -> 家长已确认
                                                -> 需补充 -> 孩子重新提交
```

提交状态：

```text
未提交 -> 已提交 -> AI 检查中 -> AI 检查完成 / AI 检查失败 -> 家长确认 / 需补充
```

## 测试要求

- Unit tests：覆盖 service 层核心业务规则。
- Integration tests：覆盖 API route 的请求校验、权限校验和状态变更。
- E2E tests：覆盖核心打卡链路。
- AI 测试使用模拟返回，覆盖完成、部分完成、疑似未完成、无法判断和失败。

## 未实现事项

- 阶段 1 前端页面已接入后端 API，仍保留未使用的早期 mock 数据文件供参考。
- 后端 MySQL schema 已创建，并已完成远程 MySQL 接口联调。
- 后端会话 token 仍使用进程内存保存，服务重启后需要重新登录。
- 图片上传仅接收 URL 形式的 `imageUrls`，未接入 Qiniu。
- AI、错题、周报代码均未实现。
- GitHub Actions 未配置。
