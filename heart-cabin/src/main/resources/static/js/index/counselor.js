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
	const appointmentBadge = document.getElementById('appointmentBadge');
	const appointmentCounselorHint = document.getElementById('appointmentCounselorHint');
	const appointmentCounselorName = document.getElementById('appointmentCounselorName');
	const appointmentCounselorStatus = document.getElementById('appointmentCounselorStatus');
	const availableTimesList = document.getElementById('availableTimesList');
	const appointmentTimeInput = document.getElementById('appointmentTimeInput');
	const appointmentReasonInput = document.getElementById('appointmentReasonInput');
	const appointmentTimeTip = document.getElementById('appointmentTimeTip');
	const appointmentForm = document.getElementById('appointmentForm');
	const userAppointmentList = document.getElementById('userAppointmentList');
	const refreshUserAppointmentsBtn = document.getElementById('refreshUserAppointmentsBtn');

	let counselorCache = [];
	let selectedCounselor = null;
	let hasLoaded = false;
	let availableTimeCache = [];
	let myAppointmentCache = [];

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

	function formatAppointmentStatus(value) {
		const map = {
			pending: '待确认',
			confirmed: '已确认',
			completed: '已完成',
			cancelled: '已取消'
		};
		return map[value] || value || '未知';
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

	function clearAppointmentSelection(message) {
		availableTimeCache = [];
		if (availableTimesList) {
			availableTimesList.innerHTML = '';
			const empty = document.createElement('div');
			empty.className = 'appointment-slot-empty';
			empty.textContent = message || '请先选择一位咨询师';
			availableTimesList.appendChild(empty);
		}
		if (appointmentBadge) {
			appointmentBadge.textContent = '等待选择';
		}
		if (appointmentCounselorHint) {
			appointmentCounselorHint.textContent = message || '请先选择一位咨询师';
		}
		if (appointmentCounselorName) {
			appointmentCounselorName.textContent = '-';
		}
		if (appointmentCounselorStatus) {
			appointmentCounselorStatus.textContent = '-';
		}
		if (appointmentTimeTip) {
			appointmentTimeTip.textContent = message || '请先选择一位咨询师';
			appointmentTimeTip.classList.remove('error');
		}
		if (appointmentTimeInput) {
			appointmentTimeInput.value = '';
		}
		if (appointmentReasonInput) {
			appointmentReasonInput.value = '';
		}
	}

	function formatDateTimeLocal(date) {
		const pad = function(value) {
			return String(value).padStart(2, '0');
		};
		return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate()) + 'T' + pad(date.getHours()) + ':' + pad(date.getMinutes());
	}

	function getNextSlotDateTime(dayOfWeek, startTime) {
		const dayIndexMap = {
			Monday: 1,
			Tuesday: 2,
			Wednesday: 3,
			Thursday: 4,
			Friday: 5,
			Saturday: 6,
			Sunday: 0
		};
		const targetDayIndex = dayIndexMap[dayOfWeek];
		if (targetDayIndex == null) {
			return '';
		}
		const now = new Date();
		const currentDayIndex = now.getDay();
		let delta = (targetDayIndex - currentDayIndex + 7) % 7;
		const candidate = new Date(now);
		candidate.setDate(now.getDate() + delta);
		const parts = String(startTime || '09:00:00').split(':');
		candidate.setHours(Number(parts[0] || 0), Number(parts[1] || 0), Number(parts[2] || 0), 0);
		if (candidate.getTime() <= now.getTime()) {
			candidate.setDate(candidate.getDate() + 7);
		}
		return formatDateTimeLocal(candidate);
	}

	function loadMyAppointments() {
		const api = window.heartCabinAppointmentApi || {};
		if (typeof api.getUserAppointments !== 'function') {
			return Promise.resolve([]);
		}
		return api.getUserAppointments().then(function(res) {
			const list = res && res.data && res.data.code === 200 && Array.isArray(res.data.data) ? res.data.data : [];
			myAppointmentCache = list;
			renderMyAppointments(list);
			return list;
		}).catch(function() {
			myAppointmentCache = [];
			renderMyAppointments([]);
			return [];
		});
	}

	function renderMyAppointments(list) {
		if (!userAppointmentList) {
			return;
		}
		userAppointmentList.innerHTML = '';
		const appointments = Array.isArray(list) ? list : [];
		if (!appointments.length) {
			const empty = document.createElement('div');
			empty.className = 'appointment-empty-state';
			empty.textContent = '暂无预约记录';
			userAppointmentList.appendChild(empty);
			return;
		}
		appointments.forEach(function(item) {
			const card = document.createElement('article');
			card.className = 'user-appointment-item';
			card.innerHTML = '\n\t\t\t<div class="user-appointment-head">\n\t\t\t\t<div>\n\t\t\t\t\t<h3>' + escapeHtml(item.counselorName || item.counselor_name || '咨询师') + '</h3>\n\t\t\t\t\t<p>' + escapeHtml(formatTime(item.appointmentTime || item.appointment_time)) + '</p>\n\t\t\t\t</div>\n\t\t\t\t<span class="user-appointment-status status-' + escapeHtml(item.status || 'pending') + '">' + escapeHtml(formatAppointmentStatus(item.status)) + '</span>\n\t\t\t</div>\n\t\t\t<div class="user-appointment-reason">' + escapeHtml(item.reason || '未填写预约原因') + '</div>\n\t\t';
			userAppointmentList.appendChild(card);
		});
	}

	function renderAvailableTimes(list) {
		if (!availableTimesList) {
			return;
		}
		availableTimesList.innerHTML = '';
		const slots = Array.isArray(list) ? list : [];
		availableTimeCache = slots;
		if (!slots.length) {
			const empty = document.createElement('div');
			empty.className = 'appointment-slot-empty';
			empty.textContent = '当前咨询师暂无可预约时间';
			availableTimesList.appendChild(empty);
			if (appointmentTimeTip) {
				appointmentTimeTip.textContent = '该咨询师暂无可预约时间段';
			}
			return;
		}

		slots.forEach(function(slot) {
			const chip = document.createElement('button');
			chip.type = 'button';
			chip.className = 'appointment-slot-chip' + (slot.isAvailable ? '' : ' disabled');
			chip.disabled = !slot.isAvailable;
			chip.innerHTML = '<span>' + escapeHtml((slot.dayOfWeek || slot.day_of_week || '')) + '</span><strong>' + escapeHtml((slot.startTime || slot.start_time || '--:--').slice(0, 5)) + ' - ' + escapeHtml((slot.endTime || slot.end_time || '--:--').slice(0, 5)) + '</strong><em>' + escapeHtml(slot.isAvailable ? '可预约' : '已停用') + '</em>';
			chip.addEventListener('click', function() {
				if (appointmentTimeInput) {
					appointmentTimeInput.value = getNextSlotDateTime(slot.dayOfWeek || slot.day_of_week, slot.startTime || slot.start_time);
					appointmentTimeInput.focus();
				}
				validateAppointmentTime();
			});
			availableTimesList.appendChild(chip);
		});
		validateAppointmentTime();
	}

	function loadAppointmentTimes(counselor) {
		const api = window.heartCabinAppointmentApi || {};
		if (!counselor) {
			clearAppointmentSelection('请先选择一位咨询师');
			return Promise.resolve([]);
		}
		if (appointmentBadge) {
			appointmentBadge.textContent = '加载中...';
		}
		if (appointmentCounselorHint) {
			appointmentCounselorHint.textContent = '正在加载可预约时间';
		}
		if (typeof api.getAvailableTimes !== 'function') {
			clearAppointmentSelection('预约接口暂不可用');
			return Promise.resolve([]);
		}
		return api.getAvailableTimes(counselor.id).then(function(res) {
			const slots = res && res.data && res.data.code === 200 && Array.isArray(res.data.data) ? res.data.data : [];
			if (appointmentBadge) {
				appointmentBadge.textContent = slots.length ? ('已加载 ' + slots.length + ' 个时段') : '暂无可用时段';
			}
			if (appointmentCounselorHint) {
				appointmentCounselorHint.textContent = slots.length ? '点击时间段可以快速填入预约时间' : '该咨询师暂无可预约时间';
			}
			renderAvailableTimes(slots);
			return slots;
		}).catch(function() {
			clearAppointmentSelection('可预约时间加载失败');
			return [];
		});
	}

	function validateAppointmentTime() {
		if (!appointmentTimeInput || !appointmentTimeTip) {
			return true;
		}
		const value = appointmentTimeInput.value;
		if (!selectedCounselor) {
			appointmentTimeTip.textContent = '请先选择一位咨询师';
			appointmentTimeTip.classList.add('error');
			return false;
		}
		if (!value) {
			appointmentTimeTip.textContent = '请选择一个具体的预约时间';
			appointmentTimeTip.classList.remove('error');
			return false;
		}
		const selectedDate = new Date(value);
		if (Number.isNaN(selectedDate.getTime())) {
			appointmentTimeTip.textContent = '预约时间格式不正确';
			appointmentTimeTip.classList.add('error');
			return false;
		}
		const weekDayMap = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
		const selectedDay = weekDayMap[selectedDate.getDay()];
		const selectedClock = String(selectedDate.getHours()).padStart(2, '0') + ':' + String(selectedDate.getMinutes()).padStart(2, '0') + ':00';
		const matched = availableTimeCache.some(function(slot) {
			if (!slot || !slot.isAvailable) {
				return false;
			}
			const slotDay = slot.dayOfWeek || slot.day_of_week;
			if (String(slotDay) !== String(selectedDay)) {
				return false;
			}
			const startTime = String(slot.startTime || slot.start_time || '').slice(0, 8);
			const endTime = String(slot.endTime || slot.end_time || '').slice(0, 8);
			return selectedClock >= startTime && selectedClock < endTime;
		});
		if (!matched) {
			appointmentTimeTip.textContent = '该时间不在当前咨询师可预约范围内';
			appointmentTimeTip.classList.add('error');
			return false;
		}
		appointmentTimeTip.textContent = '时间可用，可以提交预约';
		appointmentTimeTip.classList.remove('error');
		return true;
	}

	function submitAppointment(event) {
		event.preventDefault();
		const api = window.heartCabinAppointmentApi || {};
		if (!selectedCounselor) {
			alert('请先选择一位咨询师');
			return;
		}
		if (!appointmentTimeInput || !appointmentTimeInput.value) {
			alert('请选择预约时间');
			return;
		}
		if (!validateAppointmentTime()) {
			alert('预约时间不在可预约范围内');
			return;
		}
		const payload = {
			counselorId: selectedCounselor.id,
			appointmentTime: appointmentTimeInput.value,
			reason: appointmentReasonInput ? appointmentReasonInput.value.trim() : ''
		};
		const submitBtn = appointmentForm ? appointmentForm.querySelector('button[type="submit"]') : null;
		if (submitBtn) {
			submitBtn.disabled = true;
		}
		api.createAppointment(payload).then(function(res) {
			if (!(res && res.data && res.data.code === 200)) {
				throw new Error('submit failed');
			}
			if (appointmentTimeTip) {
				appointmentTimeTip.textContent = '预约已提交，等待咨询师确认';
				appointmentTimeTip.classList.remove('error');
			}
			if (appointmentReasonInput) {
				appointmentReasonInput.value = '';
			}
			return loadMyAppointments();
		}).catch(function(error) {
			const message = error && error.response && error.response.data && (error.response.data.msg || error.response.data.error) ? (error.response.data.msg || error.response.data.error) : '预约提交失败';
			if (appointmentTimeTip) {
				appointmentTimeTip.textContent = message;
				appointmentTimeTip.classList.add('error');
			}
		}).finally(function() {
			if (submitBtn) {
				submitBtn.disabled = false;
			}
		});
	}

	function syncAppointmentPanel(counselor) {
		if (!counselor) {
			clearAppointmentSelection('请先选择一位咨询师');
			return;
		}
		if (appointmentCounselorName) {
			appointmentCounselorName.textContent = getDisplayName(counselor);
		}
		if (appointmentCounselorStatus) {
			appointmentCounselorStatus.textContent = formatStatus(counselor.status);
		}
		if (appointmentBadge) {
			appointmentBadge.textContent = '正在加载';
		}
		if (appointmentCounselorHint) {
			appointmentCounselorHint.textContent = '请选择一个可用时间段并提交预约';
		}
		loadAppointmentTimes(counselor);
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
		clearAppointmentSelection(message || '暂无咨询师数据');
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
		syncAppointmentPanel(counselor);
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
			syncAppointmentPanel(selectedCounselor);
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

	if (appointmentForm) {
		appointmentForm.addEventListener('submit', submitAppointment);
	}

	if (appointmentTimeInput) {
		appointmentTimeInput.addEventListener('input', validateAppointmentTime);
	}

	if (refreshUserAppointmentsBtn) {
		refreshUserAppointmentsBtn.addEventListener('click', loadMyAppointments);
	}

	window.loadCounselors = loadCounselors;
	window.selectCounselor = selectCounselor;

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', loadCounselors);
	} else {
		loadCounselors();
	}

	loadMyAppointments();
})();