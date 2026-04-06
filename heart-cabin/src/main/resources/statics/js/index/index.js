// index.js - 首页和导航脚本

// 检查登录状态
if (!localStorage.getItem("isLogin")) {
  location.href = "login.html";
}

function showPage(page, link) {
  // 隐藏所有内容
  document.getElementById('home-content').style.display = 'none';
  document.getElementById('user-content').style.display = 'none';
  document.getElementById('chat-content').style.display = 'none';
  document.getElementById('mood-content').style.display = 'none';
  document.getElementById('test-content').style.display = 'none';
  document.getElementById('music-content').style.display = 'none';
  // 显示选中的
  document.getElementById(page + '-content').style.display = 'block';
  // 更新active类
  var links = document.querySelectorAll('.sidebar-menu a');
  links.forEach(function(l) {
    l.classList.remove('active');
  });
  link.classList.add('active');
}

// 退出登录
function logout() {
  if (confirm('确定要退出登录吗？')) {
    localStorage.removeItem('isLogin');
    location.href = 'login.html';
  }
}

document.getElementById('logout').onclick = function(){
  logout();
}

// 未登录不能进入个人中心
window.onload = function() {
  const isLogin = localStorage.getItem('isLogin');
  if (!isLogin) {
    alert('请先登录');
    location.href = 'login.html';
  }
}