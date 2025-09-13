# ReqFlow Frontend

ReqFlow项目管理平台的前端应用，基于Vue 3 + TypeScript构建。

## 技术栈

- **框架**: Vue 3 + TypeScript + Composition API
- **UI库**: Element Plus
- **状态管理**: Pinia
- **路由**: Vue Router 4
- **构建工具**: Vite
- **HTTP客户端**: Axios

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

## 核心功能

### 用户认证
- 用户登录/注册
- JWT token自动管理
- 路由权限守卫
- token过期自动检测和清理

### 项目管理
- 项目列表展示（卡片式布局）
- 项目创建向导
- 项目状态跟踪
- AI项目名称生成

### AI对话系统
- **需求澄清对话**: 多轮对话澄清项目需求
- **技术选型对话**: 支持两种模式
  - Vibe一下：AI自动推荐技术方案
  - 朕说了算：用户自定义技术选型，AI提供优化建议

### 技术选型可视化
- 技术选型结果卡片式展示
- 分类图标和颜色编码
- 用户技术选型结构化预览
- AI建议高亮显示

## 项目结构

```
src/
├── api/              # API接口封装
│   ├── auth.ts       # 认证相关接口
│   ├── project.ts    # 项目管理接口
│   ├── conversation.ts # 对话接口
│   └── index.ts      # Axios配置和拦截器
├── components/       # 通用组件
│   └── business/     # 业务组件
│       ├── ChatMessage.vue      # 聊天消息组件
│       ├── ProjectCard.vue      # 项目卡片组件
│       └── TechStackEditor.vue  # 技术选型编辑器
├── stores/           # Pinia状态管理
│   ├── auth.ts       # 认证状态
│   ├── project.ts    # 项目状态
│   └── conversation.ts # 对话状态
├── views/            # 页面组件
│   ├── auth/         # 认证页面
│   ├── home/         # 首页
│   ├── project/      # 项目相关页面
│   └── conversation/ # 对话页面
├── router/           # 路由配置
├── types/            # TypeScript类型定义
└── styles/           # 全局样式
```

## 核心组件

### ChatMessage
智能消息显示组件，支持：
- 普通文本消息渲染
- 技术选型消息卡片式展示
- 用户技术选型结构化预览
- Markdown格式支持

### TechStackEditor
技术选型编辑器，支持：
- 可编辑表格形式
- 预定义技术分类
- 动态添加/删除行
- 实时数据验证

### ProjectCard
项目卡片组件，支持：
- 项目状态标签
- 进度条显示
- 快捷操作按钮

## API集成

### 认证流程
```typescript
// 登录
const result = await authStore.login({ email, password })

// 自动token管理
// Axios拦截器自动添加Bearer token
// token过期自动跳转登录页
```

### 技术选型对话
```typescript
// Vibe一下模式
await conversationStore.sendTechSelection(
  conversationId, 
  'vibe', 
  '我希望使用现代化技术栈'
)

// 朕说了算模式
await conversationStore.sendTechSelection(
  conversationId, 
  'manual', 
  JSON.stringify(techStackData)
)
```

## 开发规范

### 组件命名
- 组件文件：PascalCase (UserProfile.vue)
- 组件实例：kebab-case (<user-profile />)

### 状态管理
- 使用Pinia进行状态管理
- 按功能模块划分store
- 异步操作统一错误处理

### 类型定义
- 严格TypeScript类型检查
- API响应类型定义
- 组件Props类型定义

## 环境配置

开发环境默认配置：
- 前端端口：5173
- 后端代理：http://localhost:3000
- API超时：60秒（AI请求）

## 特色功能

### 智能消息渲染
- 自动检测技术选型消息格式
- 动态解析表格数据为卡片展示
- 技术分类图标和颜色编码

### 响应式设计
- 移动端友好布局
- 自适应卡片网格
- 触摸友好的交互设计

### 用户体验优化
- Loading状态管理
- 错误信息友好提示
- 操作反馈和确认
- 自动滚动到消息底部