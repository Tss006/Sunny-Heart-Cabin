// 心晴小屋 - 交互脚本
document.addEventListener('DOMContentLoaded', () => {
  // 登录表单交互
  const loginForm = document.querySelector('.login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const account = document.getElementById('login-account').value;
      const password = document.getElementById('login-password').value;
      
      // 后续可接入后端登录接口，这里做基础校验
      if (account && password) {
        alert('登录成功！欢迎回到心晴小屋 ✨');
        loginForm.reset();
      } else {
        alert('请输入完整的账号和密码');
      }
    });
  }

  // 注册表单交互
  const registerForm = document.querySelector('.register-form');
  if (registerForm) {
    registerForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const password = document.getElementById('reg-password').value;
      const confirm = document.getElementById('reg-confirm').value;
      
      if (password !== confirm) {
        alert('两次输入的密码不一致，请重新输入');
        return;
      }
      
      alert('注册成功！快去登录吧 ✨');
      registerForm.reset();
      // 自动跳转到登录页
      window.location.href = 'index.html';
    });
  }
});