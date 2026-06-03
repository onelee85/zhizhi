export const openApiSpec = {
  openapi: "3.1.0",
  info: {
    title: "知知小助手后端 API",
    version: "0.1.0",
    description: "阶段 1-3 后端接口，当前使用 MySQL 实现登录、任务、打卡提交、家长审核、积分、愿望兑换和日历面板。"
  },
  servers: [
    {
      url: "http://localhost:4000",
      description: "本地开发服务"
    }
  ],
  tags: [
    { name: "System", description: "系统接口" },
    { name: "Auth", description: "认证接口" },
    { name: "Parent", description: "家长端接口" },
    { name: "Tasks", description: "任务接口" },
    { name: "Points", description: "积分接口" },
    { name: "Wishes", description: "愿望接口" }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer"
      }
    },
    schemas: {
      ErrorResponse: {
        type: "object",
        properties: {
          error: {
            type: "object",
            properties: {
              code: { type: "string" },
              message: { type: "string" }
            },
            required: ["code", "message"]
          }
        },
        required: ["error"]
      },
      LoginRequest: {
        type: "object",
        properties: {
          username: { type: "string", example: "parent_demo" },
          password: { type: "string", example: "password123" }
        },
        required: ["username", "password"]
      },
      User: {
        type: "object",
        properties: {
          id: { type: "string", example: "parent-1" },
          familyId: { type: "string", example: "family-1" },
          role: { type: "string", enum: ["parent", "child"] },
          username: { type: "string" },
          nickname: { type: "string" }
        },
        required: ["id", "familyId", "role", "username", "nickname"]
      },
      Task: {
        type: "object",
        properties: {
          id: { type: "string" },
          familyId: { type: "string" },
          childUserId: { type: "string" },
          creatorUserId: { type: "string" },
          subject: { type: "string", enum: ["语文", "数学", "英语", "其他"] },
          taskType: { type: "string", enum: ["作业", "预习", "复习", "错题", "阅读", "背诵", "练习"] },
          title: { type: "string" },
          description: { type: "string" },
          dueDate: { type: "string", format: "date" },
          dueTime: { type: "string", example: "20:30" },
          needPhoto: { type: "boolean" },
          needAiCheck: { type: "boolean" },
          rewardPoints: { type: "integer", minimum: 0, maximum: 999 },
          status: {
            type: "string",
            enum: ["pending", "submitted", "ai_checking", "parent_review", "confirmed", "needs_resubmit"]
          },
          isArchived: { type: "boolean", description: "是否已按历史任务规则归档。" },
          confirmedAt: {
            anyOf: [{ type: "string", format: "date-time" }, { type: "null" }],
            description: "最近一次家长确认通过时间。"
          },
          archivedAt: {
            anyOf: [{ type: "string", format: "date-time" }, { type: "null" }],
            description: "动态计算的归档生效时间；未归档时为 null。"
          },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
          submission: {
            anyOf: [{ $ref: "#/components/schemas/SubmissionWithImages" }, { type: "null" }]
          }
        },
        required: [
          "id",
          "familyId",
          "childUserId",
          "creatorUserId",
          "subject",
          "taskType",
          "title",
          "description",
          "dueDate",
          "needPhoto",
          "needAiCheck",
          "rewardPoints",
          "status",
          "createdAt",
          "updatedAt"
        ]
      },
      CreateTaskRequest: {
        type: "object",
        properties: {
          childUserId: { type: "string", example: "child-1" },
          subject: { type: "string", enum: ["语文", "数学", "英语", "其他"] },
          taskType: { type: "string", enum: ["作业", "预习", "复习", "错题", "阅读", "背诵", "练习"] },
          title: { type: "string", example: "完成数学计算练习第 3 页" },
          description: { type: "string", example: "完成第 3 页全部计算题，订正错题并圈出不会的题。" },
          dueDate: { type: "string", format: "date", example: "2026-05-26" },
          dueTime: { type: "string", example: "20:30" },
          needPhoto: { type: "boolean", default: true },
          needAiCheck: { type: "boolean", default: false },
          rewardPoints: { type: "integer", minimum: 0, maximum: 999, default: 0 }
        },
        required: ["childUserId", "subject", "taskType", "title", "description", "dueDate"]
      },
      SubmitTaskRequest: {
        type: "object",
        properties: {
          completed: { type: "boolean", const: true },
          imageUrls: {
            type: "array",
            maxItems: 9,
            items: {
              type: "string",
              pattern: "^/uploads/photos/\\d+_[a-f0-9]{12}\\.(jpg|jpeg|png|webp)$",
              example: "/uploads/photos/1718000000000_a8f3d2c4b5e6.jpg"
            },
            description: "当任务 needPhoto=true 时至少 1 张，最多 9 张；needPhoto=false 时可省略或传空数组。"
          },
          childNote: { type: "string", maxLength: 500 }
        },
        required: ["completed"]
      },
      UploadPhotoResponse: {
        type: "object",
        properties: {
          url: { type: "string", example: "/uploads/photos/1718000000000_a8f3d2c4b5e6.jpg" },
          fileName: { type: "string", example: "1718000000000_a8f3d2c4b5e6.jpg" },
          size: { type: "integer", example: 1048576 },
          contentType: { type: "string", example: "image/jpeg" }
        },
        required: ["url", "fileName", "size", "contentType"]
      },
      ReviewTaskRequest: {
        type: "object",
        properties: {
          reviewResult: { type: "string", enum: ["pass", "need_resubmit"] },
          comment: { type: "string", maxLength: 500 }
        },
        required: ["reviewResult"]
      },
      SubmissionWithImages: {
        type: "object",
        properties: {
          id: { type: "string" },
          taskId: { type: "string" },
          childUserId: { type: "string" },
          status: { type: "string", enum: ["submitted", "parent_confirmed", "needs_resubmit"] },
          childNote: { type: "string" },
          submittedAt: { type: "string", format: "date-time" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
          images: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                submissionId: { type: "string" },
                imageUrl: { type: "string", example: "/uploads/photos/1718000000000_a8f3d2c4b5e6.jpg" },
                imageThumbUrl: { type: "string", example: "/uploads/photos/1718000000000_a8f3d2c4b5e6.jpg" },
                sortOrder: { type: "integer" },
                uploadStatus: { type: "string", enum: ["uploaded"] },
                createdAt: { type: "string", format: "date-time" }
              }
            }
          }
        }
      },
      PointAccount: {
        type: "object",
        properties: {
          id: { type: "string" },
          familyId: { type: "string" },
          childUserId: { type: "string" },
          balance: { type: "integer" },
          totalEarned: { type: "integer" },
          totalSpent: { type: "integer" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" }
        }
      },
      PointLedger: {
        type: "object",
        properties: {
          id: { type: "string" },
          familyId: { type: "string" },
          childUserId: { type: "string" },
          changeAmount: { type: "integer" },
          balanceAfter: { type: "integer" },
          reason: { type: "string", enum: ["task_reward", "wish_redeem"] },
          sourceType: { type: "string", enum: ["task_review", "wish"] },
          sourceId: { type: "string" },
          operatorUserId: { type: "string" },
          createdAt: { type: "string", format: "date-time" }
        }
      },
      Wish: {
        type: "object",
        properties: {
          id: { type: "string" },
          familyId: { type: "string" },
          childUserId: { type: "string" },
          title: { type: "string" },
          description: { type: "string" },
          requiredPoints: { type: "integer" },
          status: {
            type: "string",
            enum: ["pending_review", "approved", "rejected", "redeem_requested", "redeemed"]
          },
          parentUserId: { type: "string" },
          rejectReason: { type: "string" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
          redeemedAt: { type: "string", format: "date-time" }
        }
      },
      CreateWishRequest: {
        type: "object",
        properties: {
          title: { type: "string", minLength: 1, maxLength: 100 },
          description: { type: "string", maxLength: 1000 }
        },
        required: ["title"]
      },
      UpdateWishRequest: {
        type: "object",
        properties: {
          title: { type: "string", minLength: 1, maxLength: 100 },
          description: { type: "string", maxLength: 1000 }
        },
        required: ["title"]
      },
      ApproveWishRequest: {
        type: "object",
        properties: {
          requiredPoints: { type: "integer", minimum: 1, maximum: 99999 }
        },
        required: ["requiredPoints"]
      },
      RejectWishRequest: {
        type: "object",
        properties: {
          rejectReason: { type: "string", maxLength: 500 }
        }
      }
    }
  },
  paths: {
    "/health": {
      get: {
        tags: ["System"],
        summary: "健康检查",
        responses: {
          "200": {
            description: "服务正常"
          }
        }
      }
    },
    "/uploads/photos": {
      post: {
        tags: ["Uploads"],
        summary: "孩子上传本地打卡照片",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: {
                  photo: {
                    type: "string",
                    format: "binary",
                    description: "jpg、jpeg、png 或 webp，最大 5MB"
                  }
                },
                required: ["photo"]
              }
            }
          }
        },
        responses: {
          "201": {
            description: "上传成功",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/UploadPhotoResponse" }
              }
            }
          },
          "400": { description: "文件类型或请求格式不合法" },
          "413": { description: "文件超过 5MB" }
        }
      }
    },
    "/uploads/photos/{fileName}": {
      get: {
        tags: ["Uploads"],
        summary: "读取本地上传照片",
        parameters: [{ name: "fileName", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "图片文件" },
          "404": { description: "图片不存在" }
        }
      }
    },
    "/openapi.json": {
      get: {
        tags: ["System"],
        summary: "OpenAPI JSON",
        responses: {
          "200": {
            description: "OpenAPI 规范"
          }
        }
      }
    },
    "/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "用户名密码登录",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LoginRequest" }
            }
          }
        },
        responses: {
          "200": {
            description: "登录成功"
          },
          "401": {
            description: "用户名或密码错误",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } }
          }
        }
      }
    },
    "/auth/me": {
      get: {
        tags: ["Auth"],
        summary: "当前用户",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "当前用户" },
          "401": { description: "未登录" }
        }
      }
    },
    "/parent/dashboard": {
      get: {
        tags: ["Parent"],
        summary: "家长今日看板",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "今日看板" },
          "403": { description: "非家长用户" }
        }
      }
    },
    "/points/account": {
      get: {
        tags: ["Points"],
        summary: "积分账户和流水",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "childUserId",
            in: "query",
            required: false,
            schema: { type: "string" },
            description: "家长必传；孩子端忽略并只返回自己的账户。"
          }
        ],
        responses: {
          "200": {
            description: "积分账户和流水",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    account: { $ref: "#/components/schemas/PointAccount" },
                    ledger: { type: "array", items: { $ref: "#/components/schemas/PointLedger" } }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/wishes": {
      get: {
        tags: ["Wishes"],
        summary: "愿望列表",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "childUserId", in: "query", required: false, schema: { type: "string" } }
        ],
        responses: {
          "200": { description: "愿望列表" }
        }
      },
      post: {
        tags: ["Wishes"],
        summary: "孩子提交愿望",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateWishRequest" }
            }
          }
        },
        responses: {
          "201": { description: "愿望创建成功" },
          "403": { description: "非孩子用户" }
        }
      }
    },
    "/wishes/{wishId}/approve": {
      patch: {
        tags: ["Wishes"],
        summary: "家长设置愿望积分并通过",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "wishId", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ApproveWishRequest" }
            }
          }
        },
        responses: {
          "200": { description: "审批成功" },
          "409": { description: "愿望当前状态不可审批" }
        }
      }
    },
    "/wishes/{wishId}/reject": {
      patch: {
        tags: ["Wishes"],
        summary: "家长驳回愿望",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "wishId", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RejectWishRequest" }
            }
          }
        },
        responses: {
          "200": { description: "驳回成功" },
          "409": { description: "愿望当前状态不可驳回" }
        }
      }
    },
    "/wishes/{wishId}/redeem-requests": {
      post: {
        tags: ["Wishes"],
        summary: "孩子申请兑换愿望",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "wishId", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "兑换申请成功" },
          "409": { description: "愿望不可兑换或积分不足" }
        }
      }
    },
    "/wishes/{wishId}/redeem-confirmations": {
      post: {
        tags: ["Wishes"],
        summary: "家长确认兑换愿望",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "wishId", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "兑换确认成功并扣减积分" },
          "409": { description: "愿望当前状态不可确认或积分不足" }
        }
      }
    },
    "/wishes/{wishId}": {
      get: {
        tags: ["Wishes"],
        summary: "获取单个愿望",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "wishId", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "愿望详情" },
          "403": { description: "愿望不在当前家庭或孩子范围内" },
          "404": { description: "愿望不存在" }
        }
      },
      patch: {
        tags: ["Wishes"],
        summary: "孩子修改被驳回的心愿",
        description: "仅心愿所有者孩子可调用；仅 `rejected` 状态可编辑；保存后状态重置为 `pending_review`，并清空所需积分、家长记录和驳回原因。",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "wishId", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdateWishRequest" }
            }
          }
        },
        responses: {
          "200": { description: "修改成功" },
          "403": { description: "非孩子用户或心愿不在该孩子下" },
          "409": { description: "仅 `rejected` 状态的心愿可被修改" }
        }
      },
      delete: {
        tags: ["Wishes"],
        summary: "删除心愿",
        description: "孩子和家长的删除入口共用该接口：孩子仅可删除自己的 `rejected` 心愿；家长仅可删除当前家庭内孩子的 `redeemed` 心愿。物理删除该心愿记录。",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "wishId", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "204": { description: "删除成功" },
          "403": { description: "角色不支持删除、家长跨家庭访问或孩子跨孩子访问" },
          "404": { description: "愿望不存在" },
          "409": { description: "当前角色对应的状态不允许删除（孩子仅 rejected、家长仅 redeemed）" }
        }
      }
    },
    "/tasks/today": {
      get: {
        tags: ["Tasks"],
        summary: "今日任务列表",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "includeOverdueIncomplete",
            in: "query",
            required: false,
            schema: { type: "boolean", default: false },
            description: "孩子端可传 true，同时返回逾期且仍需孩子处理的 pending/needs_resubmit 任务。"
          },
          {
            name: "includeCompleted",
            in: "query",
            required: false,
            schema: { type: "boolean", default: false },
            description: "孩子端可传 true，同时返回孩子已提交或已确认的 submitted/ai_checking/parent_review/confirmed 任务。"
          }
        ],
        responses: {
          "200": { description: "今日任务列表" }
        }
      }
    },
    "/tasks/calendar": {
      get: {
        tags: ["Tasks"],
        summary: "月视图任务列表",
        description: "家长返回当前家庭该月份全部任务；孩子只返回分配给自己的该月份任务。日历仍返回已归档任务，并通过 isArchived/archivedAt 标记。",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "month",
            in: "query",
            required: true,
            schema: { type: "string", pattern: "^\\d{4}-\\d{2}$" },
            description: "月份，格式 YYYY-MM。"
          }
        ],
        responses: {
          "200": { description: "月视图任务列表" },
          "400": { description: "月份参数格式错误" }
        }
      }
    },
    "/tasks/history": {
      get: {
        tags: ["Tasks"],
        summary: "历史任务列表",
        description:
          "返回已归档任务。归档规则为任务状态 confirmed，且家长确认通过时间超过 7 天；归档只影响展示，不改变任务状态或积分流水。",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "childUserId",
            in: "query",
            required: false,
            schema: { type: "string" },
            description: "仅家长端使用；筛选当前家庭内某个孩子的历史任务。孩子端传其他孩子 ID 会返回 403。"
          },
          {
            name: "startDate",
            in: "query",
            required: false,
            schema: { type: "string", format: "date" },
            description: "按任务 dueDate 起始日期筛选，格式 YYYY-MM-DD。"
          },
          {
            name: "endDate",
            in: "query",
            required: false,
            schema: { type: "string", format: "date" },
            description: "按任务 dueDate 结束日期筛选，格式 YYYY-MM-DD。"
          }
        ],
        responses: {
          "200": { description: "历史任务列表" },
          "400": { description: "查询参数格式错误" },
          "403": { description: "孩子跨孩子访问，或家长筛选非当前家庭孩子" }
        }
      }
    },
    "/tasks": {
      post: {
        tags: ["Tasks"],
        summary: "家长创建任务",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateTaskRequest" }
            }
          }
        },
        responses: {
          "201": { description: "创建成功" },
          "403": { description: "非家长用户" }
        }
      }
    },
    "/tasks/{taskId}": {
      get: {
        tags: ["Tasks"],
        summary: "任务详情",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "taskId", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "任务详情" },
          "404": { description: "任务不存在" }
        }
      },
      patch: {
        tags: ["Tasks"],
        summary: "家长编辑未完成任务",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "taskId", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateTaskRequest" }
            }
          }
        },
        responses: {
          "200": { description: "编辑成功" },
          "409": { description: "任务不可编辑" }
        }
      },
      delete: {
        tags: ["Tasks"],
        summary: "家长删除未完成任务",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "taskId", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "204": { description: "删除成功" },
          "409": { description: "任务不可删除" }
        }
      }
    },
    "/tasks/{taskId}/submissions": {
      post: {
        tags: ["Tasks"],
        summary: "孩子提交打卡",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "taskId", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/SubmitTaskRequest" }
            }
          }
        },
        responses: {
          "201": { description: "提交成功" },
          "409": { description: "任务当前状态不可提交" }
        }
      }
    },
    "/tasks/{taskId}/reviews": {
      post: {
        tags: ["Tasks"],
        summary: "家长审核提交",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "taskId", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ReviewTaskRequest" }
            }
          }
        },
        responses: {
          "201": { description: "审核成功" },
          "404": { description: "任务或提交不存在" }
        }
      }
    }
  }
} as const;
