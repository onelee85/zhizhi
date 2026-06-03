# 项目文档

## 项目概述

知知小助手是面向家长和孩子的 AI 学习任务打卡工具。第一版 MVP 聚焦家庭学习管理闭环：

```text
家长布置任务 -> 孩子查看任务 -> 孩子拍照打卡 -> AI 检查 -> 家长查看并确认 -> 发放积分 -> 兑换心愿 -> 每周报告复盘
```

产品目标是帮助家长降低每日检查成本，帮助孩子明确每日任务，并通过日历面板、AI 检查、积分愿望激励和周报发现完成情况、错题和薄弱点。

## 技术栈

- Next.js App Router
- TypeScript
- 数据库使用 MySQL。
- 本地文件系统图片存储
- Alibaba Bailian
- Tailwind CSS
- shadcn/ui
- animal-island-ui
- GitHub Actions

## 认证与权限

- 家长和孩子都使用应用内用户体系登录。
- 登录方式为用户名 + 密码，用户信息存储在 MySQL 用户表中。
- 服务端保存密码哈希。
- 家长操作必须校验当前用户是已登录家长。
- 孩子操作必须校验当前用户是对应孩子。
- 所有家庭数据写入必须检查 family permission。
- 孩子数据只能被绑定家长查看。
- 不在客户端暴露数据库账号、数据库密码、Qiniu Secret、Bailian API Key 等敏感信息。

## 目录约定

- `src/frontend/`：阶段 1 前端应用目录。
- `src/frontend/app/`：只放路由、布局、页面和 route handlers。
- `src/frontend/features/`：放前端业务模块、API 客户端和任务类型。
- `src/frontend/components/ui/`：放可复用 UI 组件。
- `src/backend/`：阶段 1 后端接口服务目录。
- `src/backend/src/features/`：后端业务模块。
- `src/backend/src/server/`：后端 MySQL 连接池、认证会话、密码校验等基础设施。
- `src/backend/db/schema.sql`：后端 MySQL schema 和本地 Demo seed。
- `src/backend/src/shared/`：后端通用 HTTP、路由和错误处理。
- 页面组件只负责组合 UI 和调用接口，不直接写业务逻辑。

## 当前前端

阶段 1-3 已创建可运行的 Next.js 前端，并已接入本地后端 API。

当前前端 UI 已按 `src/frontend/DESIGN.md` 的视觉方向统一为 `animal-island-ui` 的温暖、圆润、轻游戏化风格。首页首屏使用“成长小路 / 任务脚印 / 家长回声 / 家庭学习地图”的文案方向，配合更饱满的中文标题字重、正常字距、柔和重点标记和任务线视觉，承接家庭学习打卡的产品定位。全局入口导入 `animal-island-ui/style`，业务页面优先通过 `src/frontend/components/ui/` 下的 `AppButton`、`AppCard`、`AppModal`、`AppTabs`、`AppSelect` 等本地封装使用组件库。

通用弹窗统一通过 `AppModal` 和 `AppConfirmModal` 封装。删除任务等确认类操作使用 `AppConfirmModal`，不再使用浏览器原生 `window.confirm`，以保持 animal-island 风格、加载态和移动端布局一致。

孩子端优先呈现“岛屿任务”体验：今日任务页使用任务视图 tabs 和任务编号卡片，打卡页保持单列表单流程，提交结果页通过弹窗展示 AI 检查状态或摘要。孩子心愿清单页展示当前积分、积分流水、提交心愿和申请兑换入口。

家长端保持轻量管理台风格：摘要卡、日期筛选、受控状态选择器和任务列表保持清晰可扫。家长愿望管理页展示孩子积分、愿望状态、待设置积分、驳回和兑换确认操作。

顶部菜单（`HeaderNav`）采用胶囊 + 图标的圆角布局：登录后展示“任务清单”（`icon-map`）、“日历”（`icon-map`）和“心愿单”（`icon-shopping`）导航项，激活态使用 `brand-mint` 高亮和内嵌阴影；右侧展示用户身份胶囊（头像首字母 + 昵称 + 角色副标题）和“退出登录”按钮。未登录态不展示导航入口，避免在登录页出现无实际作用的“任务清单”和“登录”菜单。顶部品牌区使用渐变徽标 + 绿色状态点 + “家庭学习打卡”副标题。顶部菜单将原文案“家长端 / 孩子端”统一为“任务清单”。

