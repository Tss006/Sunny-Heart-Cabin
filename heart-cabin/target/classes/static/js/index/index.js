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
  const token = localStorage.getItem("token");
  const selectedPage = document.getElementById(page + '-content');
  if (selectedPage.id === 'user-content') {
    axios.get("user/info", {
      headers: {
        token: token
      }
    }).then(res => {
      if (res.data && res.data.code === 200 && res.data.data) {
        const user = res.data.data;
        document.getElementById('nickname').textContent = user.nickname || user.username || '心晴小屋用户';
        document.getElementById('age').textContent = user.age || '无';
        document.getElementById('gender').textContent = user.gender || '无';
        document.getElementById('signature').textContent = user.signature || '无';
        // 注册时间
        const regTimeElem = document.querySelector('#user-content .profile-info .info-item:nth-child(5) .value');
        if (regTimeElem) {
          if (user.createTime) {
            regTimeElem.textContent = user.createTime.split('T')[0].replace(/-/g, '年').replace(/(\d{4})年(\d{2})年(\d{2})/, '$1年$2月$3日');
          } else {
            regTimeElem.textContent = '未知';
          }
        }
        // 会员等级
        const levelElem = document.querySelector('#user-content .profile-info .info-item:nth-child(6) .value');
        if (levelElem) {
          if (user.role === 'admin') {
            levelElem.textContent = '管理员';
          } else if (user.role === 'user') {
            levelElem.textContent = '普通会员';
          } else {
            levelElem.textContent = user.role || '普通会员';
          }
        }
        // 当前状态
        const statusElem = document.querySelector('#user-content .profile-info .info-item:nth-child(7) .value');
        if (statusElem) {
          if (user.status === 1) {
            statusElem.textContent = '已登录';
          } else if (user.status === 0) {
            statusElem.textContent = '已禁用';
          } else {
            statusElem.textContent = '未知';
          }
        }
      } else {
        document.getElementById('nickname').textContent = '未获取到用户信息';
        alert(res.data.msg || '获取用户信息失败');
      }
    }).catch(() => {
      document.getElementById('nickname').textContent = '获取用户信息失败';
    });
  }

  selectedPage.style.display = 'block';
  // AI聊天页面自动问候
  if (selectedPage.id === 'chat-content') {
    if (typeof startNewChatSession === 'function') startNewChatSession();
  }
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

// 新建对话按钮自动问候
window.addEventListener('DOMContentLoaded', function() {
  var newChatBtn = document.getElementById('newChatBtn');
  if (newChatBtn) {
    newChatBtn.addEventListener('click', function() {
      if (typeof startNewChatSession === 'function') startNewChatSession();
    });
  }
});

// 未登录不能进入个人中心
window.onload = function() {
  const isLogin = localStorage.getItem('isLogin');
  if (!isLogin) {
    alert('请先登录');
    location.href = 'login.html';
  }
}