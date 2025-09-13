const qwenService = require('./qwenService');

class RequirementSplittingService {
  constructor() {
    this.maxRetries = 3;
  }

  // AI分析项目并生成Epic建议
  async generateEpicSuggestions(projectName, requirementSummary, techStack) {
    const systemPrompt = {
      role: 'system',
      content: `你是一个专业的系统架构师。基于项目需求和技术选型，将项目拆分为Epic层级的业务服务边界。

Epic拆分原则：
1. 每个Epic代表一个独立的业务服务边界
2. Epic之间应该低耦合，高内聚
3. 考虑技术选型的架构特点
4. 优先考虑核心业务流程
5. 每个Epic应该能够独立开发和部署

输出要求：
- 严格按照JSON格式输出
- 每个Epic包含：name, description, service_boundary, dependencies, capabilities, domain_models, integration_contracts
- dependencies是依赖的其他Epic名称数组
- capabilities是对外提供的能力描述数组
- domain_models是核心领域模型数组
- integration_contracts是集成契约描述数组

请严格按照以下JSON格式输出（不要添加任何其他文字）：

[
  {
    "name": "Epic名称",
    "description": "Epic描述",
    "service_boundary": "业务服务边界描述",
    "dependencies": ["依赖的Epic名称"],
    "capabilities": [
      {
        "endpoint_prefix": "/api/xxx/*",
        "description": "能力描述"
      }
    ],
    "domain_models": [
      {
        "name": "模型名称",
        "fields": ["字段1", "字段2"]
      }
    ],
    "integration_contracts": [
      "集成契约描述1",
      "集成契约描述2"
    ]
  }
]`
    };

    const projectInfo = `项目名称：${projectName}
需求总结：${requirementSummary}
技术选型：${this.formatTechStack(techStack)}`;

    const messages = [systemPrompt, { role: 'user', content: projectInfo }];
    
    try {
      const response = await qwenService.chat(messages, { temperature: 0.3 });
      return this.parseEpicSuggestions(response);
    } catch (error) {
      console.error('Generate epic suggestions error:', error);
      throw new Error(`AI生成Epic建议失败: ${error.message}`);
    }
  }

  // AI为Epic生成Story建议
  async generateStorySuggestions(epic, projectContext) {
    const systemPrompt = {
      role: 'system',
      content: `你是一个专业的产品经理和技术架构师。基于Epic信息，拆分出具体的Story（用户故事）。

Story拆分原则：
1. 每个Story是一个完整的用户功能
2. Story应该包含完整的技术实现规格
3. 遵循INVEST原则（独立、可协商、有价值、可估算、小、可测试）
4. 考虑前后端分离的开发模式
5. 每个Story都要有明确的验收标准

输出要求：
- 严格按照JSON格式输出
- 每个Story包含完整的技术规格：title, user_story, backend_api, database_design, frontend_specification, acceptance_criteria, mock_contracts, estimated_hours
- backend_api包含完整的API设计
- database_design包含数据表设计
- frontend_specification包含组件、路由、状态管理设计
- acceptance_criteria包含6个维度：functional, ui, performance, compatibility, error_handling, security
- mock_contracts包含Mock数据定义

请严格按照以下JSON格式输出（不要添加任何其他文字）：

[
  {
    "title": "Story标题",
    "user_story": "作为[角色]，我希望[功能]，以便[价值]",
    "backend_api": {
      "endpoint": "HTTP方法 /api/path",
      "request_schema": {},
      "response_schema": {},
      "business_rules": []
    },
    "database_design": {
      "tables": [
        {
          "name": "表名",
          "fields": ["字段定义"],
          "indexes": ["索引定义"]
        }
      ]
    },
    "frontend_specification": {
      "components": [],
      "routes": [],
      "state_management": {}
    },
    "acceptance_criteria": {
      "functional": [],
      "ui": [],
      "performance": [],
      "compatibility": [],
      "error_handling": [],
      "security": []
    },
    "mock_contracts": {},
    "estimated_hours": 8
  }
]`
    };

    const epicInfo = `Epic信息：
名称：${epic.name}
描述：${epic.description}
服务边界：${epic.service_boundary}
领域模型：${JSON.stringify(epic.domain_models, null, 2)}
对外能力：${JSON.stringify(epic.capabilities, null, 2)}

项目上下文：
${projectContext}`;

    const messages = [systemPrompt, { role: 'user', content: epicInfo }];
    
    try {
      const response = await qwenService.chat(messages, { 
        temperature: 0.3,
        maxTokens: 2000 
      });
      return this.parseStorySuggestions(response);
    } catch (error) {
      console.error('Generate story suggestions error:', error);
      throw new Error(`AI生成Story建议失败: ${error.message}`);
    }
  }

  // 格式化技术选型信息
  formatTechStack(techStack) {
    if (!techStack || !techStack.tech_choices) {
      return '未指定技术选型';
    }

    return techStack.tech_choices
      .map(choice => `${choice.category}: ${choice.technology}`)
      .join('\n');
  }

