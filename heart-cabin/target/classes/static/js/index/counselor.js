// 真人咨询页面脚本

(function() {
	const counselorList = document.getElementById('counselorList');
	const counselorListBadge = document.getElementById('counselorListBadge');
	const counselorTotalCount = document.getElementById('counselorTotalCount');
	const counselorOnlineCount = document.getElementById('counselorOnlineCount');
	const counselorEmptyState = document.getElementById('counselorEmptyState');
	const counselorDetailCard = document.getElementById('counselorDetailCard');
	const counselorAvatar = document.getElementById('counselorAvatar');
	const counselorStatusText = document.getElementById('counselorStatusText');
	const counselorName = document.getElementById('counselorName');
	const counselorTitle = document.getElementById('counselorTitle');
	const counselorSignature = document.getElementById('counselorSignature');
	const counselorUsername = document.getElementById('counselorUsername');
	const counselorAgeGender = document.getElementById('counselorAgeGender');
	const counselorPhone = document.getElementById('counselorPhone');
	const counselorCreateTime = document.getElementById('counselorCreateTime');
	const counselorChatTitle = document.getElementById('counselorChatTitle');
	const counselorChatSubtitle = document.getElementById('counselorChatSubtitle');
	const counselorChatHistory = document.getElementById('counselorChatHistory');
	const counselorChatInput = document.getElementById('counselorChatInput');
	const counselorSendBtn = document.getElementById('counselorSendBtn');

	let counselorCache = [];
	let selectedCounselor = null;
	let hasLoaded = false;

	function escapeHtml(str) {
		return String(str || '').replace(/[&<>"']/g, function(c) {
			return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&#39;' })[c];
		});
	}

	function resolveUserId() {
		const storedUserId = localStorage.getItem('user_id');
		if (storedUserId) {
			return storedUserId;
		}
		const storedUser = localStorage.getItem('user');
		if (!storedUser) {
			return '';
		}
		try {
			const parsedUser = JSON.parse(storedUser);
			return parsedUser.user_id || parsedUser.userId || (parsedUser.user && parsedUser.user.id) || parsedUser.id || '';
		} catch (error) {
			return '';
		}
	}

	function formatTime(value) {
		if (!value) {
			return '未知';
		}
		return String(value).replace('T', ' ').replace(/\.\d+$/, '').slice(0, 19);
	}

	function formatStatus(value) {
		return Number(value) === 1 ? '在线可咨询' : '暂未在线';
	}

	function formatGender(value) {
		return value || '未知';
	}

	function formatAge(value) {
		return value == null || value === '' ? '未知' : String(value);
	}

	function getCounselorAvatarSrc(counselor) {
		return counselor && counselor.avatar ? counselor.avatar : 'images/avatar-default.png';
	}

	function getDisplayName(counselor) {
		return counselor && (counselor.name || counselor.nickname || counselor.username) ? (counselor.name || counselor.nickname || counselor.username) : '咨询师';
	}

	function clearChatHistory() {
		if (counselorChatHistory) {
			counselorChatHistory.innerHTML = '';
		}
	}

	function appendMessage(role, content) {
		if (!counselorChatHistory) return;
		const message = document.createElement('div');
		message.className = 'counselor-message' + (role === 'user' ? ' user' : ' counselor');
		message.innerHTML = '\n\t\t<div class="counselor-message-avatar">' + (role === 'user' ? '我' : '🧑‍⚕️') + '</div>\n\t\t<div class="counselor-message-bubble">' + escapeHtml(content) + '</div>\n\t';
		counselorChatHistory.appendChild(message);
		counselorChatHistory.scrollTop = counselorChatHistory.scrollHeight;
	}

	function renderEmptyState(message) {
		if (counselorList) {
			counselorList.innerHTML = '';
		}
		if (counselorListBadge) {
			counselorListBadge.textContent = message || '暂无数据';
		}
		if (counselorTotalCount) {
			counselorTotalCount.textContent = '0 位咨询师';
		}
		if (counselorOnlineCount) {
			counselorOnlineCount.textContent = '0 位在线';
		}
		if (counselorEmptyState) {
			counselorEmptyState.style.display = 'block';
			counselorEmptyState.textContent = message || '暂无咨询师数据';
		}
		if (counselorDetailCard) {
			counselorDetailCard.style.display = 'none';
		}
		clearChatHistory();
		selectedCounselor = null;
	}

	function renderCounselorDetail(counselor) {
		if (!counselorDetailCard || !counselorEmptyState) return;
		if (!counselor) {
			counselorDetailCard.style.display = 'none';
			counselorEmptyState.style.display = 'block';
			return;
		}

		counselorEmptyState.style.display = 'none';
		counselorDetailCard.style.display = 'flex';

		if (counselorAvatar) {
			counselorAvatar.src = getCounselorAvatarSrc(counselor);
			counselorAvatar.alt = getDisplayName(counselor) + '头像';
		}
		if (counselorStatusText) {
			counselorStatusText.textContent = formatStatus(counselor.status);
		}
		if (counselorName) {
			counselorName.textContent = getDisplayName(counselor);
		}
		if (counselorTitle) {
			counselorTitle.textContent = counselor.title || '心理咨询师';
		}
		if (counselorSignature) {
			counselorSignature.textContent = counselor.signature || '擅长倾听、陪伴与心理疏导。';
		}
		if (counselorUsername) {
			counselorUsername.textContent = counselor.username || '-';
		}
		if (counselorAgeGender) {
			counselorAgeGender.textContent = formatAge(counselor.age) + ' / ' + formatGender(counselor.gender);
		}
		if (counselorPhone) {
			counselorPhone.textContent = counselor.phone || '未公开';
		}
		if (counselorCreateTime) {
			counselorCreateTime.textContent = formatTime(counselor.create_time);
		}
		if (counselorChatTitle) {
			counselorChatTitle.textContent = getDisplayName(counselor) + ' 的咨询记录';
		}
		if (counselorChatSubtitle) {
			counselorChatSubtitle.textContent = '正在与 ' + getDisplayName(counselor) + ' 进行咨询';
		}
	}

	function highlightSelectedCard(counselorId) {
		if (!counselorList) return;
		const cards = counselorList.querySelectorAll('.counselor-card');
		cards.forEach(function(card) {
			card.classList.toggle('active', String(card.getAttribute('data-counselor-id')) === String(counselorId));
		});
	}

	function loadHistory(counselor) {
		if (!counselor) return;
		const userId = resolveUserId();
		clearChatHistory();
		axios.get('/counselor/chat/history', {
			params: {
				userId: userId,
				counselorId: counselor.id
			}
		}).then(function(res) {
			const history = res && res.data && res.data.code === 200 && Array.isArray(res.data.data) ? res.data.data : [];
			if (!history.length) {
				appendMessage('counselor', '我们可以从你最想说的一件事开始。');
				return;
			}
			clearChatHistory();
			history.forEach(function(item) {
				if (item && Number(item.sender) === 1) {
					appendMessage('user', item.content || '');
				} else {
					appendMessage('counselor', item.content || '');
				}
			});
		}).catch(function() {
			appendMessage('counselor', '当前历史记录暂时加载失败，你也可以直接开始新的咨询。');
		});
	}

	function selectCounselor(counselor) {
		selectedCounselor = counselor;
		renderCounselorDetail(counselor);
		highlightSelectedCard(counselor && counselor.id);
		loadHistory(counselor);
	}

	function renderCounselors(list) {
		if (!counselorList) return;
		counselorList.innerHTML = '';

		const counselors = Array.isArray(list) ? list : [];
		counselorCache = counselors;

		if (counselorTotalCount) {
			counselorTotalCount.textContent = counselors.length + ' 位咨询师';
		}
		if (counselorOnlineCount) {
			const onlineCount = counselors.filter(function(item) {
				return Number(item.status) === 1;
			}).length;
			counselorOnlineCount.textContent = onlineCount + ' 位在线';
		}
		if (counselorListBadge) {
			counselorListBadge.textContent = counselors.length ? '已加载' : '暂无数据';
		}

		if (!counselors.length) {
			renderEmptyState('暂无咨询师数据，请先检查 counselor 表');
			return;
		}

		if (counselorEmptyState) {
			counselorEmptyState.style.display = 'none';
		}

		counselors.forEach(function(counselor, index) {
			const card = document.createElement('div');
			card.className = 'counselor-card' + (index === 0 && !selectedCounselor ? ' active' : '');
			card.setAttribute('data-counselor-id', counselor.id);
			card.innerHTML = '\n\t\t\t<img class="counselor-card-avatar" src="' + escapeHtml(getCounselorAvatarSrc(counselor)) + '" alt="头像">\n\t\t\t<div class="counselor-card-copy">\n\t\t\t\t<h3>' + escapeHtml(getDisplayName(counselor)) + '</h3>\n\t\t\t\t<p>' + escapeHtml(counselor.signature || '擅长倾听与心理支持') + '</p>\n\t\t\t\t<div class="counselor-card-meta">\n\t\t\t\t\t<span>' + escapeHtml(counselor.title || '心理咨询师') + '</span>\n\t\t\t\t\t<span>' + escapeHtml(formatStatus(counselor.status)) + '</span>\n\t\t\t\t</div>\n\t\t\t</div>\n\t\t';
			card.addEventListener('click', function() {
				selectCounselor(counselor);
			});
			counselorList.appendChild(card);
		});

		if (!selectedCounselor || !counselors.some(function(item) { return String(item.id) === String(selectedCounselor.id); })) {
			selectCounselor(counselors[0]);
		} else {
			highlightSelectedCard(selectedCounselor.id);
			renderCounselorDetail(selectedCounselor);
		}
	}

	function loadCounselors() {
		if (!counselorList) return;
		if (hasLoaded && counselorCache.length) {
			renderCounselors(counselorCache);
			return;
		}
		if (counselorListBadge) {
			counselorListBadge.textContent = '加载中...';
		}
		axios.get('/counselor/list').then(function(res) {
			if (res && res.data && res.data.code === 200) {
				hasLoaded = true;
				renderCounselors(Array.isArray(res.data.data) ? res.data.data : []);
				return;
			}
			renderEmptyState('咨询师数据加载失败');
		}).catch(function() {
			renderEmptyState('咨询师数据加载失败');
		});
	}

	function sendConsultMessage() {
		if (!selectedCounselor) {
			alert('请先选择一位咨询师');
			return;
		}
		const content = counselorChatInput ? counselorChatInput.value.trim() : '';
		if (!content) {
			return;
		}

		if (counselorSendBtn) {
			counselorSendBtn.disabled = true;
		}
		appendMessage('user', content);
		if (counselorChatInput) {
			counselorChatInput.value = '';
		}

		axios.post('/counselor/chat/send', {
			content: content,
			counselorId: selectedCounselor.id,
			userId: resolveUserId()
		}).then(function(res) {
			if (res && res.data && res.data.code === 200) {
				loadHistory(selectedCounselor);
				return;
			}
			throw new Error('send failed');
		}).catch(function() {
			appendMessage('counselor', '消息发送失败，请稍后再试。');
		}).finally(function() {
			if (counselorSendBtn) {
				counselorSendBtn.disabled = false;
			}
		});
	}

	if (counselorSendBtn) {
		counselorSendBtn.addEventListener('click', sendConsultMessage);
	}

	if (counselorChatInput) {
		counselorChatInput.addEventListener('keydown', function(e) {
			if (e.key === 'Enter' && !e.shiftKey) {
				e.preventDefault();
				sendConsultMessage();
			}
		});
	}

	window.loadCounselors = loadCounselors;
	window.selectCounselor = selectCounselor;

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', loadCounselors);
	} else {
		loadCounselors();
	}
})();