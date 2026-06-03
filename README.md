# 知知小助手

一个面向家庭的 AI 学习打卡助手，帮助家长布置任务、孩子打卡上传、AI 辅助检查，并生成每周学习报告。

## 项目简介

知知小助手是一个家庭学习管理 MVP 项目，通过"家长计划 → 孩子执行 → 拍照打卡 → AI 辅助检查 → 家长确认 → 每周复盘 → 下周调整"的闭环，帮助家长降低检查成本，帮助孩子建立学习执行习惯。

### 核心功能

- **家长端**：创建每日学习任务、查看今日看板、审核孩子提交、查看每周报告
- **孩子端**：查看今日任务、拍照打卡提交、查看提交结果
- **AI 能力**：图片理解、完成度检查、异常识别、错题提取、周报生成
- **数据沉淀**：任务记录、提交记录、错题本、薄弱点分析

## 技术栈

### 前端
- **框架**：Next.js 14 App Router
- **语言**：TypeScript
- **样式**：Tailwind CSS
- **UI**：shadcn/ui

### 后端
- **运行时**：Node.js
- **语言**：TypeScript
- **Web框架**：原生 Node.js HTTP Server + 自定义 Router
- **验证**：Zod
- **架构**：Service + Repository Pattern

### 基础设施
- **数据库**：MySQL
- **对象存储**：Qiniu Cloud Storage
- **AI 服务**：Alibaba Bailian
- **CI/CD**：GitHub Actions

## 快速开始

### 环境要求

- Node.js 22
- pnpm 8+
- MySQL 8+ (可选，当前使用内存数据)

### 安装与运行

#### 前端

```bash
cd src/frontend
nvm use v22
pnpm install
pnpm dev
```

访问：http://localhost:3000

同一 Wi-Fi 手机调试时，前端服务会监听 `0.0.0.0`，手机不要访问 `0.0.0.0`，需要访问电脑的局域网 IP：

```text
http://<电脑局域网IP>:3000
```

例如 `http://192.168.1.23:3000`。手机只需要访问前端地址，后端请求会由 Next 同源代理转发到本机后端。

#### 后端

```bash
cd src/backend
nvm use v22
pnpm install
pnpm dev
```

访问：http://localhost:4000

### 测试账号

| 角色 | 用户名 | 密码 |
|------|--------|------|
| 家长 | parent_demo | password123 |
| 孩子 | child_demo | password123 |

## 项目结构

```
zhizhi/
├── docs/                    # 项目文档
│   ├── api.md             # API 文档
│   ├── prd.md             # 产品需求文档
│   ├── plan.md            # 研发计划
│   ├── implement.md       # 实施记录
│   └── documentation.md   # 文档索引
├── src/
│   ├── frontend/          # 前端应用
│   │   ├── app/          # Next.js App Router
│   │   ├── components/   # UI 组件
│   │   ├── features/     # 业务模块
│   │   └── lib/          # 工具库
│   └── backend/          # 后端服务
│       ├── src/
│       │   ├── app.ts    # 应用入口
│       │   ├── domain/   # 领域类型
│       │   ├── features/ # 业务模块
│       │   ├── server/   # 服务基础设施
│       │   ├── shared/   # 共享工具
│       │   └── docs/     # API 文档
```

## 核心流程

### 任务打卡闭环

```
家长创建任务 → 孩子查看任务 → 拍照打卡提交 → AI 检查 → 家长审核确认 → 任务完成
                                                          ↓
                                                    需补充 → 重新提交
```

### 状态流转

**任务状态**：
```
待完成 → 已提交 → AI 检查中 → 待家长确认 → 已确认
                                    ↓
                                  需补充 → 重新提交
```

## 文档

- [产品需求文档 (PRD)](./docs/prd.md)
- [API 文档](./docs/api.md)
- [实施记录](./docs/implement.md)
- [研发计划](./docs/plan.md)
- [后端 README](./src/backend/README.md)
- [前端 README](./src/frontend/README.md)

## API 接口

后端提供 RESTful API，主要接口包括：

- `POST /auth/login` - 用户登录
- `GET /auth/me` - 获取当前用户
- `GET /parent/dashboard` - 家长看板
- `GET /tasks/today` - 今日任务列表
- `POST /tasks` - 创建任务
- `GET /tasks/:taskId` - 任务详情
- `PATCH /tasks/:taskId` - 更新任务
- `DELETE /tasks/:taskId` - 删除任务
- `POST /tasks/:taskId/submissions` - 提交打卡
- `POST /tasks/:taskId/reviews` - 家长审核

详细文档请参考：
- [API 文档](./docs/api.md)
- Swagger UI: http://localhost:4000/docs
- OpenAPI JSON: http://localhost:4000/openapi.json

## 开发计划

### MVP 阶段 1 (当前)
✅ 前端页面骨架
✅ 后端接口服务
✅ 内存数据实现
✅ API 文档 (Swagger)

### MVP 阶段 2
- [ ] MySQL 数据持久化
- [ ] 图片上传 (Qiniu)
- [ ] 前端对接后端 API
- [ ] 完整认证会话

### MVP 阶段 3
- [ ] AI 检查 (Alibaba Bailian)
- [ ] 错题记录
- [ ] 周报生成

## 工程约束

- 使用 TypeScript 严格模式
- 使用 Zod 进行请求验证
- 采用 Service + Repository 架构模式
- 所有数据库写入必须检查家庭权限
- 所有 AI 输出必须保存原始结果
- 不将业务逻辑直接放在页面组件中
- 不向前端暴露密钥

## 贡献指南

请先阅读 [AGENTS.md](./AGENTS.md) 了解项目规范和约束。

## 许可证

MIT License
