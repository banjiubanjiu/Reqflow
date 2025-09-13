const axios = require('axios');

// 配置
const BASE_URL = 'http://localhost:3000/api';
const TEST_USER = {
  email: '15173737427@test.com',
  password: '12345678'
};

let authToken = '';
let testProjectId = '';
let testEpicId = '';
let testStoryId = '';

// 创建axios实例
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000
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

// 测试函数
async function runTests() {
  console.log('🚀 开始测试需求拆分API...\n');

  try {
    // 1. 用户登录
    await testLogin();
    
    // 2. 获取项目列表
    await testGetProjects();
    
    // 3. 开始需求拆分
    await testStartRequirementSplitting();
    
    // 4. 获取拆分会话
    await testGetSplittingSession();
    
    // 5. 重新生成Epic建议
    await testRegenerateEpics();
    
    // 6. 确认Epic拆分
    await testConfirmEpics();
    
    // 7. 获取Epic列表
    await testGetEpics();
    
    // 8. 获取Epic详情
    await testGetEpicDetail();
    
    // 9. 生成Story建议
    await testGenerateStories();
    
    // 10. 确认Story拆分
    await testConfirmStories();
    
    // 11. 获取Story列表
    await testGetStories();
    
    // 12. 获取Story详情
    await testGetStoryDetail();
    
    // 13. 更新Epic
    await testUpdateEpic();
    
    // 14. 更新Story
    await testUpdateStory();
    
    // 15. 导出Story
    await testExportStory();
    
    // 16. 错误情况测试
    await testErrorCases();
    
    console.log('\n✅ 所有测试完成！');
    
  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    process.exit(1);
  }
}

async function testLogin() {
  console.log('1. 测试用户登录...');
  
  const response = await api.post('/auth/login', TEST_USER);
  
  if (response.token && response.user) {
    authToken = response.token;
    console.log('   ✅ 登录成功');
    console.log(`   Token: ${authToken.substring(0, 20)}...`);
  } else {
    throw new Error('登录响应格式错误');
  }
}

async function testGetProjects() {
  console.log('\n2. 测试获取项目列表...');
  
  const response = await api.get('/projects');
  
  if (response.projects && Array.isArray(response.projects)) {
    console.log(`   ✅ 获取到 ${response.projects.length} 个项目`);
    
    // 找到有需求总结和技术选型的项目
    const validProject = response.projects.find(p => 
      p.requirement_summary && p.tech_stack
    );
    
    if (validProject) {
      testProjectId = validProject.id;
      console.log(`   📋 使用项目: ${validProject.name} (${testProjectId})`);
      console.log(`   📊 项目状态: ${validProject.current_stage}`);
      console.log(`   ✅ 需求总结: ${validProject.requirement_summary ? '已完成' : '未完成'}`);
      console.log(`   ✅ 技术选型: ${validProject.tech_stack ? '已完成' : '未完成'}`);
    } else {
      // 如果没有找到，显示所有项目的状态帮助调试
      console.log('   📋 所有项目状态:');
      response.projects.forEach(p => {
        console.log(`      - ${p.name}: ${p.current_stage} (需求:${p.requirement_summary ? '✅' : '❌'}, 技术:${p.tech_stack ? '✅' : '❌'})`);
      });
      throw new Error('没有找到完成需求澄清和技术选型的项目');
    }
  } else {
    throw new Error('项目列表响应格式错误');
  }
}

async function testStartRequirementSplitting() {
  console.log('\n3. 测试开始需求拆分...');
  
  const response = await api.post(`/projects/${testProjectId}/requirement-splitting/start`);
  
  if (response.session && response.epic_suggestions) {
    console.log('   ✅ 需求拆分会话创建成功');
    console.log(`   📊 AI生成了 ${response.epic_suggestions.length} 个Epic建议`);
    response.epic_suggestions.forEach((epic, index) => {
      console.log(`      ${index + 1}. ${epic.name}`);
    });
  } else {
    throw new Error('开始需求拆分响应格式错误');
  }
}

async function testGetSplittingSession() {
  console.log('\n4. 测试获取拆分会话...');
  
  const response = await api.get(`/projects/${testProjectId}/requirement-splitting/session`);
  
  if (response.session) {
    console.log('   ✅ 获取拆分会话成功');
    console.log(`   📅 会话创建时间: ${response.session.created_at}`);
    console.log(`   🤖 AI分析: ${response.session.ai_analysis?.project_analysis || 'N/A'}`);
  } else {
    throw new Error('获取拆分会话响应格式错误');
  }
}

async function testRegenerateEpics() {
  console.log('\n5. 测试重新生成Epic建议...');
  
  const response = await api.post(`/projects/${testProjectId}/epics/generate`, {
    feedback: '请生成更详细的Epic拆分，包含更多业务领域'
  });
  
  if (response.epic_suggestions) {
    console.log('   ✅ Epic建议重新生成成功');
    console.log(`   📊 重新生成了 ${response.epic_suggestions.length} 个Epic建议`);
  } else {
    throw new Error('重新生成Epic响应格式错误');
  }
}

