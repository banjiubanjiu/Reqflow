# ReqFlow MVP Backend

基于Node.js + Express + Supabase的ReqFlow最小可用版本后端API。

## 功能特性

- 用户注册/登录 (JWT认证)
- 项目管理 (CRUD操作)
- AI对话功能 (需求澄清、技术选型)
- 集成阿里云Qwen大模型

## 技术栈

- **Runtime**: Node.js
- **框架**: Express.js
- **数据库**: Supabase (PostgreSQL)
- **认证**: JWT + bcrypt
- **AI**: 阿里云Qwen API

## 快速开始

### 1. 安装依赖

```bash
cd mvp
npm install
```

### 2. 环境配置

复制环境变量模板：
```bash
cp .env.example .env
```

编辑 `.env` 文件，填入你的配置：
```env
SUPABASE_URL=你的supabase项目URL
SUPABASE_ANON_KEY=你的supabase anon key
JWT_SECRET=你的JWT密钥
QWEN_API_KEY=你的Qwen API密钥
PORT=3000
```

### 3. 数据库初始化

在Supabase Dashboard的SQL Editor中执行 `init-database.sql` 脚本。

### 4. 启动服务

开发模式：
```bash
npm run dev
```

生产模式：
```bash
npm start
```

## API文档

### 认证相关

#### 用户注册
```
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "用户名"
}
```

#### 用户登录
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com", 
  "password": "password123"
}
```

### 项目管理

所有项目API需要在请求头中包含JWT令牌：
```
Authorization: Bearer <your_jwt_token>
```

#### 获取项目列表
```
GET /api/projects
```

#### 创建项目
```
POST /api/projects
Content-Type: application/json

{
  "name": "项目名称",
  "description": "项目描述"
}
```

#### 获取项目详情
```
GET /api/projects/:id
```

#### 更新项目
```
PUT /api/projects/:id
Content-Type: application/json

{
  "name": "新项目名称",
  "current_stage": "clarifying",
  "requirement_summary": "需求总结",
  "tech_stack": {
    "frontend": "Vue 3",
    "backend": "Node.js"
  }
}
```

### AI对话

#### 创建对话
```
POST /api/conversations
Content-Type: application/json

{
  "project_id": "project_uuid",
  "conversation_type": "requirement_clarification"
}
```

#### 发送消息
```
POST /api/conversations/:id/messages
Content-Type: application/json

{
  "content": "用户消息内容"
}
```

#### 完成对话
```
PUT /api/conversations/:id/complete
```

## 项目结构

```
mvp/
├── package.json          # 项目配置
├── .env.example         # 环境变量模板
├── init-database.sql    # 数据库初始化脚本
└── src/
    ├── app.js           # Express应用入口
    ├── config/
    │   └── supabase.js  # Supabase客户端配置
    ├── middleware/
    │   └── auth.js      # JWT认证中间件
    ├── routes/          # 路由文件
    │   ├── auth.js      # 认证路由
    │   ├── projects.js  # 项目管理路由
    │   └── conversations.js # AI对话路由
    └── services/
        └── qwenService.js   # Qwen API服务
```

## 测试账号

数据库初始化脚本包含测试账号：
- 邮箱: `15173737427@test.com`
- 密码: `12345678` (数据库中存储的是加密后的哈希值)

## 开发说明

1. **错误处理**: 所有API都有完整的错误处理和日志记录
2. **安全性**: 密码使用bcrypt加密，JWT令牌有效期7天
3. **数据验证**: 必填字段验证和用户权限验证
4. **AI集成**: 支持需求澄清和技术选型两种对话类型

## 下一步

MVP版本完成后，可以继续开发：
- Epic/Story需求拆分功能
- 文档导出功能  
- 前端Vue.js应用