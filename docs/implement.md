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
- 孩子打卡页已改为本地照片上传：先调用 `POST /uploads/photos` 保存图片，再将返回的 `/uploads/photos/<filename>` 写入 `imageUrls` 提交。
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

## 2026-05-28

- 根据 `src/frontend/DESIGN.md` 美化前端 UI 和样式。
- 全局页面背景改为暖奶油画布，增加轻量网格纹理、柔和色块和聚焦态输入样式。
- 顶部导航更新为更贴近设计文档的圆角品牌标识、奶油半透明导航和登录/退出状态样式。
- 通用 `Button`、`ButtonLink`、`Card`、`CardTitle`、`Badge` 组件更新为 12px/24px 圆角、品牌色卡片和更清晰的信息层级。
- 首页重做为产品化首屏，加入彩色任务看板视觉片段和家长端/孩子端/当前边界三张品牌色功能卡。
- 登录页、家长看板、孩子任务页、任务表单、家长任务详情、孩子打卡页和提交结果页统一使用 `DESIGN.md` 中的奶油底、彩色标题区域和圆润表单控件。
- 本日早些时候的前端美化未修改后端接口；本次审核状态修复已同步更新 `docs/api.md`。
- 前端通过 `pnpm typecheck`；`pnpm build` 在沙箱内受 Turbopack 端口绑定限制失败，提权后构建通过。
- 已启动前端开发服务，访问地址为 `http://localhost:3000`。
- 修复家长任务详情页在孩子未提交时仍显示“确认通过/要求补充”的问题。
- 家长审核操作现在仅在任务已有提交且处于 `submitted`、`ai_checking` 或 `parent_review` 状态时展示。
- 后端 `POST /tasks/:taskId/reviews` 增加可审核状态校验；未提交任务调用审核接口返回 `409 TASK_NOT_REVIEWABLE`，提交缺失返回 `409 SUBMISSION_REQUIRED`。

## 2026-05-29