async function testConfirmEpics() {
  console.log('\n6. 测试确认Epic拆分...');
  
  const epicsData = {
    epics: [
      {
        name: '用户管理系统',
        description: '负责用户注册、登录、权限管理等核心功能',
        service_boundary: '用户认证、权限控制、用户信息管理',
        dependencies: [],
        capabilities: [
          {
            endpoint_prefix: '/api/auth/*',
            description: '用户认证相关接口'
          }
        ],
        domain_models: [
          {
            name: 'User',
            fields: ['id', 'email', 'name', 'role', 'status']
          }
        ],
        integration_contracts: [
          '其他服务通过JWT token验证用户身份'
        ],
        priority: 1
      }
    ]
  };
  
  const response = await api.put(`/projects/${testProjectId}/epics/confirm`, epicsData);
  
  if (response.epics && response.epics.length > 0) {
    testEpicId = response.epics[0].id;
    console.log('   ✅ Epic确认成功');
    console.log(`   📋 创建了 ${response.epics.length} 个Epic`);
    console.log(`   🎯 测试Epic ID: ${testEpicId}`);
  } else {
    throw new Error('确认Epic响应格式错误');
  }
}

async function testGetEpics() {
  console.log('\n7. 测试获取Epic列表...');
  
  const response = await api.get(`/projects/${testProjectId}/epics`);
  
  if (response.epics && Array.isArray(response.epics)) {
    console.log(`   ✅ 获取到 ${response.epics.length} 个Epic`);
    response.epics.forEach((epic, index) => {
      console.log(`      ${index + 1}. ${epic.name} (${epic.status})`);
    });
  } else {
    throw new Error('获取Epic列表响应格式错误');
  }
}

async function testGetEpicDetail() {
  console.log('\n8. 测试获取Epic详情...');
  
  const response = await api.get(`/epics/${testEpicId}`);
  
  if (response.epic) {
    console.log('   ✅ 获取Epic详情成功');
    console.log(`   📋 Epic名称: ${response.epic.name}`);
    console.log(`   🎯 服务边界: ${response.epic.service_boundary}`);
    console.log(`   🔗 能力数量: ${response.epic.capabilities?.length || 0}`);
  } else {
    throw new Error('获取Epic详情响应格式错误');
  }
}

async function testGenerateStories() {
  console.log('\n9. 测试生成Story建议...');
  
  const response = await api.post(`/epics/${testEpicId}/stories/generate`);
  
  if (response.story_suggestions) {
    console.log('   ✅ Story建议生成成功');
    console.log(`   📊 生成了 ${response.story_suggestions.length} 个Story建议`);
    response.story_suggestions.forEach((story, index) => {
      console.log(`      ${index + 1}. ${story.title}`);
    });
  } else {
    throw new Error('生成Story建议响应格式错误');
  }
}

async function testConfirmStories() {
  console.log('\n10. 测试确认Story拆分...');
  
  const storiesData = {
    stories: [
      {
        title: '用户登录功能',
        user_story: '作为用户，我希望能够通过邮箱和密码登录系统，以便访问个人功能',
        backend_api: {
          endpoint: 'POST /api/auth/login',
          request_schema: {
            email: { type: 'string', format: 'email', required: true },
            password: { type: 'string', minLength: 6, required: true }
          },
          response_schema: {
            success_200: {
              access_token: 'string',
              user: { id: 'string', email: 'string', name: 'string' }
            }
          },
          business_rules: ['JWT token有效期24小时']
        },
        database_design: {
          tables: [
            {
              name: 'users',
              fields: ['id(UUID)', 'email(VARCHAR)', 'password_hash(VARCHAR)'],
              indexes: ['email(UNIQUE)']
            }
          ]
        },
        frontend_specification: {
          components: [
            {
              component: 'LoginForm',
              layout: '居中卡片布局，最大宽度400px'
            }
          ],
          routes: [{ path: '/login', component: 'LoginPage' }],
          state_management: { store: 'authStore', state: ['user', 'isLoggedIn'] }
        },
        acceptance_criteria: {
          functional: ['用户输入正确的邮箱和密码，能够成功登录'],
          ui: ['登录表单居中显示，最大宽度400px'],
          performance: ['登录接口响应时间不超过2秒'],
          compatibility: ['支持主流浏览器最新版本'],
          error_handling: ['网络错误时显示友好提示'],
          security: ['密码传输加密']
        },
        mock_contracts: {
          'POST /api/auth/login': {
            success_response: {
              access_token: 'mock_jwt_token_xxxxx',
              user: { id: 'uuid-1234', email: 'test@example.com', name: '测试用户' }
            }
          }
        },
        estimated_hours: 8,
        priority: 1
      }
    ]
  };
  
  const response = await api.put(`/epics/${testEpicId}/stories/confirm`, storiesData);
  
  if (response.stories && response.stories.length > 0) {
    testStoryId = response.stories[0].id;
    console.log('   ✅ Story确认成功');
    console.log(`   📋 创建了 ${response.stories.length} 个Story`);
    console.log(`   🎯 测试Story ID: ${testStoryId}`);
  } else {
    throw new Error('确认Story响应格式错误');
  }
}

