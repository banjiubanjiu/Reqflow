-- ReqFlow MVP数据库初始化脚本
-- 在Supabase SQL Editor中执行

-- 1. 创建用户表
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 创建项目表
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

-- 3. 创建AI对话记录表
CREATE TABLE ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  conversation_type VARCHAR(50) NOT NULL,
  messages JSONB NOT NULL DEFAULT '[]',
  is_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 创建索引
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_stage ON projects(current_stage);
CREATE INDEX idx_conversations_project_id ON ai_conversations(project_id);
CREATE INDEX idx_conversations_type ON ai_conversations(conversation_type);

-- 5. 关闭RLS (MVP阶段简化权限)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations DISABLE ROW LEVEL SECURITY;

-- 6. 插入测试数据
INSERT INTO users (email, password_hash, name) VALUES 
('15173737427@test.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqyT4FSC2CWibQqgOUf/c.m', '测试用户');

-- 获取测试用户ID (后续插入项目时需要)
-- SELECT id FROM users WHERE email = '15173737427@test.com';