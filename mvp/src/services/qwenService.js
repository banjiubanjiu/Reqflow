const axios = require('axios');

class QwenService {
  constructor() {
    this.apiKey = process.env.QWEN_API_KEY;
    this.baseURL = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation';
    
    if (!this.apiKey) {
      throw new Error('QWEN_API_KEY is required');
    }
  }

  async chat(messages, options = {}) {
    const {
      model = 'qwen-max',
      maxTokens = 800,
      temperature = 0.7
    } = options;

    try {
      console.log('Calling Qwen API with:', { model, messages: messages.slice(-1) });
      
      const response = await axios.post(this.baseURL, {
        model,
        input: { messages },
        parameters: {
          result_format: 'message',
          max_tokens: maxTokens,
          temperature
        }
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 90000 // 增加到90秒，为AI处理复杂任务留出更多时间
      });

      console.log('Qwen API Response status:', response.status);
      return response.data.output.choices[0].message.content;
    } catch (error) {
      console.error('Qwen API Error Details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        url: this.baseURL,
        apiKey: this.apiKey ? `${this.apiKey.substring(0, 10)}...` : 'NOT SET'
      });
      
      throw new Error(`AI服务调用失败: ${error.response?.data?.message || error.message}`);
    }
  }

  // 需求澄清对话
  async clarifyRequirement(userInput, conversationHistory = []) {
    const systemPrompt = {
      role: 'system',
      content: `你是一个专业的需求分析师。请基于用户的项目描述，提出一个具体的问题来澄清需求。
      
规则：
1. 每次只问一个问题
2. 问题要具体、有针对性
3. 避免技术术语，用通俗易懂的语言
4. 如果需求已经足够明确，回复"需求澄清完成"`
    };

    // 转换历史消息格式，确保符合API要求
    const formattedHistory = conversationHistory.map(msg => ({
      role: msg.role === 'ai' ? 'assistant' : 'user',
      content: msg.content
    }));

    const messages = [systemPrompt, ...formattedHistory, { role: 'user', content: userInput }];
    return await this.chat(messages);
  }

  // AI生成技术选型（Vibe一下模式）
  async generateTechStack(projectName, projectDescription, requirementSummary) {
    const systemPrompt = {
      role: 'system',
      content: `你是一个技术架构师。基于项目信息生成合适的技术选型方案。

技术选型原则：
1. 优先采用前后端分离架构
2. 必须包含Swagger UI进行API文档管理
3. 前端必须使用UI组件库（Element Plus、Ant Design等）
4. 体现"够用就好"理念，避免过度设计
5. 考虑开发效率和技术成熟度

输出要求：
- 严格按照表格格式输出
- 控制在30行以内
- 每个技术选择都要有具体理由
- 分类包含：前端框架、后端框架、数据库、UI组件库、部署方案等

请严格按照以下格式输出（不要添加任何其他文字或说明）：

| 分类 | 技术选择 | 选择理由 |
|------|----------|----------|
| 前端框架 | Vue 3 + TypeScript | 现代化MVVM框架，TypeScript提供强类型支持 |
| 后端框架 | Node.js + Express | 轻量级，开发效率高，生态丰富 |
| 数据库 | Supabase (PostgreSQL) | 云数据库，提供实时API和认证功能 |
| UI组件库 | Element Plus | 成熟的Vue 3组件库，管理后台风格 |
| API文档 | Swagger UI | 自动生成API文档，支持在线测试 |
| 部署方案 | Vercel + Railway | 前端静态托管，后端容器化部署 |

重要：
1. 必须包含至少6个技术分类
2. 每行必须严格按照表格格式
3. 不要添加额外的文字说明
4. 确保所有"|"符号对齐`
    };

    const projectInfo = `项目名称：${projectName}
项目描述：${projectDescription}
需求总结：${requirementSummary || '待补充'}`;

    const messages = [systemPrompt, { role: 'user', content: projectInfo }];
    return await this.chat(messages);
  }

  // AI优化用户技术选型（朕说了算模式）
  async optimizeTechStack(userTechStack, projectName, requirementSummary) {
    const systemPrompt = {
      role: 'system',
      content: `你是一个技术架构师。用户已经提供了他们的技术选型方案，请给出专业的优化建议。

优化原则：
1. 尊重用户的技术偏好
2. 指出潜在问题和改进空间
3. 推荐更合适的替代方案（如果有）
4. 确保符合前后端分离、Swagger UI、UI组件库等基本要求
5. 考虑技术栈之间的兼容性

输出格式：
- 首先以表格形式展示优化后的技术选型
- 然后简要说明主要的优化建议和理由
- 保持建议的实用性和可执行性

请严格按照以下格式输出：

## 优化后的技术选型

| 分类 | 技术选择 | 选择理由 |
|------|----------|----------|
| [继续用户的分类，或补充缺失的分类] | [原选择或优化建议] | [具体理由] |

## 优化建议
- 建议1：具体的优化理由
- 建议2：技术替换的必要性`
    };

    const userInput = `项目名称：${projectName}
需求总结：${requirementSummary || '待补充'}
用户的技术选型方案：
${userTechStack}`;

    const messages = [systemPrompt, { role: 'user', content: userInput }];
    return await this.chat(messages);
  }

  // 解析AI返回的表格格式技术选型，转换为结构化数据
  parseTechStackTable(aiResponse, selectionMode = 'ai_generated') {
    try {
      const lines = aiResponse.split('\n').filter(line => line.trim());
      const techChoices = [];
      let aiSuggestions = '';
      let isInSuggestions = false;
      let tableFound = false;

      for (const line of lines) {
        const trimmedLine = line.trim();
        
        // 检测优化建议部分
        if (trimmedLine.includes('## 优化建议') || 
            trimmedLine.includes('优化建议') ||
            trimmedLine.includes('## 建议') ||
            trimmedLine.includes('建议：')) {
          isInSuggestions = true;
          continue;
        }
        
        // 收集优化建议
        if (isInSuggestions && trimmedLine) {
          aiSuggestions += trimmedLine + '\n';
          continue;
        }
        
        // 解析表格行 - 更宽松的检测条件
        if (trimmedLine.includes('|') && !trimmedLine.includes('---')) {
          const parts = trimmedLine.split('|').map(part => part.trim()).filter(part => part);
          
          // 跳过表头
          if (parts.length >= 3 && 
              !parts[0].includes('分类') && 
              !parts[1].includes('技术选择') &&
              parts[0] && parts[1] && parts[2]) {
            
            const [category, technology, reason] = parts;
            techChoices.push({
              category: category,
              technology: technology, 
              reason: reason
            });
            tableFound = true;
          }
        }
      }

      // 如果没有找到表格，尝试从文本中提取技术信息
      if (!tableFound) {
        console.log('No table found, trying to extract from text...');
        const fallbackChoices = this.extractTechFromText(aiResponse);
        if (fallbackChoices.length > 0) {
          techChoices.push(...fallbackChoices);
        }
      }

      const result = {
        selection_mode: selectionMode,
        tech_choices: techChoices.length > 0 ? techChoices : this.getDefaultTechChoices(),
        created_at: new Date().toISOString(),
        ai_suggestions: aiSuggestions.trim() || aiResponse
      };

      console.log('Parsed tech stack:', JSON.stringify(result, null, 2));
      return result;
      
    } catch (error) {
      console.error('Failed to parse tech stack table:', error);
      
      // 返回更有用的备用结构
      return {
        selection_mode: selectionMode,
        tech_choices: this.getDefaultTechChoices(),
        created_at: new Date().toISOString(),
        ai_suggestions: aiResponse,
        parsing_error: true
      };
    }
  }

  // 从文本中提取技术信息的备用方法
  extractTechFromText(text) {
    const choices = [];
    const lines = text.split('\n');
    
    // 查找包含技术栈信息的行
    const techPatterns = [
      /(?:前端|后端|数据库|UI|框架|库).*?[:：]\s*(.+)/i,
      /(\w+(?:\s+\w+)*)\s*[-–—]\s*(.+)/,
      /(Vue|React|Node\.js|Express|MySQL|PostgreSQL|Redis|Docker|Nginx).*?[-–—:]?\s*(.+)/i
    ];
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      
      for (const pattern of techPatterns) {
        const match = trimmed.match(pattern);
        if (match) {
          choices.push({
            category: this.categorizeFromText(match[1] || match[0]),
            technology: match[1] || match[0],
            reason: match[2] || '基于AI建议'
          });
          break;
        }
      }
    }
    
    return choices.slice(0, 8); // 限制数量
  }

  // 根据文本内容分类技术
  categorizeFromText(tech) {
    const tech_lower = tech.toLowerCase();
    if (tech_lower.includes('vue') || tech_lower.includes('react') || tech_lower.includes('angular')) {
      return '前端框架';
    }
    if (tech_lower.includes('node') || tech_lower.includes('express') || tech_lower.includes('spring')) {
      return '后端框架';
    }
    if (tech_lower.includes('mysql') || tech_lower.includes('postgres') || tech_lower.includes('mongo')) {
      return '数据库';
    }
    if (tech_lower.includes('element') || tech_lower.includes('ant') || tech_lower.includes('ui')) {
      return 'UI组件库';
    }
    return '其他';
  }

  // 获取默认技术选型（当解析完全失败时使用）
  getDefaultTechChoices() {
    return [
      {
        category: '前端框架',
        technology: 'Vue 3 + TypeScript',
        reason: '现代化MVVM框架，TypeScript提供强类型支持'
      },
      {
        category: '后端框架',
        technology: 'Node.js + Express',
        reason: '轻量级，开发效率高，生态丰富'
      },
      {
        category: '数据库',
        technology: 'Supabase (PostgreSQL)',
        reason: '云数据库，提供实时API和认证功能'
      },
      {
        category: 'UI组件库',
        technology: 'Element Plus',
        reason: '成熟的Vue 3组件库，管理后台风格'
      }
    ];
  }

  // 生成对话开场问题
  async generateInitialQuestion(projectName, projectDescription, conversationType) {
    if (conversationType === 'requirement_clarification') {
      const systemPrompt = {
        role: 'system',
        content: `你是一个专业的需求分析师。用户刚创建了一个项目，现在需要你主动开始需求澄清对话。

项目信息：
- 项目名称：${projectName}
- 项目描述：${projectDescription}

任务要求：
1. 基于用户的项目描述，提出第一个具体的澄清问题
2. 问题要具体、有针对性，帮助深入了解需求
3. 使用友好、专业的语调
4. 遵循深度遍历原则，从核心功能开始
5. 避免技术术语，用通俗易懂的语言
6. 问题要开放式，鼓励用户详细描述

请直接输出你要问的问题，不要添加其他格式或说明。`
      };

      const messages = [systemPrompt, { 
        role: 'user', 
        content: `我想创建一个项目：${projectName}。${projectDescription}` 
      }];
      
      return await this.chat(messages);
      
    } else if (conversationType === 'tech_selection') {
      const systemPrompt = {
        role: 'system',
        content: `你是一个技术架构师。现在需要为用户的项目进行技术选型对话。

项目信息：
- 项目名称：${projectName}
- 项目描述：${projectDescription}

任务要求：
1. 主动开始技术选型对话
2. 询问用户的技术偏好或约束条件
3. 了解项目规模、用户量、性能要求等
4. 语调专业但不过于技术化
5. 优先考虑前后端分离、简单易用的技术栈

请直接输出你要问的第一个问题，不要添加其他格式或说明。`
      };

      const messages = [systemPrompt, { 
        role: 'user', 
        content: `我的项目是：${projectName}。${projectDescription}。现在需要进行技术选型。` 
      }];
      
      return await this.chat(messages);
    }
    
    throw new Error(`Unsupported conversation type: ${conversationType}`);
  }

  // 生成需求总结
  async generateRequirementSummary(conversationMessages) {
    const systemPrompt = {
      role: 'system',
      content: `基于整个需求澄清对话，生成一份简洁的需求总结。

要求：
1. 总结用户的核心需求和功能点
2. 突出关键的业务逻辑和用户场景
3. 控制在200-300字以内
4. 使用清晰的结构化描述
5. 重点关注"什么"而不是"怎么做"

请直接输出需求总结内容，不要添加多余的格式或说明。`
    };

    // 只提取用户和AI的主要对话内容，过滤掉系统消息
    const dialogueContext = conversationMessages
      .map(msg => `${msg.role === 'user' ? '用户' : 'AI'}: ${msg.content}`)
      .join('\n\n');

    const messages = [systemPrompt, { role: 'user', content: dialogueContext }];
    return await this.chat(messages);
  }

  // 生成项目名称建议
  async generateProjectNames(projectDescription) {
    const systemPrompt = {
      role: 'system',
      content: `基于用户的项目描述，生成3个有创意的项目名称建议。每个名称都要附带简短的解释理由。

要求：
1. 名称要简洁、易记、有意义
2. 体现项目的核心功能或特色
3. 避免过于复杂或抽象的词汇
4. 每个名称控制在2-4个字符或单词内

请严格按照以下JSON格式回复（不要添加任何其他文字）：
[
  {
    "name": "项目名称1",
    "reason": "选择理由1"
  },
  {
    "name": "项目名称2", 
    "reason": "选择理由2"
  },
  {
    "name": "项目名称3",
    "reason": "选择理由3"
  }
]`
    };

    const messages = [systemPrompt, { role: 'user', content: projectDescription }];
    const response = await this.chat(messages);
    
    try {
      // 尝试解析JSON响应
      const suggestions = JSON.parse(response);
      if (Array.isArray(suggestions) && suggestions.length > 0) {
        return suggestions;
      }
    } catch (error) {
      console.error('Failed to parse AI response as JSON:', error);
    }
    
    // 如果解析失败，返回备用建议
    return [
      {
        name: "MyProject", 
        reason: "基于您的项目描述生成的通用名称"
      },
      {
        name: "SmartApp", 
        reason: "体现项目的智能化特色"
      },
      {
        name: "FlowSystem", 
        reason: "突出项目的流程管理功能"
      }
    ];
  }
}

module.exports = new QwenService();