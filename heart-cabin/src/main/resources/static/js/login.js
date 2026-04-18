const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");
const modeTabs = Array.from(document.querySelectorAll("[data-mode-tab]"));
const switchButtons = Array.from(document.querySelectorAll("[data-switch-to]"));
const roleButtons = Array.from(document.querySelectorAll("[data-role-btn]"));
const loginError = document.getElementById("login-error");
const registerError = document.getElementById("register-error");
const authSubtitle = document.getElementById("auth-subtitle");
const loginTitle = document.querySelector(".login-title");

let currentMode = "login";
let currentRole = "user";

function setTitleText(mode) {
  if (!authSubtitle || !loginTitle) {
    return;
  }

  if (mode === "login") {
    loginTitle.textContent = "心晴小屋";
    authSubtitle.textContent = "愿每一种情绪，都能被温柔接住";
  } else {
    loginTitle.textContent = "用户注册";
    authSubtitle.textContent = "创建你的心晴小屋账号";
  }
}

function showError(element, message) {
  element.textContent = message;
  element.style.display = "block";
}

function clearError(element) {
  element.textContent = "";
  element.style.display = "none";
}

function setLoading(button, text) {
  const originalText = button.textContent;
  button.textContent = text;
  button.disabled = true;
  return originalText;
}

function switchMode(mode) {
  currentMode = mode !== "register" ? "login" : "register";
  const isLogin = currentMode === "login";

  loginForm.hidden = !isLogin;
  registerForm.hidden = isLogin;

  modeTabs.forEach((tab) => {
    const active = tab.dataset.modeTab === (isLogin ? "login" : "register");
    tab.classList.toggle("is-active", active);
    tab.setAttribute("aria-selected", String(active));
  });

  clearError(loginError);
  clearError(registerError);

  setTitleText(currentMode);

  roleButtons.forEach((button) => {
    const isActive = button.dataset.roleBtn === currentRole;
    button.classList.toggle("active", isActive);
  });

  if (isLogin) {
    document.getElementById("login-account").focus();
  } else {
    document.getElementById("register-nickname").focus();
  }
}

function handleLoginSubmit(event) {
  event.preventDefault();

  const username = document.getElementById("login-account").value.trim();
  const password = document.getElementById("login-password").value;

  if (!username) {
    showError(loginError, "请输入用户名");
    return;
  }
  if (!password) {
    showError(loginError, "请输入密码");
    return;
  }
  if (password.length < 6) {
    showError(loginError, "密码长度不能少于6位");
    return;
  }

  const submitBtn = loginForm.querySelector(".login-btn");
  if (!submitBtn || submitBtn.disabled) return;
  const originalText = setLoading(submitBtn, "登录中...");
  clearError(loginError);

  axios.post("/user/login", {
    username,
    password,
    role: currentRole
  })
  .then(response => {
    const data = response.data;
    if (data.code === 200) {
      const account = data.data && data.data.user ? data.data.user : {};
      const role = String(account.role || currentRole || "user").toLowerCase();
      localStorage.setItem("isLogin", "true");
      localStorage.setItem("token", data.data.token);
      localStorage.setItem("user", JSON.stringify(account));
      localStorage.setItem("user_id", account && account.id ? String(account.id) : "");
      localStorage.setItem("user_role", role);
      if (role === "counselor") {
        sessionStorage.removeItem("home_intro_pending");
      } else {
        sessionStorage.setItem("home_intro_pending", "1");
      }
      location.href = role === "counselor" ? "counselor.html" : "index.html";
    } else {
      showError(loginError, data.msg || "登录失败");
    }
  })
  .catch(error => {
    console.error("登录请求失败:", error);
    showError(loginError, "网络错误，请稍后重试");
  })
  .finally(() => {
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
  });
}

function handleRegisterSubmit(event) {
  event.preventDefault();

  const nickname = document.getElementById("register-nickname").value.trim();
  const username = document.getElementById("register-username").value.trim();
  const password = document.getElementById("register-password").value;
  const password2 = document.getElementById("register-password2").value;

  if (!nickname) {
    showError(registerError, "请输入昵称");
    return;
  }
  if (!username) {
    showError(registerError, "请输入用户名");
    return;
  }
  if (!/^\w{4,16}$/.test(username)) {
    showError(registerError, "用户名需为4-16位字母数字下划线");
    return;
  }
  if (!password) {
    showError(registerError, "请输入密码");
    return;
  }
  if (password.length < 6) {
    showError(registerError, "密码长度不能少于6位");
    return;
  }
  if (password !== password2) {
    showError(registerError, "两次密码输入不一致");
    return;
  }

  const submitBtn = registerForm.querySelector(".login-btn");
  if (!submitBtn || submitBtn.disabled) return;
  const originalText = setLoading(submitBtn, "注册中...");
  clearError(registerError);

  axios.post("/user/register", {
    username,
    password,
    nickname
  }).then(response => {
    const data = response.data;
    if (data.code === 200) {
      document.getElementById("register-nickname").value = "";
      document.getElementById("register-password").value = "";
      document.getElementById("register-password2").value = "";
      switchMode("login");
      document.getElementById("login-account").value = username;
      showError(loginError, "注册成功，请使用新账号登录。");
    } else {
      showError(registerError, data.msg || "注册失败");
    }
  }).catch(error => {
    console.error("注册请求失败:", error);
    showError(registerError, "网络错误，请稍后重试");
  }).finally(() => {
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
  });
}

modeTabs.forEach((tab) => {
  tab.addEventListener("click", () => switchMode(tab.dataset.modeTab));
});

switchButtons.forEach((button) => {
  button.addEventListener("click", () => switchMode(button.dataset.switchTo));
});

loginForm.addEventListener("submit", handleLoginSubmit);
registerForm.addEventListener("submit", handleRegisterSubmit);

roleButtons.forEach((button) => {
  button.addEventListener("click", () => {
    currentRole = button.dataset.roleBtn || "user";
    roleButtons.forEach((item) => item.classList.toggle("active", item === button));
  });
});

switchMode("login");