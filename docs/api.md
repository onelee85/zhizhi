# API 文档

后端默认地址：`http://localhost:4000`。完整机器可读契约见：

- Swagger UI：`GET /docs`
- OpenAPI JSON：`GET /openapi.json`

除登录、健康检查和 OpenAPI 外，业务接口均使用：

```http
Authorization: Bearer <token>
```

## 家庭与指标

| 方法 | 路径 | 说明 |
|---|---|---|
| `GET` | `/family/context` | 当前家庭及唯一孩子 |
| `GET` | `/parent/dashboard` | 任务摘要、孩子积分和近 14 天指标 |
| `GET` | `/metrics/mvp?days=14` | 家长可见的 1 至 30 天 MVP 汇总 |

## 任务

任务主状态仅有：`pending`、`parent_review`、`confirmed`、`needs_resubmit`。

| 方法 | 路径 | 说明 |
|---|---|---|
| `GET` | `/tasks/today` | 今日、逾期和已处理任务 |
| `GET` | `/tasks/calendar?month=YYYY-MM` | 月视图任务 |
| `GET` | `/tasks/history` | 已归档只读任务 |
| `POST` | `/tasks` | 家长创建任务；`childUserId` 可省略，积分默认 1 |
| `GET` | `/tasks/:taskId` | 任务详情，含 `submissions[]`、最新 `submission` 和 `isOverdue` |
| `PATCH` | `/tasks/:taskId` | 编辑 `pending` 或 `needs_resubmit` |
| `DELETE` | `/tasks/:taskId` | 仅删除无提交记录的 `pending` |
| `POST` | `/tasks/:taskId/submissions` | 孩子提交；最多 9 张图片 |
| `POST` | `/tasks/:taskId/reviews` | 家长审核；要求补充时 `comment` 必填 |

`POST /tasks` 支持 `note`，不再接受 `needAiCheck`。提交、图片、状态更新在同一事务；审核、状态和积分在同一事务。重复审核同一提交返回 `200` 和已有结果，首次审核返回 `201`。

## 图片

| 方法 | 路径 | 说明 |
|---|---|---|
| `POST` | `/uploads/photos` | 孩子上传 jpg/png/webp，单张最大 5MB |
| `GET` | `/uploads/photos/:fileName` | 受保护读取，校验登录、家庭和孩子归属 |

图片 URL 不允许匿名读取。前端通过 `/api/backend` 同源代理携带 Bearer token 获取 Blob。

## 积分与心愿

| 方法 | 路径 | 说明 |
|---|---|---|
| `GET` | `/points/account` | 积分账户和完整流水 |
| `GET/POST` | `/wishes` | 愿望列表、孩子创建愿望 |
| `GET/PATCH/DELETE` | `/wishes/:wishId` | 查看、修改或删除自己的 `rejected` 心愿 |
| `PATCH` | `/wishes/:wishId/approve` | 家长设置积分并通过 |
| `PATCH` | `/wishes/:wishId/reject` | 家长驳回，`rejectReason` 必填 |
| `POST` | `/wishes/:wishId/redeem-requests` | 孩子申请并原子预扣积分 |
| `POST` | `/wishes/:wishId/redeem-confirmations` | 家长确认兑现 |
| `POST` | `/wishes/:wishId/redeem-rejections` | 家长拒绝并退款，`rejectReason` 必填 |

愿望响应包含最近的 `latestRedeemRequest`。兑换请求、预扣流水和退款流水使用同一请求 ID，已兑换心愿不可删除。

## 错误

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed"
  }
}
```

常见状态码：`400` 校验失败，`401` 未登录，`403` 越权，`404` 不存在，`409` 状态冲突。
