const express = require('express');
const supabase = require('../config/supabase');
const { authenticateToken } = require('../middleware/auth');
const requirementSplittingService = require('../services/requirementSplittingService');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: 需求拆分
 *   description: Epic/Story两层需求拆分功能
 */

// 所有需求拆分路由都需要认证
router.use(authenticateToken);

/**
 * @swagger
 * /api/projects/{id}/requirement-splitting/start:
 *   post:
 *     tags: [需求拆分]
 *     summary: 开始需求拆分
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
 *       201:
 *         description: 需求拆分会话创建成功
 *       400:
 *         description: 项目状态不符合要求
 *       404:
 *         description: 项目不存在
 */
router.post('/projects/:id/requirement-splitting/start', async (req, res) => {
  try {
    const { id: projectId } = req.params;

    // 验证项目存在且属于当前用户
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, name, description, current_stage, requirement_summary, tech_stack')
      .eq('id', projectId)
      .eq('user_id', req.user.userId)
      .single();

    if (projectError || !project) {
      return res.status(404).json({ error: '项目不存在或无权限访问' });
    }

    // 检查项目是否具备需求拆分的条件
    if (!project.requirement_summary || !project.tech_stack) {
      return res.status(400).json({
        error: '项目需要先完成需求澄清和技术选型才能进行需求拆分'
      });
    }

    // 检查项目状态，允许已完成技术选型的项目进行需求拆分
    const allowedStages = ['tech_selecting', 'tech_selected', 'requirement_splitting'];
    if (!allowedStages.includes(project.current_stage)) {
      return res.status(400).json({
        error: `项目当前状态(${project.current_stage})不支持需求拆分，需要先完成技术选型`
      });
    }

    // 检查是否已有进行中的拆分会话
    const { data: existingSession } = await supabase
      .from('requirement_splitting_sessions')
      .select('id, is_completed')
      .eq('project_id', projectId)
      .eq('is_completed', false)
      .single();

    if (existingSession) {
      return res.status(400).json({
        error: '项目已有进行中的需求拆分会话',
        session_id: existingSession.id
      });
    }

    // AI分析项目并生成Epic建议
    let epicSuggestions = [];
    let aiAnalysis = null;

    try {
      console.log('Generating epic suggestions for project:', project.name);

      epicSuggestions = await requirementSplittingService.generateEpicSuggestions(
        project.name,
        project.requirement_summary,
        project.tech_stack
      );

      aiAnalysis = {
        project_analysis: `基于需求总结和技术选型，AI识别出${epicSuggestions.length}个核心业务领域`,
        tech_considerations: project.tech_stack.ai_suggestions || '基于选定的技术栈进行架构设计',
        splitting_strategy: 'Epic层按业务服务边界拆分，Story层按用户功能拆分',
        generated_at: new Date().toISOString()
      };

      console.log('Generated epic suggestions:', epicSuggestions.length);
    } catch (aiError) {
      console.error('AI analysis failed:', aiError);
      // AI失败时使用默认建议，不阻断流程
      epicSuggestions = requirementSplittingService.getDefaultEpicSuggestions();
      aiAnalysis = {
        project_analysis: 'AI分析服务暂时不可用，使用默认拆分建议',
        error: aiError.message,
        generated_at: new Date().toISOString()
      };
    }

    // 创建需求拆分会话
    const { data: session, error: sessionError } = await supabase
      .from('requirement_splitting_sessions')
      .insert([
        {
          project_id: projectId,
          ai_analysis: aiAnalysis,
          epic_suggestions: epicSuggestions,
          story_suggestions: [],
          user_feedback: [],
          is_completed: false
        }
      ])
      .select()
      .single();

    if (sessionError) {
      console.error('Create splitting session error:', sessionError);
      return res.status(500).json({ error: '创建需求拆分会话失败' });
    }

    // 更新项目状态
    await supabase
      .from('projects')
      .update({
        current_stage: 'requirement_splitting',
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId);

    res.status(201).json({
      message: '需求拆分会话创建成功',
      session: session,
      epic_suggestions: epicSuggestions,
      ai_analysis: aiAnalysis
    });

  } catch (error) {
    console.error('Start requirement splitting error:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

/**
 * @swagger
 * /api/projects/{id}/requirement-splitting/session:
 *   get:
 *     tags: [需求拆分]
 *     summary: 获取需求拆分会话
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
 *         description: 成功获取拆分会话
 *       404:
 *         description: 会话不存在
 */
router.get('/projects/:id/requirement-splitting/session', async (req, res) => {
  try {
    const { id: projectId } = req.params;

    // 首先直接获取项目信息进行权限检查
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', req.user.userId)
      .single();

    if (projectError || !project) {
      console.error('Get project error:', {
        projectId,
        userId: req.user.userId,
        error: projectError
      });
      return res.status(404).json({ 
        error: '项目不存在或无权限访问',
        projectId,
        userId: req.user.userId
      });
    }

    // 尝试获取拆分会话
    const { data: session, error: sessionError } = await supabase
      .from('requirement_splitting_sessions')
      .select('*')
      .eq('project_id', projectId)
      .single();

    if (sessionError) {
      if (sessionError.code === 'PGRST116') {
        // 没有找到会话，返回null
        return res.json({ session: null });
      } else if (sessionError.code === '42P01') {
        // 表不存在
        return res.status(500).json({ 
          error: '需求拆分功能尚未初始化，请联系管理员执行数据库迁移',
          code: 'TABLE_NOT_EXISTS'
        });
      } else {
        console.error('Get session error:', sessionError);
        return res.status(500).json({ 
          error: '获取拆分会话失败',
          details: sessionError.message
        });
      }
    }

    res.json({
      session: session || null
    });

  } catch (error) {
    console.error('Get splitting session error:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

/**
 * @swagger
 * /api/projects/{id}/epics/generate:
 *   post:
 *     tags: [需求拆分]
 *     summary: 重新生成Epic建议
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
 *               feedback:
 *                 type: string
 *                 description: 用户对当前Epic建议的反馈
 *     responses:
 *       200:
 *         description: 成功生成新的Epic建议
 */
router.post('/requirement-splitting/projects/:id/generate-epics', async (req, res) => {
  try {
    const { id: projectId } = req.params;
    const { feedback } = req.body;

    // 获取项目信息
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('name, requirement_summary, tech_stack')
      .eq('id', projectId)
      .eq('user_id', req.user.userId)
      .single();

    if (projectError || !project) {
      return res.status(404).json({ error: '项目不存在或无权限访问' });
    }

    // 获取当前拆分会话
    const { data: session, error: sessionError } = await supabase
      .from('requirement_splitting_sessions')
      .select('id, user_feedback')
      .eq('project_id', projectId)
      .eq('is_completed', false)
      .single();

    if (sessionError || !session) {
      return res.status(404).json({ error: '需求拆分会话不存在' });
    }

    // 生成新的Epic建议
    let epicSuggestions = [];
    try {
      epicSuggestions = await requirementSplittingService.generateEpicSuggestions(
        project.name,
        project.requirement_summary,
        project.tech_stack
      );
    } catch (aiError) {
      console.error('Regenerate epic suggestions failed:', aiError);
      epicSuggestions = requirementSplittingService.getDefaultEpicSuggestions();
    }

    // 记录用户反馈
    const updatedFeedback = [...(session.user_feedback || [])];
    if (feedback) {
      updatedFeedback.push({
        type: 'epic_regeneration',
        content: feedback,
        timestamp: new Date().toISOString()
      });
    }

    // 更新会话
    const { error: updateError } = await supabase
      .from('requirement_splitting_sessions')
      .update({
        epic_suggestions: epicSuggestions,
        user_feedback: updatedFeedback,
        updated_at: new Date().toISOString()
      })
      .eq('id', session.id);

    if (updateError) {
      console.error('Update session error:', updateError);
      return res.status(500).json({ error: '更新会话失败' });
    }

    res.json({
      message: 'Epic建议重新生成成功',
      epic_suggestions: epicSuggestions
    });

  } catch (error) {
    console.error('Regenerate epics error:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

/**
 * @swagger
 * /api/projects/{id}/epics/confirm:
 *   put:
 *     tags: [需求拆分]
 *     summary: 确认Epic拆分
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
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - epics
 *             properties:
 *               epics:
 *                 type: array
 *                 description: 用户确认的Epic列表
 *     responses:
 *       200:
 *         description: Epic确认成功
 */
router.post('/requirement-splitting/projects/:id/confirm-epics', async (req, res) => {
  try {
    const { id: projectId } = req.params;
    const { epics } = req.body;

    if (!epics || !Array.isArray(epics) || epics.length === 0) {
      return res.status(400).json({ error: 'Epic列表不能为空' });
    }

    // 验证项目权限
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('user_id', req.user.userId)
      .single();

    if (projectError || !project) {
      return res.status(404).json({ error: '项目不存在或无权限访问' });
    }

    // 验证Epic数据
    for (const epic of epics) {
      try {
        requirementSplittingService.validateEpicData(epic);
      } catch (validationError) {
        return res.status(400).json({
          error: `Epic数据验证失败: ${validationError.message}`
        });
      }
    }

    // 删除项目现有的Epic（如果有）
    await supabase
      .from('epics')
      .delete()
      .eq('project_id', projectId);

    // 插入新的Epic
    const epicsToInsert = epics.map((epic, index) => ({
      project_id: projectId,
      name: epic.name,
      description: epic.description,
      service_boundary: epic.service_boundary,
      dependencies: epic.dependencies || [],
      capabilities: epic.capabilities || [],
      domain_models: epic.domain_models || [],
      integration_contracts: epic.integration_contracts || [],
      priority: epic.priority || (index + 1),
      status: 'not_started'
    }));

    const { data: createdEpics, error: insertError } = await supabase
      .from('epics')
      .insert(epicsToInsert)
      .select();

    if (insertError) {
      console.error('Insert epics error:', insertError);
      return res.status(500).json({ error: '保存Epic失败' });
    }

    res.json({
      message: 'Epic确认成功',
      epics: createdEpics
    });

  } catch (error) {
    console.error('Confirm epics error:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

/**
 * @swagger
 * /api/epics/{id}/stories/generate:
 *   post:
 *     tags: [需求拆分]
 *     summary: 为Epic生成Story建议
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Epic ID
 *     responses:
 *       200:
 *         description: 成功生成Story建议
 */
router.post('/epics/:id/stories/generate', async (req, res) => {
  try {
    const { id: epicId } = req.params;

    // 获取Epic信息和项目上下文
    const { data: epic, error: epicError } = await supabase
      .from('epics')
      .select(`
        *,
        projects!inner(user_id, name, requirement_summary, tech_stack)
      `)
      .eq('id', epicId)
      .eq('projects.user_id', req.user.userId)
      .single();

    if (epicError || !epic) {
      return res.status(404).json({ error: 'Epic不存在或无权限访问' });
    }

    // 构建项目上下文
    const projectContext = `项目名称：${epic.projects.name}
需求总结：${epic.projects.requirement_summary}
技术选型：${requirementSplittingService.formatTechStack(epic.projects.tech_stack)}`;

    // 生成Story建议
    let storySuggestions = [];
    try {
      storySuggestions = await requirementSplittingService.generateStorySuggestions(
        epic,
        projectContext
      );
    } catch (aiError) {
      console.error('Generate story suggestions failed:', aiError);
      storySuggestions = requirementSplittingService.getDefaultStorySuggestions();
    }

    // 更新拆分会话的Story建议
    const { error: updateError } = await supabase
      .from('requirement_splitting_sessions')
      .update({
        story_suggestions: storySuggestions,
        updated_at: new Date().toISOString()
      })
      .eq('project_id', epic.project_id)
      .eq('is_completed', false);

    if (updateError) {
      console.error('Update session with stories error:', updateError);
    }

    res.json({
      message: 'Story建议生成成功',
      epic: {
        id: epic.id,
        name: epic.name
      },
      story_suggestions: storySuggestions
    });

  } catch (error) {
    console.error('Generate stories error:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

/**
 * @swagger
 * /api/epics/{id}/stories/confirm:
 *   put:
 *     tags: [需求拆分]
 *     summary: 确认Epic的Story拆分
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Epic ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - stories
 *             properties:
 *               stories:
 *                 type: array
 *                 description: 用户确认的Story列表
 *     responses:
 *       200:
 *         description: Story确认成功
 */
router.put('/epics/:id/stories/confirm', async (req, res) => {
  try {
    const { id: epicId } = req.params;
    const { stories } = req.body;

    if (!stories || !Array.isArray(stories) || stories.length === 0) {
      return res.status(400).json({ error: 'Story列表不能为空' });
    }

    // 验证Epic权限
    const { data: epic, error: epicError } = await supabase
      .from('epics')
      .select(`
        id, project_id,
        projects!inner(user_id)
      `)
      .eq('id', epicId)
      .eq('projects.user_id', req.user.userId)
      .single();

    if (epicError || !epic) {
      return res.status(404).json({ error: 'Epic不存在或无权限访问' });
    }

    // 验证Story数据
    for (const story of stories) {
      try {
        requirementSplittingService.validateStoryData(story);
      } catch (validationError) {
        return res.status(400).json({
          error: `Story数据验证失败: ${validationError.message}`
        });
      }
    }

    // 删除Epic现有的Story（如果有）
    await supabase
      .from('stories')
      .delete()
      .eq('epic_id', epicId);

    // 插入新的Story
    const storiesToInsert = stories.map((story, index) => ({
      epic_id: epicId,
      project_id: epic.project_id,
      title: story.title,
      user_story: story.user_story,
      backend_api: story.backend_api,
      database_design: story.database_design,
      frontend_specification: story.frontend_specification,
      acceptance_criteria: story.acceptance_criteria,
      mock_contracts: story.mock_contracts || {},
      priority: story.priority || (index + 1),
      status: 'not_started',
      estimated_hours: story.estimated_hours || 8
    }));

    const { data: createdStories, error: insertError } = await supabase
      .from('stories')
      .insert(storiesToInsert)
      .select();

    if (insertError) {
      console.error('Insert stories error:', insertError);
      return res.status(500).json({ error: '保存Story失败' });
    }

    res.json({
      message: 'Story确认成功',
      epic_id: epicId,
      stories: createdStories
    });

  } catch (error) {
    console.error('Confirm stories error:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

module.exports = router;