日历面板采用类 Apple Calendar 的月视图结构，并套入 `animal-island-ui` 的奶油纸面、圆角任务徽章和柔和底部阴影。桌面端为 7 列月历 + 右侧选中日期检查器：点击日期选中当天，点击日期格里的任务进入详情，点击 `+` 或检查器“创建”进入创建任务页并自动带入该日期。孩子点击未来任务时会进入任务查看页，但页面不展示打卡提交表单，并用亲切提示说明时间还未到。iPad 端保留完整 7 列月历，选中日期任务抽屉下移到月历下方，所有操作以 tap 为主，不依赖 hover；任务文本最多展示 3 条，超出以“还有 N 项”折叠，避免日期格拥挤。

前端专用说明文档位于 `src/frontend/README.md`，包含项目架构、依赖版本、启动、打包、部署和页面验证方式。

前端 E2E 测试位于 `tests/e2e`。任务主流程由 `tests/e2e/task/task-flow.spec.ts` 覆盖；日历面板由 `tests/e2e/task/calendar.spec.ts` 覆盖，包含家长月视图切换、按日期创建、编辑同步、删除同步，以及孩子只读日历、未来任务可查看但不能打卡提交。

已包含页面：

- `/`：首页和阶段说明。
- `/login`：用户名密码登录页，调用 `POST /auth/login`；页面展示家长和孩子 Demo 账号卡片，登录表单使用分区标题、统一输入控件和错误提示样式；未登录或 token 失效访问受保护页面时会自动跳转到该页，并展示中文提示。
- `/parent`：家长任务管理页，调用 `GET /parent/dashboard`，任务列表支持按截止日期和任务状态筛选，展示任务奖励积分，列表每项支持通过统一确认弹窗删除（`pending`/`needs_resubmit` 状态）。
- `/parent/calendar`：家长日历面板，调用 `GET /tasks/calendar?month=YYYY-MM`，支持月视图、上月/下月、今天、今日高亮、点击日期创建任务、点击任务详情、在选中日期检查器编辑或删除未完成任务。
- `/parent/wishes`：家长愿望管理页，调用 `GET /points/account`、`GET /wishes`、`PATCH /wishes/:wishId/approve`、`PATCH /wishes/:wishId/reject`、`POST /wishes/:wishId/redeem-confirmations` 和 `DELETE /wishes/:wishId`；已兑换的心愿支持"删除心愿"，删除前使用统一确认弹窗。
- `/parent/tasks/new`：创建任务表单，调用 `POST /tasks`，支持设置任务奖励积分；从日历进入时可通过 `dueDate=YYYY-MM-DD` 默认选中截止日期。
- `/parent/tasks/[taskId]`：家长任务详情和审核页，调用 `GET /tasks/:taskId` 和 `POST /tasks/:taskId/reviews`；仅在任务已有提交且处于 `submitted`、`ai_checking` 或 `parent_review` 状态时显示确认通过/要求补充，`pending`/`needs_resubmit` 状态显示编辑和删除按钮，删除前使用统一确认弹窗。
- `/parent/tasks/[taskId]/edit`：编辑任务表单，调用 `GET /tasks/:taskId` 预填并 `PATCH /tasks/:taskId` 保存，支持修改未完成任务的奖励积分。
- `/child`：孩子今日任务页，调用 `GET /tasks/today`；支持通过 tabs 切换今日、逾期和已完成三种筛选视图，复用 `includeOverdueIncomplete=true` 与 `includeCompleted=true` 请求参数取回完整筛选数据，并展示任务奖励积分。
- `/child/calendar`：孩子日历面板，调用 `GET /tasks/calendar?month=YYYY-MM`，只读展示分配给自己的月任务；点击任务进入打卡页或提交结果页，并通过 `from=calendar` 保持返回目标为日历面板。未来任务可打开查看，但不能提前提交打卡。
- `/child/wishes`：孩子心愿清单页，调用 `GET /points/account`、`GET /wishes` 和 `POST /wishes/:wishId/redeem-requests`；通过紧凑快捷入口跳转到 `/child/wishes/new` 提交心愿；被驳回的心愿提供"修改心愿"和"删除心愿"入口，删除前使用统一确认弹窗。
- `/child/wishes/new`：孩子提交新心愿页，调用 `POST /wishes`，提交成功后返回 `/child/wishes`。
- `/child/wishes/[wishId]/edit`：孩子修改被驳回的心愿页，调用 `GET /wishes/:wishId` 预填并 `PATCH /wishes/:wishId` 保存；保存成功后状态回到 `pending_review` 并清空所需积分、家长审核记录和驳回原因。
- `/child/tasks/[taskId]/check-in`：孩子打卡页，调用 `GET /tasks/:taskId` 和 `POST /tasks/:taskId/submissions`；顶部统一展示返回按钮，默认返回任务清单，从日历进入时返回日历。若任务截止日期晚于今天，仅展示任务详情和“时间还没到”的友好提示，不渲染提交表单。
- `/child/tasks/[taskId]/result`：提交结果页，调用 `GET /tasks/:taskId`，展示任务信息、提交状态、孩子备注和已上传图片，并通过弹窗展示 AI 检查状态或摘要；顶部返回按钮会根据来源返回任务清单或日历。

