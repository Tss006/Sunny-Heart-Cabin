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

// 编辑个人信息功能
let isEditing = false;

document.getElementById('editProfileBtn').addEventListener('click', function() {
  const btn = this;
  const editableFields = ['nickname', 'age', 'gender', 'signature'];

  if (!isEditing) {
    // 进入编辑模式
    editableFields.forEach(fieldId => {
      const span = document.getElementById(fieldId);
      const value = span.textContent;
      const input = document.createElement('input');
      input.type = fieldId === 'age' ? 'number' : 'text';
      input.value = value;
      input.id = fieldId + 'Input';
      input.className = 'edit-input';
      span.parentNode.replaceChild(input, span);
    });
    btn.textContent = '保存';
    isEditing = true;
  } else {
    // 保存并退出编辑模式
    editableFields.forEach(fieldId => {
      const input = document.getElementById(fieldId + 'Input');
      const value = input.value;
      const span = document.createElement('span');
      span.className = 'value';
      span.id = fieldId;
      span.textContent = value;
      input.parentNode.replaceChild(span, input);
    });
    btn.textContent = '编辑';
    isEditing = false;
    // 可以在这里添加保存到服务器的逻辑
    console.log('个人信息已保存');
  }
});