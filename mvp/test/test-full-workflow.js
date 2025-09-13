const axios = require('axios');

// 配置
const BASE_URL = 'http://localhost:3000/api';
const TEST_USER = {
  email: '15173737427@test.com',
  password: '12345678'
};

let authToken = '';
let testProjectId = '';
let requirementConversationId = '';
let techConversationId = '';
let testEpicId = '';
let testStoryId = '';

// 创建axios实例
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 60000 // 增加超时时间，因为AI请求可能较慢
});

// 请求拦截器
api.interceptors.request.use(config => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

// 响应拦截器
api.interceptors.response.use(
  response => response.data,
  error => {
    console.error(`❌ API Error: ${error.response?.status} ${error.response?.statusText}`);
    console.error(`   URL: ${error.config?.method?.toUpperCase()} ${error.config?.url}`);
    if (error.response?.data) {
      console.error(`   Response:`, error.response.data);
    }
    throw error;
  }
);

// 完整工作流测试
async function runFullWorkflowTest() {
  console.log('🚀 开始完整工作流测试...\n');
  console.log('📋 测试流程: 登录 → 创建项目 → 需求澄清 → 技术选型 → 需求拆分\n');

  try {
    // 1. 用户登录
    await testLogin();
    
    // 2. 创建新项目
    await testCreateProject();
    
    // 3. 需求澄清流程
    await testRequirementClarification();
    
    // 4. 技术选型流程
    await testTechSelection();
    
    // 5. 需求拆分流程
    await testRequirementSplitting();
    
    console.log('\n🎉 完整工作流测试成功！');
    console.log('\n📊 测试结果汇总:');
    console.log(`   - 项目ID: ${testProjectId}`);
    console.log(`   - Epic ID: ${testEpicId}`);
    console.log(`   - Story ID: ${testStoryId}`);
    
  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    process.exit(1);
  }
}

async function testLogin() {
  console.log('1️⃣ 测试用户登录...');
  
  const response = await api.post('/auth/login', TEST_USER);
  
  if (response.token && response.user) {
    authToken = response.token;
    console.log('   ✅ 登录成功');
    console.log(`   👤 用户: ${response.user.email}`);
  } else {
    throw new Error('登录响应格式错误');
  }
}

async function testCreateProject() {
  console.log('\n2️⃣ 测试创建项目...');
  
  const projectData = {
    name: `测试项目-${Date.now()}`,
    description: '这是一个用于测试完整工作流的项目，包含用户管理、订单处理、支付系统等功能'
  };
  
  const response = await api.post('/projects', projectData);
  
  if (response.project) {
    testProjectId = response.project.id;
    console.log('   ✅ 项目创建成功');
    console.log(`   📋 项目名称: ${response.project.name}`);
    console.log(`   🆔 项目ID: ${testProjectId}`);
    console.log(`   📊 项目状态: ${response.project.current_stage}`);
  } else {
    throw new Error('创建项目响应格式错误');
  }
}

async function testRequirementClarification() {
  console.log('\n3️⃣ 测试需求澄清流程...');
  
  // 3.1 创建需求澄清对话
  console.log('   3.1 创建需求澄清对话...');
  const conversationResponse = await api.post('/conversations', {
    project_id: testProjectId,
    conversation_type: 'requirement_clarification'
  });
  
  if (conversationResponse.conversation) {
    requirementConversationId = conversationResponse.conversation.id;
    console.log('   ✅ 需求澄清对话创建成功');
    console.log(`   💬 AI开场问题: ${conversationResponse.initial_question?.substring(0, 100)}...`);
  } else {
    throw new Error('创建需求澄清对话失败');
  }
  
  // 3.2 模拟用户回答
  console.log('   3.2 模拟用户回答...');
  await api.post(`/conversations/${requirementConversationId}/messages`, {
    content: '我想开发一个电商平台，主要功能包括商品展示、购物车、订单管理、用户注册登录、支付系统。目标用户是普通消费者，预计同时在线用户1000人左右。'
  });
  console.log('   ✅ 用户回答已发送');
  
  // 3.3 再次回答AI问题
  console.log('   3.3 继续回答AI问题...');
  await api.post(`/conversations/${requirementConversationId}/messages`, {
    content: '系统需要支持商品分类管理、库存管理、优惠券系统、订单状态跟踪、用户评价系统。支付方式支持微信支付和支付宝。需要有管理后台供商家管理商品和订单。'
  });
  console.log('   ✅ 继续回答完成');
  
  // 3.4 完成需求澄清
  console.log('   3.4 完成需求澄清...');
  const completeResponse = await api.put(`/conversations/${requirementConversationId}/complete`);
  
  if (completeResponse.requirement_summary) {
    console.log('   ✅ 需求澄清完成');
    console.log(`   📝 需求总结: ${completeResponse.requirement_summary.substring(0, 150)}...`);
  } else {
    console.log('   ⚠️  需求澄清完成，但未生成总结');
  }
}

async function testTechSelection() {
  console.log('\n4️⃣ 测试技术选型流程...');
  
  // 4.1 创建技术选型对话
  console.log('   4.1 创建技术选型对话...');
  const conversationResponse = await api.post('/conversations', {
    project_id: testProjectId,
    conversation_type: 'tech_selection'
  });
  
  if (conversationResponse.conversation) {
    techConversationId = conversationResponse.conversation.id;
    console.log('   ✅ 技术选型对话创建成功');
  } else {
    throw new Error('创建技术选型对话失败');
  }
  
  // 4.2 使用Vibe一下模式
  console.log('   4.2 使用Vibe一下模式...');
  const techResponse = await api.post(`/conversations/${techConversationId}/tech-selection`, {
    mode: 'vibe',
    content: '我希望使用现代化的技术栈，优先考虑开发效率和稳定性，团队对Vue比较熟悉'
  });
  
  if (techResponse.ai_reply) {
    console.log('   ✅ AI技术选型生成成功');
    console.log(`   🔧 AI回复长度: ${techResponse.ai_reply.length} 字符`);
  } else {
    throw new Error('AI技术选型生成失败');
  }
  
  // 4.3 完成技术选型
  console.log('   4.3 完成技术选型...');
  const completeResponse = await api.put(`/conversations/${techConversationId}/complete`);
  
  if (completeResponse.tech_stack) {
    console.log('   ✅ 技术选型完成');
    console.log(`   🛠️  技术选择数量: ${completeResponse.tech_stack.tech_choices?.length || 0}`);
  } else {
    console.log('   ⚠️  技术选型完成，但未生成技术栈数据');
  }
  
  // 4.4 验证项目状态更新
  console.log('   4.4 验证项目状态...');
  const projectResponse = await api.get(`/projects/${testProjectId}`);
  console.log(`   📊 项目状态: ${projectResponse.project.current_stage}`);
  console.log(`   ✅ 需求总结: ${projectResponse.project.requirement_summary ? '已完成' : '未完成'}`);
  console.log(`   ✅ 技术选型: ${projectResponse.project.tech_stack ? '已完成' : '未完成'}`);
}

async function testRequirementSplitting() {
  console.log('\n5️⃣ 测试需求拆分流程...');
  
  // 5.1 开始需求拆分
  console.log('   5.1 开始需求拆分...');
  const startResponse = await api.post(`/projects/${testProjectId}/requirement-splitting/start`);
  
  if (startResponse.epic_suggestions) {
    console.log('   ✅ 需求拆分会话创建成功');
    console.log(`   📊 AI生成了 ${startResponse.epic_suggestions.length} 个Epic建议:`);
    startResponse.epic_suggestions.forEach((epic, index) => {
      console.log(`      ${index + 1}. ${epic.name}`);
    });
  } else {
    throw new Error('开始需求拆分失败');
  }
  
  // 5.2 确认Epic拆分
  console.log('   5.2 确认Epic拆分...');
  const confirmEpicsResponse = await api.put(`/projects/${testProjectId}/epics/confirm`, {
    epics: startResponse.epic_suggestions.slice(0, 2) // 只取前2个Epic进行测试
  });
  
  if (confirmEpicsResponse.epics && confirmEpicsResponse.epics.length > 0) {
    testEpicId = confirmEpicsResponse.epics[0].id;
    console.log('   ✅ Epic确认成功');
    console.log(`   📋 创建了 ${confirmEpicsResponse.epics.length} 个Epic`);
    console.log(`   🎯 测试Epic: ${confirmEpicsResponse.epics[0].name}`);
  } else {
    throw new Error('确认Epic失败');
  }
  
  // 5.3 生成Story建议
  console.log('   5.3 生成Story建议...');
  const storiesResponse = await api.post(`/epics/${testEpicId}/stories/generate`);
  
  if (storiesResponse.story_suggestions) {
    console.log('   ✅ Story建议生成成功');
    console.log(`   📊 生成了 ${storiesResponse.story_suggestions.length} 个Story建议:`);
    storiesResponse.story_suggestions.forEach((story, index) => {
      console.log(`      ${index + 1}. ${story.title} (${story.estimated_hours || 'N/A'}h)`);
    });
  } else {
    throw new Error('生成Story建议失败');
  }
  
  // 5.4 确认Story拆分
  console.log('   5.4 确认Story拆分...');
  const confirmStoriesResponse = await api.put(`/epics/${testEpicId}/stories/confirm`, {
    stories: storiesResponse.story_suggestions.slice(0, 2) // 只取前2个Story进行测试
  });
  
  if (confirmStoriesResponse.stories && confirmStoriesResponse.stories.length > 0) {
    testStoryId = confirmStoriesResponse.stories[0].id;
    console.log('   ✅ Story确认成功');
    console.log(`   📋 创建了 ${confirmStoriesResponse.stories.length} 个Story`);
    console.log(`   🎯 测试Story: ${confirmStoriesResponse.stories[0].title}`);
  } else {
    throw new Error('确认Story失败');
  }
  
  // 5.5 测试Story导出
  console.log('   5.5 测试Story导出...');
  try {
    const exportResponse = await axios.get(`${BASE_URL}/stories/${testStoryId}/export`, {
      headers: { Authorization: `Bearer ${authToken}` },
      responseType: 'text'
    });
    
    if (exportResponse.data && exportResponse.data.includes('# Story规格文档')) {
      console.log('   ✅ Story导出成功');
      console.log(`   📄 文档长度: ${exportResponse.data.length} 字符`);
    } else {
      console.log('   ⚠️  Story导出格式异常');
    }
  } catch (error) {
    console.log('   ❌ Story导出失败:', error.message);
  }
  
  // 5.6 获取完整的Epic和Story结构
  console.log('   5.6 验证最终结构...');
  const epicsResponse = await api.get(`/projects/${testProjectId}/epics`);
  console.log(`   📊 项目共有 ${epicsResponse.epics.length} 个Epic`);
  
  for (const epic of epicsResponse.epics) {
    const storiesResponse = await api.get(`/epics/${epic.id}/stories`);
    console.log(`   📋 Epic "${epic.name}" 有 ${storiesResponse.stories.length} 个Story`);
  }
}

// 运行测试
if (require.main === module) {
  runFullWorkflowTest().catch(error => {
    console.error('完整工作流测试失败:', error);
    process.exit(1);
  });
}

module.exports = { runFullWorkflowTest };