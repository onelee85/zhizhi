# 项目文档

## 项目概述

知知小助手是面向家长和孩子的 AI 学习任务打卡工具。第一版 MVP 聚焦家庭学习管理闭环：

```text
家长布置任务 -> 孩子查看任务 -> 孩子拍照打卡 -> AI 检查 -> 家长查看并确认 -> 每周报告复盘
```

产品目标是帮助家长降低每日检查成本，帮助孩子明确每日任务，并通过 AI 检查和周报发现完成情况、错题和薄弱点。

## 技术栈

- Next.js App Router
- TypeScript
- 数据库使用 MySQL。
- 本地文件系统图片存储
- Alibaba Bailian
- Tailwind CSS
- shadcn/ui
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

阶段 1 已创建可运行的 Next.js 前端，并已接入本地后端 API。

当前前端 UI 已按 `src/frontend/DESIGN.md` 的视觉方向统一：使用暖奶油画布、黑色主按钮、12px/24px 圆角控件、品牌色功能卡、彩色页面标题区和更明确的任务列表信息层级。

前端专用说明文档位于 `src/frontend/README.md`，包含项目架构、依赖版本、启动、打包、部署和页面验证方式。

已包含页面：

- `/`：首页和阶段说明。
- `/login`：用户名密码登录页，调用 `POST /auth/login`。
- `/parent`：家长今日看板，调用 `GET /parent/dashboard`，任务列表支持按截止日期和任务状态筛选，列表每项支持删除（`pending`/`needs_resubmit` 状态）。
- `/parent/tasks/new`：创建任务表单，调用 `POST /tasks`。
- `/parent/tasks/[taskId]`：家长任务详情和审核页，调用 `GET /tasks/:taskId` 和 `POST /tasks/:taskId/reviews`；仅在任务已有提交且处于 `submitted`、`ai_checking` 或 `parent_review` 状态时显示确认通过/要求补充，`pending`/`needs_resubmit` 状态显示编辑和删除按钮。
- `/parent/tasks/[taskId]/edit`：编辑任务表单，调用 `GET /tasks/:taskId` 预填并 `PATCH /tasks/:taskId` 保存。
- `/child`：孩子今日任务页，调用 `GET /tasks/today`；支持通过 checkbox 追加请求 `includeOverdueIncomplete=true` 显示逾期且仍为 `pending`/`needs_resubmit` 的未完成任务，也支持 `includeCompleted=true` 显示孩子已提交或已确认的完成任务。
- `/child/tasks/[taskId]/check-in`：孩子打卡页，调用 `GET /tasks/:taskId` 和 `POST /tasks/:taskId/submissions`。
- `/child/tasks/[taskId]/result`：提交结果页，调用 `GET /tasks/:taskId`，展示任务信息、提交状态、孩子备注和已上传图片。

当前不包含：

- Alibaba Bailian AI 检查。

前端通过 `src/frontend/app/api/backend/[...path]/route.ts` 提供同源代理，默认转发到 `http://localhost:4000`，可通过 `NEXT_PUBLIC_API_BASE_URL` 覆盖。图片展示路径 `/uploads/photos/<filename>` 由 `src/frontend/app/uploads/photos/[filename]/route.ts` 代理到后端本地文件读取接口。

当前后端尚无家庭孩子列表接口，创建任务页阶段 1 使用 Demo seed 中的 `child-1` 作为默认孩子。

## 当前后端接口

阶段 1 已创建可运行的后端接口服务，当前已接入 MySQL repository。

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
| `POST` | `/tasks` | 家长创建任务 |
| `GET` | `/tasks/:taskId` | 任务详情 |
| `PATCH` | `/tasks/:taskId` | 家长编辑未完成任务 |
| `DELETE` | `/tasks/:taskId` | 家长删除未完成任务 |
| `POST` | `/tasks/:taskId/submissions` | 孩子提交打卡 |
| `POST` | `/tasks/:taskId/reviews` | 家长审核提交，要求任务已有孩子提交且处于可审核状态 |

当前后端已包含：

- MySQL 连接池。
- 核心表 schema 和本地 Demo seed。
- 用户名密码登录的 MySQL 用户读取和 scrypt 密码哈希校验。
- 阶段 1 任务、提交、图片、审核接口的数据持久化。
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

- 家长：创建任务、查看今日看板、查看图片和 AI 结果、确认通过或要求补充、查看周报。
- 孩子：查看今日任务、完成任务后上传图片打卡、查看提交结果和补充要求。
- AI 助手：检查上传内容是否匹配任务、判断完成度、识别异常、提取疑似错题、生成周报。

## 核心页面

家长端：

- 首页 / 今日看板：展示今日完成率、任务总览、异常提醒、待确认任务。
- 创建任务页：填写科目、任务类型、标题、说明、截止时间、拍照和 AI 检查选项。
- 任务详情页：查看任务信息、提交状态、上传图片、AI 结果、审核操作和错题入口。
- 周报页：查看本周概览、科目分析、错题与薄弱点、AI 建议和历史报告。

孩子端：

- 今日任务页：展示今日任务清单、状态、完成进度和打卡入口。
- 打卡提交页：展示任务要求，支持勾选完成、上传图片、填写备注并提交。
- 提交结果页：展示提交成功、AI 检查状态、家长确认状态和补充原因。

## 核心数据表

- `user`：应用用户，包含角色、用户名、密码哈希、昵称、头像、手机号。
- `family_member`：家庭关系，关联家庭、家长用户和孩子用户。
- `study_task`：学习任务，包含科目、任务类型、标题、说明、日期、截止时间、状态。
- `task_submission`：任务提交，记录孩子备注、提交状态和提交时间。
- `submission_image`：提交图片，记录图片地址、缩略图、排序和上传状态。
- `ai_check_result`：AI 检查结果，记录匹配度、完成度、异常、建议、状态和 `raw_result`。
- `parent_review`：家长审核记录，记录通过、要求补充或标记 AI 不准确。
- `wrong_question`：错题记录，关联孩子、任务、提交、图片、知识点和掌握状态。
- `weekly_report`：周报，记录周统计、科目统计、薄弱点、AI 报告正文和下周建议。

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
