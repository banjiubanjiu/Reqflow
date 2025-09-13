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
- AI需求澄清对话（AI主动发起）
- AI技术选型对话（支持Vibe一下和朕说了算两种模式）
- 智能需求总结生成
- AI项目名称生成

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
- `POST /api/projects/generate-names` - AI生成项目名称建议
- `GET /api/projects/:id` - 获取项目详情
- `PUT /api/projects/:id` - 更新项目
- `DELETE /api/projects/:id` - 删除项目

### AI对话
- `POST /api/conversations` - 创建对话（AI主动发起第一个问题）
- `POST /api/conversations/:id/messages` - 发送消息
- `GET /api/conversations/:id` - 获取对话详情
- `PUT /api/conversations/:id/complete` - 完成对话（自动生成需求总结）

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
- AI主动发起对话，创建对话时自动生成开场问题
- 需求澄清完成时自动生成需求总结并更新项目状态
- 支持AI生成项目名称建议，用户可选择或"换一批"
- 完整的错误处理和请求验证
- Swagger UI提供交互式API文档

## 新功能特性

### AI主动对话
- 创建需求澄清对话时，AI自动基于项目描述提出第一个问题
- 创建技术选型对话时，AI主动询问技术偏好和约束条件

### 智能需求总结
- 需求澄清对话完成时，AI自动分析整个对话历史
- 生成结构化的需求总结并保存到项目中
- 自动更新项目状态为"澄清完成"

### AI项目命名
- 基于项目描述生成3个创意项目名称
- 每个名称都有详细的选择理由
- 支持"换一批"重新生成不同的名称选项

### 双模式技术选型
- **Vibe一下模式**: 用户描述偏好，AI自动生成完整技术选型方案
- **朕说了算模式**: 用户直接提供JSON格式技术选型，AI给出优化建议
- 自动解析技术选型表格并保存结构化数据
- 支持技术选型完成时自动更新项目状态