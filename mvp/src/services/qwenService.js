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
}

module.exports = new QwenService();