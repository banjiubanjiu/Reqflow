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
              enum: ['created', 'clarifying', 'tech_selecting', 'requirement_splitting', 'completed']
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