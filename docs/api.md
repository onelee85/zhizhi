# 知知小助手后端 API 文档

## 基础信息

- **Base URL**: http://localhost:4000
- **认证方式**: Bearer Token (登录后获取)
- **数据格式**: JSON

## 目录

- [系统接口](#系统接口)
- [认证接口](#认证接口)
- [家长端接口](#家长端接口)
- [任务接口](#任务接口)

---

## 系统接口

### GET /health - 健康检查

检查后端服务是否正常运行。

**响应示例:**
```json
{
  "status": "ok",
  "service": "zhizhi-backend"
}
```

### GET /openapi.json - OpenAPI 规范

获取完整的 OpenAPI 3.1 规范文档。

### GET /docs - Swagger UI

访问交互式 API 文档界面。

---

## 认证接口

### POST /auth/login - 用户名密码登录

用户登录接口，支持家长和孩子账号。

**请求体:**
```json
{
  "username": "parent_demo",
  "password": "password123"
}
```

**响应 (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "parent-1",
    "familyId": "family-1",
    "role": "parent",
    "username": "parent_demo",
    "nickname": "小明爸爸"
  }
}
```

**错误响应 (401):**
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "用户名或密码错误"
  }
}
```

### GET /auth/me - 获取当前用户信息

获取当前登录用户的详细信息。

**请求头:**
```
Authorization: Bearer <token>
```

**响应 (200):**
```json
{
  "user": {
    "id": "parent-1",
    "familyId": "family-1",
    "role": "parent",
    "username": "parent_demo",
    "nickname": "小明爸爸"
  }
}
```

---

## 家长端接口

### GET /parent/dashboard - 家长今日看板

获取家长今日看板数据，包括今日任务统计等。

**请求头:**
```
Authorization: Bearer <token>
```

**权限要求**: 需要家长角色

**响应 (200):**
```json
{
  "today": "2026-05-26",
  "children": [
    {
      "id": "child-1",
      "nickname": "小明",
      "pendingCount": 3,
      "submittedCount": 1,
      "confirmedCount": 2
    }
  ],
  "tasksNeedReview": []
}
```

---

## 任务接口

### GET /tasks/today - 获取今日任务列表

获取当前用户今日的任务列表。

**请求头:**
```
Authorization: Bearer <token>
```

**响应 (200):**
```json
{
  "tasks": [
    {
      "id": "task-1",
      "familyId": "family-1",
      "childUserId": "child-1",
      "creatorUserId": "parent-1",
      "subject": "数学",
      "taskType": "作业",
      "title": "完成数学计算练习第 3 页",
      "description": "完成第 3 页全部计算题，订正错题并圈出不会的题。",
      "dueDate": "2026-05-26",
      "dueTime": "20:30",
      "needPhoto": true,
      "needAiCheck": false,
      "status": "pending",
      "createdAt": "2026-05-26T10:00:00.000Z",
      "updatedAt": "2026-05-26T10:00:00.000Z",
      "submission": null
    }
  ]
}
```

### POST /tasks - 创建任务 (家长)

家长为孩子创建新的学习任务。

**请求头:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**权限要求**: 需要家长角色

**请求体:**
```json
{
  "childUserId": "child-1",
  "subject": "语文",
  "taskType": "作业",
  "title": "背诵古诗《春晓》",
  "description": "熟练背诵并默写古诗《春晓》",
  "dueDate": "2026-05-26",
  "dueTime": "19:00",
  "needPhoto": true,
  "needAiCheck": false
}
```

**字段说明:**
- `subject`: 科目，可选值 ["语文", "数学", "英语", "其他"]
- `taskType`: 任务类型，可选值 ["作业", "预习", "复习", "错题", "阅读", "背诵", "练习"]
- `dueDate`: 截止日期，格式 YYYY-MM-DD
- `dueTime`: 截止时间，可选，格式 HH:MM
- `needPhoto`: 是否需要上传照片，默认 true
- `needAiCheck`: 是否需要 AI 检查，默认 false

**响应 (201):**
```json
{
  "task": {
    "id": "task-2",
    "familyId": "family-1",
    "childUserId": "child-1",
    "creatorUserId": "parent-1",
    "subject": "语文",
    "taskType": "作业",
    "title": "背诵古诗《春晓》",
    "description": "熟练背诵并默写古诗《春晓》",
    "dueDate": "2026-05-26",
    "dueTime": "19:00",
    "needPhoto": true,
    "needAiCheck": false,
    "status": "pending",
    "createdAt": "2026-05-26T10:30:00.000Z",
    "updatedAt": "2026-05-26T10:30:00.000Z",
    "submission": null
  }
}
```

### GET /tasks/:taskId - 获取任务详情

获取指定任务的详细信息。

**请求头:**
```
Authorization: Bearer <token>
```

**路径参数:**
- `taskId`: 任务 ID

**响应 (200):**
```json
{
  "task": {
    "id": "task-1",
    "familyId": "family-1",
    "childUserId": "child-1",
    "creatorUserId": "parent-1",
    "subject": "数学",
    "taskType": "作业",
    "title": "完成数学计算练习第 3 页",
    "description": "完成第 3 页全部计算题，订正错题并圈出不会的题。",
    "dueDate": "2026-05-26",
    "dueTime": "20:30",
    "needPhoto": true,
    "needAiCheck": false,
    "status": "submitted",
    "createdAt": "2026-05-26T10:00:00.000Z",
    "updatedAt": "2026-05-26T15:00:00.000Z",
    "submission": {
      "id": "submission-1",
      "taskId": "task-1",
      "childUserId": "child-1",
      "status": "submitted",
      "childNote": "已完成全部题目",
      "submittedAt": "2026-05-26T15:00:00.000Z",
      "createdAt": "2026-05-26T15:00:00.000Z",
      "updatedAt": "2026-05-26T15:00:00.000Z",
      "images": [
        {
          "id": "image-1",
          "submissionId": "submission-1",
          "imageUrl": "https://example.com/image1.jpg",
          "imageThumbUrl": "https://example.com/thumb1.jpg",
          "sortOrder": 0,
          "uploadStatus": "uploaded",
          "createdAt": "2026-05-26T15:00:00.000Z"
        }
      ]
    }
  }
}
```

### PATCH /tasks/:taskId - 更新任务 (家长)

家长更新未完成的任务。

**请求头:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**权限要求**: 需要家长角色

**路径参数:**
- `taskId`: 任务 ID

**请求体:** (至少包含一个字段)
```json
{
  "subject": "数学",
  "taskType": "作业",
  "title": "完成数学计算练习第 3-4 页",
  "description": "完成第 3-4 页全部计算题",
  "dueDate": "2026-05-27",
  "dueTime": "21:00",
  "needPhoto": true,
  "needAiCheck": false
}
```

**限制**: 只能更新状态为 `pending` 或 `needs_resubmit` 的任务

**响应 (200):**
```json
{
  "task": {
    "id": "task-1",
    "...": "..."
  }
}
```

### DELETE /tasks/:taskId - 删除任务 (家长)

家长删除未完成的任务。

**请求头:**
```
Authorization: Bearer <token>
```

**权限要求**: 需要家长角色

**路径参数:**
- `taskId`: 任务 ID

**限制**: 只能删除状态为 `pending` 或 `needs_resubmit` 的任务

**响应 (204):** 无内容

### POST /tasks/:taskId/submissions - 提交任务打卡 (孩子)

孩子完成任务后提交打卡。

**请求头:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**权限要求**: 需要孩子角色

**路径参数:**
- `taskId`: 任务 ID

**请求体:**
```json
{
  "completed": true,
  "imageUrls": [
    "https://example.com/image1.jpg",
    "https://example.com/image2.jpg"
  ],
  "childNote": "已完成，感觉很简单！"
}
```

**字段说明:**
- `completed`: 必须为 true
- `imageUrls`: 照片 URL 数组，1-9 张
- `childNote`: 孩子备注，可选，最多 500 字符

**响应 (201):**
```json
{
  "task": {
    "id": "task-1",
    "status": "submitted",
    "...": "..."
  }
}
```

### POST /tasks/:taskId/reviews - 审核任务 (家长)

家长审核孩子提交的任务。

**请求头:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**权限要求**: 需要家长角色

**路径参数:**
- `taskId`: 任务 ID

**请求体:**
```json
{
  "reviewResult": "pass",
  "comment": "完成得很好！继续保持！"
}
```

**字段说明:**
- `reviewResult`: 审核结果，可选值 ["pass", "need_resubmit"]
- `comment`: 家长评语，可选，最多 500 字符

**响应 (201):**
```json
{
  "task": {
    "id": "task-1",
    "status": "confirmed",
    "...": "..."
  }
}
```

---

## 数据模型

### 任务状态 (TaskStatus)

| 状态 | 说明 |
|------|------|
| pending | 待完成 |
| submitted | 已提交 |
| ai_checking | AI 检查中 |
| parent_review | 待家长审核 |
| confirmed | 已确认 |
| needs_resubmit | 需重新提交 |

### 科目 (Subject)

- 语文
- 数学
- 英语
- 其他

### 任务类型 (TaskType)

- 作业
- 预习
- 复习
- 错题
- 阅读
- 背诵
- 练习

---

## 错误响应格式

所有错误响应遵循以下格式:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "错误描述信息"
  }
}
```

常见错误码:
- `UNAUTHORIZED`: 未授权 (401)
- `FORBIDDEN`: 无权限 (403)
- `NOT_FOUND`: 资源不存在 (404)
- `CONFLICT`: 操作冲突 (409)
- `VALIDATION_ERROR`: 请求参数验证失败 (400)
