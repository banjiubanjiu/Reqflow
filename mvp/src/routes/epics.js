const express = require('express');
const supabase = require('../config/supabase');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Epic管理
 *   description: Epic CRUD操作
 */

// 所有Epic路由都需要认证
router.use(authenticateToken);

/**
 * @swagger
 * /api/projects/{id}/epics:
 *   get:
 *     tags: [Epic管理]
 *     summary: 获取项目的Epic列表
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
 *         description: 成功获取Epic列表
 */
router.get('/projects/:id/epics', async (req, res) => {
  try {
    const { id: projectId } = req.params;

    // 验证项目权限并获取Epic列表
    const { data: epics, error } = await supabase
      .from('epics')
      .select(`
        *,
        projects!inner(user_id, name)
      `)
      .eq('project_id', projectId)
      .eq('projects.user_id', req.user.userId)
      .order('priority', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Get epics error:', error);
      return res.status(500).json({ error: '获取Epic列表失败' });
    }

    res.json({ 
      project_id: projectId,
      epics: epics || []
    });

  } catch (error) {
    console.error('Get epics error:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

/**
 * @swagger
 * /api/epics/{id}:
 *   get:
 *     tags: [Epic管理]
 *     summary: 获取Epic详情
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
 *         description: 成功获取Epic详情
 */
router.get('/epics/:id', async (req, res) => {
  try {
    const { id: epicId } = req.params;

    const { data: epic, error } = await supabase
      .from('epics')
      .select(`
        *,
        projects!inner(user_id, name, description)
      `)
      .eq('id', epicId)
      .eq('projects.user_id', req.user.userId)
      .single();

    if (error || !epic) {
      return res.status(404).json({ error: 'Epic不存在或无权限访问' });
    }

    res.json({ epic });

  } catch (error) {
    console.error('Get epic error:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

/**
 * @swagger
 * /api/epics/{id}:
 *   put:
 *     tags: [Epic管理]
 *     summary: 更新Epic信息
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
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               service_boundary:
 *                 type: string
 *               dependencies:
 *                 type: array
 *               capabilities:
 *                 type: array
 *               domain_models:
 *                 type: array
 *               integration_contracts:
 *                 type: array
 *               priority:
 *                 type: integer
 *               status:
 *                 type: string
 *                 enum: [not_started, in_progress, completed]
 *     responses:
 *       200:
 *         description: Epic更新成功
 */
router.put('/epics/:id', async (req, res) => {
  try {
    const { id: epicId } = req.params;
    const updateData = req.body;

    // 验证Epic权限
    const { data: existingEpic, error: checkError } = await supabase
      .from('epics')
      .select(`
        id,
        projects!inner(user_id)
      `)
      .eq('id', epicId)
      .eq('projects.user_id', req.user.userId)
      .single();

    if (checkError || !existingEpic) {
      return res.status(404).json({ error: 'Epic不存在或无权限访问' });
    }

    // 过滤允许更新的字段
    const allowedFields = [
      'name', 'description', 'service_boundary', 'dependencies',
      'capabilities', 'domain_models', 'integration_contracts',
      'priority', 'status'
    ];

    const filteredData = {};
    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        filteredData[field] = updateData[field];
      }
    }

    if (Object.keys(filteredData).length === 0) {
      return res.status(400).json({ error: '没有提供要更新的字段' });
    }

    // 添加更新时间
    filteredData.updated_at = new Date().toISOString();

    // 更新Epic
    const { data: updatedEpic, error: updateError } = await supabase
      .from('epics')
      .update(filteredData)
      .eq('id', epicId)
      .select()
      .single();

    if (updateError) {
      console.error('Update epic error:', updateError);
      return res.status(500).json({ error: '更新Epic失败' });
    }

    res.json({
      message: 'Epic更新成功',
      epic: updatedEpic
    });

  } catch (error) {
    console.error('Update epic error:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

/**
 * @swagger
 * /api/epics/{id}:
 *   delete:
 *     tags: [Epic管理]
 *     summary: 删除Epic
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
 *         description: Epic删除成功
 */
router.delete('/epics/:id', async (req, res) => {
  try {
    const { id: epicId } = req.params;

    // 验证Epic权限
    const { data: existingEpic, error: checkError } = await supabase
      .from('epics')
      .select(`
        id,
        projects!inner(user_id)
      `)
      .eq('id', epicId)
      .eq('projects.user_id', req.user.userId)
      .single();

    if (checkError || !existingEpic) {
      return res.status(404).json({ error: 'Epic不存在或无权限访问' });
    }

    // 检查是否有关联的Story
    const { data: stories, error: storiesError } = await supabase
      .from('stories')
      .select('id')
      .eq('epic_id', epicId)
      .limit(1);

    if (storiesError) {
      console.error('Check stories error:', storiesError);
      return res.status(500).json({ error: '检查关联Story失败' });
    }

    if (stories && stories.length > 0) {
      return res.status(400).json({ 
        error: '无法删除Epic，请先删除关联的Story' 
      });
    }

    // 删除Epic
    const { error: deleteError } = await supabase
      .from('epics')
      .delete()
      .eq('id', epicId);

    if (deleteError) {
      console.error('Delete epic error:', deleteError);
      return res.status(500).json({ error: '删除Epic失败' });
    }

    res.json({ message: 'Epic删除成功' });

  } catch (error) {
    console.error('Delete epic error:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

/**
 * @swagger
 * /api/epics/{id}/stories:
 *   get:
 *     tags: [Epic管理]
 *     summary: 获取Epic的Story列表
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
 *         description: 成功获取Story列表
 */
router.get('/epics/:id/stories', async (req, res) => {
  try {
    const { id: epicId } = req.params;

    // 验证Epic权限并获取Story列表
    const { data: stories, error } = await supabase
      .from('stories')
      .select(`
        *,
        epics!inner(
          id, name,
          projects!inner(user_id)
        )
      `)
      .eq('epic_id', epicId)
      .eq('epics.projects.user_id', req.user.userId)
      .order('priority', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Get stories error:', error);
      return res.status(500).json({ error: '获取Story列表失败' });
    }

    res.json({ 
      epic_id: epicId,
      stories: stories || []
    });

  } catch (error) {
    console.error('Get stories error:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

module.exports = router;