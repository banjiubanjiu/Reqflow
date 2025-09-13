const express = require('express');
const supabase = require('../config/supabase');
const qwenService = require('../services/qwenService');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: AI对话
 *   description: AI对话功能，包括需求澄清和技术选型
 */

// 所有对话路由都需要认证
router.use(authenticateToken);

/**
 * @swagger
 * /api/conversations:
 *   post:
 *     tags: [AI对话]
 *     summary: 创建新对话
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - project_id
 *               - conversation_type
 *             properties:
 *               project_id:
 *                 type: string
 *                 format: uuid
 *                 example: "123e4567-e89b-12d3-a456-426614174000"
 *               conversation_type:
 *                 type: string
 *                 enum: [requirement_clarification, tech_selection]
 *                 example: requirement_clarification
 *     responses:
 *       201:
 *         description: 对话创建成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 conversation:
 *                   $ref: '#/components/schemas/Conversation'
 *       400:
 *         description: 请求参数错误
 *       404:
 *         description: 项目不存在
 *       401:
 *         description: 未授权
 */
router.post('/', async (req, res) => {
  try {
    const { project_id, conversation_type } = req.body;

    if (!project_id || !conversation_type) {
      return res.status(400).json({ error: '项目ID和对话类型不能为空' });
    }

    // 验证项目归属并获取项目信息
    const { data: project } = await supabase
      .from('projects')
      .select('id, name, description')
      .eq('id', project_id)
      .eq('user_id', req.user.userId)
      .single();

    if (!project) {
      return res.status(404).json({ error: '项目不存在或无权限访问' });
    }

    // 生成AI开场问题
    let initialQuestion;
    try {
      initialQuestion = await qwenService.generateInitialQuestion(
        project.name, 
        project.description || '', 
        conversation_type
      );
    } catch (aiError) {
      console.error('Generate initial question error:', aiError);
      return res.status(500).json({ 
        error: 'AI服务调用失败，无法开始对话', 
        details: aiError.message 
      });
    }

    // 创建AI开场消息
    const aiMessage = {
      role: 'ai',
      content: initialQuestion,
      timestamp: new Date().toISOString()
    };

    // 创建对话，包含AI的开场消息
    const { data: conversation, error } = await supabase
      .from('ai_conversations')
      .insert([
        {
          project_id,
          conversation_type,
          messages: [aiMessage],
          is_completed: false
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Create conversation error:', error);
      return res.status(500).json({ error: '创建对话失败' });
    }

    // 根据对话类型更新项目状态
    let newStage;
    if (conversation_type === 'requirement_clarification') {
      newStage = 'clarifying';
    } else if (conversation_type === 'tech_selection') {
      newStage = 'tech_selecting';
    }

    if (newStage) {
      const { error: updateError } = await supabase
        .from('projects')
        .update({ 
          current_stage: newStage,
          updated_at: new Date().toISOString()
        })
        .eq('id', project_id);

      if (updateError) {
        console.error('Update project stage error:', updateError);
        // 不返回错误，因为对话已经创建成功
      }
    }

    res.json({
      message: '对话创建成功',
      conversation
    });

  } catch (error) {
    console.error('Create conversation error:', error);
    res.status(500).json({ error: '创建对话失败' });
  }
});

/**
 * @swagger
 * /api/conversations/{id}/tech-selection:
 *   post:
 *     tags: [AI对话]
 *     summary: 技术选型
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 对话ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - mode
 *               - content
 *             properties:
 *               mode:
 *                 type: string
 *                 enum: [vibe, manual]
 *                 description: 技术选型模式
 *               content:
 *                 type: string
 *                 description: 用户输入内容
 *     responses:
 *       200:
 *         description: 技术选型成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 conversation:
 *                   type: object
 *                 ai_reply:
 *                   type: string
 *                 mode:
 *                   type: string
 *       400:
 *         description: 请求参数错误
 *       404:
 *         description: 对话不存在
 *       500:
 *         description: 服务器错误
 */
router.post('/:id/tech-selection', async (req, res) => {
  try {
    const { id } = req.params;
    const { mode, content } = req.body;

    if (!mode || !content) {
      return res.status(400).json({ error: '模式和内容不能为空' });
    }

    if (!['vibe', 'manual'].includes(mode)) {
      return res.status(400).json({ error: '无效的选型模式' });
    }

    // 获取对话信息，确保是技术选型类型
    const { data: conversation, error: getError } = await supabase
      .from('ai_conversations')
      .select(`
        *,
        projects!inner(user_id, name, description, requirement_summary)
      `)
      .eq('id', id)
      .eq('projects.user_id', req.user.userId)
      .eq('conversation_type', 'tech_selection')
      .single();

    if (getError || !conversation) {
      return res.status(404).json({ error: '技术选型对话不存在或无权限访问' });
    }

    if (conversation.is_completed) {
      return res.status(400).json({ error: '对话已完成，无法继续' });
    }

    // 添加用户消息
    const userMessage = {
      role: 'user',
      content: mode === 'manual' ? JSON.stringify({ mode, ...JSON.parse(content) }) : content,
      timestamp: new Date().toISOString(),
      selection_mode: mode
    };

    const updatedMessages = [...conversation.messages, userMessage];

    // 根据模式调用不同的AI服务
    let aiReply;
    try {
      if (mode === 'vibe') {
        // Vibe一下模式 - AI生成技术选型
        aiReply = await qwenService.generateTechStack(
          conversation.projects.name || '项目',
          conversation.projects.description || '',
          conversation.projects.requirement_summary || '待补充',
          content // 传递用户的技术偏好或要求
        );
      } else {
        // 朕说了算模式 - AI优化建议
        const userTechStackData = JSON.parse(content);
        const techStackString = userTechStackData.tech_choices
          .map(choice => `${choice.category}: ${choice.technology} (${choice.reason})`)
          .join('\n');
          
        aiReply = await qwenService.optimizeTechStack(
          techStackString, 
          conversation.projects.name || '项目',
          conversation.projects.requirement_summary || '待补充'
        );
        
        aiReply = `用户技术选型方案已收到。以下是优化建议：\n\n${aiReply}`;
      }
    } catch (aiError) {
      console.error('Tech Selection AI Error:', aiError);
      return res.status(500).json({ 
        error: 'AI技术选型服务调用失败', 
        details: aiError.message 
      });
    }

    // 添加AI消息
    const aiMessage = {
      role: 'ai',
      content: aiReply,
      timestamp: new Date().toISOString(),
      selection_mode: mode
    };

    const finalMessages = [...updatedMessages, aiMessage];

    // 更新对话
    const { data: updatedConversation, error: updateError } = await supabase
      .from('ai_conversations')
      .update({
        messages: finalMessages
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Update tech selection conversation error:', updateError);
      return res.status(500).json({ error: '更新技术选型对话失败' });
    }

    res.json({
      message: '技术选型处理成功',
      conversation: updatedConversation,
      ai_reply: aiReply,
      mode: mode
    });

  } catch (error) {
    console.error('Tech selection error:', error);
    res.status(500).json({ error: '技术选型处理失败' });
  }
});

/**
 * @swagger
 * /api/conversations/{id}/tech-selection:
 *   post:
 *     tags: [AI对话]
 *     summary: 技术选型专用接口
 *     description: |
 *       专门处理技术选型对话，支持两种模式：
 *       - Vibe一下模式：发送文本描述，AI生成技术选型表格
 *       - 朕说了算模式：发送JSON格式的技术选型数据，AI提供优化建议
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 技术选型对话ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - mode
 *               - content
 *             properties:
 *               mode:
 *                 type: string
 *                 enum: [vibe, manual]
 *                 description: 选型模式
 *               content:
 *                 type: string
 *                 description: 消息内容（文本或JSON字符串）
 *     responses:
 *       200:
 *         description: 技术选型处理成功
 *       400:
 *         description: 请求参数错误
 */

/**
 * @swagger
 * /api/conversations/{id}/messages:
 *   post:
 *     tags: [AI对话]
 *     summary: 发送消息并获取AI回复
 *     description: |
 *       支持需求澄清和技术选型两种对话类型：
 *       
 *       **需求澄清模式**：
 *       - 发送项目相关需求描述
 *       - AI会提出澄清问题
 *       
 *       **技术选型模式**：
 *       - Vibe一下模式：发送文本消息让AI生成技术方案
 *       - 朕说了算模式：直接发送JSON格式的技术选型数据（包含tech_choices数组）
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 对话ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 description: 消息内容
 *                 examples:
 *                   requirement_clarification:
 *                     summary: 需求澄清示例
 *                     value: 我想做一个在线教育平台，主要功能是课程管理和学员学习
 *                   tech_selection_vibe:
 *                     summary: 技术选型-Vibe一下模式（文本格式）
 *                     value: 我没有特别偏好，请你直接推荐一个技术方案吧
 *                   tech_selection_user_defined:
 *                     summary: 技术选型-朱说了算模式（JSON格式）
 *                     value: |
 *                       {
 *                         "tech_choices": [
 *                           {
 *                             "category": "前端框架",
 *                             "technology": "React",
 *                             "reason": "组件化开发，生态丰富"
 *                           },
 *                           {
 *                             "category": "后端框架",
 *                             "technology": "Spring Boot", 
 *                             "reason": "Java技术栈，企业级应用"
 *                           }
 *                         ]
 *                       }
 *     responses:
 *       200:
 *         description: 消息发送成功，返回AI回复
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 conversation:
 *                   $ref: '#/components/schemas/Conversation'
 *                 ai_reply:
 *                   type: string
 *                   description: AI的回复内容，技术选型时会包含结构化表格
 *       400:
 *         description: 请求参数错误或对话已完成
 *       404:
 *         description: 对话不存在
 *       401:
 *         description: 未授权
 */
router.post('/:id/messages', async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ error: '消息内容不能为空' });
    }

    // 获取对话信息
    const { data: conversation, error: getError } = await supabase
      .from('ai_conversations')
      .select(`
        *,
        projects!inner(user_id)
      `)
      .eq('id', id)
      .eq('projects.user_id', req.user.userId)
      .single();

    if (getError || !conversation) {
      return res.status(404).json({ error: '对话不存在或无权限访问' });
    }

    if (conversation.is_completed) {
      return res.status(400).json({ error: '对话已完成，无法继续' });
    }

    // 添加用户消息
    const userMessage = {
      role: 'user',
      content,
      timestamp: new Date().toISOString()
    };

    const updatedMessages = [...conversation.messages, userMessage];

    // 只处理需求澄清对话
    if (conversation.conversation_type !== 'requirement_clarification') {
      return res.status(400).json({ 
        error: '此接口仅支持需求澄清对话，技术选型请使用 /tech-selection 接口' 
      });
    }

    // 调用AI获取回复
    let aiReply;
    try {
      aiReply = await qwenService.clarifyRequirement(content, conversation.messages);
    } catch (aiError) {
      console.error('AI Service Error:', aiError);
      return res.status(500).json({ 
        error: 'AI服务调用失败', 
        details: aiError.message 
      });
    }

    // 添加AI消息
    const aiMessage = {
      role: 'ai',
      content: aiReply,
      timestamp: new Date().toISOString()
    };

    const finalMessages = [...updatedMessages, aiMessage];

    // 检查是否应该完成对话
    const shouldComplete = aiReply.includes('需求澄清完成') || aiReply.includes('技术选型完成');

    // 更新对话
    const { data: updatedConversation, error: updateError } = await supabase
      .from('ai_conversations')
      .update({
        messages: finalMessages,
        is_completed: shouldComplete
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Update conversation error:', updateError);
      return res.status(500).json({ error: '更新对话失败' });
    }

    res.json({
      message: '消息发送成功',
      conversation: updatedConversation,
      ai_reply: aiReply
    });

  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: '发送消息失败' });
  }
});

