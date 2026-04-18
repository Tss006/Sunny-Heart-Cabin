// index.js - 首页和导航脚本

if (!localStorage.getItem('isLogin')) {
	location.href = 'login.html';
}

function hideAllPages() {
	if (typeof window.closeTestWidget === 'function') {
		window.closeTestWidget();
	}
	if (typeof window.closeMusicWidget === 'function') {
		window.closeMusicWidget();
	}
	if (typeof window.closeHomeMessageWidget === 'function') {
		window.closeHomeMessageWidget();
	}
	if (typeof window.closeMoodWidget === 'function') {
		window.closeMoodWidget();
	}
	if (typeof window.closeAiChatWidget === 'function') {
		window.closeAiChatWidget();
	}
	['home-content', 'mood-content', 'test-content', 'music-content'].forEach(function(id) {
		const element = document.getElementById(id);
		if (element) {
			element.style.display = 'none';
		}
	});
}

function loadHomePage() {
	return;
}

function goHomePage(page) {
	if (page === 'mood' && typeof openMoodWidget === 'function') {
		openMoodWidget();
		return;
	}
	if (page === 'message') {
		if (typeof toggleHomeMessageWidget === 'function') {
			toggleHomeMessageWidget();
			return;
		}
	}
	if (page === 'test') {
		if (typeof toggleTestWidget === 'function') {
			toggleTestWidget();
			return;
		}
	}
	if (page === 'music') {
		if (typeof toggleMusicWidget === 'function') {
			toggleMusicWidget();
			return;
		}
	}
	if (page === 'user') {
		location.href = 'user.html';
		return;
	}
	if (page === 'counselor') {
		location.href = 'consult.html';
		return;
	}
	showPage(page);
}

function getStoredUser() {
	const raw = localStorage.getItem('user');
	if (!raw) {
		return {};
	}
	try {
		return JSON.parse(raw) || {};
	} catch (error) {
		return {};
	}
}

function getCurrentUserId() {
	const storedUserId = localStorage.getItem('user_id');
	if (storedUserId) {
		return storedUserId;
	}
	const account = getStoredUser();
	return account.user_id || account.userId || account.id || '';
}

function getCurrentUserName() {
	const account = getStoredUser();
	return account.nickname || account.name || account.username || '心晴用户';
}

function isHomeMessageWidgetVisible() {
	const homeMessageWidget = document.getElementById('homeMessageWidget');
	return !!(homeMessageWidget && homeMessageWidget.style.display !== 'none' && homeMessageWidget.style.display !== '');
}

function openHomeMessageWidget() {
	const homeMessageWidget = document.getElementById('homeMessageWidget');
	if (!homeMessageWidget) {
		return;
	}
	if (typeof window.closeTestWidget === 'function') {
		window.closeTestWidget();
	}
	if (typeof window.closeMusicWidget === 'function') {
		window.closeMusicWidget();
	}
	if (typeof window.closeMoodWidget === 'function') {
		window.closeMoodWidget();
	}
	if (typeof window.closeAiChatWidget === 'function') {
		window.closeAiChatWidget();
	}
	homeMessageWidget.style.display = 'flex';
	document.body.classList.add('widget-modal-open');
	loadHomeMessages();
	const homeMessageInput = document.getElementById('homeMessageInput');
	if (homeMessageInput) {
		homeMessageInput.focus();
	}
}

function closeHomeMessageWidget() {
	const homeMessageWidget = document.getElementById('homeMessageWidget');
	if (!homeMessageWidget) {
		return;
	}
	homeMessageWidget.style.display = 'none';
	document.body.classList.remove('widget-modal-open');
}

function toggleHomeMessageWidget() {
	if (isHomeMessageWidgetVisible()) {
		closeHomeMessageWidget();
	} else {
		openHomeMessageWidget();
	}
}

function renderHomeMessages(messages) {
	const messageList = document.getElementById('homeMessageList');
	if (!messageList) {
		return;
	}

	messageList.innerHTML = '';
	const list = Array.isArray(messages) ? messages : [];
	if (!list.length) {
		const empty = document.createElement('div');
		empty.className = 'home-message-empty';
		empty.textContent = '还没有留言，先留下一句鼓励的话吧。';
		messageList.appendChild(empty);
		return;
	}

	list.forEach(function(item) {
		const card = document.createElement('article');
		card.className = 'home-message-bubble';

		const meta = document.createElement('div');
		meta.className = 'home-message-meta';
		const displayName = item && item.anonymous ? '匿名用户' : ((item && item.nickname) || '心晴用户');
		const createdTime = item && item.createdTime ? String(item.createdTime).replace('T', ' ').slice(0, 16) : '刚刚';
		meta.textContent = displayName + ' · ' + createdTime;

		const content = document.createElement('p');
		content.className = 'home-message-text';
		content.textContent = item && item.message ? item.message : '';

		card.appendChild(meta);
		card.appendChild(content);
		messageList.appendChild(card);
	});
}

