// register.js - 注册页面脚本

const form = document.getElementById('registerForm');
form.addEventListener('submit', function (e) {
  e.preventDefault();
  alert('注册成功！即将跳转到登录页');
  location.href = 'login.html';
});