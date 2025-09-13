const express = require('express');
const supabase = require('../config/supabase');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Story管理
 *   description: Story CRUD操作
 */

// 所有Story路由都需要认证
router.use(authenticateToken);

/**
 * @swagger
 * /api/stories/{id}:
 *   get:
 *     tags: [Story管理]
 *     summary: 获取Story详情
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Story ID
 *     responses:
 *       200:
 *         description: 成功获取Story详情
 */
router.get('/stories/:id', async (req, res) => {
  try {
    const { id: storyId } = req.params;

    const { data: story, error } = await supabase
      .from('stories')
      .select(`
        *,
        epics!inner(
          id, name, service_boundary,
          projects!inner(user_id, name, description)
        )
      `)
      .eq('id', storyId)
      .eq('epics.projects.user_id', req.user.userId)
      .single();

    if (error || !story) {
      return res.status(404).json({ error: 'Story不存在或无权限访问' });
    }

    res.json({ story });

  } catch (error) {
    console.error('Get story error:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

/**
 * @swagger
 * /api/stories/{id}:
 *   put:
 *     tags: [Story管理]
 *     summary: 更新Story信息
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Story ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               user_story:
 *                 type: string
 *               backend_api:
 *                 type: object
 *               database_design:
 *                 type: object
 *               frontend_specification:
 *                 type: object
 *               acceptance_criteria:
 *                 type: object
 *               mock_contracts:
 *                 type: object
 *               priority:
 *                 type: integer
 *               status:
 *                 type: string
 *                 enum: [not_started, in_progress, completed]
 *               estimated_hours:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Story更新成功
 */
router.put('/stories/:id', async (req, res) => {
  try {
    const { id: storyId } = req.params;
    const updateData = req.body;

    // 验证Story权限
    const { data: existingStory, error: checkError } = await supabase
      .from('stories')
      .select(`
        id,
        epics!inner(
          projects!inner(user_id)
        )
      `)
      .eq('id', storyId)
      .eq('epics.projects.user_id', req.user.userId)
      .single();

    if (checkError || !existingStory) {
      return res.status(404).json({ error: 'Story不存在或无权限访问' });
    }

    // 过滤允许更新的字段
    const allowedFields = [
      'title', 'user_story', 'backend_api', 'database_design',
      'frontend_specification', 'acceptance_criteria', 'mock_contracts',
      'priority', 'status', 'estimated_hours'
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

    // 更新Story
    const { data: updatedStory, error: updateError } = await supabase
      .from('stories')
      .update(filteredData)
      .eq('id', storyId)
      .select()
      .single();

    if (updateError) {
      console.error('Update story error:', updateError);
      return res.status(500).json({ error: '更新Story失败' });
    }

    res.json({
      message: 'Story更新成功',
      story: updatedStory
    });

  } catch (error) {
    console.error('Update story error:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

/**
 * @swagger
 * /api/stories/{id}:
 *   delete:
 *     tags: [Story管理]
 *     summary: 删除Story
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Story ID
 *     responses:
 *       200:
 *         description: Story删除成功
 */
router.delete('/stories/:id', async (req, res) => {
  try {
    const { id: storyId } = req.params;

    // 验证Story权限
    const { data: existingStory, error: checkError } = await supabase
      .from('stories')
      .select(`
        id,
        epics!inner(
          projects!inner(user_id)
        )
      `)
      .eq('id', storyId)
      .eq('epics.projects.user_id', req.user.userId)
      .single();

    if (checkError || !existingStory) {
      return res.status(404).json({ error: 'Story不存在或无权限访问' });
    }

    // 删除Story
    const { error: deleteError } = await supabase
      .from('stories')
      .delete()
      .eq('id', storyId);

    if (deleteError) {
      console.error('Delete story error:', deleteError);
      return res.status(500).json({ error: '删除Story失败' });
    }

    res.json({ message: 'Story删除成功' });

  } catch (error) {
    console.error('Delete story error:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

/**
 * @swagger
 * /api/stories/{id}/export:
 *   get:
 *     tags: [Story管理]
 *     summary: 导出Story规格为Markdown
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Story ID
 *     responses:
 *       200:
 *         description: 成功导出Story规格
 *         content:
 *           text/markdown:
 *             schema:
 *               type: string
 */
router.get('/stories/:id/export', async (req, res) => {
  try {
    const { id: storyId } = req.params;

    // 获取Story完整信息
    const { data: story, error } = await supabase
      .from('stories')
      .select(`
        *,
        epics!inner(
          id, name, service_boundary,
          projects!inner(user_id, name, description)
        )
      `)
      .eq('id', storyId)
      .eq('epics.projects.user_id', req.user.userId)
      .single();

    if (error || !story) {
      return res.status(404).json({ error: 'Story不存在或无权限访问' });
    }

    // 生成Markdown格式的Story规格
    const markdown = generateStoryMarkdown(story);

    res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="story-${story.title.replace(/[^a-zA-Z0-9]/g, '-')}.md"`);
    res.send(markdown);

  } catch (error) {
    console.error('Export story error:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 生成Story的Markdown文档
function generateStoryMarkdown(story) {
  const epic = story.epics;
  const project = epic.projects;

  return `# Story规格文档

## 基本信息

- **项目名称**: ${project.name}
- **Epic**: ${epic.name}
- **Story标题**: ${story.title}
- **优先级**: ${story.priority}
- **状态**: ${story.status}
- **预估工时**: ${story.estimated_hours || 'N/A'} 小时

## 用户故事

${story.user_story}

## 后端API设计

### 接口定义
- **端点**: ${story.backend_api.endpoint || 'N/A'}

### 请求参数
\`\`\`json
${JSON.stringify(story.backend_api.request_schema || {}, null, 2)}
\`\`\`

### 响应格式
\`\`\`json
${JSON.stringify(story.backend_api.response_schema || {}, null, 2)}
\`\`\`

### 业务规则
${Array.isArray(story.backend_api.business_rules) 
  ? story.backend_api.business_rules.map(rule => `- ${rule}`).join('\n')
  : '- 无特殊业务规则'
}

## 数据库设计

### 数据表
${Array.isArray(story.database_design.tables) 
  ? story.database_design.tables.map(table => `
#### ${table.name}
- **字段**: ${Array.isArray(table.fields) ? table.fields.join(', ') : 'N/A'}
- **索引**: ${Array.isArray(table.indexes) ? table.indexes.join(', ') : 'N/A'}
`).join('\n')
  : '- 无数据表设计'
}

## 前端UI规格

### 组件设计
${Array.isArray(story.frontend_specification.components) 
  ? story.frontend_specification.components.map(comp => `
#### ${comp.component || 'Component'}
- **布局**: ${comp.layout || 'N/A'}
- **字段**: ${Array.isArray(comp.fields) ? comp.fields.map(f => Object.keys(f)[0]).join(', ') : 'N/A'}
`).join('\n')
  : '- 无组件设计'
}

### 路由配置
${Array.isArray(story.frontend_specification.routes) 
  ? story.frontend_specification.routes.map(route => `- ${route.path}: ${route.component}`).join('\n')
  : '- 无路由配置'
}

### 状态管理
${story.frontend_specification.state_management 
  ? `- **Store**: ${story.frontend_specification.state_management.store || 'N/A'}
- **状态**: ${Array.isArray(story.frontend_specification.state_management.state) 
    ? story.frontend_specification.state_management.state.join(', ') 
    : 'N/A'}`
  : '- 无状态管理设计'
}

## 验收标准

### 功能验收
${Array.isArray(story.acceptance_criteria.functional) 
  ? story.acceptance_criteria.functional.map(criteria => `- ${criteria}`).join('\n')
  : '- 无功能验收标准'
}

### 界面验收
${Array.isArray(story.acceptance_criteria.ui) 
  ? story.acceptance_criteria.ui.map(criteria => `- ${criteria}`).join('\n')
  : '- 无界面验收标准'
}

### 性能验收
${Array.isArray(story.acceptance_criteria.performance) 
  ? story.acceptance_criteria.performance.map(criteria => `- ${criteria}`).join('\n')
  : '- 无性能验收标准'
}

### 兼容性验收
${Array.isArray(story.acceptance_criteria.compatibility) 
  ? story.acceptance_criteria.compatibility.map(criteria => `- ${criteria}`).join('\n')
  : '- 无兼容性验收标准'
}

### 异常处理验收
${Array.isArray(story.acceptance_criteria.error_handling) 
  ? story.acceptance_criteria.error_handling.map(criteria => `- ${criteria}`).join('\n')
  : '- 无异常处理验收标准'
}

### 安全验收
${Array.isArray(story.acceptance_criteria.security) 
  ? story.acceptance_criteria.security.map(criteria => `- ${criteria}`).join('\n')
  : '- 无安全验收标准'
}

## Mock数据契约

\`\`\`json
${JSON.stringify(story.mock_contracts || {}, null, 2)}
\`\`\`

---

*文档生成时间: ${new Date().toISOString()}*
*Story ID: ${story.id}*
`;
}

module.exports = router;