- 孩子端任务列表新增“显示逾期未完成”checkbox。
- `GET /tasks/today` 新增可选查询参数 `includeOverdueIncomplete=true`；孩子端传入后返回今日任务，以及截止日期早于今天且状态为 `pending` 或 `needs_resubmit` 的任务。
- 孩子任务列表对逾期未完成任务显示“逾期未完成”标签，并展示完整截止日期和时间。
- 更新 `docs/api.md` 和 `docs/documentation.md`，同步接口参数和孩子端页面行为。
- 孩子端任务列表新增“显示已完成”checkbox。
- `GET /tasks/today` 新增可选查询参数 `includeCompleted=true`；孩子端传入后返回今日任务，以及状态为 `submitted`、`ai_checking`、`parent_review` 或 `confirmed` 的已完成任务。
- 孩子端已提交/已确认任务的入口改为“查看结果”，避免进入打卡页重复提交。
- 照片上传从 URL 模拟/第三方存储预留改为服务端本地保存。
- 后端新增 `src/backend/src/server/uploads.ts`，提供 `saveUploadedFile`、`generateFileName`、`validateImageFile`、`deleteLocalFile` 和本地图片读取能力。
- 上传接口为 `POST /uploads/photos`，仅孩子账号可调用；请求使用 `multipart/form-data` 字段 `photo`，只允许 `jpg/jpeg/png/webp`，单张最大 5MB。
- 本地图片保存到 `src/backend/storage/uploads/photos/`（以后端进程工作目录为准），文件名格式为 `timestamp_random.ext`，例如 `1718000000000_a8f3d2c4b5e6.jpg`。
- 数据库 `submission_image.image_url` 和 `image_thumb_url` 只保存相对访问路径，例如 `/uploads/photos/1718000000000_a8f3d2c4b5e6.jpg`，不保存图片二进制。
- 前端新增 `/uploads/photos/[filename]` route handler，将数据库中的相对路径代理到后端本地图片读取接口；图片展示继续直接使用数据库路径。
- 同源后端代理改为使用 `arrayBuffer()` 转发非 GET/HEAD 请求体，支持 multipart 图片二进制。
- 家长删除任务时会尝试同步删除该任务历史提交关联的本地图片文件；当前业务规则仍只允许删除未提交的 `pending` 任务。
- 孩子端提交结果页补充展示任务标题、说明、科目类型、截止时间、提交时间、孩子备注、状态和已上传图片缩略图；图片直接使用数据库保存的 `/uploads/photos/<filename>` 路径展示。
- 家长端任务列表新增前端筛选条件：按截止日期 `dueDate` 精确筛选，按任务状态筛选；列表计数显示当前筛选结果数量和总任务数量，支持一键清空筛选。
- 基于 `animal-island-ui` 重构前端 UI，安装依赖 `animal-island-ui@0.9.6`，并在 Next.js 全局入口导入 `animal-island-ui/style`。
- 新增/重构 `src/frontend/components/ui/` 基础封装：`AppButton`、`AppCard`、`AppModal`、`AppTabs`、`AppSelect`，业务页面通过本地封装使用组件库，避免散落第三方组件调用。
- 孩子今日任务页改为“岛屿任务”风格，使用移动端优先 `max-w-lg` 布局、任务编号卡片、任务视图 tabs，并保留 `GET /tasks/today` 的现有筛选参数逻辑。
- 孩子今日任务页的任务视图 tabs 调整为“今日 / 逾期 / 已完成”三种筛选；前端一次取回今日、逾期未完成和已完成任务后按当前视图过滤展示。
- 本次孩子端筛选调整已通过 `source ~/.nvm/nvm.sh && nvm use v22 && pnpm typecheck`。
- 孩子打卡页改为温暖圆润的任务提交表单，保留完成勾选、图片类型/大小校验、上传和提交逻辑。
- 提交结果页新增 AI 检查结果弹窗，使用 `AppModal` 展示 `aiSummary` 或当前 AI 检查状态说明，不新增后端接口。
- 家长任务管理页改为轻量管理台样式，保留看板接口、日期筛选、状态筛选、删除和任务详情跳转逻辑；状态筛选改用受控 `AppSelect`。
- 更新 `src/frontend/DESIGN.md` 为 animal-island-ui 方向的前端设计说明。
- 前端通过 `pnpm typecheck`；`pnpm build` 在沙箱内因 Turbopack 处理 `animal-island-ui` CSS 时被端口绑定限制阻止，提权后构建通过。
- `pnpm lint` 当前仍因 Next 16 下 `next lint` 脚本被解析为项目目录 `lint` 而失败，需要后续改为 ESLint CLI。
- 已启动前端开发服务并验证 `/child`、`/parent`、`/child/tasks/demo/result` 返回 200，访问地址为 `http://localhost:3000`。

## 2026-06-01

- 优化前端删除确认弹窗，移除家长看板和家长任务详情中的 `window.confirm`。
- 新增通用 `AppConfirmModal`，基于 `AppModal` 和 `animal-island-ui` Modal 封装确认类弹窗，支持标题、描述、详情、确认/取消文案、loading 状态和危险操作样式。
- 家长看板任务列表删除按钮改为打开 `AppConfirmModal`，弹窗展示待删除任务标题，确认后调用现有 `DELETE /tasks/:taskId` 并从列表移除。
- 家长任务详情页删除按钮改为打开 `AppConfirmModal`，确认删除成功后继续跳转回 `/parent`。
- 全局 modal 样式补充 animal-island 风格的奶油底、柔和阴影、危险操作提示标记、响应式按钮布局。
- 本次仅调整前端交互和通用弹窗样式，后端接口无变化，`docs/api.md` 无需更新。
- 前端通过 `pnpm typecheck`；`pnpm build` 在沙箱内仍因 Turbopack 绑定端口限制失败，提权后构建通过。

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
- 图片存储：服务端本地文件系统，当前保存于 `src/backend/storage/uploads/photos/`，数据库仅保存 `/uploads/photos/<filename>`。
- AI 能力：Alibaba Bailian，多模态图片理解和文本生成。
- UI：Tailwind CSS + shadcn/ui + animal-island-ui。
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

1. 接入 Alibaba Bailian AI 检查，异步写入 AI 检查结果。
2. 实现错题记录和按科目查看。
3. 实现薄弱点统计和每周学习报告。
4. 补齐服务层单测、API 集成测试和核心 E2E 测试。

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
- 图片上传已接入本地文件保存；生产部署需要为 `src/backend/storage/uploads/photos/` 配置持久化磁盘或共享卷。
- AI、错题、周报代码均未实现。
- GitHub Actions 未配置。