当前不包含：

- Alibaba Bailian AI 检查。

前端通过 `src/frontend/app/api/backend/[...path]/route.ts` 提供同源代理，默认转发到 `http://localhost:4000`，可通过服务端环境变量 `BACKEND_BASE_URL` 覆盖；旧的 `NEXT_PUBLIC_API_BASE_URL` 仍保留兼容。图片展示路径 `/uploads/photos/<filename>` 由 `src/frontend/app/uploads/photos/[filename]/route.ts` 代理到后端本地文件读取接口。

## 网络与重连策略

- 前端 API 客户端会对 `GET`/`HEAD` 读取请求自动尝试重连：网络异常或返回 `408`、`502`、`503`、`504` 时短退避重试，最多 3 次。
- 前端同源代理转发到后端时也会对读取请求执行同样的临时故障重试；如果后端仍不可达，返回 `503 BACKEND_UNAVAILABLE`，客户端继续按统一错误处理展示。
- 后端路由层会对 `GET`/`HEAD` 请求中的临时数据库/网络连接错误短退避重试，最多 3 次；最终失败返回 `503 TEMPORARY_CONNECTION_ERROR`。
- `POST`、`PATCH`、`DELETE` 等写入请求不默认自动重发，因为连接中断时无法可靠判断服务端是否已经完成写入，盲目重发可能造成重复任务、重复提交或重复积分流水。
- MySQL 连接池继续由 `mysql2` 维护，读取请求上的业务级重试用于覆盖断网、数据库重启、空闲连接失效等短暂异常。

当前后端尚无家庭孩子列表接口，创建任务页和家长愿望管理页阶段 2 使用 Demo seed 中的 `child-1` 作为默认孩子。

## 当前后端接口

阶段 1-3 已创建可运行的后端接口服务，当前已接入 MySQL repository。

后端专用说明文档位于 `src/backend/README.md`，包含项目架构、技术栈版本、运行方式、打包部署、测试账号和接口验证示例。

服务地址：

```text
http://localhost:4000
```

测试账号：

- 家长：`parent_demo` / `password123`
- 孩子：`child_demo` / `password123`

已包含接口：

| 方法 | 路径 | 说明 |
|---|---|---|
| `GET` | `/health` | 健康检查 |
| `GET` | `/docs` | Swagger UI |
| `GET` | `/openapi.json` | OpenAPI JSON |
| `POST` | `/uploads/photos` | 孩子上传本地打卡照片，`multipart/form-data` 字段为 `photo` |
| `GET` | `/uploads/photos/:fileName` | 读取本地上传照片 |
| `POST` | `/auth/login` | 用户名密码登录 |
| `GET` | `/auth/me` | 当前用户 |
| `GET` | `/parent/dashboard` | 家长看板（家庭全部任务） |
| `GET` | `/tasks/today` | 今日任务；孩子端可传 `includeOverdueIncomplete=true` 追加逾期未完成任务，或传 `includeCompleted=true` 追加已完成任务 |
| `GET` | `/tasks/calendar` | 月视图任务列表；家长返回家庭整月任务，孩子只返回自己的整月任务 |
| `POST` | `/tasks` | 家长创建任务 |
| `GET` | `/tasks/:taskId` | 任务详情 |
| `PATCH` | `/tasks/:taskId` | 家长编辑未完成任务 |
| `DELETE` | `/tasks/:taskId` | 家长删除未完成任务 |
| `POST` | `/tasks/:taskId/submissions` | 孩子提交打卡 |
| `POST` | `/tasks/:taskId/reviews` | 家长审核提交，审核通过时按任务积分幂等发放积分 |
| `GET` | `/points/account` | 获取孩子积分账户和积分流水 |
| `GET` | `/wishes` | 获取愿望列表 |
| `POST` | `/wishes` | 孩子提交愿望 |
| `GET` | `/wishes/:wishId` | 获取单个愿望 |
| `PATCH` | `/wishes/:wishId` | 孩子修改被驳回的心愿；保存后状态重置为 `pending_review` |
| `DELETE` | `/wishes/:wishId` | 孩子删除被驳回的心愿；家长删除已兑换的心愿；物理删除心愿记录 |
| `PATCH` | `/wishes/:wishId/approve` | 家长设置愿望所需积分并通过 |
| `PATCH` | `/wishes/:wishId/reject` | 家长驳回愿望 |
| `POST` | `/wishes/:wishId/redeem-requests` | 孩子申请兑换愿望 |
| `POST` | `/wishes/:wishId/redeem-confirmations` | 家长确认兑换并扣减积分 |

