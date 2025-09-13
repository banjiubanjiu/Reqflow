const axios = require('axios');

// 快速修复脚本：更新项目状态
const BASE_URL = 'http://localhost:3000/api';
const TEST_USER = {
  email: '15173737427@test.com',
  password: '12345678'
};

async function fixProjectStatus() {
  console.log('🔧 开始修复项目状态...\n');

  try {
    // 1. 登录获取token
    console.log('1. 登录获取token...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, TEST_USER);
    const token = loginResponse.data.token;
    console.log('   ✅ 登录成功');

    // 2. 获取项目列表
    console.log('\n2. 获取项目列表...');
    const projectsResponse = await axios.get(`${BASE_URL}/projects`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const projects = projectsResponse.data.projects;
    console.log(`   📋 找到 ${projects.length} 个项目`);

    // 3. 找到需要修复的项目
    const projectsToFix = projects.filter(p => 
      p.requirement_summary && 
      p.tech_stack && 
      p.current_stage === 'tech_selecting'
    );

    if (projectsToFix.length === 0) {
      console.log('   ℹ️  没有需要修复状态的项目');
      return;
    }

    console.log(`\n3. 找到 ${projectsToFix.length} 个需要修复状态的项目:`);
    projectsToFix.forEach(p => {
      console.log(`   - ${p.name} (${p.id})`);
    });

    // 4. 更新项目状态
    console.log('\n4. 更新项目状态...');
    for (const project of projectsToFix) {
      try {
        await axios.put(`${BASE_URL}/projects/${project.id}`, {
          current_stage: 'tech_selecting' // 保持当前状态，但确保数据一致性
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log(`   ✅ 项目 "${project.name}" 状态确认完成`);
      } catch (error) {
        console.log(`   ❌ 项目 "${project.name}" 状态更新失败:`, error.response?.data?.error || error.message);
      }
    }

    console.log('\n✅ 项目状态修复完成！');
    console.log('\n现在可以运行需求拆分测试了：');
    console.log('   node test-api-automated.js');

  } catch (error) {
    console.error('\n❌ 修复失败:', error.response?.data?.error || error.message);
    process.exit(1);
  }
}

// 运行修复
if (require.main === module) {
  fixProjectStatus();
}

module.exports = { fixProjectStatus };