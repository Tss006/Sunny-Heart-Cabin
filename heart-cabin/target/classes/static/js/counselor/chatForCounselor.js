// 咨询师端-用户咨询脚本

(function() {
	let sessions = [];
	let currentSessionId = '';
	let currentCounselorId = '';
	let currentSession = null;

	function escapeHtml(str) {
		return String(str || '').replace(/[&<>"]/g, function(c) {
			return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c];
		});
	}

	function sessionListNode() {
		return document.getElementById('consultSessionList');
	}

	function historyNode() {
		return document.getElementById('consultHistory');
	}

	function inputNode() {
		return document.getElementById('consultInput');
	}

	function titleNode() {
		return document.getElementById('consultChatTitle');
	}

	function subtitleNode() {
		return document.getElementById('consultChatSubtitle');
	}

	function getAccount() {
		const raw = localStorage.getItem('user');
		if (!raw) return {};
		try {
			return JSON.parse(raw) || {};
		} catch (error) {
			return {};
		}
	}

	function resolveCounselorId() {
		const storedUserId = localStorage.getItem('user_id');
		if (storedUserId) {
			return storedUserId;
		}
		const account = getAccount();
		return account.user_id || account.userId || account.id || '';
	}

	function formatTime(value) {
		if (!value) return '';
		return String(value).replace('T', ' ').replace(/\.\d+$/, '').slice(0, 19);
	}

	function resolveUserId(item) {
		return String(item && (item.userId || item.user_id || item.id) ? (item.userId || item.user_id || item.id) : '');
	}

	function renderMessage(role, content, options) {
		const history = historyNode();
		if (!history) return;
		const message = document.createElement('div');
		message.className = 'consult-message' + (role === 'user' ? ' user' : ' counselor');
		const timeText = formatTime(options && options.time ? options.time : '');
		const nickname = options && options.nickname ? options.nickname : (role === 'user' && currentSession && currentSession.nickname ? currentSession.nickname : '咨询师');
		message.innerHTML = '<div class="consult-message-avatar">' + (role === 'user' ? '用' : '我') + '</div><div class="consult-message-body'+(role === 'user' ? ' user' : '')+'"><div class="consult-message-meta">' + escapeHtml(nickname) + (timeText ? ' · ' + escapeHtml(timeText) : '') + '</div><div class="consult-message-bubble">' + escapeHtml(content) + '</div></div>';
		history.appendChild(message);
		history.scrollTop = history.scrollHeight;
	}

	function renderEmptyHistory(message) {
		const history = historyNode();
		if (!history) return;
		history.innerHTML = '';
		const empty = document.createElement('div');
		empty.className = 'consult-empty-state';
		empty.textContent = message || '暂无聊天记录';
		history.appendChild(empty);
	}

	function renderSessionList() {
		const list = sessionListNode();
		if (!list) return;
		list.innerHTML = '';
		if (!sessions.length) {
			const empty = document.createElement('li');
			empty.className = 'active';
			empty.innerHTML = '<strong>暂无会话</strong><span>等待用户发送消息后，这里会自动出现会话记录。</span>';
			list.appendChild(empty);
			return;
		}
		sessions.forEach(function(session) {
			const item = document.createElement('li');
			const sessionId = resolveUserId(session);
			item.className = currentSessionId === sessionId ? 'active' : '';
			item.innerHTML = '<strong>' + escapeHtml(session.nickname || session.name || ('用户 #' + sessionId)) + '</strong><span>' + escapeHtml((session.preview || '暂无预览') + (session.lastTime ? ' · ' + formatTime(session.lastTime) : '')) + '</span>';
			item.onclick = function() {
				currentSessionId = sessionId;
				renderConsultPage(session);
			};
			list.appendChild(item);
		});
	}

	function renderConsultPage(session) {
		const sessionId = resolveUserId(session);
		currentSession = session;
		currentSessionId = sessionId;
		renderSessionList();
		const history = historyNode();
		const title = titleNode();
		const subtitle = subtitleNode();
		const input = inputNode();
		if (title) {
			title.textContent = (session.nickname || session.name || ('用户 #' + sessionId)) + ' 的咨询会话';
		}
		if (subtitle) {
			subtitle.textContent = '最后消息时间：' + (session.lastTime ? formatTime(session.lastTime) : '未知');
		}
		if (input) {
			input.value = '';
		}
		loadHistory(sessionId);
	}

	function loadHistory(userId) {
		const history = historyNode();
		const counselorId = currentCounselorId || resolveCounselorId();
		if (!userId || !counselorId) {
			renderEmptyHistory('请先选择会话');
			return;
		}
		if (history) {
			history.innerHTML = '';
		}
		axios.get('/counselor/chat/history', {
			params: {
				userId: userId,
				counselorId: counselorId
			}
		}).then(function(res) {
			const historyList = res && res.data && res.data.code === 200 && Array.isArray(res.data.data) ? res.data.data : [];
			if (!historyList.length) {
				renderEmptyHistory('暂无聊天记录，先给对方发一句问候吧。');
				return;
			}
			if (history) {
				history.innerHTML = '';
			}
			historyList.forEach(function(item) {
				const role = Number(item.sender) === 2 ? 'counselor' : 'user';
				renderMessage(role, item.content || '', {
					nickname: role === 'user' && currentSession ? (currentSession.nickname || currentSession.name || '用户') : '咨询师',
					time: item.create_time || item.createTime || ''
				});
			});
		}).catch(function() {
			renderEmptyHistory('聊天记录加载失败');
		});
	}

	function sendReply() {
		const counselorId = currentCounselorId || resolveCounselorId();
		const input = inputNode();
		const text = input ? input.value.trim() : '';
		if (!currentSessionId) {
			alert('请先选择一个用户会话');
			return;
		}
		if (!text) return;
		const sendBtn = document.getElementById('consultSendBtn');
		if (sendBtn) {
			sendBtn.disabled = true;
		}
		axios.post('/counselor/chat/reply', {
			userId: currentSessionId,
			counselorId: counselorId,
			content: text
		}).then(function(res) {
			if (res && res.data && res.data.code === 200) {
				if (input) input.value = '';
				loadHistory(currentSessionId);
				loadSessions();
				return;
			}
			throw new Error('send failed');
		}).catch(function() {
			alert('发送失败，请稍后再试');
		}).finally(function() {
			if (sendBtn) {
				sendBtn.disabled = false;
			}
		});
	}

	function loadSessions() {
		currentCounselorId = resolveCounselorId();
		if (!currentCounselorId) {
			sessions = [];
			renderSessionList();
			renderEmptyHistory('未找到当前咨询师信息，请重新登录');
			return;
		}
		axios.get('/counselor/chat/sessions', {
			params: {
				counselorId: currentCounselorId
			}
		}).then(function(res) {
			sessions = res && res.data && res.data.code === 200 && Array.isArray(res.data.data) ? res.data.data : [];
			renderSessionList();
			if (sessions.length) {
				const firstSession = sessions.find(function(item) {
					return resolveUserId(item);
				}) || sessions[0];
				currentSessionId = resolveUserId(firstSession);
				renderConsultPage(firstSession);
			} else {
				currentSessionId = '';
				const title = titleNode();
				const subtitle = subtitleNode();
				if (title) title.textContent = '请选择一个会话';
				if (subtitle) subtitle.textContent = '当有用户发来消息后，这里会自动出现会话列表';
				renderEmptyHistory('暂无会话');
			}
		}).catch(function() {
			sessions = [];
			renderSessionList();
			renderEmptyHistory('会话列表加载失败');
		});
	}

	function initCounselorConsult() {
		loadSessions();
	}

	const sendBtn = document.getElementById('consultSendBtn');
	if (sendBtn) {
		sendBtn.addEventListener('click', sendReply);
	}

	const input = inputNode();
	if (input) {
		input.addEventListener('keydown', function(e) {
			if (e.key === 'Enter' && !e.shiftKey) {
				e.preventDefault();
				sendReply();
			}
		});
	}

	window.initCounselorConsult = initCounselorConsult;

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', initCounselorConsult);
	} else {
		initCounselorConsult();
	}
})();