当前后端已包含：

- MySQL 连接池。
- 核心表 schema 和本地 Demo seed。
- 用户名密码登录的 MySQL 用户读取和 scrypt 密码哈希校验。
- 阶段 1 任务、提交、图片、审核接口的数据持久化。
- 阶段 2 任务奖励积分、积分账户/流水、愿望提交、愿望审核、兑换申请和家长确认兑换接口的数据持久化。
- 阶段 3 日历面板月视图任务查询接口。
- 本地照片上传和读取，图片保存到 `src/backend/storage/uploads/photos/`，数据库只保存 `/uploads/photos/<filename>` 相对路径。
- 远程 MySQL 接口验证已覆盖登录、今日任务、家长看板、创建任务、任务详情、孩子提交、家长审核和基础权限拦截。

当前后端不包含：

- Alibaba Bailian AI 检查。
- 错题记录。
- 周报生成。

后端 MySQL 默认环境变量：

| 环境变量 | 默认值 |
|---|---|
| `MYSQL_HOST` | `127.0.0.1` |
| `MYSQL_PORT` | `3306` |
| `MYSQL_DATABASE` | `zhizhi` |
| `MYSQL_ACCOUNT` | `root` |
| `MYSQL_PASSWORD` | 空字符串 |

本地开发时，后端会自动读取 `src/backend/.env.local` 和 `src/backend/.env`。已存在的 shell 环境变量优先级更高，不会被文件覆盖。

初始化本地数据库。`db/schema.sql` 是完整初始化脚本，包含创建数据库、切换数据库、建表和 Demo seed：

```bash
cd /Users/lijiao/Documents/AI/zhizhi/src/backend
mysql -h 127.0.0.1 -u root -p < db/schema.sql
```

如果使用图形 SQL 客户端，需要用“执行脚本/执行全部 SQL”的方式运行，不要只执行当前语句。

兼容性说明：`db/schema.sql` 使用 `utf8mb4_unicode_ci`，避免依赖 MySQL 8 专属的 `utf8mb4_0900_ai_ci`。

## 核心角色

- 家长：创建任务、设置任务积分、查看今日看板、查看图片和 AI 结果、确认通过或要求补充、处理孩子愿望和兑换申请、查看周报。
- 孩子：查看今日任务、完成任务后上传图片打卡、查看提交结果和补充要求、提交愿望、申请兑换心愿。
- AI 助手：检查上传内容是否匹配任务、判断完成度、识别异常、提取疑似错题、生成周报。

## 核心页面

家长端：

- 首页 / 今日看板：展示今日完成率、任务总览、异常提醒、待确认任务。
- 日历面板：按月查看每日任务，支持家长按日期创建、编辑和删除未完成任务。
- 创建任务页：填写科目、任务类型、标题、说明、截止时间、任务积分、拍照和 AI 检查选项。
- 任务详情页：查看任务信息、提交状态、上传图片、AI 结果、审核操作和错题入口。
- 愿望管理页：查看孩子积分、处理待设置积分愿望、驳回愿望、确认兑换申请，删除已兑换的心愿。
- 周报页：查看本周概览、科目分析、错题与薄弱点、AI 建议和历史报告。

孩子端：

- 今日任务页：展示今日任务清单、状态、完成进度和打卡入口。
- 日历面板：按月查看分配给自己的任务、任务日期、状态和积分，不支持创建、编辑或删除。
- 打卡提交页：展示任务要求，支持勾选完成、当任务需要拍照时上传图片、填写备注并提交；当任务不需要拍照时只展示说明和备注控件。
- 提交结果页：展示提交成功、AI 检查状态、家长确认状态和补充原因。
- 愿望清单页：查看当前积分、提交愿望、查看愿望状态、积分足够时申请兑换。

