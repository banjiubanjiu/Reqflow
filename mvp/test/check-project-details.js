const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';
const TEST_USER = {
  email: '15173737427@test.com',
  password: '12345678'
};

async function checkProjectDetails() {
  console.log('🔍 检查项目详细信息...\n');

  try {
    // 1. 登录
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, TEST_USER);
    const token = loginResponse.data.token;
    console.log('✅ 登录成功\n');

    // 2. 获取项目列表
    const projectsResponse = await axios.get(`${BASE_URL}/projects`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log(`📋 找到 ${projectsResponse.data.projects.length} 个项目:\n`);

    // 3. 检查每个项目的详细信息
    for (const project of projectsResponse.data.projects) {
      console.log(`🔍 检查项目: ${project.name}`);
      console.log(`   🆔 ID: ${project.id}`);
      console.log(`   📊 状态: ${project.current_stage}`);
      
      try {
        // 获取项目详情
        const detailResponse = await axios.get(`${BASE_URL}/projects/${project.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const detail = detailResponse.data.project;
        console.log(`   📝 需求总结: ${detail.requirement_summary ? '✅ 已完成' : '❌ 未完成'}`);
        console.log(`   🛠️  技术选型: ${detail.tech_stack ? '✅ 已完成' : '❌ 未完成'}`);
        
        if (detail.requirement_summary) {
          console.log(`   📄 需求内容: ${detail.requirement_summary.substring(0, 100)}...`);
        }
        
        if (detail.tech_stack) {
          console.log(`   🔧 技术数量: ${detail.tech_stack.tech_choices?.length || 0} 项`);
        }
        
        // 检查对话历史
        if (detail.ai_conversations && detail.ai_conversations.length > 0) {
          console.log(`   💬 对话历史: ${detail.ai_conversations.length} 个对话`);
          detail.ai_conversations.forEach(conv => {
            console.log(`      - ${conv.conversation_type}: ${conv.is_completed ? '已完成' : '进行中'} (${conv.messages?.length || 0} 条消息)`);
          });
        } else {
          console.log(`   💬 对话历史: 无`);
        }
        
      } catch (error) {
        console.log(`   ❌ 获取详情失败: ${error.response?.data?.error || error.message}`);
      }
      
      console.log(''); // 空行分隔
    }

    // 4. 建议下一步操作
    console.log('💡 建议操作:');
    const incompleteProjects = projectsResponse.data.projects.filter(p => 
      !p.requirement_summary || !p.tech_stack
    );
    
    if (incompleteProjects.length > 0) {
      console.log('   1. 完成现有项目的需求澄清和技术选型流程');
      console.log('   2. 或者创建一个新项目进行完整测试');
    } else {
      console.log('   可以直接测试需求拆分功能');
    }

  } catch (error) {
    console.error('❌ 检查失败:', error.response?.data?.error || error.message);
  }
}

// 运行检查
checkProjectDetails();