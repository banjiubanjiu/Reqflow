# ReqFlow MVP API测试 - cURL命令

## 使用说明

1. 确保后端服务已启动：`npm run dev`
2. 按顺序执行下面的命令
3. 将返回的token替换到后续需要认证的请求中

## 测试命令

### 1. 健康检查

```bash
curl -X GET http://localhost:3000/health
```

### 2. 用户注册

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@reqflow.com",
    "password": "test123456", 
    "name": "测试用户"
  }'
```

### 3. 测试用户登录

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "15173737427@test.com",
    "password": "12345678"
  }'
```

**注意**：复制返回的token，替换下面命令中的 `YOUR_JWT_TOKEN`

### 4. 获取项目列表

```bash
curl -X GET http://localhost:3000/api/projects \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 5. 创建项目

```bash
curl -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "我的测试项目",
    "description": "用于测试MVP功能的项目"
  }'
```

**注意**：复制返回的项目ID，替换下面命令中的 `PROJECT_ID`

### 6. 获取项目详情

```bash
curl -X GET http://localhost:3000/api/projects/PROJECT_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 7. 创建需求澄清对话

```bash
curl -X POST http://localhost:3000/api/conversations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "project_id": "PROJECT_ID",
    "conversation_type": "requirement_clarification"
  }'
```

**注意**：复制返回的对话ID，替换下面命令中的 `CONVERSATION_ID`

### 8. 发送对话消息（AI需求澄清）

```bash
curl -X POST http://localhost:3000/api/conversations/CONVERSATION_ID/messages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "content": "我想做一个在线教育平台，主要功能包括课程管理、学员注册、视频播放等"
  }'
```

### 9. 获取对话详情

```bash
curl -X GET http://localhost:3000/api/conversations/CONVERSATION_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 10. 创建技术选型对话

```bash
curl -X POST http://localhost:3000/api/conversations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "project_id": "PROJECT_ID",
    "conversation_type": "tech_selection"
  }'
```

### 11. 技术选型建议

```bash
curl -X POST http://localhost:3000/api/conversations/NEW_CONVERSATION_ID/messages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "content": "基于在线教育平台需求，推荐合适的技术栈"
  }'
```

## 预期结果

- 注册/登录：返回JWT token和用户信息
- 项目操作：返回项目数据
- AI对话：返回AI生成的回复内容
- 所有API都应该返回合适的HTTP状态码和错误信息