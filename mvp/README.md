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
- **AI需求拆分（Epic/Story两层架构）**
- 智能需求总结生成
- AI项目名称生成
- 技术选型结果可视化展示
- Story规格文档导出

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
- `POST /api/conversations/:id/messages` - 发送消息（需求澄清专用）
- `POST /api/conversations/:id/tech-selection` - 技术选型专用接口
- `GET /api/conversations/:id` - 获取对话详情
- `PUT /api/conversations/:id/complete` - 完成对话（自动生成需求总结或技术选型）

### 需求拆分
- `POST /api/projects/:id/requirement-splitting/start` - 开始需求拆分
- `GET /api/projects/:id/requirement-splitting/session` - 获取拆分会话
- `POST /api/projects/:id/epics/generate` - 重新生成Epic建议
- `PUT /api/projects/:id/epics/confirm` - 确认Epic拆分
- `POST /api/epics/:id/stories/generate` - 生成Story建议
- `PUT /api/epics/:id/stories/confirm` - 确认Story拆分

### Epic管理
- `GET /api/projects/:id/epics` - 获取项目Epic列表
- `GET /api/epics/:id` - 获取Epic详情
- `PUT /api/epics/:id` - 更新Epic信息
- `DELETE /api/epics/:id` - 删除Epic
- `GET /api/epics/:id/stories` - 获取Epic的Story列表

### Story管理
- `GET /api/stories/:id` - 获取Story详情
- `PUT /api/stories/:id` - 更新Story信息
- `DELETE /api/stories/:id` - 删除Story
- `GET /api/stories/:id/export` - 导出Story为Markdown文档

### 测试接口
- `GET /health` - 健康检查
- `POST /api/test/qwen` - 测试AI服务

## 项目结构
```
mvp/
├── package.json                    # 依赖配置
├── .env.example                   # 环境变量模板
├── init-database.sql              # 数据库初始化
├── migrations/                    # 数据库迁移脚本
│   └── 002-add-requirement-splitting.sql
├── test-*.js|.http               # 测试文件
├── 数据库设计-MVP.md              # 数据库设计文档
├── 数据库设计-需求拆分扩展.md      # 需求拆分功能数据库设计
└── src/
    ├── app.js                    # 应用入口
    ├── config/                   # 配置文件
    │   ├── supabase.js          # Supabase配置
    │   └── swagger.js           # Swagger API文档配置
    ├── middleware/               # 中间件
    │   └── auth.js              # JWT认证中间件
    ├── routes/                   # 路由处理
    │   ├── auth.js              # 用户认证路由
    │   ├── projects.js          # 项目管理路由
    │   ├── conversations.js     # AI对话路由
    │   ├── requirementSplitting.js  # 需求拆分路由
    │   ├── epics.js             # Epic管理路由
    │   ├── stories.js           # Story管理路由
    │   └── test.js              # 测试路由
    └── services/                 # 业务服务
        ├── qwenService.js       # Qwen AI服务
        └── requirementSplittingService.js  # 需求拆分服务
```

## API测试

### 快速测试
```bash
# 测试基本API连接
node test-basic-api.js

# 测试需求拆分功能（需要已完成需求澄清和技术选型的项目）
node test-requirement-splitting-only.js

# 完整工作流测试（从创建项目到需求拆分）
node test-full-workflow.js
```

### 使用Swagger UI
访问 `http://localhost:3000/api-docs` 查看完整的API文档和在线测试界面。

### HTTP测试文件
使用 `test-requirement-splitting-api.http` 文件在VS Code REST Client中测试所有API接口。

## 开发说明

- 所有需要认证的API使用JWT Bearer token
- 密码使用bcrypt加密存储
- AI服务集成Qwen API进行需求澄清、技术选型和需求拆分
- AI主动发起对话，创建对话时自动生成开场问题
- 需求澄清完成时自动生成需求总结并更新项目状态
- 技术选型完成时自动更新项目状态为`tech_selected`
- 需求拆分采用Epic/Story两层架构，支持完整的技术实现规格
- Story包含后端API、数据库设计、前端UI规格、验收标准、Mock契约
- 支持Story规格导出为Markdown文档
- 完整的错误处理和请求验证
- Swagger UI提供交互式API文档

