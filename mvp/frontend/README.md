# ReqFlow MVP Frontend

ReqFlow项目管理平台MVP版本的前端应用。

## 技术栈

- **框架**: Vue 3 + Composition API + `<script setup>`
- **类型**: TypeScript (严格模式)
- **构建工具**: Vite
- **UI库**: Element Plus + 自定义主题
- **状态管理**: Pinia (模块化设计)
- **路由**: Vue Router 4 (权限守卫)
- **HTTP**: Axios (拦截器+JWT管理)

## 核心功能

- 用户登录/注册认证
- 项目CRUD管理界面
- AI需求澄清对话界面
- AI技术选型建议界面
- 响应式设计支持

## 快速启动

### 1. 安装依赖
```bash
npm install
```

### 2. 启动开发服务器
```bash
npm run dev
```

### 3. 构建生产版本
```bash
npm run build
```

### 4. 类型检查
```bash
npm run type-check
```

### 5. 预览构建结果
```bash
npm run preview
```

## 项目结构

```
frontend/
├── public/                 # 静态资源
├── src/
│   ├── api/               # API接口封装
│   │   ├── index.ts       # Axios配置和拦截器
│   │   ├── auth.ts        # 认证相关接口
│   │   ├── project.ts     # 项目管理接口
│   │   └── conversation.ts # AI对话接口
│   ├── components/        # 组件库
│   │   └── business/      # 业务组件
│   │       ├── ProjectCard.vue    # 项目卡片
│   │       └── ChatMessage.vue    # 聊天消息
│   ├── views/            # 页面组件
│   │   ├── auth/         # 认证页面
│   │   ├── home/         # 首页
│   │   ├── project/      # 项目管理页面
│   │   └── conversation/ # 对话页面
│   ├── stores/           # Pinia状态管理
│   │   ├── auth.ts       # 用户认证状态
│   │   ├── project.ts    # 项目管理状态
│   │   └── conversation.ts # 对话状态
│   ├── router/           # 路由配置
│   ├── types/            # TypeScript类型定义
│   ├── utils/            # 工具函数
│   ├── styles/           # 全局样式
│   └── main.ts           # 应用入口
├── package.json
├── vite.config.ts        # Vite配置
└── tsconfig.json         # TypeScript配置
```

## 页面路由

| 路径 | 页面 | 描述 | 权限要求 |
|------|------|------|----------|
| `/login` | 登录页 | 用户登录 | 游客 |
| `/register` | 注册页 | 用户注册 | 游客 |
| `/home` | 首页 | 项目列表 | 认证用户 |
| `/project/create` | 创建项目 | 新建项目向导 | 认证用户 |
| `/project/:id` | 项目详情 | 项目信息和操作 | 认证用户 |
| `/project/:id/conversation/:conversationId?` | AI对话 | 需求澄清/技术选型 | 认证用户 |

## 核心组件

### 业务组件

**ProjectCard.vue** - 项目卡片组件
- Props: project (Project)
- Events: view, edit, delete
- 功能: 显示项目基本信息、进度、快捷操作

**ChatMessage.vue** - 聊天消息组件
- Props: message (Message)
- 功能: 渲染AI和用户消息，支持Markdown格式

### 状态管理

**useAuthStore** - 用户认证
- 状态: user, token, loading, initialized
- 方法: login, register, logout, initializeAuth

**useProjectStore** - 项目管理
- 状态: projects, currentProject, loading
- 方法: fetchProjects, createProject, updateProject, deleteProject

**useConversationStore** - AI对话
- 状态: currentConversation, loading, sendingMessage
- 方法: createConversation, sendMessage, completeConversation

## API集成

前端通过Axios与后端API通信，支持：

- 自动JWT token管理
- 请求/响应拦截器
- 统一错误处理
- 自动重定向到登录页
- API代理配置（开发环境）

## 开发规范

### 代码风格
- 组件使用PascalCase命名
- 函数和变量使用camelCase
- 常量使用UPPER_CASE
- 严格TypeScript类型检查

### 组件规范
- 使用Composition API + `<script setup>`
- 明确的Props和Emits类型定义
- 响应式数据使用ref/reactive
- 计算属性使用computed

### 样式规范
- 基于Element Plus主题
- CSS变量定义全局色彩
- 组件样式使用scoped
- 响应式设计优先移动端

## 部署配置

### 环境变量
```bash
# 开发环境
VITE_API_BASE_URL=http://localhost:3000

# 生产环境  
VITE_API_BASE_URL=https://your-api-domain.com
```

### 构建优化
- 路由级代码分割
- Element Plus按需导入
- 自动导入Vue和Pinia
- TypeScript严格模式

## 浏览器支持

- Chrome >= 87
- Firefox >= 78  
- Safari >= 14
- Edge >= 88

## 扩展计划

当前MVP版本支持核心功能，后续可扩展：

- Epic/Story需求拆分界面
- 项目文档导出功能
- 团队协作功能
- 项目模板功能
- 实时消息推送
- 移动端适配优化