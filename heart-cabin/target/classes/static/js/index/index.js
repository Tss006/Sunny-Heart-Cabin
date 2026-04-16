// index.js - 首页和导航脚本

if (!localStorage.getItem('isLogin')) {
	location.href = 'login.html';
}

function hideAllPages() {
	document.getElementById('home-content').style.display = 'none';
	document.getElementById('user-content').style.display = 'none';
	document.getElementById('chat-content').style.display = 'none';
	document.getElementById('counselor-content').style.display = 'none';
	document.getElementById('mood-content').style.display = 'none';
	document.getElementById('test-content').style.display = 'none';
	document.getElementById('music-content').style.display = 'none';
}

function loadHomePage() {
	const quoteText = document.getElementById('homeQuoteText');
	const quoteAuthor = document.getElementById('homeQuoteAuthor');

	if (quoteText) {
		quoteText.textContent = '正在从数据库加载今日名言...';
	}
	if (quoteAuthor) {
		quoteAuthor.textContent = '-';
	}

	axios.get('/quote/random').then(function(res) {
		if (res && res.data && res.data.code === 200 && res.data.data) {
			const quote = res.data.data;
			if (quoteText) {
				quoteText.textContent = quote.content || '让情绪先被看见，再慢慢变好。';
			}
			if (quoteAuthor) {
				quoteAuthor.textContent = quote.author ? '—— ' + quote.author : '—— 佚名';
			}
			return;
		}
		throw new Error('quote load failed');
	}).catch(function() {
		if (quoteText) {
			quoteText.textContent = '你无法阻止风来，但可以调整帆。';
		}
		if (quoteAuthor) {
			quoteAuthor.textContent = '—— 佚名';
		}
	}).finally(function() {
		loadHomeMessages();
	});
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

function updateActiveLink(link) {
	var links = document.querySelectorAll('.sidebar-menu a');
	links.forEach(function(item) {
		item.classList.remove('active');
	});
	if (link) {
		link.classList.add('active');
	}
}

function showPage(page, link) {
	const currentPage = document.querySelector('.content > div:not([style*="display: none"])');
	if (currentPage && currentPage.id === 'chat-content' && page !== 'chat') {
		if (typeof summarizeAndShowSession === 'function') summarizeAndShowSession();
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
	if (selectedPage.id === 'chat-content') {
		if (typeof startNewChatSession === 'function') startNewChatSession();
	}
	if (selectedPage.id === 'counselor-content' && typeof loadCounselors === 'function') {
		loadCounselors();
	}

	updateActiveLink(link);
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

	const newChatBtn = document.getElementById('newChatBtn');
	if (newChatBtn) {
		newChatBtn.addEventListener('click', function() {
			const chatHistory = document.getElementById('chatHistory');
			let hasMsg = false;
			if (chatHistory) {
				const msgs = chatHistory.querySelectorAll('.chat-message');
				msgs.forEach(function(msg) {
					const content = msg.querySelector('.bubble')?.innerText || '';
					if (content.trim() !== '') hasMsg = true;
				});
			}
			if (hasMsg && typeof summarizeAndShowSession === 'function') {
				summarizeAndShowSession();
			}
			if (typeof startNewChatSession === 'function') startNewChatSession();
		});
	}

	const homeMessageForm = document.getElementById('homeMessageForm');
	if (homeMessageForm) {
		homeMessageForm.addEventListener('submit', submitHomeMessage);
	}

	const homeMessageRefresh = document.getElementById('homeMessageRefresh');
	if (homeMessageRefresh) {
		homeMessageRefresh.addEventListener('click', loadHomeMessages);
	}

	if (document.getElementById('home-content')) {
		loadHomePage();
	}
});
