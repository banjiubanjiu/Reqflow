const bcrypt = require('bcrypt');

async function generatePasswordHash() {
  const password = '12345678';
  const saltRounds = 12;
  
  try {
    const hash = await bcrypt.hash(password, saltRounds);
    console.log('Password:', password);
    console.log('Hash:', hash);
    
    // 验证哈希是否正确
    const isValid = await bcrypt.compare(password, hash);
    console.log('Hash验证:', isValid);
    
    console.log('\n请在Supabase SQL Editor中执行以下SQL更新测试账号密码:');
    console.log(`UPDATE users SET password_hash = '${hash}' WHERE email = '15173737427@test.com';`);
  } catch (error) {
    console.error('Error:', error);
  }
}

generatePasswordHash();