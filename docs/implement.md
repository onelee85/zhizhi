# 实施记录

## 2026-06-04

- 重新生成根目录 `README.md`，按当前项目状态更新项目定位、已实现范围、未实现边界、技术栈、目录结构、本地启动、数据库初始化、环境变量、常用命令、API 入口和核心工程规则。
- README 同步移除已过期的 Next.js 14、shadcn/ui、Qiniu/内存数据等旧描述，改为当前 Next.js 16、React 19、animal-island-ui、MySQL、本地照片上传、积分心愿、日历面板和历史任务归档说明。
- 本次仅更新项目文档，不涉及产品行为、接口路径、请求参数或响应结构；`docs/api.md` 和 `docs/prd.md` 无需更新。

## 2026-06-03

- 完成历史任务归档前端实现。
- 前端 API 客户端新增 `getHistoryTasks()`，接入 `GET /tasks/history`，并在 `StudyTask` 类型补充 `isArchived`、`confirmedAt` 和 `archivedAt` 元数据。
- 新增 `/parent/history` 和 `/child/history` 历史任务页，复用 `TaskHistoryList` 展示已归档任务；家长端支持按孩子、开始日期和结束日期筛选，孩子端支持按日期范围筛选。
- 家长任务清单页在日期 / 状态筛选区域旁新增【历史任务】入口；孩子任务清单页在任务日历入口附近新增【历史任务】入口。
- 历史任务列表只读展示，点击后分别进入家长任务详情或孩子提交结果页，并通过 `from=history` 返回历史任务页。
- 日历面板对已归档任务展示“已归档”标记，保持归档任务在月视图可见。
- 本轮未修改接口路径、请求参数或响应数据结构；`docs/api.md` 和 `docs/prd.md` 无需更新。
- 完成历史任务归档后端 API 第一轮实现。
- 新增 `GET /tasks/history`：家长返回当前家庭已归档任务，孩子只返回自己的已归档任务；支持 `childUserId`、`startDate`、`endDate` 查询参数。
- 归档按动态规则计算：任务状态为 `confirmed`，且最近一次家长 `pass` 审核时间超过 7 天；返回 `isArchived`、`confirmedAt` 和 `archivedAt` 元数据，不新增任务状态或积分流水。
- 家长普通看板和今日任务查询默认过滤已归档任务；日历月视图继续返回已归档任务并标记归档元数据。
- 后端新增 `TaskService` 归档单测，覆盖普通列表隐藏归档任务、历史列表返回归档任务、日历保留归档标记、孩子跨孩子访问拦截和家长跨家庭孩子筛选拦截。
- 已使用 Node v22 执行 `pnpm build` 和 `pnpm test`，后端构建通过，20 个 node:test 用例全部通过。
- 同步更新 `docs/api.md`、`docs/documentation.md` 和后端 OpenAPI 规范；本轮未修改 `docs/prd.md` 的产品行为定义。
- 此前需求梳理轮次确认新增“历史任务归档”需求：家长确认完成超过 7 天的 `confirmed` 任务自动进入历史任务。
- 明确归档只影响展示，不改变任务状态、积分流水、周报统计或审计口径；MVP 不支持手动提前归档、取消归档或批量归档。
- 明确普通家长任务列表和孩子任务列表默认隐藏已归档任务；家长端和孩子端均新增【历史任务】入口。
- 明确日历面板仍展示已归档任务，并用“已归档”标记区分。
- 明确历史任务列表和详情只读，保留任务、提交照片、AI 检查、家长确认和积分信息。
- 当时更新 `docs/prd.md`、`docs/documentation.md`、`docs/api.md` 和 `docs/plan.md`，补充历史任务归档规则、页面入口、验证范围和规划接口 `GET /tasks/history`。
- 该需求梳理轮次仅完善需求和文档，未修改前后端代码，未执行构建或测试。
- 支持同一 Wi-Fi 手机访问本地前端：前端 `pnpm dev` 和 `pnpm start` 默认使用 `next dev/start -H 0.0.0.0` 监听局域网入口。
- 前端 `next.config.mjs` 新增 `allowedDevOrigins`，允许 `192.168.*.*`、`10.*.*.*` 和 `172.*.*.*` 访问 Next dev 内部资源，修复手机通过局域网 IP 打开页面后客户端未 hydration、点击登录退化成原生 `/login?` 跳转的问题。
- 前端后端代理和图片代理新增服务端环境变量 `BACKEND_BASE_URL`，默认仍转发到 `http://localhost:4000`，避免把后端地址暴露给浏览器；旧 `NEXT_PUBLIC_API_BASE_URL` 保留兼容。
- 手机调试时访问 `http://<电脑局域网IP>:3000`，不要访问 `http://0.0.0.0:3000`；手机端 API 与图片请求保持同源代理，无需直接访问后端 `4000`。
- 前端提交图片展示会将历史 `localhost`、`127.0.0.1`、`0.0.0.0` 绝对地址归一化为当前访问域名，避免手机访问任务详情或提交结果时加载到手机自身的 localhost。
- 本轮未修改接口路径、请求参数或响应数据结构；`docs/api.md` 无需更新。
- 新增网络中断和临时连接异常的主动重试策略。
- 前端 API 客户端对 `GET`/`HEAD` 读取请求在网络异常或 `408`、`502`、`503`、`504` 响应时自动短退避重试，最多 3 次；写入类请求不自动重发，避免重复创建、提交或扣减积分。
- 前端同源后端代理对读取请求使用同样的临时故障重试策略；后端服务不可达时返回统一 `503 BACKEND_UNAVAILABLE` JSON 错误。
- 后端路由层对 `GET`/`HEAD` 请求遇到 MySQL/网络临时连接错误时自动短退避重试，最多 3 次；最终失败时返回 `503 TEMPORARY_CONNECTION_ERROR`。
- 新增 `src/backend/src/shared/retry.ts`，集中识别 `ECONNRESET`、`ECONNREFUSED`、`ETIMEDOUT`、`PROTOCOL_CONNECTION_LOST` 等临时连接错误。
- 本轮未修改接口路径、请求参数或响应数据结构；`docs/api.md` 无需更新。
- 前端 API 客户端将 `UNAUTHENTICATED`、`INVALID_CREDENTIALS` 和 `FORBIDDEN` 等鉴权错误映射为更友好的中文提示。
- 未登录或 token 失效访问受保护页面时，前端会清理本地会话，自动跳转到 `/login`，并在登录页展示“请先登录后再继续使用。”提示。
- 本次仅调整前端鉴权错误处理和登录页提示，不涉及接口路径、请求参数或响应数据结构；`docs/api.md` 无需更新。

