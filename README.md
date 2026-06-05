# 知知小助手

知知小助手是一个面向家庭的学习任务打卡 MVP。它围绕“家长创建任务、孩子查看并打卡、上传完成照片、家长审核确认、积分奖励、心愿兑换、日历查看、历史归档”建立一个可追踪的家庭学习闭环。

## 当前状态

项目已完成任务打卡主流程、MySQL 应用用户登录、前后端 API 联调、本地照片上传、积分心愿激励、日历面板和历史任务归档。

当前仍未接入 Alibaba Bailian AI 检查、错题提取、薄弱点分析和周报生成；这些能力在后续阶段规划中。

## 核心功能

- 家长使用用户名和密码登录，创建、编辑、删除未完成任务。
- 孩子查看今日任务、逾期未完成任务和已完成任务。
- 孩子按任务要求上传打卡照片，或提交无需照片的任务。
- 家长查看提交记录并审核通过或要求补充。
- 家长审核通过后按任务配置发放积分。
- 孩子提交心愿，家长设置所需积分、通过或驳回。
- 孩子申请兑换心愿，家长确认兑换并扣减积分。
- 家长和孩子查看任务日历；家长可从日历按日期创建任务。
- 家长确认完成超过 7 天的任务自动进入历史任务列表，日历仍保留归档标记。

## 技术栈

| 模块 | 技术 |
| --- | --- |
| 前端 | Next.js 16 App Router, React 19, TypeScript, Tailwind CSS, animal-island-ui |
| 后端 | Node.js 22, TypeScript, 原生 HTTP Server, 自定义 Router |
| 数据库 | MySQL, mysql2 |
| 校验 | Zod |
| 认证 | 应用用户体系，用户名 + 密码，Bearer Token |
| 测试 | Node test, Playwright Test |

## 项目结构

```text
zhizhi/
├── docs/                         # 产品、API、实施和项目文档
├── src/
│   ├── frontend/                 # Next.js 前端应用
│   │   ├── app/                  # 路由、布局、route handlers
│   │   ├── components/ui/        # 可复用 UI 封装
│   │   ├── features/             # 业务模块 UI 与前端 API client
│   │   └── DESIGN.md             # 前端设计说明
│   └── backend/                  # 后端服务
│       ├── db/                   # schema、seed、迁移
│       └── src/
│           ├── features/         # service + repository 业务模块
│           ├── server/           # 认证、数据库、上传、环境配置
│           ├── shared/           # 路由、错误、HTTP、重试工具
│           └── docs/             # OpenAPI 和 Swagger UI
├── tests/e2e/                    # Playwright E2E 测试
├── package.json                  # 根目录 E2E 脚本
├── playwright.config.ts
└── AGENTS.md                     # 项目协作与编码规则
```

## 环境要求

- Node.js v22
- pnpm
- MySQL 5.7+/8.x 或兼容版本

建议使用 nvm：

```bash
source ~/.nvm/nvm.sh
nvm use v22
```

## 初始化数据库

后端 schema 位于 `src/backend/db/schema.sql`，包含建库、建表和 Demo seed。

```bash
cd src/backend
mysql -h 127.0.0.1 -u root -p < db/schema.sql
```

Demo 账号：

| 角色 | 用户名 | 密码 |
| --- | --- | --- |
| 家长 | `parent_demo` | `password123` |
| 孩子 | `child_demo` | `password123` |

## 后端配置

后端会自动读取 `src/backend/.env.local` 和 `src/backend/.env`。已存在的 shell 环境变量优先级更高。

常用环境变量：

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `HOST` | `0.0.0.0` | 后端监听地址 |
| `PORT` | `4000` | 后端端口 |
| `MYSQL_HOST` | `127.0.0.1` | MySQL 地址 |
| `MYSQL_PORT` | `3306` | MySQL 端口 |
| `MYSQL_DATABASE` | `zhizhi` | 数据库名 |
| `MYSQL_ACCOUNT` | `root` | 数据库账号 |
| `MYSQL_PASSWORD` | 空 | 数据库密码 |
| `MYSQL_CONNECTION_LIMIT` | `10` | 连接池大小 |

