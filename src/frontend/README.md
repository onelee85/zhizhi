# 知知小助手前端

家庭学习任务打卡 MVP 的前端项目。当前阶段只实现阶段 1 页面骨架，使用静态 mock 数据展示家长端和孩子端核心路径。

## 项目信息

- 项目名称：`zhizhi`
- 当前版本：`0.1.0`
- 项目目录：`/Users/lijiao/Documents/AI/zhizhi/src/frontend`
- 包管理器：pnpm
- Node.js：建议使用 Node.js v22
- 当前边界：不包含提交逻辑、后端 API、数据库、真实登录、真实图片上传和 AI 检查

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
│   └── tasks
│       ├── mock-data.ts
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

- `app/`：Next.js App Router 页面、布局和路由。
- `components/ui/`：基础可复用 UI 组件。
- `features/tasks/`：阶段 1 任务类型和 mock 数据，后续承接任务业务模块。
- `lib/`：通用工具函数。

## 页面路由

| 路由 | 说明 |
|---|---|
| `/` | 首页和阶段说明 |
| `/login` | 用户名密码登录页骨架 |
| `/parent` | 家长今日看板 |
| `/parent/tasks/new` | 创建任务表单骨架 |
| `/parent/tasks/math-1` | 家长任务详情页 |
| `/child` | 孩子今日任务页 |
| `/child/tasks/math-1/check-in` | 孩子打卡页骨架 |
| `/child/tasks/math-1/result` | 提交结果页骨架 |

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

当前阶段没有必需环境变量。后续接入后端、数据库、Qiniu 和 Alibaba Bailian 后，敏感配置必须只放在服务端环境变量中，不能暴露给客户端。

## 验证方式

构建验证：

```bash
pnpm build
```

页面验证：

- 打开 `/`，确认能看到阶段 1 说明和家长端、孩子端入口。
- 打开 `/login`，确认展示用户名密码登录页骨架。
- 打开 `/parent`，确认展示今日任务统计和任务列表。
- 打开 `/parent/tasks/new`，确认展示创建任务表单骨架，按钮为待实现状态。
- 打开 `/parent/tasks/math-1`，确认展示任务详情、图片占位和家长审核占位。
- 打开 `/child`，确认展示孩子今日任务清单。
- 打开 `/child/tasks/math-1/check-in`，确认展示打卡表单骨架，提交按钮为待实现状态。
- 打开 `/child/tasks/math-1/result`，确认展示提交结果页骨架。

## 当前未实现

- 登录认证。
- 创建任务保存。
- 打卡提交。
- 图片上传。
- 家长审核提交。
- 后端 API。
- MySQL 数据库。
- AI 检查。
- 测试用例和 CI。
