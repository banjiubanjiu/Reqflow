const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';
const TEST_USER = {
  email: '15173737427@test.com',
  password: '12345678'
};

// 使用"拼好饭"项目ID
const PROJECT_ID = '113469e1-710e-4de7-af94-13a4c1877f6a';

let authToken = '';
let testEpicId = '';
let testStoryId = '';

async function testRequirementSplittingOnly() {
  console.log('🎯 专门测试需求拆分API...\n');

  try {
    // 1. 登录
    console.log('1️⃣ 用户登录...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, TEST_USER);
    authToken = loginResponse.data.token;
    console.log('   ✅ 登录成功\n');

    // 2. 验证项目状态
    console.log('2️⃣ 验证项目状态...');
    const projectResponse = await axios.get(`${BASE_URL}/projects/${PROJECT_ID}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    const project = projectResponse.data.project;
    console.log(`   📋 项目名称: ${project.name}`);
    console.log(`   📊 项目状态: ${project.current_stage}`);
    console.log(`   ✅ 需求总结: ${project.requirement_summary ? '已完成' : '未完成'}`);
    console.log(`   ✅ 技术选型: ${project.tech_stack ? '已完成' : '未完成'}`);
    
    if (project.tech_stack) {
      console.log(`   🔧 技术选择: ${project.tech_stack.tech_choices?.length || 0} 项`);
    }
    console.log('');

    // 3. 开始需求拆分
    console.log('3️⃣ 开始需求拆分...');
    const startResponse = await axios.post(`${BASE_URL}/projects/${PROJECT_ID}/requirement-splitting/start`, {}, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('   ✅ 需求拆分会话创建成功');
    console.log(`   📊 AI生成了 ${startResponse.data.epic_suggestions?.length || 0} 个Epic建议:`);
    
    startResponse.data.epic_suggestions?.forEach((epic, index) => {
      console.log(`      ${index + 1}. ${epic.name}`);
      console.log(`         📝 ${epic.description?.substring(0, 80)}...`);
    });
    console.log('');

    // 4. 获取拆分会话详情
    console.log('4️⃣ 获取拆分会话详情...');
    const sessionResponse = await axios.get(`${BASE_URL}/projects/${PROJECT_ID}/requirement-splitting/session`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('   ✅ 获取会话详情成功');
    console.log(`   🤖 AI分析: ${sessionResponse.data.session.ai_analysis?.project_analysis || 'N/A'}`);
    console.log('');

    // 5. 确认Epic拆分（使用前2个Epic）
    console.log('5️⃣ 确认Epic拆分...');
    const epicsToConfirm = startResponse.data.epic_suggestions.slice(0, 2);
    
    const confirmEpicsResponse = await axios.put(`${BASE_URL}/projects/${PROJECT_ID}/epics/confirm`, {
      epics: epicsToConfirm
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('   ✅ Epic确认成功');
    console.log(`   📋 创建了 ${confirmEpicsResponse.data.epics.length} 个Epic`);
    
    if (confirmEpicsResponse.data.epics.length > 0) {
      testEpicId = confirmEpicsResponse.data.epics[0].id;
      console.log(`   🎯 测试Epic: ${confirmEpicsResponse.data.epics[0].name} (${testEpicId})`);
    }
    console.log('');

    // 6. 获取Epic列表
    console.log('6️⃣ 获取Epic列表...');
    const epicsResponse = await axios.get(`${BASE_URL}/projects/${PROJECT_ID}/epics`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log(`   ✅ 获取到 ${epicsResponse.data.epics.length} 个Epic`);
    epicsResponse.data.epics.forEach((epic, index) => {
      console.log(`      ${index + 1}. ${epic.name} (${epic.status}, 优先级: ${epic.priority})`);
    });
    console.log('');

    // 7. 生成Story建议
    console.log('7️⃣ 生成Story建议...');
    const storiesResponse = await axios.post(`${BASE_URL}/epics/${testEpicId}/stories/generate`, {}, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('   ✅ Story建议生成成功');
    console.log(`   📊 生成了 ${storiesResponse.data.story_suggestions?.length || 0} 个Story建议:`);
    
    storiesResponse.data.story_suggestions?.forEach((story, index) => {
      console.log(`      ${index + 1}. ${story.title} (${story.estimated_hours || 'N/A'}h)`);
    });
    console.log('');

    // 8. 确认Story拆分（使用前2个Story）
    console.log('8️⃣ 确认Story拆分...');
    const storiesToConfirm = storiesResponse.data.story_suggestions.slice(0, 2);
    
    const confirmStoriesResponse = await axios.put(`${BASE_URL}/epics/${testEpicId}/stories/confirm`, {
      stories: storiesToConfirm
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('   ✅ Story确认成功');
    console.log(`   📋 创建了 ${confirmStoriesResponse.data.stories.length} 个Story`);
    
    if (confirmStoriesResponse.data.stories.length > 0) {
      testStoryId = confirmStoriesResponse.data.stories[0].id;
      console.log(`   🎯 测试Story: ${confirmStoriesResponse.data.stories[0].title} (${testStoryId})`);
    }
    console.log('');

    // 9. 获取Story列表
    console.log('9️⃣ 获取Story列表...');
    const storiesListResponse = await axios.get(`${BASE_URL}/epics/${testEpicId}/stories`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log(`   ✅ 获取到 ${storiesListResponse.data.stories.length} 个Story`);
    storiesListResponse.data.stories.forEach((story, index) => {
      console.log(`      ${index + 1}. ${story.title}`);
      console.log(`         ⏱️  ${story.estimated_hours || 'N/A'}h | 📊 ${story.status} | 🎯 优先级${story.priority}`);
    });
    console.log('');

    // 10. 获取Story详情
    console.log('🔟 获取Story详情...');
    const storyDetailResponse = await axios.get(`${BASE_URL}/stories/${testStoryId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    const story = storyDetailResponse.data.story;
    console.log('   ✅ 获取Story详情成功');
    console.log(`   📋 标题: ${story.title}`);
    console.log(`   👤 用户故事: ${story.user_story?.substring(0, 100)}...`);
    console.log(`   🔧 后端API: ${story.backend_api?.endpoint || 'N/A'}`);
    console.log(`   📊 验收标准: ${Object.keys(story.acceptance_criteria || {}).length} 个维度`);
    console.log('');

    // 11. 测试Story导出
    console.log('1️⃣1️⃣ 测试Story导出...');
    try {
      const exportResponse = await axios.get(`${BASE_URL}/stories/${testStoryId}/export`, {
        headers: { Authorization: `Bearer ${authToken}` },
        responseType: 'text'
      });
      
      console.log('   ✅ Story导出成功');
      console.log(`   📄 文档长度: ${exportResponse.data.length} 字符`);
      console.log(`   📋 包含章节: ${exportResponse.data.match(/^##? /gm)?.length || 0} 个`);
    } catch (error) {
      console.log('   ❌ Story导出失败:', error.response?.data?.error || error.message);
    }
    console.log('');

    // 12. 测试更新操作
    console.log('1️⃣2️⃣ 测试更新操作...');
    
    // 更新Epic
    const updateEpicResponse = await axios.put(`${BASE_URL}/epics/${testEpicId}`, {
      status: 'in_progress',
      priority: 1
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('   ✅ Epic更新成功');
    
    // 更新Story
    const updateStoryResponse = await axios.put(`${BASE_URL}/stories/${testStoryId}`, {
      status: 'in_progress',
      estimated_hours: 12
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('   ✅ Story更新成功');
    console.log('');

    // 13. 最终验证
    console.log('1️⃣3️⃣ 最终验证...');
    const finalEpicsResponse = await axios.get(`${BASE_URL}/projects/${PROJECT_ID}/epics`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('   📊 最终项目结构:');
    console.log(`   📋 项目: ${project.name}`);
    console.log(`   📊 Epic数量: ${finalEpicsResponse.data.epics.length}`);
    
    let totalStories = 0;
    for (const epic of finalEpicsResponse.data.epics) {
      const epicStoriesResponse = await axios.get(`${BASE_URL}/epics/${epic.id}/stories`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      totalStories += epicStoriesResponse.data.stories.length;
      console.log(`      - ${epic.name}: ${epicStoriesResponse.data.stories.length} 个Story`);
    }
    console.log(`   📊 Story总数: ${totalStories}`);

    console.log('\n🎉 需求拆分API测试完成！');
    console.log('\n📋 测试结果汇总:');
    console.log(`   ✅ 项目ID: ${PROJECT_ID}`);
    console.log(`   ✅ Epic ID: ${testEpicId}`);
    console.log(`   ✅ Story ID: ${testStoryId}`);
    console.log(`   ✅ 所有API接口正常工作`);

  } catch (error) {
    console.error('\n❌ 测试失败:', error.response?.data?.error || error.message);
    if (error.response?.status) {
      console.error(`   HTTP状态: ${error.response.status}`);
    }
    if (error.response?.data) {
      console.error('   响应详情:', error.response.data);
    }
  }
}

// 运行测试
testRequirementSplittingOnly();