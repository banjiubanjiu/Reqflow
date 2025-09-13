-- ReqFlow 需求拆分功能数据库迁移脚本
-- 执行前请确保已经运行了 init-database.sql

-- 1. 创建Epic表
CREATE TABLE epics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  service_boundary TEXT NOT NULL,
  dependencies JSONB DEFAULT '[]',
  capabilities JSONB DEFAULT '[]',
  domain_models JSONB DEFAULT '[]',
  integration_contracts JSONB DEFAULT '[]',
  priority INTEGER DEFAULT 1,
  status VARCHAR(50) DEFAULT 'not_started',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 创建Story表
CREATE TABLE stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  epic_id UUID NOT NULL REFERENCES epics(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title VARCHAR(300) NOT NULL,
  user_story TEXT NOT NULL,
  backend_api JSONB NOT NULL,
  database_design JSONB NOT NULL,
  frontend_specification JSONB NOT NULL,
  acceptance_criteria JSONB NOT NULL,
  mock_contracts JSONB DEFAULT '{}',
  priority INTEGER DEFAULT 1,
  status VARCHAR(50) DEFAULT 'not_started',
  estimated_hours INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 创建需求拆分会话表
CREATE TABLE requirement_splitting_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  ai_analysis JSONB,
  epic_suggestions JSONB DEFAULT '[]',
  story_suggestions JSONB DEFAULT '[]',
  user_feedback JSONB DEFAULT '[]',
  is_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 创建索引
CREATE INDEX idx_epics_project_id ON epics(project_id);
CREATE INDEX idx_epics_status ON epics(status);
CREATE INDEX idx_epics_priority ON epics(priority);

CREATE INDEX idx_stories_epic_id ON stories(epic_id);
CREATE INDEX idx_stories_project_id ON stories(project_id);
CREATE INDEX idx_stories_status ON stories(status);
CREATE INDEX idx_stories_priority ON stories(priority);

CREATE INDEX idx_splitting_sessions_project_id ON requirement_splitting_sessions(project_id);
CREATE INDEX idx_splitting_sessions_completed ON requirement_splitting_sessions(is_completed);

-- 5. 添加数据完整性约束
ALTER TABLE epics ADD CONSTRAINT check_epic_priority CHECK (priority BETWEEN 1 AND 5);
ALTER TABLE epics ADD CONSTRAINT check_epic_status 
CHECK (status IN ('not_started', 'in_progress', 'completed'));

ALTER TABLE stories ADD CONSTRAINT check_story_priority CHECK (priority BETWEEN 1 AND 5);
ALTER TABLE stories ADD CONSTRAINT check_story_status 
CHECK (status IN ('not_started', 'in_progress', 'completed'));

-- 6. 关闭RLS (MVP阶段简化权限)
ALTER TABLE epics DISABLE ROW LEVEL SECURITY;
ALTER TABLE stories DISABLE ROW LEVEL SECURITY;
ALTER TABLE requirement_splitting_sessions DISABLE ROW LEVEL SECURITY;

-- 7. 更新项目状态枚举（如果需要）
-- 注意：PostgreSQL不支持直接修改枚举，这里使用VARCHAR已经足够灵活

-- 8. 插入测试数据（可选）
-- 获取测试项目ID
DO $$
DECLARE
    test_project_id UUID;
    test_epic_id UUID;
BEGIN
    -- 查找测试用户的项目
    SELECT id INTO test_project_id 
    FROM projects 
    WHERE user_id = (SELECT id FROM users WHERE email = '15173737427@test.com')
    LIMIT 1;
    
    -- 如果找到测试项目，插入示例Epic和Story
    IF test_project_id IS NOT NULL THEN
        -- 插入示例Epic
        INSERT INTO epics (
            project_id, 
            name, 
            description, 
            service_boundary,
            capabilities,
            domain_models,
            integration_contracts,
            priority
        ) VALUES (
            test_project_id,
            '用户认证系统',
            '负责用户注册、登录、权限管理等核心认证功能',
            '用户认证、权限管理、会话控制',
            '[
                {"endpoint_prefix": "/api/auth/*", "description": "认证相关接口"},
                {"endpoint_prefix": "/api/users/*", "description": "用户管理接口"}
            ]'::jsonb,
            '[
                {"name": "User", "fields": ["id", "email", "role", "status"]},
                {"name": "Session", "fields": ["token", "user_id", "expires_at"]}
            ]'::jsonb,
            '[
                "其他服务获取用户信息必须调用 GET /api/users/{id}",
                "权限验证必须调用 POST /api/auth/verify"
            ]'::jsonb,
            1
        ) RETURNING id INTO test_epic_id;
        
        -- 插入示例Story
        INSERT INTO stories (
            epic_id,
            project_id,
            title,
            user_story,
            backend_api,
            database_design,
            frontend_specification,
            acceptance_criteria,
            mock_contracts,
            priority,
            estimated_hours
        ) VALUES (
            test_epic_id,
            test_project_id,
            '用户邮箱密码登录',
            '作为用户，我希望能够通过邮箱和密码登录系统，以便访问个人功能',
            '{
                "endpoint": "POST /api/auth/login",
                "request_schema": {
                    "email": {"type": "string", "format": "email", "required": true},
                    "password": {"type": "string", "minLength": 8, "required": true}
                },
                "response_schema": {
                    "success_200": {
                        "access_token": "string",
                        "user": {"id": "string", "email": "string", "role": "string"}
                    },
                    "error_401": {"message": "邮箱或密码错误"}
                }
            }'::jsonb,
            '{
                "tables": [
                    {
                        "name": "users",
                        "fields": ["id(UUID)", "email(VARCHAR)", "password_hash(VARCHAR)", "status(ENUM)"],
                        "indexes": ["email(UNIQUE)", "status"]
                    }
                ]
            }'::jsonb,
            '{
                "components": [
                    {
                        "component": "LoginForm",
                        "layout": "居中卡片布局，最大宽度400px",
                        "fields": [
                            {"email": {"type": "input", "placeholder": "请输入邮箱"}},
                            {"password": {"type": "password", "placeholder": "请输入密码"}}
                        ]
                    }
                ],
                "routes": [{"path": "/login", "component": "LoginPage"}]
            }'::jsonb,
            '{
                "functional": ["用户输入正确的邮箱和密码，能够成功登录系统"],
                "ui": ["登录表单居中显示，最大宽度400px"],
                "performance": ["登录接口响应时间不超过2秒"],
                "security": ["密码在传输和存储时必须加密"]
            }'::jsonb,
            '{
                "POST /api/auth/login": {
                    "success_response": {
                        "access_token": "mock_jwt_token_xxxxx",
                        "user": {"id": "uuid-1234", "email": "test@example.com", "role": "user"}
                    }
                }
            }'::jsonb,
            1,
            8
        );
        
        RAISE NOTICE '已为测试项目插入示例Epic和Story数据';
    END IF;
END $$;