/**
 * @swagger
 * /api/conversations/{id}/complete:
 *   put:
 *     tags: [AI对话]
 *     summary: 完成对话
 *     description: |
 *       完成AI对话并处理相关业务逻辑：
 *       
 *       **需求澄清完成**：
 *       - 自动生成需求总结
 *       - 更新项目状态为 'clarifying'
 *       - 保存需求总结到项目表
 *       
 *       **技术选型完成**：
 *       - 解析AI生成的技术选型表格
 *       - 更新项目状态为 'tech_selecting' 
 *       - 保存结构化技术选型数据到项目表
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 对话ID
 *     responses:
 *       200:
 *         description: 对话完成成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 对话已完成
 *                 conversation:
 *                   $ref: '#/components/schemas/Conversation'
 *                 requirement_summary:
 *                   type: string
 *                   description: 需求澄清对话的总结（如果是需求澄清类型）
 *                   example: 用户希望开发一个外卖平台，主要功能包括商品展示、订单管理、支付系统等
 *                 tech_stack:
 *                   type: object
 *                   description: 结构化的技术选型数据（如果是技术选型类型）
 *                   properties:
 *                     selection_mode:
 *                       type: string
 *                       enum: [ai_generated, user_defined]
 *                       description: 选型模式
 *                     tech_choices:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           category:
 *                             type: string
 *                             example: 前端框架
 *                           technology:
 *                             type: string
 *                             example: Vue 3 + TypeScript
 *                           reason:
 *                             type: string
 *                             example: 现代化MVVM框架，TypeScript提供强类型支持
 *                     ai_suggestions:
 *                       type: string
 *                       description: AI的优化建议
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *       404:
 *         description: 对话不存在
 *       401:
 *         description: 未授权
 *       500:
 *         description: 服务器错误
 */
