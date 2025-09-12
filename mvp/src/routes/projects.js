const express = require('express');
const supabase = require('../config/supabase');
const { authenticateToken } = require('../middleware/auth');
const qwenService = require('../services/qwenService');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: 项目管理
 *   description: 项目CRUD操作
 */

// 所有项目路由都需要认证
router.use(authenticateToken);

/**
 * @swagger
 * /api/projects:
 *   get:
 *     tags: [项目管理]
 *     summary: 获取用户项目列表
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: 成功获取项目列表
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 projects:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Project'
 *       401:
 *         description: 未授权
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', async (req, res) => {
  try {
    const { data: projects, error } = await supabase
      .from('projects')
      .select('id, name, description, current_stage, updated_at')
      .eq('user_id', req.user.userId)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Get projects error:', error);
      return res.status(500).json({ error: '获取项目列表失败' });
    }

    res.json({ projects });

  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

/**
 * @swagger
 * /api/projects:
 *   post:
 *     tags: [项目管理]
 *     summary: 创建新项目
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: 我的项目
 *               description:
 *                 type: string
 *                 example: 项目描述
 *     responses:
 *       201:
 *         description: 项目创建成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 project:
 *                   $ref: '#/components/schemas/Project'
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 未授权
 */
router.post('/', async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: '项目名称不能为空' });
    }

    const { data: project, error } = await supabase
      .from('projects')
      .insert([
        {
          user_id: req.user.userId,
          name,
          description: description || null,
          current_stage: 'created'
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Create project error:', error);
      return res.status(500).json({ error: '创建项目失败' });
    }

    res.status(201).json({
      message: '项目创建成功',
      project
    });

  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

/**
 * @swagger
 * /api/projects/{id}:
 *   get:
 *     tags: [项目管理]
 *     summary: 获取项目详情
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 项目ID
 *     responses:
 *       200:
 *         description: 成功获取项目详情
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 project:
 *                   allOf:
 *                     - $ref: '#/components/schemas/Project'
 *                     - type: object
 *                       properties:
 *                         ai_conversations:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Conversation'
 *       404:
 *         description: 项目不存在
 *       401:
 *         description: 未授权
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: project, error } = await supabase
      .from('projects')
      .select(`
        *,
        ai_conversations (
          id,
          conversation_type,
          messages,
          is_completed,
          created_at
        )
      `)
      .eq('id', id)
      .eq('user_id', req.user.userId)
      .single();

    if (error || !project) {
      return res.status(404).json({ error: '项目不存在或无权限访问' });
    }

    res.json({ project });

  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

/**
 * @swagger
 * /api/projects/{id}:
 *   put:
 *     tags: [项目管理]
 *     summary: 更新项目信息
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 项目ID
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: 更新后的项目名称
 *               description:
 *                 type: string
 *                 example: 更新后的项目描述
 *               current_stage:
 *                 type: string
 *                 enum: [created, clarifying, tech_selecting, requirement_splitting, completed]
 *                 example: clarifying
 *               requirement_summary:
 *                 type: string
 *                 example: 需求澄清后的总结
 *               tech_stack:
 *                 type: object
 *                 example: {"frontend": "Vue 3", "backend": "Node.js", "database": "PostgreSQL"}
 *     responses:
 *       200:
 *         description: 项目更新成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 project:
 *                   $ref: '#/components/schemas/Project'
 *       400:
 *         description: 请求参数错误
 *       404:
 *         description: 项目不存在
 *       401:
 *         description: 未授权
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, current_stage, requirement_summary, tech_stack } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (current_stage) updateData.current_stage = current_stage;
    if (requirement_summary !== undefined) updateData.requirement_summary = requirement_summary;
    if (tech_stack !== undefined) updateData.tech_stack = tech_stack;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: '没有提供要更新的字段' });
    }

    const { data: project, error } = await supabase
      .from('projects')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', req.user.userId)
      .select()
      .single();

    if (error || !project) {
      return res.status(404).json({ error: '项目不存在或更新失败' });
    }

    res.json({
      message: '项目更新成功',
      project
    });

  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

/**
 * @swagger
 * /api/projects/{id}:
 *   delete:
 *     tags: [项目管理]
 *     summary: 删除项目
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 项目ID
 *     responses:
 *       200:
 *         description: 项目删除成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 项目删除成功
 *       404:
 *         description: 项目不存在
 *       401:
 *         description: 未授权
 *       500:
 *         description: 服务器错误
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id)
      .eq('user_id', req.user.userId);

    if (error) {
      console.error('Delete project error:', error);
      return res.status(500).json({ error: '删除项目失败' });
    }

    res.json({ message: '项目删除成功' });

  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

/**
 * @swagger
 * /api/projects/generate-names:
 *   post:
 *     tags: [项目管理]
 *     summary: AI生成项目名称建议
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - description
 *             properties:
 *               description:
 *                 type: string
 *                 example: 我想做一个在线教育平台，主要功能包括课程管理、学员注册、视频播放等
 *     responses:
 *       200:
 *         description: 成功生成项目名称建议
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 suggestions:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                         example: EduFlow
 *                       reason:
 *                         type: string
 *                         example: 结合教育(Edu)和流程(Flow)，体现在线教育平台的流畅体验
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 未授权
 *       500:
 *         description: 服务器错误
 */
router.post('/generate-names', async (req, res) => {
  try {
    const { description } = req.body;

    if (!description || description.trim().length === 0) {
      return res.status(400).json({ error: '项目描述不能为空' });
    }

    if (description.length < 10) {
      return res.status(400).json({ error: '项目描述至少需要10个字符' });
    }

    console.log('Generating project names for:', description.substring(0, 100));

    const suggestions = await qwenService.generateProjectNames(description);

    res.json({ suggestions });

  } catch (error) {
    console.error('Generate project names error:', error);
    res.status(500).json({ 
      error: '生成项目名称失败',
      details: error.message 
    });
  }
});

module.exports = router;