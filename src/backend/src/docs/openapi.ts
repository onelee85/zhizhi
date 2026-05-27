export const openApiSpec = {
  openapi: "3.1.0",
  info: {
    title: "知知小助手后端 API",
    version: "0.1.0",
    description: "阶段 1 后端接口，当前使用 MySQL 实现登录、任务、打卡提交和家长审核。"
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
    { name: "Tasks", description: "任务接口" }
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
          status: {
            type: "string",
            enum: ["pending", "submitted", "ai_checking", "parent_review", "confirmed", "needs_resubmit"]
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
          needAiCheck: { type: "boolean", default: false }
        },
        required: ["childUserId", "subject", "taskType", "title", "description", "dueDate"]
      },
      SubmitTaskRequest: {
        type: "object",
        properties: {
          completed: { type: "boolean", const: true },
          imageUrls: {
            type: "array",
            minItems: 1,
            maxItems: 9,
            items: { type: "string", format: "uri" }
          },
          childNote: { type: "string", maxLength: 500 }
        },
        required: ["completed", "imageUrls"]
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
                imageUrl: { type: "string", format: "uri" },
                imageThumbUrl: { type: "string", format: "uri" },
                sortOrder: { type: "integer" },
                uploadStatus: { type: "string", enum: ["uploaded"] },
                createdAt: { type: "string", format: "date-time" }
              }
            }
          }
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
    "/tasks/today": {
      get: {
        tags: ["Tasks"],
        summary: "今日任务列表",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "今日任务列表" }
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