router.put('/:id/complete', async (req, res) => {
  try {
    const { id } = req.params;

    // 获取对话详情，包括项目信息
    const { data: conversation, error: getError } = await supabase
      .from('ai_conversations')
      .select(`
        *,
        projects!inner(id, user_id, current_stage)
      `)
      .eq('id', id)
      .eq('projects.user_id', req.user.userId)
      .single();

    if (getError || !conversation) {
      return res.status(404).json({ error: '对话不存在或无权限访问' });
    }

    // 处理对话完成时的特殊逻辑
    let requirementSummary = null;
    let techStackData = null;
    let nextStage = null;

    if (!conversation.is_completed) {
      if (conversation.conversation_type === 'requirement_clarification') {
        try {
          // 使用AI生成需求总结
          requirementSummary = await qwenService.generateRequirementSummary(conversation.messages);
          nextStage = 'clarifying'; // 更新项目阶段为需求澄清完成
          
          console.log('Generated requirement summary:', requirementSummary.substring(0, 100) + '...');
        } catch (aiError) {
          console.error('Failed to generate requirement summary:', aiError);
          // 即使生成总结失败，也允许完成对话，只是不更新总结
        }
      } else if (conversation.conversation_type === 'tech_selection') {
        try {
          // 获取项目的需求总结和基本信息
          const { data: projectData } = await supabase
            .from('projects')
            .select('name, description, requirement_summary')
            .eq('id', conversation.project_id)
            .single();

          if (projectData && conversation.messages.length > 1) {
            // 检查用户消息中是否包含JSON格式的技术选型数据
            const userMessages = conversation.messages.filter(msg => msg.role === 'user');
            let userTechStackData = null;
            
            // 从后向前检查用户消息中的JSON技术选型数据
            for (let i = userMessages.length - 1; i >= 0; i--) {
              try {
                const parsedContent = JSON.parse(userMessages[i].content);
                if (parsedContent.tech_choices && Array.isArray(parsedContent.tech_choices)) {
                  userTechStackData = parsedContent;
                  break;
                }
              } catch (e) {
                // 不是JSON格式，继续检查下一条消息
              }
            }
            
            if (userTechStackData) {
              // 用户直接提供了技术选型JSON数据 - "朕说了算"模式
              techStackData = {
                selection_mode: 'user_defined',
                tech_choices: userTechStackData.tech_choices,
                created_at: new Date().toISOString(),
                ai_suggestions: userTechStackData.ai_suggestions || '用户自定义技术选型方案'
              };
            } else {
              // AI生成技术选型 - "Vibe一下"模式
              const lastAiMessage = conversation.messages
                .filter(msg => msg.role === 'ai')
                .pop();

              if (lastAiMessage && lastAiMessage.content) {
                // 解析AI返回的技术选型表格
                techStackData = qwenService.parseTechStackTable(
                  lastAiMessage.content,
                  'ai_generated'
                );
              }
            }
            
            if (techStackData) {
              nextStage = 'tech_selected'; // 更新项目阶段为技术选型已完成
              console.log('Tech stack data:', JSON.stringify(techStackData, null, 2));
            }
          }
        } catch (aiError) {
          console.error('Failed to process tech selection completion:', aiError);
          // 即使处理失败，也允许完成对话
        }
      }
    }

    // 更新对话状态
    const { data: updatedConversation, error: updateConversationError } = await supabase
      .from('ai_conversations')
      .update({ is_completed: true })
      .eq('id', id)
      .select()
      .single();

    if (updateConversationError) {
      console.error('Update conversation error:', updateConversationError);
      return res.status(500).json({ error: '更新对话状态失败' });
    }

    // 更新项目信息（需求总结或技术选型）
    if ((requirementSummary || techStackData) && nextStage) {
      const updateData = {
        current_stage: nextStage,
        updated_at: new Date().toISOString()
      };
      
      if (requirementSummary) {
        updateData.requirement_summary = requirementSummary;
      }
      
      if (techStackData) {
        updateData.tech_stack = techStackData;
      }

      const { error: updateProjectError } = await supabase
        .from('projects')
        .update(updateData)
        .eq('id', conversation.projects.id);

      if (updateProjectError) {
        console.error('Update project error:', updateProjectError);
        // 记录错误但不阻断响应，对话已完成
      }
    }

    res.json({
      message: '对话已完成',
      conversation: updatedConversation,
      requirement_summary: requirementSummary,
      tech_stack: techStackData
    });

  } catch (error) {
    console.error('Complete conversation error:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

/**
 * @swagger
 * /api/conversations/{id}:
 *   get:
 *     tags: [AI对话]
 *     summary: 获取对话详情
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 对话ID
 *     responses:
 *       200:
 *         description: 成功获取对话详情
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 conversation:
 *                   allOf:
 *                     - $ref: '#/components/schemas/Conversation'
 *                     - type: object
 *                       properties:
 *                         projects:
 *                           type: object
 *                           properties:
 *                             user_id:
 *                               type: string
 *                               format: uuid
 *                             name:
 *                               type: string
 *       404:
 *         description: 对话不存在或无权限访问
 *       401:
 *         description: 未授权
 *       500:
 *         description: 服务器错误
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: conversation, error } = await supabase
      .from('ai_conversations')
      .select(`
        *,
        projects!inner(user_id, name)
      `)
      .eq('id', id)
      .eq('projects.user_id', req.user.userId)
      .single();

    if (error || !conversation) {
      return res.status(404).json({ error: '对话不存在或无权限访问' });
    }

    res.json({ conversation });

  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

module.exports = router;