## 核心特性

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
- 技术选型结果卡片式可视化展示，支持分类图标和颜色编码

### AI需求拆分系统
- **Epic/Story两层架构**: 业务服务边界 → 具体功能实现
- **AI智能拆分**: 基于需求总结和技术选型自动生成拆分建议
- **完整技术规格**: 每个Story包含后端API、数据库设计、前端UI规格、验收标准、Mock契约
- **并行开发支持**: 通过接口契约和Mock数据支持前后端并行开发
- **渐进式确认**: 用户可以逐步确认Epic和Story拆分结果
- **文档导出**: Story规格可导出为完整的Markdown技术文档

## 技术选型接口详情

### POST /api/conversations/:id/tech-selection
专门处理技术选型的接口，支持两种模式：

**请求参数**:
```json
{
  "mode": "vibe|manual",
  "content": "文本描述或JSON字符串"
}
```

**Vibe一下模式示例**:
```json
{
  "mode": "vibe",
  "content": "我希望使用现代化的技术栈，优先考虑开发效率"
}
```

**朕说了算模式示例**:
```json
{
  "mode": "manual", 
  "content": "{\"tech_choices\":[{\"category\":\"前端框架\",\"technology\":\"Vue 3\",\"reason\":\"现代化MVVM框架\"}]}"
}
```

**响应格式**:
```json
{
  "message": "技术选型处理成功",
  "conversation": {...},
  "ai_reply": "AI生成的技术选型表格或优化建议",
  "mode": "vibe|manual"
}
```

## 需求拆分接口详情

### 拆分流程
1. **开始拆分** → 2. **确认Epic** → 3. **生成Story** → 4. **确认Story** → 5. **导出文档**

### POST /api/projects/:id/requirement-splitting/start
开始需求拆分，AI自动生成Epic建议：

**前置条件**: 项目必须完成需求澄清和技术选型

**响应格式**:
```json
{
  "message": "需求拆分会话创建成功",
  "session": {...},
  "epic_suggestions": [
    {
      "name": "用户管理系统",
      "description": "负责用户注册、登录、权限管理等核心功能",
      "service_boundary": "用户认证、权限控制、用户信息管理",
      "capabilities": [
        {
          "endpoint_prefix": "/api/auth/*",
          "description": "用户认证相关接口"
        }
      ],
      "domain_models": [
        {
          "name": "User",
          "fields": ["id", "email", "name", "role"]
        }
      ]
    }
  ]
}
```

### PUT /api/projects/:id/epics/confirm
确认Epic拆分，创建Epic记录：

**请求参数**:
```json
{
  "epics": [
    {
      "name": "用户管理系统",
      "description": "...",
      "service_boundary": "...",
      "capabilities": [...],
      "domain_models": [...]
    }
  ]
}
```

### POST /api/epics/:id/stories/generate
为Epic生成Story建议，包含完整技术规格：

**响应格式**:
```json
{
  "story_suggestions": [
    {
      "title": "用户登录功能",
      "user_story": "作为用户，我希望能够通过邮箱和密码登录系统",
      "backend_api": {
        "endpoint": "POST /api/auth/login",
        "request_schema": {...},
        "response_schema": {...}
      },
      "database_design": {
        "tables": [...]
      },
      "frontend_specification": {
        "components": [...],
        "routes": [...],
        "state_management": {...}
      },
      "acceptance_criteria": {
        "functional": [...],
        "ui": [...],
        "performance": [...],
        "compatibility": [...],
        "error_handling": [...],
        "security": [...]
      },
      "mock_contracts": {...},
      "estimated_hours": 8
    }
  ]
}
```

### GET /api/stories/:id/export
导出Story为完整的Markdown技术文档：

**响应**: Markdown格式文档，包含：
- 基本信息（项目、Epic、Story）
- 用户故事
- 后端API设计（接口定义、请求响应、业务规则）
- 数据库设计（表结构、字段、索引）
- 前端UI规格（组件、路由、状态管理）
- 验收标准（6个维度：功能、界面、性能、兼容性、异常处理、安全）
- Mock数据契约