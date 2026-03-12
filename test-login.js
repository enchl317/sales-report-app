// 测试登录功能
async function testLogin() {
  console.log('测试登录功能...');
  
  // 导入 auth 模块
  const { login } = await import('./src/lib/auth');
  
  // 测试有效的登录凭据
  console.log('\n测试有效凭据: store1_staff / password123');
  const result1 = await login('store1_staff', 'password123');
  console.log('登录结果:', result1);
  
  // 测试无效的用户名
  console.log('\n测试无效用户名: invalid_user / password123');
  const result2 = await login('invalid_user', 'password123');
  console.log('登录结果:', result2);
  
  // 测试错误的密码
  console.log('\n测试错误密码: store1_staff / wrongpassword');
  const result3 = await login('store1_staff', 'wrongpassword');
  console.log('登录结果:', result3);
  
  console.log('\n测试完成');
}

// 运行测试
testLogin().catch(console.error);