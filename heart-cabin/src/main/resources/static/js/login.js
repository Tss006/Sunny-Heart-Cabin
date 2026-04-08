// login.js - 登录页面脚本
const form = document.querySelector(".login-form");
const errorMessage = document.getElementById("error-message");

form.addEventListener("submit", function (e) {
  e.preventDefault();

  const username = document.getElementById("login-account").value;
  const password = document.getElementById("login-password").value;

  // 显示加载状态
  const submitBtn = form.querySelector(".btn-primary");
  const originalText = submitBtn.textContent;
  submitBtn.textContent = "登录中...";
  console.log("正在登录...");
  submitBtn.disabled = true;

  // 隐藏之前的错误信息
  errorMessage.style.display = "none";

  // 发送登录请求
  axios.post('/user/login', {
    username: username,
    password: password
  })
  .then(response => {
    const data = response.data;
    console.log(data);
    if (data.code===200) {
      // 登录成功
      localStorage.setItem("isLogin", "true");
      localStorage.setItem("user", JSON.stringify(data.data)); // 保存用户信息
      location.href = "index.html";
    } else {
      // 登录失败
      console.log("登录失败")
      showError(data.message || "登录失败");
    }
  })
  .catch(error => {
    console.error("登录请求失败:", error);
    showError("网络错误，请稍后重试");

  })
  .finally(() => {
    // 恢复按钮状态
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
  });
});

function showError(message) {
  errorMessage.textContent = message;
  errorMessage.style.display = "block";
}