## 2026-06-02

- 新增日历面板前端 E2E 测试 `tests/e2e/task/calendar.spec.ts`。
- 覆盖家长日历月视图、上月 / 下月切换、回到今天、按选中日期创建任务、编辑后回到日历同步展示、删除未完成任务后日历和任务列表同步移除。
- 覆盖孩子日历只读查看自己的月任务、无创建入口、点击待完成任务进入打卡页并保留“返回日历”来源。
- 本次仅新增前端测试用例，不涉及后端接口或产品行为变更，`docs/api.md` 和 `docs/prd.md` 无需更新。
- 优化孩子端 `/child/wishes` 我的心愿清单页面布局。
- 将“提交新心愿”入口改为紧凑横向快捷卡，避免被右侧积分流水区域拉高造成大块空白。
- 将心愿页主体调整为桌面两栏布局：左侧集中展示提交入口和心愿列表，右侧展示积分流水。
- 本次仅调整前端布局，不涉及后端接口变更，`docs/api.md` 无需更新。
- 修复孩子端从任务日历进入任务打卡页或提交结果页后返回目标错误的问题。
- 孩子任务日历点击任务时会透传 `from=calendar`，打卡页提交后也会保留来源进入结果页。
- 孩子打卡页和提交结果页顶部统一展示单个返回按钮，并根据来源返回 `/child/calendar` 或 `/child`。
- 本次未修改后端接口，`docs/api.md` 无需更新。
- 登录页移除“使用后端 MySQL 应用用户体系登录，家长和孩子会进入各自的任务工作台。”说明文案。
- 登录页调整为左侧 Demo 账号角色卡 + 右侧登录表单的卡片式布局，强化标题区、输入区和错误提示层次。
- 本次仅调整前端登录页 UI，不涉及后端接口变更，`docs/api.md` 无需更新。
- 登录表单标题区文案从 “Sign in / 进入学习打卡” 调整为 “准备出发 / 登上学习岛”，并改为浅绿色卡片背景。
- 登录按钮改为浅绿色样式，保持与登录标题区一致的视觉层级。

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
- 根据产品需求沟通结果，更新 `docs/prd.md`，在第一版 MVP 中加入愿望清单和积分兑换需求。
- 明确任务积分由家长在任务上设置，家长确认任务完成后才发放积分。
- 明确孩子提交愿望后，家长只能设置所需积分并通过，或驳回，不能修改孩子愿望原文。
- 明确孩子仅发起兑换申请，家长确认后才扣减积分并将愿望标记为已兑换。
- 明确第一版周报不展示积分、愿望和兑换数据。
- 同步更新 `docs/documentation.md` 的产品闭环、角色、页面、数据表、状态流转和当前未实现范围。
- 本次仅调整需求与项目文档，未改动前后端接口实现，`docs/api.md` 无需更新。
- 更新 `docs/plan.md`，将愿望清单与积分兑换规划放入阶段二，与 AI 完成度检查同阶段推进。
- 同步调整 `docs/prd.md` 中 MVP 开发计划和研发排期：阶段一保留任务打卡闭环，阶段二加入积分发放、愿望提交与兑换。
- 同步更新 `docs/documentation.md` 的 MVP 阶段计划说明。
- 根据最新阶段规划，更新 `docs/plan.md`，将 AI 完成度检查从阶段二移到阶段三。
- 阶段二调整为积分愿望激励，阶段三调整为 AI 完成度检查与错题记录。
- 同步更新 `docs/prd.md` 的 MVP 开发计划和研发排期，以及 `docs/documentation.md` 的 MVP 阶段计划说明。
- 完成阶段 2 积分愿望激励的前端接入。
- 前端 API client 新增积分账户、愿望列表、孩子提交愿望、家长通过/驳回愿望、孩子申请兑换和家长确认兑换方法。
- 前端任务类型补充 `rewardPoints`，创建/编辑任务表单新增奖励积分输入，家长和孩子任务列表、家长任务详情展示任务奖励积分。
- 新增孩子端 `/child/wishes` 心愿清单页：展示当前积分、积分流水、提交新心愿、查看心愿状态，并在积分足够时发起兑换申请。
- 新增家长端 `/parent/wishes` 愿望管理页：展示孩子积分、待设置积分/待确认兑换统计、积分流水，支持设置所需积分并通过、驳回愿望和确认兑换。
- 顶部导航、孩子任务页和家长任务管理页新增心愿单入口。
- 当前前端仍使用 Demo seed 中的 `child-1` 查询家长端孩子积分和愿望，待后续家庭孩子列表接口完成后替换为真实孩子选择。
- 本次未修改后端 API，`docs/api.md` 无需更新。
- 前端通过 `pnpm typecheck`；`pnpm build` 在沙箱内仍因 Turbopack 绑定端口限制失败，提权后构建通过。
- 孩子端提交心愿入口拆分为独立页面。
- 新增 `src/frontend/features/incentives/child-wish-create-form.tsx`，承载心愿标题、说明、提交与失败提示，提交成功后通过 `router.push` 跳转回 `/child/wishes`。
- 新增 `src/frontend/app/child/wishes/new/page.tsx` 路由，渲染 `ChildWishCreateForm`，遵循 `app/child/tasks/[taskId]/check-in` 的页面拆分模式。
- `ChildWishlist` 移除内联表单与提交流程，保留当前积分、积分流水、心愿列表和兑换申请；原“提交新心愿”卡片改为 `AppButtonLink` 跳转到 `/child/wishes/new`。
- 本次未修改后端 API，`docs/api.md` 无需更新；`docs/documentation.md` 同步新增页面说明。
- 被家长驳回的心愿支持孩子在孩子端修改或删除。
- 后端新增 `GET /wishes/:wishId`、`PATCH /wishes/:wishId` 和 `DELETE /wishes/:wishId` 三个心愿接口。
- `PATCH /wishes/:wishId` 仅 `rejected` 状态可调用，仅心愿所有者孩子可调用；保存后状态重置为 `pending_review`，并清空 `required_points`、`parent_user_id` 和 `reject_reason`。
- `DELETE /wishes/:wishId` 仅 `rejected` 状态可调用，仅心愿所有者孩子可调用；直接物理删除心愿记录。
- 新增 `IncentiveService.getWish / updateWish / deleteWish` 方法和对应 `IncentiveRepository` 方法；`IncentiveService` 单测覆盖正常修改/删除、跨孩子和跨状态拦截。
- `src/backend/src/features/incentives/incentive.schemas.ts` 新增 `updateWishSchema`，字段与 `createWishSchema` 一致。
- 前端 API 客户端新增 `getWish`、`updateWish` 和 `deleteWish` 方法。
- 新增 `src/frontend/features/incentives/child-wish-edit-form.tsx` 和 `src/frontend/app/child/wishes/[wishId]/edit/page.tsx`：复用 `/child/wishes/new` 表单结构，预填心愿标题、说明和驳回原因；保存成功后返回 `/child/wishes`。
- `ChildWishlist` 在状态为 `rejected` 的心愿上展示“修改心愿”和“删除心愿”操作；删除前打开 `AppConfirmModal` 确认，确认成功后从列表移除。
- 修复 `needPhoto=false` 任务仍强制要求至少 1 张图片的 bug。
- 后端 `submitTaskSchema` 将 `imageUrls` 改为可选且不再强制 `min(1)`；`TaskService.submitTask` 改为根据任务的 `needPhoto` 决定是否要求图片，`needPhoto=true` 但未提供图片时返回 `400 VALIDATION_ERROR`。
- 前端孩子打卡页 `CheckInForm` 在 `needPhoto=false` 时不再展示图片上传控件，改为提示“这个任务不需要上传图片”，提交逻辑仅在 `needPhoto=true` 时校验 `photos.length === 0`。
- 前端 API 客户端 `submitTask` 的 `imageUrls` 类型改为 `string[] | undefined`。
- 同步更新 `docs/api.md` 中 `/tasks/:taskId/submissions` 的字段说明与错误响应，更新 OpenAPI 规范。
- 美化页面顶部菜单 UI 和布局，并将“家长端 / 孩子端”文案统一改为“任务清单”。
- `HeaderNav` 改为带图标的圆角导航项胶囊（`icon-map` 任务清单 / `icon-shopping` 心愿单），激活态使用 `brand-mint` 高亮和内嵌阴影；用户身份区改为头像 + 昵称 + 角色副标题胶囊；退出登录按钮悬停态变为珊瑚色提示。
- 顶部 logo 升级为渐变方形徽标并带绿色状态点，brand 名称下方补充“家庭学习打卡”副标题，header 底部加一条 mint 色渐变高光分隔线。
- 未登录态顶部菜单将“家长端 / 孩子端”合并为单一“任务清单”入口指向 `/login`，登录入口保留 `bg-ink` 实心按钮。
- 本次仅调整顶部菜单 UI 和文案，后端接口无变化，`docs/api.md` 无需更新。
- 前端通过 `pnpm typecheck`；`pnpm build` 一次构建成功。
- 修复顶部菜单激活态匹配 bug：原 `match` 用 `path.startsWith("/child/")` 同时匹配 `/child/wishes`，导致进入心愿单页时“任务清单”仍被高亮。
- 改为"任务清单"匹配 `dashboardHref` 精确路径或子路径但排除 `wishlistHref` 子树；"心愿单"匹配 `wishlistHref` 精确路径或子路径。

