# ReqFlow MVP Backend

ReqFlow项目管理平台MVP版本的后端API服务。

## 技术栈

- **Runtime**: Node.js
- **框架**: Express.js
- **数据库**: Supabase (PostgreSQL)
- **认证**: JWT + bcrypt
- **AI集成**: 阿里云Qwen API
- **API文档**: Swagger UI

## 核心功能

- 用户注册/登录认证
- 项目CRUD管理
- AI需求澄清对话
- AI技术选型建议

## 快速启动

### 1. 安装依赖
```bash
npm install
```

### 2. 环境配置
复制 `.env.example` 为 `.env`，配置以下变量：
```env
SUPABASE_URL=你的supabase项目URL
SUPABASE_ANON_KEY=你的supabase anon key
JWT_SECRET=jwt密钥
QWEN_API_KEY=qwen api密钥
PORT=3000
```

### 3. 初始化数据库
在Supabase SQL Editor中执行 `init-database.sql`

### 4. 启动服务
```bash
npm run dev  # 开发模式
npm start    # 生产模式
```

### 5. 访问API文档
打开 `http://localhost:3000/api-docs` 查看完整API文档

## 数据库设计

### 核心表结构

**users** - 用户表
```sql
id (UUID, PK), email (唯一), password_hash, name, avatar_url, created_at, updated_at
```

**projects** - 项目表
```sql
id (UUID, PK), user_id (FK), name, description, 
current_stage (created/clarifying/tech_selecting/requirement_splitting/completed),
requirement_summary, tech_stack (JSONB), created_at, updated_at
```

**ai_conversations** - AI对话表
```sql
id (UUID, PK), project_id (FK), conversation_type (requirement_clarification/tech_selection),
messages (JSONB), is_completed, created_at, updated_at
```

### 测试数据
- 测试账号: `15173737427@test.com` / `12345678`

## API接口

### 认证模块
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录

### 项目管理
- `GET /api/projects` - 获取项目列表
- `POST /api/projects` - 创建项目
- `GET /api/projects/:id` - 获取项目详情
- `PUT /api/projects/:id` - 更新项目
- `DELETE /api/projects/:id` - 删除项目

### AI对话
- `POST /api/conversations` - 创建对话
- `POST /api/conversations/:id/messages` - 发送消息
- `GET /api/conversations/:id` - 获取对话详情
- `PUT /api/conversations/:id/complete` - 完成对话

### 测试接口
- `GET /health` - 健康检查
- `POST /api/test/qwen` - 测试AI服务

## 项目结构
```
mvp/
├── package.json          # 依赖配置
├── .env.example         # 环境变量模板
├── init-database.sql    # 数据库初始化
├── test-*.js|.http      # 测试文件
└── src/
    ├── app.js           # 应用入口
    ├── config/          # 配置文件
    ├── middleware/      # 中间件
    ├── routes/          # 路由处理
    └── services/        # 业务服务
```

## 开发说明

- 所有需要认证的API使用JWT Bearer token
- 密码使用bcrypt加密存储
- AI服务集成Qwen API进行需求澄清和技术选型
- 完整的错误处理和请求验证
- Swagger UI提供交互式API文档