# 实施记录

## 2026-05-26

- 将登录方案明确为基于 MySQL 应用用户体系的用户名 + 密码登录。
- 更新 `AGENTS.md` 中孩子登录和家长操作认证规则，移除旧登录方案表述。
- 更新 `docs/prd.md` 中登录前置条件、第一阶段登录范围、用户表字段和推荐存储方案。
- 根据 `docs/prd.md` 完善 `docs/plan.md`、`docs/implement.md`、`docs/documentation.md`，形成 MVP 研发计划、实施基线和项目文档。

## 当前状态

- 当前仓库仍处于文档和项目定义阶段。
- 尚未初始化 Next.js 应用代码。
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

- `app/` 只包含 routes、layouts、pages 和 route handlers。
- `features/` 放业务模块，包括任务、提交、AI 检查、错题、周报等。
- `server/` 放 server-only 基础设施，包括数据库、鉴权、存储、AI 客户端。
- `components/ui/` 放可复用 UI 组件。
- 页面文件不得直接放业务逻辑。
- 所有请求入参使用 Zod 校验。
- 业务模块使用 service + repository pattern。
- 所有数据库写入必须检查家庭权限。
- 所有 AI 输出必须保存 `raw_result`。

## 建议实施顺序

1. 初始化 Next.js、TypeScript、Tailwind、shadcn/ui、测试框架和基础目录。
2. 建立 MySQL schema 和数据库访问层。
3. 实现用户名密码登录、会话管理、角色识别和家庭权限校验。
4. 实现任务打卡闭环：家长创建任务、孩子查看任务、图片提交、家长审核。
5. 接入 Qiniu 图片上传，保证提交图片可被家长查看。
6. 接入 Alibaba Bailian AI 检查，异步写入 AI 检查结果。
7. 实现错题记录和按科目查看。
8. 实现薄弱点统计和每周学习报告。
9. 补齐服务层单测、API 集成测试和核心 E2E 测试。

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

- Next.js 项目骨架未创建。
- MySQL schema 和 migration 未创建。
- 登录、权限、任务、提交、上传、AI、错题、周报代码均未实现。
- GitHub Actions 未配置。
