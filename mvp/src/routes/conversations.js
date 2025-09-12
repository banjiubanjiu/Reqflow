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

    // 验证项目归属
    const { data: project } = await supabase
      .from('projects')
      .select('id')
      .eq('id', project_id)
      .eq('user_id', req.user.userId)
      .single();

    if (!project) {
      return res.status(404).json({ error: '项目不存在或无权限访问' });
    }

    // 创建对话
    const { data: conversation, error } = await supabase
      .from('ai_conversations')
      .insert([
        {
          project_id,
          conversation_type,
          messages: [],
          is_completed: false
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Create conversation error:', error);
      return res.status(500).json({ error: '创建对话失败' });
    }

    res.status(201).json({
      message: '对话创建成功',
      conversation
    });

  } catch (error) {
    console.error('Create conversation error:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

/**
 * @swagger
 * /api/conversations/{id}/messages:
 *   post:
 *     tags: [AI对话]
 *     summary: 发送消息并获取AI回复
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
 *                 example: 我想做一个在线教育平台，主要功能是课程管理和学员学习
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

    // 调用AI获取回复
    let aiReply;
    try {
      if (conversation.conversation_type === 'requirement_clarification') {
        aiReply = await qwenService.clarifyRequirement(content, conversation.messages);
      } else if (conversation.conversation_type === 'tech_selection') {
        aiReply = await qwenService.suggestTechStack(content);
      } else {
        aiReply = await qwenService.chat([{ role: 'user', content }]);
      }
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

    // 如果是需求澄清对话且尚未完成，生成需求总结
    let requirementSummary = null;
    let nextStage = null;

    if (conversation.conversation_type === 'requirement_clarification' && !conversation.is_completed) {
      try {
        // 使用AI生成需求总结
        requirementSummary = await qwenService.generateRequirementSummary(conversation.messages);
        nextStage = 'clarifying'; // 更新项目阶段为需求澄清完成
        
        console.log('Generated requirement summary:', requirementSummary.substring(0, 100) + '...');
      } catch (aiError) {
        console.error('Failed to generate requirement summary:', aiError);
        // 即使生成总结失败，也允许完成对话，只是不更新总结
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

    // 如果有需求总结，更新项目信息
    if (requirementSummary && nextStage) {
      const { error: updateProjectError } = await supabase
        .from('projects')
        .update({
          requirement_summary: requirementSummary,
          current_stage: nextStage,
          updated_at: new Date().toISOString()
        })
        .eq('id', conversation.projects.id);

      if (updateProjectError) {
        console.error('Update project error:', updateProjectError);
        // 记录错误但不阻断响应，对话已完成
      }
    }

    res.json({
      message: '对话已完成',
      conversation: updatedConversation,
      requirement_summary: requirementSummary
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