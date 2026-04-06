// login.js - 登录页面脚本

const form = document.querySelector(".login-form");
form.addEventListener("submit", function (e) {
  e.preventDefault();
  localStorage.setItem("isLogin", "true");
  location.href = "index.html";
});