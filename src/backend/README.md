# 知知小助手后端

家庭学习任务打卡 MVP 的阶段 1 后端接口服务。当前版本使用内存数据实现用户名密码登录、今日任务、任务创建、孩子打卡提交和家长审核接口。

## 项目信息

- 项目名称：`zhizhi-backend`
- 当前版本：`0.1.0`
- 项目目录：`/Users/lijiao/Documents/AI/zhizhi/src/backend`
- 包管理器：pnpm
- Node.js：建议使用 v22
- 默认端口：`4000`
- 当前数据模式：内存数据，服务重启后恢复内置 seed

## 当前边界

- 不接入 MySQL。
- 不接入 Qiniu Cloud Storage。
- 不接入 Alibaba Bailian。
- 不做真实图片上传，提交接口使用 `imageUrls` 模拟已上传图片地址。
- 不做密码哈希，测试账号密码仅用于阶段 1 本地接口验证。
- 不持久化数据，不提供生产级认证会话。

## 技术栈

| 技术 | 版本 | 用途 |
|---|---:|---|
| Node.js | v22 | 运行时 |
| TypeScript | 6.0.3 | 类型检查与构建 |
| Zod | 4.3.6 | 请求参数校验 |
| tsx | 4.21.0 | 本地 TypeScript 开发启动 |
| 原生 Node HTTP server | Node 内置 | HTTP 服务 |
| pnpm | 10.28.2 | 依赖管理 |

## 项目架构

```text
src/backend
├── README.md
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
└── src
    ├── app.ts
    ├── server.ts
    ├── docs
    │   ├── openapi.ts
    │   └── swagger-ui.ts
    ├── domain
    │   └── types.ts
    ├── features
    │   └── tasks
    │       ├── task.repository.ts
    │       ├── task.schemas.ts
    │       └── task.service.ts
    ├── server
    │   ├── auth.ts
    │   └── db.ts
    └── shared
        ├── errors.ts
        ├── http.ts
        └── router.ts
```

目录职责：

- `src/server.ts`：服务启动入口，读取 `PORT` 和 `HOST`。
- `src/app.ts`：HTTP 路由注册和模块组装。
- `src/docs/`：OpenAPI 规范和 Swagger UI 页面。
- `src/domain/`：领域类型定义。
- `src/features/tasks/`：阶段 1 任务业务模块，包含 schema、service、repository。
- `src/server/`：当前阶段的内存数据和登录会话。
- `src/shared/`：通用路由、HTTP 响应、错误处理。

## 本地启动

进入后端目录：

```bash
cd /Users/lijiao/Documents/AI/zhizhi/src/backend
```

切换 Node.js：

```bash
source ~/.nvm/nvm.sh
nvm use v22
```

安装依赖：

```bash
pnpm install
```

启动开发服务：

```bash
pnpm dev
```

默认访问：

```text
http://localhost:4000
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

```text
http://localhost:4000/openapi.json
```

## 打包与生产启动

类型检查：

```bash
pnpm typecheck
```

生产构建：

```bash
pnpm build
```

构建产物目录：

```text
dist/
```

生产模式启动：

```bash
pnpm start
```

指定端口启动：

```bash
PORT=4001 pnpm start
```

## 部署说明

当前服务是标准 Node.js HTTP 服务，可部署到支持 Node.js v22 的运行环境。

基础部署流程：

```bash
cd /Users/lijiao/Documents/AI/zhizhi/src/backend
source ~/.nvm/nvm.sh
nvm use v22
pnpm install --frozen-lockfile
pnpm build
PORT=4000 pnpm start
```

当前阶段没有必需环境变量。

后续接入生产能力时需要补充：

- `MYSQL_HOST`
- `MYSQL_PORT`
- `MYSQL_DATABASE`
- `MYSQL_ACCOUNT`
- `MYSQL_PASSWORD`
- `QINIU_ACCESS_KEY`
- `QINIU_SECRET_KEY`
- `BAILIAN_API_KEY`
- 会话签名密钥

敏感配置只能在服务端读取，不能暴露给前端。

## 测试账号

| 角色 | 用户名 | 密码 |
|---|---|---|
| 家长 | `parent_demo` | `password123` |
| 孩子 | `child_demo` | `password123` |

## 接口清单

| 方法 | 路径 | 说明 | 角色 |
|---|---|---|---|
| `GET` | `/health` | 健康检查 | 无 |
| `GET` | `/docs` | Swagger UI | 无 |
| `GET` | `/openapi.json` | OpenAPI JSON | 无 |
| `POST` | `/auth/login` | 用户名密码登录 | 无 |
| `GET` | `/auth/me` | 当前用户 | 家长/孩子 |
| `GET` | `/parent/dashboard` | 家长今日看板 | 家长 |
| `GET` | `/tasks/today` | 今日任务列表 | 家长/孩子 |
| `POST` | `/tasks` | 创建任务 | 家长 |
| `GET` | `/tasks/:taskId` | 任务详情 | 家长/孩子 |
| `PATCH` | `/tasks/:taskId` | 编辑未完成任务 | 家长 |
| `DELETE` | `/tasks/:taskId` | 删除未完成任务 | 家长 |
| `POST` | `/tasks/:taskId/submissions` | 孩子提交打卡 | 孩子 |
| `POST` | `/tasks/:taskId/reviews` | 家长审核提交 | 家长 |

## 接口验证

查看 Swagger UI：

```bash
open http://localhost:4000/docs
```

查看 OpenAPI JSON：

```bash
curl --noproxy '*' -s http://localhost:4000/openapi.json
```

登录家长：

```bash
curl --noproxy '*' -s http://localhost:4000/auth/login \
  -H 'content-type: application/json' \
  -d '{"username":"parent_demo","password":"password123"}'
```

登录孩子：

```bash
curl --noproxy '*' -s http://localhost:4000/auth/login \
  -H 'content-type: application/json' \
  -d '{"username":"child_demo","password":"password123"}'
```

后续请求在 header 中传入登录返回的 token：

```text
Authorization: Bearer <token>
```

查看孩子今日任务：

```bash
curl --noproxy '*' -s http://localhost:4000/tasks/today \
  -H 'authorization: Bearer <child_token>'
```

孩子提交打卡：

```bash
curl --noproxy '*' -s http://localhost:4000/tasks/task-math-1/submissions \
  -H 'authorization: Bearer <child_token>' \
  -H 'content-type: application/json' \
  -d '{"completed":true,"imageUrls":["https://example.com/math-1.jpg"],"childNote":"第 5 题不确定"}'
```

家长审核通过：

```bash
curl --noproxy '*' -s http://localhost:4000/tasks/task-math-1/reviews \
  -H 'authorization: Bearer <parent_token>' \
  -H 'content-type: application/json' \
  -d '{"reviewResult":"pass","comment":"完成，已确认"}'
```

## 当前未实现

- MySQL schema、migration 和 repository 实现。
- 密码哈希和生产级会话。
- Qiniu 图片上传。
- Alibaba Bailian AI 检查。
- 错题记录。
- 周报生成。
- 自动化测试和 CI。
