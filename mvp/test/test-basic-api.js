const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';
const TEST_USER = {
  email: '15173737427@test.com',
  password: '12345678'
};

async function testBasicAPI() {
  console.log('🔍 测试基本API连接...\n');

  try {
    // 1. 测试健康检查
    console.log('1. 测试健康检查...');
    const healthResponse = await axios.get('http://localhost:3000/health');
    console.log('   ✅ 后端服务正常运行');
    console.log(`   📊 响应: ${healthResponse.data.message}`);

    // 2. 测试登录
    console.log('\n2. 测试用户登录...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, TEST_USER);
    const token = loginResponse.data.token;
    console.log('   ✅ 登录成功');
    console.log(`   🔑 Token: ${token.substring(0, 20)}...`);

    // 3. 测试获取项目列表
    console.log('\n3. 测试获取项目列表...');
    const projectsResponse = await axios.get(`${BASE_URL}/projects`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`   ✅ 获取到 ${projectsResponse.data.projects.length} 个项目`);
    
    // 显示项目状态
    projectsResponse.data.projects.forEach(p => {
      console.log(`   📋 ${p.name}: ${p.current_stage} (需求:${p.requirement_summary ? '✅' : '❌'}, 技术:${p.tech_stack ? '✅' : '❌'})`);
    });

    // 4. 找到可以进行需求拆分的项目
    const validProject = projectsResponse.data.projects.find(p => 
      p.requirement_summary && p.tech_stack
    );

    if (validProject) {
      console.log(`\n4. 找到可用项目: ${validProject.name}`);
      console.log(`   🆔 项目ID: ${validProject.id}`);
      console.log(`   📊 当前状态: ${validProject.current_stage}`);
      
      // 5. 测试开始需求拆分
      console.log('\n5. 测试开始需求拆分...');
      try {
        const splittingResponse = await axios.post(
          `${BASE_URL}/projects/${validProject.id}/requirement-splitting/start`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log('   ✅ 需求拆分开始成功');
        console.log(`   📊 生成了 ${splittingResponse.data.epic_suggestions?.length || 0} 个Epic建议`);
      } catch (error) {
        console.log('   ❌ 需求拆分失败:', error.response?.data?.error || error.message);
      }
    } else {
      console.log('\n4. ⚠️  没有找到完成需求澄清和技术选型的项目');
      console.log('   💡 建议: 先完成一个项目的需求澄清和技术选型流程');
    }

    console.log('\n✅ 基本API测试完成');

  } catch (error) {
    console.error('\n❌ 测试失败:', error.response?.data?.error || error.message);
    if (error.response?.status) {
      console.error(`   HTTP状态: ${error.response.status}`);
    }
  }
}

// 运行测试
testBasicAPI();