## 2026-06-02

- 家长端新增“删除已兑换的心愿”功能。
- 后端 `DELETE /wishes/:wishId` 重构为按角色区分入口：孩子仍可删除自己被驳回的 `rejected` 心愿；家长可删除当前家庭内孩子的 `redeemed` 心愿；其它状态或跨家庭/跨孩子访问返回 `403 FORBIDDEN` 或 `409 WISH_NOT_DELETABLE`。
- `IncentiveService.deleteWish` 改为按 `user.role` 调度权限校验和状态校验；`IncentiveRepository.deleteWish` 新增 `requiredStatus` 入参，SQL 仅在指定状态匹配时物理删除。
- 后端路由从 `requireRole("child")` 改为 `requireUser`，由 service 决定角色权限，避免 `requireRole` 单一角色限制。
- 单元测试在原有 12 个 case 基础上新增 3 个 case：家长可删除 `redeemed` 心愿、家长删除非 `redeemed` 心愿被拒、家长跨家庭访问被拒；并将“孩子删除 `redeemed` 心愿被拒”补充为边界用例，合计 15 个 case 全部通过。
- 家长愿望管理页 (`/parent/wishes`) 在 `redeemed` 心愿上新增“删除心愿”按钮，点击后弹出 `AppConfirmModal`（danger 样式）确认；确认后调用现有 `DELETE /wishes/:wishId`，成功后从列表移除。
- 同步更新 `docs/api.md` 中 `DELETE /wishes/:wishId` 的角色语义、错误码和权限说明，以及 `src/backend/src/docs/openapi.ts` 中对应条目；`docs/documentation.md` 同步家长愿望管理页、后端接口表和核心页面说明。
- 根据新增产品需求更新 `docs/prd.md`，新增“日历面板”功能章节。
- 日历面板定义为现有任务系统的日历化展示与操作入口，不新增独立任务系统。
- 明确日历面板支持月视图、当前年月、上月 / 下月切换、回到今天、今日高亮、每日任务摘要、点击日期创建任务、点击任务查看详情和移动端基础适配。
- 明确家长可在日历中查看当前家庭孩子任务，并创建、编辑、删除未完成任务；孩子只能查看自己的任务，MVP 不允许创建、编辑或删除。
- 明确日历任务 CRUD 仍复用现有任务权限、状态流转和积分规则，积分只在家长审核通过后发放。
- 补充日历面板 MVP 范围、暂不纳入范围、交互说明、数据模型影响、验收标准和待确认问题。
- 同步更新 `docs/documentation.md` 的产品概览、当前未实现范围、核心页面和数据模型说明。
- 本次仅更新产品与项目文档，未实现前后端代码；后端 API 未变更，`docs/api.md` 无需更新。
- 更新 `docs/plan.md`，将阶段三从“AI 完成度检查与错题记录”调整为“日历面板”。
- `docs/plan.md` 阶段三补充月视图日历、上月 / 下月切换、回到今天、今日高亮、按日期创建任务、编辑任务、删除未完成任务、孩子只读和移动端基础适配。
- 将 `docs/plan.md` 中 AI 完成度检查、错题记录、薄弱点分析和周报顺延合并到阶段四。
- 同步更新 `docs/prd.md` 的 MVP 开发计划和研发排期，以及 `docs/documentation.md` 的 MVP 阶段计划说明。
- 本次仍仅更新文档，未实现前后端代码；后端 API 未变更，`docs/api.md` 无需更新。
- 完成阶段 3 日历面板的前后端基础实现。
- 后端新增 `GET /tasks/calendar?month=YYYY-MM`，使用 Zod 校验月份参数；家长返回当前家庭该月份全部任务，孩子只返回分配给自己的该月份任务。
- `TaskRepository` 新增按日期范围查询家庭任务和孩子任务的方法，`TaskService.listCalendarTasks` 负责角色隔离和提交信息补全。
- 将任务编辑/删除的业务规则统一为未完成任务（`pending`、`needs_resubmit`）可操作，修复前端已展示“需补充”可编辑/删除但后端拒绝的问题。
- 前端新增 `TaskCalendarPanel`，并新增 `/parent/calendar` 与 `/child/calendar` 路由。
- 日历面板采用类 Apple Calendar 月视图：桌面端为 7 列月历 + 右侧选中日期检查器，iPad 端保留 7 列月历并将选中日期任务区下移，使用 tap 选择日期、tap 任务进入详情、tap `+` 创建任务。
- 家长日历支持上月 / 下月、今天、今日高亮、日期任务摘要、点击日期创建任务、点击任务进入详情、在选中日期检查器编辑或删除未完成任务。
- 孩子日历只读展示自己的任务，点击任务按状态进入打卡页或结果页。
- 修复孩子从日历点击未来任务进入 404 的问题，恢复 `/child/tasks/[taskId]/check-in` 路由；未来任务可以查看详情，但不展示打卡提交表单，并提示“时间还没到哦”。
- 创建任务页支持从日历传入 `dueDate=YYYY-MM-DD`，表单默认截止日期即为所选日期。
- 顶部导航、家长任务管理页和孩子今日任务页新增日历入口。
- 同步更新 `docs/api.md`、`docs/documentation.md` 和 `docs/plan.md`。
- 优化首页主视觉文案和样式。
- 首页主标题从“每天的学习任务，变成一条清楚的完成线。”调整为“把今天的学习，走成一条看得见的成长小路。”，副文案改为更具画面感的任务脚印、家长回声和家庭学习地图表达。
- 首页首屏字体层级调整为更饱满的中文标题字重、正常字距和更舒展的说明文行高，右侧任务示意卡同步加入“今日第一站”“家长回声”等轻游戏化文案与任务线视觉。
- 本次仅调整首页展示文案和前端样式，后端接口无变化，`docs/api.md` 无需更新；产品流程无变化，`docs/prd.md` 无需更新。
- 移除家长任务管理页任务列表标题下方的“后端实时数据”说明文案。

