# 知知小助手前端

家庭学习任务打卡 MVP 的前端项目。当前阶段已接入本地后端 API，支持登录、家长创建任务、孩子打卡提交和家长审核。

## 项目信息

- 项目名称：`zhizhi`
- 当前版本：`0.1.0`
- 项目目录：`/Users/lijiao/Documents/AI/zhizhi/src/frontend`
- 包管理器：pnpm
- Node.js：建议使用 Node.js v22
- 当前边界：不包含 Qiniu 真实图片上传、AI 检查、错题、周报和 CI

## 技术栈

| 技术 | 版本 | 用途 |
|---|---:|---|
| Next.js | 16.2.6 | App Router 前端应用 |
| React | 19.2.5 | UI 渲染 |
| React DOM | 19.2.5 | DOM 渲染 |
| TypeScript | 6.0.3 | 类型检查 |
| Tailwind CSS | 3.4.17 | 样式 |
| Zod | 4.3.6 | 后续请求和表单校验 |
| ESLint | 9.39.2 | 代码检查 |
| pnpm | 10.28.2 | 依赖管理 |

## 项目架构

```text
src/frontend
├── app
│   ├── child
│   ├── api/backend/[...path]/route.ts
│   │   ├── page.tsx
│   │   └── tasks/[taskId]
│   │       ├── check-in/page.tsx
│   │       └── result/page.tsx
│   ├── login/page.tsx
│   ├── parent
│   │   ├── page.tsx
│   │   └── tasks
│   │       ├── [taskId]/page.tsx
│   │       └── new/page.tsx
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components
│   └── ui
│       ├── badge.tsx
│       ├── button.tsx
│       └── card.tsx
├── features
│   ├── api
│   │   └── client.ts
│   ├── auth
│   │   └── login-form.tsx
│   └── tasks
│       ├── check-in-form.tsx
│       ├── child-task-list.tsx
│       ├── task-form.tsx
│       ├── parent-dashboard.tsx
│       ├── parent-task-detail.tsx
│       ├── status.ts
│       ├── submission-result.tsx
│       └── types.ts
├── lib
│   └── utils.ts
├── next.config.mjs
├── package.json
├── pnpm-lock.yaml
├── postcss.config.mjs
├── tailwind.config.ts
└── tsconfig.json
```

目录职责：

- `app/`：Next.js App Router 页面、布局和同源代理 route handler。
- `components/ui/`：基础可复用 UI 组件。
- `features/api/`：前端 API 客户端，统一处理 token、请求和错误响应。
- `features/auth/`：登录交互模块。
- `features/tasks/`：任务列表、创建、详情、打卡、审核和状态展示模块。
- `lib/`：通用工具函数。

## 页面路由

| 路由 | 说明 |
|---|---|
| `/` | 首页和阶段说明 |
| `/login` | 用户名密码登录 |
| `/parent` | 家长今日看板 |
| `/parent/tasks/new` | 创建任务表单 |
| `/parent/tasks/[taskId]` | 家长任务详情和审核页 |
| `/child` | 孩子今日任务页 |
| `/child/tasks/[taskId]/check-in` | 孩子打卡页 |
| `/child/tasks/[taskId]/result` | 提交结果页 |

## 后端 API

前端页面调用同源路径 `/api/backend/*`，由 Next route handler 转发到后端。

默认后端地址：

```text
http://localhost:4000
```

当前后端尚无家庭孩子列表接口，创建任务页阶段 1 使用 Demo seed 中的 `child-1` 作为默认孩子。

如需覆盖：

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000 pnpm dev
```

测试账号：

- 家长：`parent_demo` / `password123`
- 孩子：`child_demo` / `password123`

## 本地开发

进入前端目录：

```bash
cd /Users/lijiao/Documents/AI/zhizhi/src/frontend
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

浏览器打开：

```text
http://localhost:3000
```

## 打包与生产启动

生产打包：

```bash
pnpm build
```

本地生产模式启动：

```bash
pnpm start
```

默认访问地址：

```text
http://localhost:3000
```

## 部署说明

当前项目是标准 Next.js 应用，可部署到支持 Node.js 的环境。

基础部署流程：

```bash
cd /Users/lijiao/Documents/AI/zhizhi/src/frontend
source ~/.nvm/nvm.sh
nvm use v22
pnpm install --frozen-lockfile
pnpm build
pnpm start
```

当前前端只需要后端 Base URL。数据库、Qiniu Secret、Alibaba Bailian Key 等敏感配置必须只放在后端环境变量中，不能暴露给客户端。

## 验证方式

构建验证：

```bash
pnpm build
```

页面验证：

- 打开 `/login`，使用 `parent_demo` / `password123` 登录后进入家长端。
- 打开 `/parent`，确认展示后端今日任务统计和任务列表。
- 打开 `/parent/tasks/new`，创建任务后确认跳转到任务详情。
- 使用 `child_demo` / `password123` 登录后打开 `/child`，确认展示孩子今日任务清单。
- 打开 `/child/tasks/<taskId>/check-in`，填写图片 URL 后提交打卡。
- 使用家长账号打开 `/parent/tasks/<taskId>`，确认可以通过或要求补充。

## 当前未实现

- Qiniu 图片上传。
- AI 检查。
- 错题和周报。
- 测试用例和 CI。
