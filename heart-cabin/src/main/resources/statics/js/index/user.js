// user.js - 用户页面脚本

// 更换头像功能
function changeAvatar() {
  const avatarInput = document.getElementById('avatarInput');
  avatarInput.click();
}

// 处理头像文件选择
document.getElementById('avatarInput').addEventListener('change', function(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      const avatarImg = document.getElementById('avatarImg');
      avatarImg.src = e.target.result;
      // 可以在这里添加保存到服务器的逻辑
      console.log('头像已更换');
    };
    reader.readAsDataURL(file);
  }
});