## 当前状态

- 当前仓库已创建阶段 1-2 前端页面，并已接入本地后端 API。
- 前端应用位于 `src/frontend`。
- 当前仓库已创建阶段 1-2 后端接口服务，并已对接 MySQL repository。
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

## 阶段 2 后端接口实现

- `study_task` 新增 `reward_points`，家长创建或编辑未完成任务时可设置奖励积分。
- 新增 `child_point_account`、`point_ledger`、`wish` 表，支持积分账户、积分流水和愿望状态流转。
- 新增 `src/backend/db/migrations/20260601_phase2_incentives.sql`，用于已有本地库升级阶段 2 数据结构。
- 家长审核任务通过时按 `rewardPoints` 发放积分，使用 `point_ledger` 的来源唯一约束保证同一任务只发一次。
- 新增 `GET /points/account`，孩子查看自己的积分账户，家长按 `childUserId` 查看家庭内孩子积分账户和流水。
- 新增愿望接口：孩子提交愿望，家长设置所需积分并通过或驳回，孩子申请兑换，家长确认兑换后扣减积分并标记已兑换。
- 愿望兑换扣减积分使用事务和流水唯一约束，避免同一愿望重复扣减。
- 新增 `IncentiveService` 单测，覆盖积分账户权限、孩子跨账号访问拦截、积分不足兑换拦截和愿望审核不改原文。
- 已同步更新 `docs/api.md`、`docs/documentation.md` 和 OpenAPI 规范。