## 核心数据表

- `user`：应用用户，包含角色、用户名、密码哈希、昵称、头像、手机号。
- `family_member`：家庭关系，关联家庭、家长用户和孩子用户。
- `study_task`：学习任务，包含科目、任务类型、标题、说明、日期、截止时间、任务积分、状态。
- `task_submission`：任务提交，记录孩子备注、提交状态和提交时间。
- `submission_image`：提交图片，记录图片地址、缩略图、排序和上传状态。
- `ai_check_result`：AI 检查结果，记录匹配度、完成度、异常、建议、状态和 `raw_result`。
- `parent_review`：家长审核记录，记录通过、要求补充或标记 AI 不准确。
- `wrong_question`：错题记录，关联孩子、任务、提交、图片、知识点和掌握状态。
- `weekly_report`：周报，记录周统计、科目统计、薄弱点、AI 报告正文和下周建议。
- `child_point_account`：孩子积分账户，记录当前可用积分。
- `point_ledger`：积分流水，记录任务奖励和心愿兑换扣减。
- `wish`：愿望清单，记录孩子提交的愿望、家长设置的所需积分和兑换状态。

日历面板不新增独立数据表，复用 `study_task.due_date`、`due_time`、`reward_points`、`status`、`child_user_id` 和 `deleted_at` 等字段。已完成任务如需作废，PRD 建议后续补充作废字段，避免积分流水不一致。

## 任务与提交状态

任务状态：

```text
待完成 -> 孩子已提交 -> AI 检查中 -> 待家长确认 -> 家长已确认
                                                -> 需补充 -> 孩子重新提交
```

提交状态：

```text
未提交 -> 已提交 -> AI 检查中 -> AI 检查完成 / AI 检查失败 -> 家长确认 / 需补充
```

积分发放状态：

```text
任务提交 -> AI 检查 / 待家长确认 -> 家长确认完成 -> 发放任务积分 -> 记录积分流水
```

愿望状态：

```text
待家长设置积分 -> 可兑换 -> 兑换申请中 -> 已兑换
                 -> 已驳回
```

积分与愿望规则：

- 积分由家长在任务上设置，家长确认任务完成后才发放。
- 孩子提交愿望后，家长只能设置所需积分并通过，或驳回，不能修改孩子愿望原文。
- 孩子只是发起兑换申请，家长确认后才扣积分并标记已兑换。
- 第一版周报不展示积分和愿望数据。

## MVP 阶段计划

- 阶段一：任务打卡闭环，先跑通家长创建任务、孩子查看和上传打卡、家长看板与审核。
- 阶段二：积分愿望激励，加入任务积分发放、孩子提交愿望、家长设置愿望积分和确认兑换。
- 阶段三：日历面板，加入月视图日历、按日期查看任务、家长按日期创建 / 编辑 / 删除未完成任务、孩子只读查看自己的任务。
- 阶段四：AI 完成度检查、错题记录、薄弱点分析和周报。

## AI 检查

AI 检查输入：

- 任务标题
- 任务科目
- 任务类型
- 任务说明
- 上传图片
- 孩子备注

AI 检查输出：

- 内容匹配度
- 完成度
- 异常提示
- 疑似错题
- 简短结论
- 建议动作
- 原始返回 `raw_result`

可靠性原则：

- AI 结果只作为辅助，不替代家长最终判断。
- 无法判断时必须明确输出“无法判断”。
- AI 检查失败不能影响基础打卡流程。
- 家长必须能查看原始图片并覆盖 AI 判断。

## 周报

周报默认每周日晚上生成，内容包括：

- 本周任务数、完成数、完成率、需补充数、AI 异常数、错题数。
- 按科目统计任务数、完成率、错题数和风险提示。
- 执行情况分析，包括完成较好或较差的日期、容易拖延的任务类型。
- 薄弱点分析，包括高频错题知识点、不熟练题型和重复问题。
- 下周行动建议，建议必须基于本周真实数据。

第一版周报不展示积分、愿望和兑换数据。

## 非功能要求

- 今日任务列表加载时间不超过 2 秒。
- 图片上传后 3 秒内展示本地或云端预览。
- AI 检查异步执行，不阻塞孩子提交。
- AI 检查结果建议在 1 分钟内返回，复杂图片可延迟。
- 图片上传失败要支持重试。
- 周报生成失败要支持重新生成。
- 家长端必须始终可以查看原始上传内容。