function loadHomeMessages() {
	const messageStatus = document.getElementById('homeMessageStatus');
	if (messageStatus) {
		messageStatus.textContent = '正在加载留言...';
	}

	axios.get('/message/random', {
		params: {
			count: 3
		}
	}).then(function(res) {
		const messages = res && res.data && res.data.code === 200 && Array.isArray(res.data.data) ? res.data.data : [];
		renderHomeMessages(messages);
		if (messageStatus) {
			messageStatus.textContent = messages.length ? '已加载最新留言' : '暂无留言';
		}
	}).catch(function() {
		renderHomeMessages([]);
		if (messageStatus) {
			messageStatus.textContent = '留言暂时加载失败';
		}
	});
}

function submitHomeMessage(event) {
	if (event) {
		event.preventDefault();
	}

	const input = document.getElementById('homeMessageInput');
	const anonymousInput = document.getElementById('homeMessageAnonymous');
	const status = document.getElementById('homeMessageStatus');
	const content = input ? input.value.trim() : '';
	if (!content) {
		if (status) {
			status.textContent = '请先输入一条留言';
		}
		return;
	}

	const anonymous = !!(anonymousInput && anonymousInput.checked);
	const payload = {
		message: content,
		anonymous: anonymous,
		userId: getCurrentUserId(),
		nickname: getCurrentUserName()
	};

	axios.post('/message/submit', payload).then(function(res) {
		if (res && res.data && res.data.code === 200) {
			if (input) {
				input.value = '';
			}
			if (status) {
				status.textContent = '留言已发布';
			}
			loadHomeMessages();
			return;
		}
		throw new Error('message submit failed');
	}).catch(function() {
		if (status) {
			status.textContent = '留言发布失败，请稍后再试';
		}
	});
}

function showPage(page) {
	if (page === 'test' && typeof openTestWidget === 'function') {
		openTestWidget();
		return;
	}
	if (page === 'music' && typeof openMusicWidget === 'function') {
		openMusicWidget();
		return;
	}
	if (page === 'message' && typeof openHomeMessageWidget === 'function') {
		openHomeMessageWidget();
		return;
	}
	hideAllPages();

	const token = localStorage.getItem('token');
	const selectedPage = document.getElementById(page + '-content');
	if (!selectedPage) return;

	selectedPage.style.display = 'block';
	if (selectedPage.id === 'home-content' && typeof loadHomePage === 'function') {
		loadHomePage();
	}
	if (selectedPage.id === 'user-content' && typeof loadUserProfile === 'function') {
		loadUserProfile(token);
	}
	if (selectedPage.id === 'counselor-content' && typeof loadCounselors === 'function') {
		loadCounselors();
	}
}

function logout() {
	if (confirm('确定要退出登录吗？')) {
		localStorage.removeItem('isLogin');
		location.href = 'login.html';
	}
}

document.addEventListener('DOMContentLoaded', function() {
	const logoutBtn = document.getElementById('logout');
	if (logoutBtn) {
		logoutBtn.onclick = logout;
	}

	const homeMessageForm = document.getElementById('homeMessageForm');
	if (homeMessageForm) {
		homeMessageForm.addEventListener('submit', submitHomeMessage);
	}

	const homeMessageRefresh = document.getElementById('homeMessageRefresh');
	if (homeMessageRefresh) {
		homeMessageRefresh.addEventListener('click', loadHomeMessages);
	}

	const closeHomeMessageWidgetBtn = document.getElementById('closeHomeMessageWidgetBtn');
	if (closeHomeMessageWidgetBtn) {
		closeHomeMessageWidgetBtn.addEventListener('click', closeHomeMessageWidget);
	}

	if (document.getElementById('home-content')) {
		loadHomePage();
	}
});

window.openHomeMessageWidget = openHomeMessageWidget;
window.closeHomeMessageWidget = closeHomeMessageWidget;
window.toggleHomeMessageWidget = toggleHomeMessageWidget;