## 阶段 1-2 前端验证

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
- `http://localhost:3000/parent/wishes`：家长愿望管理页，需先用家长账号登录。
- `http://localhost:3000/parent/tasks/new`：创建任务表单，需先用家长账号登录。
- `http://localhost:3000/parent/tasks/<taskId>`：家长任务详情和审核页，需先用家长账号登录。
- `http://localhost:3000/child`：孩子今日任务页，需先用孩子账号登录。
- `http://localhost:3000/child/wishes`：孩子心愿清单页，需先用孩子账号登录。
- `http://localhost:3000/child/wishes/new`：孩子提交新心愿页，需先用孩子账号登录。
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
- `DELETE /wishes/:wishId`（孩子删除 `rejected` 心愿 / 家长删除 `redeemed` 心愿）

## 2026-06-01

- 使用 Playwright 连接 `http://localhost:3000/login` 完成前端登录功能验证。
- 已验证家长账号 `parent_demo` / `password123` 登录成功后跳转 `/parent`，浏览器 `localStorage` 写入 parent 用户信息和 auth token。
- 已验证孩子账号 `child_demo` / `password123` 登录成功后跳转 `/child`，浏览器 `localStorage` 写入 child 用户信息和 auth token。
- 已验证错误密码请求返回 `401`，页面保持在 `/login` 并展示后端错误信息 `Invalid username or password`。
- 本轮未修改前后端业务代码，后端接口无变化。
- 新增 Playwright Test E2E 用例 `tests/e2e/task/task-flow.spec.ts`，覆盖家长创建任务、孩子上传照片打卡、家长审核发放积分、孩子提交心愿、家长设置积分、孩子申请兑换和家长确认兑换。
- E2E 用例将登录、创建任务、上传照片、审核任务、心愿审批和兑换确认封装为 Page Object，选择器优先使用 `getByRole`、`getByLabel`、`getByText`，未使用 CSS class 选择器。
- 用例通过认证后的同源后端 API 校验任务状态、积分变化和心愿兑换状态，适合后续接入 CI 后作为回归测试。
- 在仓库根目录新增 `package.json`、`pnpm-lock.yaml` 和 `playwright.config.ts`，安装 `@playwright/test@1.58.0`，新增 `test:e2e` 脚本。
- 修复家长愿望管理页确认兑换后的前端运行时错误：`POST /wishes/:wishId/redeem-confirmations` 返回字段为 `ledger`，前端不再读取不存在的 `pointLedger`。
- 已通过 `src/frontend` 的 `pnpm typecheck`。
- 已执行 `PLAYWRIGHT_CHROMIUM_CHANNEL=chrome pnpm exec playwright test tests/e2e/task/task-flow.spec.ts --project=chromium`，结果 `1 passed`。
- `.gitignore` 新增 Playwright 本地报告产物 `test-results/` 和 `playwright-report/`。
- `.gitignore` 新增本地上传照片目录 `src/backend/storage/uploads/photos/`，避免测试和开发上传文件进入版本控制。

## 2026-06-02

- 已在后端 `IncentiveService` 单测中追加 3 个 case 并调整 1 个已有 case 的状态断言，覆盖家长删除 `redeemed` 心愿、家长删除非 `redeemed` 心愿被拒、家长跨家庭访问被拒和孩子删除 `redeemed` 心愿被拒；`pnpm test` 结果 `15 passed`。
- 后端已通过 `pnpm typecheck` 和 `pnpm build`。
- 前端已通过 `pnpm typecheck`；家长愿望管理页在 `redeemed` 心愿上展示"删除心愿"按钮并接入危险样式确认弹窗，删除成功后从列表移除。
- 登录页顶部未登录导航已移除，不再展示无实际作用的"任务清单"和"登录"入口；登录后的任务、日历、心愿单和退出导航保持不变。

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
