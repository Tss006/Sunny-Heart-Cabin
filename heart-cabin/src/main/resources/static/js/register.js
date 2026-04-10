// register.js - 注册页面脚本

const form = document.getElementById('registerForm');
const errorMessage = document.getElementById("error-message");


form.addEventListener('submit', function (e) {
  e.preventDefault();

  const submitBtn = form.querySelector(".btn-primary");
  if (submitBtn.disabled) return; // 防止重复点击
  const originalText = submitBtn.textContent;
  submitBtn.textContent = "注册中...";
  submitBtn.disabled = true;

  errorMessage.style.display = "none";
  const username = document.getElementById("register_username").value.trim();
  const password = document.getElementById("register_password").value;
  const nickname = document.getElementById("register_nickname").value.trim();
  const password2 = document.getElementById("register_password2").value;

  // 表单校验
  if (!nickname) {
    showError("请输入昵称");
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
    return;
  }
  if (!username) {
    showError("请输入用户名");
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
    return;
  }
  if (!/^\w{4,16}$/.test(username)) {
    showError("用户名需为4-16位字母数字下划线");
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
    return;
  }
  if (!password) {
    showError("请输入密码");
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
    return;
  }
  if (password.length < 6) {
    showError("密码长度不能少于6位");
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
    return;
  }
  if (password !== password2) {
    showError("两次密码输入不一致");
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
    return;
  }

  axios.post('user/register', {
    username: username,
    password: password,
    nickname: nickname
  }).then(res => {
    const data = res.data;
    if (data.code === 200) {
      alert('注册成功！即将跳转到登录页');
      location.href = 'login.html';
    } else {
      showError(data.msg || "注册失败")
    }
  }).catch(error => {
    console.error("注册请求失败:", error);
    showError("网络错误，请稍后重试");
  }).finally(() => {
    // 恢复按钮状态
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
  });
});

function showError(message) {
  errorMessage.textContent = message;
  errorMessage.style.display = "block";
}