const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'ReqFlow MVP API',
      version: '1.0.0',
      description: 'ReqFlow项目管理平台MVP版本API文档',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: '开发环境',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            name: { type: 'string' },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        Project: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            user_id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            description: { type: 'string' },
            current_stage: { 
              type: 'string',
              enum: ['created', 'clarifying', 'tech_selecting', 'tech_selected', 'requirement_splitting', 'development', 'completed']
            },
            requirement_summary: { type: 'string' },
            tech_stack: { type: 'object' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },
        Conversation: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            project_id: { type: 'string', format: 'uuid' },
            conversation_type: {
              type: 'string',
              enum: ['requirement_clarification', 'tech_selection']
            },
            messages: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  role: { type: 'string', enum: ['user', 'ai'] },
                  content: { type: 'string' },
                  timestamp: { type: 'string', format: 'date-time' },
                },
              },
            },
            is_completed: { type: 'boolean' },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        TechChoice: {
          type: 'object',
          properties: {
            category: { 
              type: 'string',
              example: '前端框架'
            },
            technology: { 
              type: 'string',
              example: 'Vue 3 + TypeScript'
            },
            reason: { 
              type: 'string',
              example: '现代化MVVM框架，TypeScript提供强类型支持'
            },
          },
          required: ['category', 'technology', 'reason']
        },
        TechStack: {
          type: 'object',
          properties: {
            selection_mode: {
              type: 'string',
              enum: ['user_defined', 'ai_generated'],
              description: '技术选型模式：user_defined=朕说了算，ai_generated=Vibe一下'
            },
            tech_choices: {
              type: 'array',
              items: { $ref: '#/components/schemas/TechChoice' }
            },
            ai_suggestions: {
              type: 'string',
              description: 'AI的建议和说明'
            },
            created_at: { 
              type: 'string', 
              format: 'date-time' 
            },
          },
          required: ['selection_mode', 'tech_choices', 'created_at']
        },
        Epic: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            project_id: { type: 'string', format: 'uuid' },
            name: { 
              type: 'string',
              example: '用户管理系统'
            },
            description: { 
              type: 'string',
              example: '负责用户注册、登录、权限管理等核心功能'
            },
            service_boundary: { 
              type: 'string',
              example: '用户认证、权限控制、用户信息管理'
            },
            dependencies: {
              type: 'array',
              items: { type: 'string' },
              example: ['其他Epic名称']
            },
            capabilities: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  endpoint_prefix: { type: 'string', example: '/api/auth/*' },
                  description: { type: 'string', example: '用户认证相关接口' }
                }
              }
            },
            domain_models: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string', example: 'User' },
                  fields: { 
                    type: 'array', 
                    items: { type: 'string' },
                    example: ['id', 'email', 'name', 'role']
                  }
                }
              }
            },
            integration_contracts: {
              type: 'array',
              items: { type: 'string' },
              example: ['其他服务通过JWT token验证用户身份']
            },
            priority: { 
              type: 'integer',
              minimum: 1,
              maximum: 5,
              example: 1
            },
            status: {
              type: 'string',
              enum: ['not_started', 'in_progress', 'completed'],
              example: 'not_started'
            },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },
        Story: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            epic_id: { type: 'string', format: 'uuid' },
            project_id: { type: 'string', format: 'uuid' },
            title: { 
              type: 'string',
              example: '用户登录功能'
            },
            user_story: { 
              type: 'string',
              example: '作为用户，我希望能够通过邮箱和密码登录系统，以便访问个人功能'
            },
            backend_api: {
              type: 'object',
              properties: {
                endpoint: { type: 'string', example: 'POST /api/auth/login' },
                request_schema: { type: 'object' },
                response_schema: { type: 'object' },
                business_rules: { 
                  type: 'array', 
                  items: { type: 'string' },
                  example: ['JWT token有效期24小时']
                }
              }
            },
            database_design: {
              type: 'object',
              properties: {
                tables: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      name: { type: 'string', example: 'users' },
                      fields: { 
                        type: 'array', 
                        items: { type: 'string' },
                        example: ['id(UUID)', 'email(VARCHAR)', 'password_hash(VARCHAR)']
                      },
                      indexes: { 
                        type: 'array', 
                        items: { type: 'string' },
                        example: ['email(UNIQUE)']
                      }
                    }
                  }
                }
              }
            },
            frontend_specification: {
              type: 'object',
              properties: {
                components: { type: 'array', items: { type: 'object' } },
                routes: { type: 'array', items: { type: 'object' } },
                state_management: { type: 'object' }
              }
            },
            acceptance_criteria: {
              type: 'object',
              properties: {
                functional: { 
                  type: 'array', 
                  items: { type: 'string' },
                  example: ['用户输入正确的邮箱和密码，能够成功登录']
                },
                ui: { 
                  type: 'array', 
                  items: { type: 'string' },
                  example: ['登录表单居中显示，最大宽度400px']
                },
                performance: { 
                  type: 'array', 
                  items: { type: 'string' },
                  example: ['登录接口响应时间不超过2秒']
                },
                compatibility: { 
                  type: 'array', 
                  items: { type: 'string' },
                  example: ['支持主流浏览器最新版本']
                },
                error_handling: { 
                  type: 'array', 
                  items: { type: 'string' },
                  example: ['网络错误时显示友好提示']
                },
                security: { 
                  type: 'array', 
                  items: { type: 'string' },
                  example: ['密码传输加密']
                }
              }
            },
            mock_contracts: {
              type: 'object',
              example: {
                'POST /api/auth/login': {
                  success_response: {
                    access_token: 'mock_jwt_token_xxxxx',
                    user: { id: 'uuid-1234', email: 'test@example.com' }
                  }
                }
              }
            },
            priority: { 
              type: 'integer',
              minimum: 1,
              maximum: 5,
              example: 1
            },
            status: {
              type: 'string',
              enum: ['not_started', 'in_progress', 'completed'],
              example: 'not_started'
            },
            estimated_hours: { 
              type: 'integer',
              example: 8
            },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },
        RequirementSplittingSession: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            project_id: { type: 'string', format: 'uuid' },
            ai_analysis: {
              type: 'object',
              properties: {
                project_analysis: { 
                  type: 'string',
                  example: '基于需求总结和技术选型，AI识别出5个核心业务领域'
                },
                tech_considerations: { type: 'string' },
                splitting_strategy: { type: 'string' },
                generated_at: { type: 'string', format: 'date-time' }
              }
            },
            epic_suggestions: {
              type: 'array',
              items: { $ref: '#/components/schemas/Epic' }
            },
            story_suggestions: {
              type: 'array',
              items: { $ref: '#/components/schemas/Story' }
            },
            user_feedback: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  type: { type: 'string', example: 'epic_regeneration' },
                  content: { type: 'string' },
                  timestamp: { type: 'string', format: 'date-time' }
                }
              }
            },
            is_completed: { type: 'boolean' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.js'],
};

const specs = swaggerJsdoc(options);
module.exports = specs;