## 测试策略

- Service 层单测：覆盖任务创建、提交、审核、AI 检查解析、错题、周报统计和权限校验。
- API 集成测试：覆盖请求校验、认证、家庭权限、状态流转和错误处理。
- E2E 测试：覆盖家长创建任务、孩子查看并打卡、AI 检查、家长确认、周报查看。

## MVP 验收标准

- 家长可以创建每日任务。
- 孩子可以查看任务并上传打卡。
- 家长可以查看今日完成情况。
- AI 可以生成完成度检查结果。
- 家长可以确认或要求补充。
- 系统可以基于一周数据生成报告。

## 本地运行与页面验证

前端运行目录：

```bash
cd /Users/lijiao/Documents/AI/zhizhi/src/frontend
```

安装依赖：

```bash
source ~/.nvm/nvm.sh
nvm use v22
pnpm install
```

启动开发服务：

```bash
pnpm dev
```

浏览器打开：

```text
http://localhost:3000
```

同一 Wi-Fi 手机调试：

- 前端 `pnpm dev` 和 `pnpm start` 默认监听 `0.0.0.0`。
- 手机不要访问 `http://0.0.0.0:3000`，应访问电脑局域网 IP，例如 `http://192.168.1.23:3000`。
- 手机只需要访问前端 `3000` 端口；API 和图片请求保持同源，由 Next 代理转发到本机后端 `http://localhost:4000`。
- Next.js dev 模式通过 `allowedDevOrigins` 允许常见局域网私有 IP 段访问内部开发资源；修改后需要重启前端开发服务。
- 如果手机无法打开页面，检查电脑和手机是否在同一 Wi-Fi、电脑防火墙是否允许局域网访问 `3000` 端口。

阶段 1 页面验证路径：

- 首页：`http://localhost:3000`
- 登录页：`http://localhost:3000/login`
- 家长看板：`http://localhost:3000/parent`
- 创建任务：`http://localhost:3000/parent/tasks/new`
- 家长任务详情：`http://localhost:3000/parent/tasks/<taskId>`
- 孩子今日任务：`http://localhost:3000/child`
- 孩子打卡页：`http://localhost:3000/child/tasks/<taskId>/check-in`
- 提交结果页：`http://localhost:3000/child/tasks/<taskId>/result`

生产构建验证：

```bash
pnpm build
```

Playwright 登录验证：

- 运行目标：`http://localhost:3000/login`
- 家长账号：`parent_demo` / `password123`，预期跳转 `/parent`。
- 孩子账号：`child_demo` / `password123`，预期跳转 `/child`。
- 错误密码：预期 `POST /api/backend/auth/login` 返回 `401`，页面停留 `/login` 并展示 `Invalid username or password`。
- 2026-06-01 已使用 Playwright + Chrome headless 完成上述三项验证。

Playwright E2E 回归用例：

- 用例文件：`tests/e2e/task/task-flow.spec.ts`
- 覆盖业务：家长创建任务 -> 孩子上传照片打卡 -> 家长审核通过并发放积分 -> 孩子提交心愿 -> 家长设置兑换积分 -> 孩子申请兑换 -> 家长确认兑换。
- 运行前需要前端 `http://localhost:3000` 和后端 `http://localhost:4000` 已启动；根目录已安装 `@playwright/test`。
- 可通过环境变量 `PLAYWRIGHT_BASE_URL` 覆盖前端地址，默认使用 `http://localhost:3000`。
- 本机可使用系统 Chrome channel 运行：

```bash
cd /Users/lijiao/Documents/AI/zhizhi
source ~/.nvm/nvm.sh
nvm use v22
PLAYWRIGHT_CHROMIUM_CHANNEL=chrome pnpm exec playwright test tests/e2e/task/task-flow.spec.ts --project=chromium
```

- 2026-06-01 已执行上述命令，结果 `1 passed`。

## 后端运行与接口验证

后端运行目录：

```bash
cd /Users/lijiao/Documents/AI/zhizhi/src/backend
```

安装依赖：

```bash
source ~/.nvm/nvm.sh
nvm use v22
pnpm install
```

启动开发服务：

```bash
pnpm dev
```

健康检查：

```bash
curl --noproxy '*' http://localhost:4000/health
```

Swagger UI：

```text
http://localhost:4000/docs
```

OpenAPI JSON：

```bash
curl --noproxy '*' http://localhost:4000/openapi.json
```

生产构建验证：

```bash
pnpm build
```
