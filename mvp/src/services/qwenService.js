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
        timeout: 30000
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

  // 技术选型建议
  async suggestTechStack(requirementSummary) {
    const systemPrompt = {
      role: 'system',
      content: `基于需求描述，推荐合适的技术栈。以表格形式回复，包含：前端、后端、数据库、选择理由。简洁易懂，避免过度技术化。`
    };

    const messages = [systemPrompt, { role: 'user', content: requirementSummary }];
    return await this.chat(messages);
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