# ReqFlow 数据库设计 - MVP版本

## 设计原则

- **最小可用**：只设计MVP必需的表结构
- **简单高效**：避免复杂关系，优先开发速度
- **易扩展**：为后期功能扩展预留空间

## 核心表结构

### 1. 用户表 (users)

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_users_email ON users(email);
```

**字段说明**：
- `id`: 主键，UUID格式
- `email`: 登录邮箱，唯一约束
- `password_hash`: 加密后的密码
- `name`: 用户显示名称
- `avatar_url`: 头像链接（可选）

### 2. 项目表 (projects)

```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  current_stage VARCHAR(50) DEFAULT 'created',
  requirement_summary TEXT,
  tech_stack JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_stage ON projects(current_stage);
```

**字段说明**：
- `current_stage`: 项目阶段 ('created', 'clarifying', 'tech_selecting', 'requirement_splitting', 'completed')
- `requirement_summary`: 需求澄清后的总结
- `tech_stack`: 技术选型结果 (JSON格式存储)

### 3. AI对话记录表 (ai_conversations)

```sql
CREATE TABLE ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  conversation_type VARCHAR(50) NOT NULL,
  messages JSONB NOT NULL DEFAULT '[]',
  is_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_conversations_project_id ON ai_conversations(project_id);
CREATE INDEX idx_conversations_type ON ai_conversations(conversation_type);
```

**字段说明**：
- `conversation_type`: 对话类型 ('requirement_clarification', 'tech_selection')
- `messages`: 对话消息数组 (JSON格式)
- `is_completed`: 是否完成对话

**消息格式示例**：
```json
[
  {
    "role": "ai",
    "content": "请描述一下你的项目主要功能？",
    "timestamp": "2024-01-01T10:00:00Z"
  },
  {
    "role": "user", 
    "content": "我想做一个项目管理工具",
    "timestamp": "2024-01-01T10:01:00Z"
  }
]
```

## 数据关系图

```
users (1) -----> (N) projects
projects (1) --> (N) ai_conversations
```

## 初始化数据

### 测试用户
```sql
-- 插入测试用户
INSERT INTO users (email, password_hash, name) VALUES 
('15173737427@test.com', '$2b$12$hashed_password_here', '测试用户');
```

## MVP版本限制

### 暂不包含的功能
- Epic/Story详细拆分存储 (后续版本添加)
- 团队成员管理
- 权限控制
- 文件上传存储
- 操作日志记录

### 技术选型存储
用JSONB字段存储表格形式的技术选型结果，格式：
```json
{
  "selection_mode": "ai_generated", // "user_defined" | "ai_generated"
  "tech_choices": [
    {
      "category": "前端框架",
      "technology": "Vue 3 + TypeScript",
      "reason": "成熟的MVVM框架，TypeScript支持强类型开发"
    },
    {
      "category": "后端框架", 
      "technology": "Node.js + Express",
      "reason": "轻量级框架，开发效率高，生态丰富"
    },
    {
      "category": "数据库",
      "technology": "Supabase PostgreSQL", 
      "reason": "云数据库服务，内置认证和实时功能"
    },
    {
      "category": "UI组件库",
      "technology": "Element Plus",
      "reason": "Vue3专用组件库，组件丰富，文档完善"
    }
  ],
  "created_at": "2024-01-01T10:00:00Z",
  "ai_suggestions": "优先采用前后端分离架构，使用Swagger UI进行API文档管理"
}
```

## Supabase配置

### RLS策略（暂时关闭）
```sql
-- MVP阶段关闭RLS，简化开发
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations DISABLE ROW LEVEL SECURITY;
```

### 实时订阅
```sql
-- 启用实时功能（可选）
ALTER PUBLICATION supabase_realtime ADD TABLE projects;
```

## API数据访问模式

### 用户登录后获取项目列表
```sql
SELECT id, name, description, current_stage, updated_at 
FROM projects 
WHERE user_id = $1 
ORDER BY updated_at DESC;
```

### 获取项目详情（包含对话历史）
```sql
SELECT p.*, 
       COALESCE(
         json_agg(
           json_build_object(
             'type', c.conversation_type,
             'messages', c.messages,
             'completed', c.is_completed
           )
         ) FILTER (WHERE c.id IS NOT NULL), 
         '[]'::json
       ) as conversations
FROM projects p
LEFT JOIN ai_conversations c ON p.id = c.project_id
WHERE p.id = $1 AND p.user_id = $2
GROUP BY p.id;
```

## 扩展计划

后续版本可以添加：
- `epics` 表
- `stories` 表  
- `project_members` 表
- `ai_prompts` 表（存储提示词模板）
- `export_logs` 表（导出记录）

这样的MVP设计足够支撑核心功能开发，同时为后续扩展预留了空间。