  // 解析Epic建议
  parseEpicSuggestions(aiResponse) {
    try {
      // 尝试直接解析JSON
      const suggestions = JSON.parse(aiResponse);
      if (Array.isArray(suggestions) && suggestions.length > 0) {
        return suggestions.map(epic => ({
          ...epic,
          priority: 1,
          status: 'not_started'
        }));
      }
    } catch (error) {
      console.error('Failed to parse epic suggestions as JSON:', error);
    }
    
    // 如果解析失败，返回默认建议
    return this.getDefaultEpicSuggestions();
  }

  // 解析Story建议
  parseStorySuggestions(aiResponse) {
    try {
      // 尝试直接解析JSON
      const suggestions = JSON.parse(aiResponse);
      if (Array.isArray(suggestions) && suggestions.length > 0) {
        return suggestions.map(story => ({
          ...story,
          priority: 1,
          status: 'not_started'
        }));
      }
    } catch (error) {
      console.error('Failed to parse story suggestions as JSON:', error);
    }
    
    // 如果解析失败，返回默认建议
    return this.getDefaultStorySuggestions();
  }

  // 默认Epic建议（当AI解析失败时使用）
  getDefaultEpicSuggestions() {
    return [
      {
        name: '用户管理系统',
        description: '负责用户注册、登录、权限管理等核心功能',
        service_boundary: '用户认证、权限控制、用户信息管理',
        dependencies: [],
        capabilities: [
          {
            endpoint_prefix: '/api/auth/*',
            description: '用户认证相关接口'
          },
          {
            endpoint_prefix: '/api/users/*',
            description: '用户信息管理接口'
          }
        ],
        domain_models: [
          {
            name: 'User',
            fields: ['id', 'email', 'name', 'role', 'status']
          }
        ],
        integration_contracts: [
          '其他服务通过JWT token验证用户身份',
          '用户信息查询统一通过用户服务接口'
        ],
        priority: 1,
        status: 'not_started'
      }
    ];
  }

  // 默认Story建议（当AI解析失败时使用）
  getDefaultStorySuggestions() {
    return [
      {
        title: '用户登录功能',
        user_story: '作为用户，我希望能够通过邮箱和密码登录系统，以便访问个人功能',
        backend_api: {
          endpoint: 'POST /api/auth/login',
          request_schema: {
            email: { type: 'string', format: 'email', required: true },
            password: { type: 'string', minLength: 6, required: true }
          },
          response_schema: {
            success_200: {
              access_token: 'string',
              user: { id: 'string', email: 'string', name: 'string' }
            },
            error_401: {
              message: '邮箱或密码错误'
            }
          },
          business_rules: [
            '密码错误3次后锁定账户5分钟',
            'JWT token有效期24小时'
          ]
        },
        database_design: {
          tables: [
            {
              name: 'users',
              fields: ['id(UUID)', 'email(VARCHAR)', 'password_hash(VARCHAR)', 'name(VARCHAR)', 'status(ENUM)'],
              indexes: ['email(UNIQUE)', 'status']
            }
          ]
        },
        frontend_specification: {
          components: [
            {
              component: 'LoginForm',
              layout: '居中卡片布局，最大宽度400px',
              fields: [
                { email: { type: 'input', placeholder: '请输入邮箱' } },
                { password: { type: 'password', placeholder: '请输入密码' } }
              ]
            }
          ],
          routes: [
            { path: '/login', component: 'LoginPage' }
          ],
          state_management: {
            store: 'authStore',
            state: ['user', 'isLoggedIn', 'loginLoading']
          }
        },
        acceptance_criteria: {
          functional: [
            '用户输入正确的邮箱和密码，能够成功登录',
            '用户输入错误的邮箱或密码，显示错误提示'
          ],
          ui: [
            '登录表单居中显示，最大宽度400px',
            '输入框有合适的placeholder和验证提示'
          ],
          performance: [
            '登录接口响应时间不超过2秒',
            '页面加载时间不超过3秒'
          ],
          compatibility: [
            '支持主流浏览器最新版本',
            '移动端适配'
          ],
          error_handling: [
            '网络错误时显示友好提示',
            '服务器错误时显示重试选项'
          ],
          security: [
            '密码传输加密',
            '防止暴力破解'
          ]
        },
        mock_contracts: {
          'POST /api/auth/login': {
            success_response: {
              access_token: 'mock_jwt_token_xxxxx',
              user: { id: 'uuid-1234', email: 'test@example.com', name: '测试用户' }
            }
          }
        },
        estimated_hours: 8,
        priority: 1,
        status: 'not_started'
      }
    ];
  }

  // 验证Epic数据完整性
  validateEpicData(epic) {
    const required = ['name', 'description', 'service_boundary'];
    for (const field of required) {
      if (!epic[field] || epic[field].trim() === '') {
        throw new Error(`Epic缺少必需字段: ${field}`);
      }
    }
    return true;
  }

  // 验证Story数据完整性
  validateStoryData(story) {
    const required = ['title', 'user_story', 'backend_api', 'database_design', 'frontend_specification', 'acceptance_criteria'];
    for (const field of required) {
      if (!story[field]) {
        throw new Error(`Story缺少必需字段: ${field}`);
      }
    }
    return true;
  }
}

module.exports = new RequirementSplittingService();