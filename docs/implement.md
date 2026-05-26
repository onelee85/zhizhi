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

## 当前状态

- 当前仓库已创建阶段 1 前端页面骨架。
- 前端应用位于 `src/frontend`。
- 当前仓库已创建阶段 1 后端接口服务。
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
- `src/frontend/features/` 放前端阶段 1 的 mock 数据和后续业务模块入口。
- `src/frontend/components/ui/` 放可复用 UI 组件。
- `src/backend/src/features/` 放后端业务模块。
- `src/backend/src/server/` 放后端内存数据和认证会话基础设施。
- `src/backend/src/shared/` 放后端通用 HTTP、路由和错误处理。
- 页面文件不得直接放业务逻辑。
- 所有请求入参使用 Zod 校验。
- 业务模块使用 service + repository pattern。
- 所有数据库写入必须检查家庭权限。
- 所有 AI 输出必须保存 `raw_result`。

## 建议实施顺序

1. 基于当前 `src/frontend` 骨架继续完善阶段 1 交互。
2. 实现用户名密码登录、会话管理、角色识别和家庭权限校验。
3. 建立 MySQL schema 和数据库访问层。
4. 实现任务打卡闭环：家长创建任务、孩子查看任务、图片提交、家长审核。
5. 接入 Qiniu 图片上传，保证提交图片可被家长查看。
6. 接入 Alibaba Bailian AI 检查，异步写入 AI 检查结果。
7. 实现错题记录和按科目查看。
8. 实现薄弱点统计和每周学习报告。
9. 补齐服务层单测、API 集成测试和核心 E2E 测试。

## 阶段 1 前端骨架验证

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
- `http://localhost:3000/login`：用户名密码登录页骨架。
- `http://localhost:3000/parent`：家长今日看板。
- `http://localhost:3000/parent/tasks/new`：创建任务表单骨架。
- `http://localhost:3000/parent/tasks/math-1`：家长任务详情页。
- `http://localhost:3000/child`：孩子今日任务页。
- `http://localhost:3000/child/tasks/math-1/check-in`：孩子打卡页骨架。
- `http://localhost:3000/child/tasks/math-1/result`：提交结果页骨架。

## 阶段 1 后端接口验证

后端说明文档：

- `src/backend/README.md`

运行方式：

```bash
cd /Users/lijiao/Documents/AI/zhizhi/src/backend
source ~/.nvm/nvm.sh
nvm use v22
pnpm install
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

- 阶段 1 前端页面仅使用 mock 数据。
- MySQL schema 和 migration 未创建。
- 后端阶段 1 使用内存数据，服务重启后数据重置。
- 图片上传仅接收 mock `imageUrls`，未接入 Qiniu。
- AI、错题、周报代码均未实现。
- GitHub Actions 未配置。