敏感配置只允许放在服务端环境中，不要暴露给前端客户端。

## 本地启动

先启动后端：

```bash
cd src/backend
pnpm install
pnpm dev
```

后端默认地址：

```text
http://localhost:4000
```

再启动前端：

```bash
cd src/frontend
pnpm install
pnpm dev
```

前端默认地址：

```text
http://localhost:3000
```

前端通过同源代理 `/api/backend/*` 访问后端，默认转发到 `http://localhost:4000`。如需覆盖：

```bash
BACKEND_BASE_URL=http://localhost:4000 pnpm dev
```

同一 Wi-Fi 手机调试时，访问电脑局域网 IP：

```text
http://<电脑局域网IP>:3000
```

不要用 `http://0.0.0.0:3000` 作为浏览器访问地址。

## 常用命令

后端：

```bash
cd src/backend
pnpm typecheck
pnpm build
pnpm test
```

前端：

```bash
cd src/frontend
pnpm typecheck
pnpm build
```

E2E：

```bash
pnpm test:e2e
```

Playwright 默认使用 `http://localhost:3000`。如需指定：

```bash
PLAYWRIGHT_BASE_URL=http://localhost:3000 pnpm test:e2e
```

## API 文档

后端启动后可访问：

- Swagger UI: [http://localhost:4000/docs](http://localhost:4000/docs)
- OpenAPI JSON: [http://localhost:4000/openapi.json](http://localhost:4000/openapi.json)
- 健康检查: [http://localhost:4000/health](http://localhost:4000/health)

主要接口：

- `POST /auth/login`
- `GET /auth/me`
- `GET /parent/dashboard`
- `GET /tasks/today`
- `GET /tasks/calendar`
- `GET /tasks/history`
- `POST /tasks`
- `GET /tasks/:taskId`
- `PATCH /tasks/:taskId`
- `DELETE /tasks/:taskId`
- `POST /tasks/:taskId/submissions`
- `POST /uploads/photos`
- `POST /tasks/:taskId/reviews`
- `GET /points/accounts/:childUserId`
- `GET /wishes`
- `POST /wishes`
- `GET /wishes/:wishId`
- `PATCH /wishes/:wishId`
- `DELETE /wishes/:wishId`

完整说明见 [docs/api.md](./docs/api.md)。

## 核心规则

- `src/frontend/app/` 只放路由、布局、页面和 route handlers，不直接堆业务逻辑。
- 业务 UI、服务调用和类型放在 `src/frontend/features/`。
- 后端业务使用 service + repository pattern。
- 所有 API 输入使用 Zod 校验。
- 所有任务、照片、AI 检查、积分、心愿和日历数据必须归属到家庭。
- 数据库写入必须验证 authenticated user、role 和 family 权限。
- Alibaba Bailian 调用必须运行在服务端，不能暴露密钥。

## 文档

- [产品需求 PRD](./docs/prd.md)
- [API 文档](./docs/api.md)
- [实施记录](./docs/implement.md)
- [项目文档](./docs/documentation.md)
- [研发计划](./docs/plan.md)
- [前端 README](./src/frontend/README.md)
- [后端 README](./src/backend/README.md)

## 开发边界

已实现：

- MySQL 登录与任务持久化
- 前端同源后端代理
- 本地照片上传与读取
- 任务创建、编辑、删除、提交、审核
- 积分账户、积分流水、心愿审核和兑换
- 日历面板
- 历史任务归档
- 后端 service 单测和前端 E2E 测试

未实现或待完善：

- Alibaba Bailian AI 完成度检查
- 错题提取和薄弱点分析
- 周报生成
- 生产级会话持久化
- 家庭孩子列表接口
- GitHub Actions 流水线