async function testGetStories() {
  console.log('\n11. 测试获取Story列表...');
  
  const response = await api.get(`/epics/${testEpicId}/stories`);
  
  if (response.stories && Array.isArray(response.stories)) {
    console.log(`   ✅ 获取到 ${response.stories.length} 个Story`);
    response.stories.forEach((story, index) => {
      console.log(`      ${index + 1}. ${story.title} (${story.status}, ${story.estimated_hours}h)`);
    });
  } else {
    throw new Error('获取Story列表响应格式错误');
  }
}

async function testGetStoryDetail() {
  console.log('\n12. 测试获取Story详情...');
  
  const response = await api.get(`/stories/${testStoryId}`);
  
  if (response.story) {
    console.log('   ✅ 获取Story详情成功');
    console.log(`   📋 Story标题: ${response.story.title}`);
    console.log(`   👤 用户故事: ${response.story.user_story.substring(0, 50)}...`);
    console.log(`   ⏱️  预估工时: ${response.story.estimated_hours} 小时`);
    console.log(`   🔧 后端API: ${response.story.backend_api?.endpoint || 'N/A'}`);
  } else {
    throw new Error('获取Story详情响应格式错误');
  }
}

async function testUpdateEpic() {
  console.log('\n13. 测试更新Epic...');
  
  const updateData = {
    name: '用户管理系统 (已更新)',
    status: 'in_progress',
    priority: 1
  };
  
  const response = await api.put(`/epics/${testEpicId}`, updateData);
  
  if (response.epic) {
    console.log('   ✅ Epic更新成功');
    console.log(`   📋 新名称: ${response.epic.name}`);
    console.log(`   📊 新状态: ${response.epic.status}`);
  } else {
    throw new Error('更新Epic响应格式错误');
  }
}

async function testUpdateStory() {
  console.log('\n14. 测试更新Story...');
  
  const updateData = {
    title: '用户登录功能 (已更新)',
    status: 'in_progress',
    estimated_hours: 10
  };
  
  const response = await api.put(`/stories/${testStoryId}`, updateData);
  
  if (response.story) {
    console.log('   ✅ Story更新成功');
    console.log(`   📋 新标题: ${response.story.title}`);
    console.log(`   📊 新状态: ${response.story.status}`);
    console.log(`   ⏱️  新工时: ${response.story.estimated_hours} 小时`);
  } else {
    throw new Error('更新Story响应格式错误');
  }
}

async function testExportStory() {
  console.log('\n15. 测试导出Story...');
  
  try {
    const response = await axios.get(`${BASE_URL}/stories/${testStoryId}/export`, {
      headers: { Authorization: `Bearer ${authToken}` },
      responseType: 'text'
    });
    
    if (response.data && response.data.includes('# Story规格文档')) {
      console.log('   ✅ Story导出成功');
      console.log(`   📄 文档长度: ${response.data.length} 字符`);
      console.log('   📋 包含章节: 基本信息, 用户故事, 后端API设计, 数据库设计, 前端UI规格, 验收标准');
    } else {
      throw new Error('导出的Markdown格式不正确');
    }
  } catch (error) {
    throw new Error(`导出Story失败: ${error.message}`);
  }
}

async function testErrorCases() {
  console.log('\n16. 测试错误情况...');
  
  // 测试访问不存在的项目
  try {
    await api.post('/projects/00000000-0000-0000-0000-000000000000/requirement-splitting/start');
    throw new Error('应该返回404错误');
  } catch (error) {
    if (error.response?.status === 404) {
      console.log('   ✅ 不存在项目返回404 - 正确');
    } else {
      throw error;
    }
  }
  
  // 测试访问不存在的Epic
  try {
    await api.get('/epics/00000000-0000-0000-0000-000000000000');
    throw new Error('应该返回404错误');
  } catch (error) {
    if (error.response?.status === 404) {
      console.log('   ✅ 不存在Epic返回404 - 正确');
    } else {
      throw error;
    }
  }
  
  // 测试无效的Epic确认数据
  try {
    await api.put(`/projects/${testProjectId}/epics/confirm`, { epics: [] });
    throw new Error('应该返回400错误');
  } catch (error) {
    if (error.response?.status === 400) {
      console.log('   ✅ 空Epic列表返回400 - 正确');
    } else {
      throw error;
    }
  }
  
  console.log('   ✅ 错误情况测试完成');
}

// 运行测试
if (require.main === module) {
  runTests().catch(error => {
    console.error('测试执行失败:', error);
    process.exit(1);
  });
}

module.exports = { runTests };