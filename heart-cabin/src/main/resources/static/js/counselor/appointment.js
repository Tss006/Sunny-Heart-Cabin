// 咨询师端-预约管理脚本

(function() {
	let appointmentCache = [];
	let timeSlotCache = [];
	let initialized = false;

	function getApi() {
		return window.heartCabinAppointmentApi || {};
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

	function escapeHtml(str) {
		return String(str || '').replace(/[&<>"]+/g, function(c) {
			return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c];
		});
	}

	function formatTime(value) {
		if (!value) return '未知';
		return String(value).replace('T', ' ').replace(/\.\d+$/, '').slice(0, 19);
	}

	function formatSlotClock(value) {
		if (!value) return '--:--';
		return String(value).slice(0, 5);
	}

	function statusText(status) {
		const map = {
			pending: '待确认',
			confirmed: '已确认',
			completed: '已完成',
			cancelled: '已取消'
		};
		return map[status] || status || '未知';
	}

	function dayText(day) {
		const map = {
			Monday: '周一',
			Tuesday: '周二',
			Wednesday: '周三',
			Thursday: '周四',
			Friday: '周五',
			Saturday: '周六',
			Sunday: '周日'
		};
		return map[day] || day || '未知';
	}

	function appointmentListNode() {
		return document.getElementById('counselorAppointmentList');
	}

	function appointmentStatsBadge() {
		return document.getElementById('appointmentStatsBadge');
	}

	function appointmentPendingCountNode() {
		return document.getElementById('appointmentPendingCount');
	}

	function appointmentConfirmedCountNode() {
		return document.getElementById('appointmentConfirmedCount');
	}

	function appointmentCompletedCountNode() {
		return document.getElementById('appointmentCompletedCount');
	}

	function timeSlotBadgeNode() {
		return document.getElementById('timeSlotBadge');
	}

	function timeSlotListNode() {
		return document.getElementById('timeSlotList');
	}

	function timeSlotFormNode() {
		return document.getElementById('timeSlotForm');
	}

	function daySelectNode() {
		return document.getElementById('appointmentDaySelect');
	}

	function startTimeNode() {
		return document.getElementById('appointmentStartTimeInput');
	}

	function endTimeNode() {
		return document.getElementById('appointmentEndTimeInput');
	}

	function availableSwitchNode() {
		return document.getElementById('appointmentAvailableSwitch');
	}

	function formStatusNode() {
		return document.getElementById('appointmentTimeFormStatus');
	}

	function clearNode(node) {
		if (node) {
			node.innerHTML = '';
		}
	}

	function renderSummary(list) {
		const appointments = Array.isArray(list) ? list : [];
		const pendingCount = appointments.filter(function(item) { return item && item.status === 'pending'; }).length;
		const confirmedCount = appointments.filter(function(item) { return item && item.status === 'confirmed'; }).length;
		const completedCount = appointments.filter(function(item) { return item && item.status === 'completed'; }).length;

		const badge = appointmentStatsBadge();
		if (badge) {
			badge.textContent = appointments.length + ' 条预约';
		}
		const pendingNode = appointmentPendingCountNode();
		if (pendingNode) pendingNode.textContent = String(pendingCount);
		const confirmedNode = appointmentConfirmedCountNode();
		if (confirmedNode) confirmedNode.textContent = String(confirmedCount);
		const completedNode = appointmentCompletedCountNode();
		if (completedNode) completedNode.textContent = String(completedCount);
	}

	function renderAppointments(list) {
		const container = appointmentListNode();
		if (!container) return;
		clearNode(container);

		const appointments = Array.isArray(list) ? list : [];
		appointmentCache = appointments;
		renderSummary(appointments);

		if (!appointments.length) {
			const empty = document.createElement('div');
			empty.className = 'appointment-empty-state';
			empty.textContent = '暂无预约记录';
			container.appendChild(empty);
			return;
		}

		appointments.forEach(function(appointment) {
			const card = document.createElement('article');
			card.className = 'appointment-card-item';
			card.innerHTML = '\n\t\t\t<div class="appointment-card-main">\n\t\t\t\t<div class="appointment-card-head">\n\t\t\t\t\t<div>\n\t\t\t\t\t\t<h3>' + escapeHtml(appointment.userName || '匿名用户') + '</h3>\n\t\t\t\t\t\t<p>' + escapeHtml(formatTime(appointment.appointmentTime || appointment.appointment_time)) + '</p>\n\t\t\t\t\t</div>\n\t\t\t\t\t<span class="appointment-status-pill status-' + escapeHtml(appointment.status || 'pending') + '">' + escapeHtml(statusText(appointment.status)) + '</span>\n\t\t\t\t</div>\n\t\t\t\t<div class="appointment-card-meta">\n\t\t\t\t\t<span>预约人：' + escapeHtml(appointment.userName || '未知用户') + '</span>\n\t\t\t\t\t<span>时间：' + escapeHtml(formatTime(appointment.appointmentTime || appointment.appointment_time)) + '</span>\n\t\t\t\t</div>\n\t\t\t\t<div class="appointment-card-reason">' + escapeHtml(appointment.reason || '未填写预约原因') + '</div>\n\t\t\t</div>\n\t\t\t<div class="appointment-card-actions">' + buildAppointmentActions(appointment) + '</div>\n\t\t';
			container.appendChild(card);
		});
	}

	function buildAppointmentActions(appointment) {
		const id = appointment && appointment.id;
		if (!id) {
			return '';
		}
		if (appointment.status === 'pending') {
			return '\n\t\t\t<button type="button" class="appointment-action-btn success" data-status-btn="confirmed" data-appointment-id="' + id + '">确认</button>\n\t\t\t<button type="button" class="appointment-action-btn ghost" data-status-btn="cancelled" data-appointment-id="' + id + '">取消</button>';
		}
		if (appointment.status === 'confirmed') {
			return '\n\t\t\t<button type="button" class="appointment-action-btn success" data-status-btn="completed" data-appointment-id="' + id + '">已完成</button>\n\t\t\t<button type="button" class="appointment-action-btn ghost" data-status-btn="cancelled" data-appointment-id="' + id + '">取消</button>';
		}
		return '<span class="appointment-action-muted">无需处理</span>';
	}

	function renderTimeSlots(list) {
		const container = timeSlotListNode();
		if (!container) return;
		clearNode(container);

		const slots = Array.isArray(list) ? list : [];
		timeSlotCache = slots;
		const badge = timeSlotBadgeNode();
		if (badge) {
			badge.textContent = slots.length ? ('共 ' + slots.length + ' 个时间段') : '暂无时间段';
		}

		if (!slots.length) {
			const empty = document.createElement('div');
			empty.className = 'appointment-empty-state';
			empty.textContent = '还没有设置可预约时间';
			container.appendChild(empty);
			return;
		}

		slots.forEach(function(slot) {
			const item = document.createElement('div');
			item.className = 'time-slot-item ' + (slot.isAvailable ? 'available' : 'disabled');
			item.innerHTML = '\n\t\t\t<div>\n\t\t\t\t<strong>' + escapeHtml(dayText(slot.dayOfWeek || slot.day_of_week)) + '</strong>\n\t\t\t\t<p>' + escapeHtml(formatSlotClock(slot.startTime || slot.start_time)) + ' - ' + escapeHtml(formatSlotClock(slot.endTime || slot.end_time)) + '</p>\n\t\t\t</div>\n\t\t\t<div class="time-slot-actions">\n\t\t\t\t<span class="time-slot-status">' + escapeHtml(Boolean(slot.isAvailable) ? '可预约' : '已停用') + '</span>\n\t\t\t\t<button type="button" class="time-slot-toggle-btn" data-toggle-slot="1" data-slot-day="' + escapeHtml(slot.dayOfWeek || slot.day_of_week) + '" data-slot-start="' + escapeHtml(slot.startTime || slot.start_time) + '" data-slot-end="' + escapeHtml(slot.endTime || slot.end_time) + '" data-slot-active="' + String(Boolean(slot.isAvailable)) + '">' + (Boolean(slot.isAvailable) ? '停用' : '启用') + '</button>\n\t\t\t</div>\n\t\t';
			container.appendChild(item);
		});
	}

	function loadAppointments() {
		const api = getApi();
		if (typeof api.getCounselorAppointments !== 'function') {
			return Promise.resolve([]);
		}
		return api.getCounselorAppointments().then(function(res) {
			const appointments = res && res.data && res.data.code === 200 && Array.isArray(res.data.data) ? res.data.data : [];
			renderAppointments(appointments);
			return appointments;
		}).catch(function() {
			renderAppointments([]);
			return [];
		});
	}

	function loadTimeSlots() {
		const api = getApi();
		if (typeof api.getAvailableTimes !== 'function') {
			return Promise.resolve([]);
		}
		return api.getAvailableTimes(resolveCounselorId()).then(function(res) {
			const slots = res && res.data && res.data.code === 200 && Array.isArray(res.data.data) ? res.data.data : [];
			renderTimeSlots(slots);
			return slots;
		}).catch(function() {
			renderTimeSlots([]);
			return [];
		});
	}

	function loadCounselorAppointmentSummary() {
		return loadAppointments().then(function(list) {
			return {
				total: list.length,
				pending: list.filter(function(item) { return item && item.status === 'pending'; }).length,
				confirmed: list.filter(function(item) { return item && item.status === 'confirmed'; }).length,
				completed: list.filter(function(item) { return item && item.status === 'completed'; }).length
			};
		});
	}

	function handleStatusClick(event) {
		const target = event.target;
		if (!target || !target.matches('[data-status-btn]')) {
			return;
		}
		const appointmentId = target.getAttribute('data-appointment-id');
		const status = target.getAttribute('data-status-btn');
		if (!appointmentId || !status) {
			return;
		}
		const api = getApi();
		if (typeof api.updateAppointmentStatus !== 'function') {
			return;
		}
		target.disabled = true;
		api.updateAppointmentStatus(appointmentId, status).then(function(res) {
			if (!(res && res.data && res.data.code === 200)) {
				throw new Error('update failed');
			}
			return loadAppointments();
		}).catch(function() {
			alert('更新预约状态失败');
		}).finally(function() {
			target.disabled = false;
		});
	}

	function handleSlotToggle(event) {
		const target = event.target;
		if (!target || !target.matches('[data-toggle-slot]')) {
			return;
		}
		const api = getApi();
		if (typeof api.saveAvailableTime !== 'function') {
			return;
		}
		const payload = {
			dayOfWeek: target.getAttribute('data-slot-day'),
			startTime: target.getAttribute('data-slot-start'),
			endTime: target.getAttribute('data-slot-end'),
			isAvailable: target.getAttribute('data-slot-active') !== 'true'
		};
		target.disabled = true;
		api.saveAvailableTime(payload).then(function(res) {
			if (!(res && res.data && res.data.code === 200)) {
				throw new Error('save failed');
			}
			return loadTimeSlots();
		}).catch(function() {
			alert('更新时间段失败');
		}).finally(function() {
			target.disabled = false;
		});
	}

	function handleTimeSlotSubmit(event) {
		event.preventDefault();
		const api = getApi();
		if (typeof api.saveAvailableTime !== 'function') {
			return;
		}
		const daySelect = daySelectNode();
		const startInput = startTimeNode();
		const endInput = endTimeNode();
		const availableSwitch = availableSwitchNode();
		const statusNode = formStatusNode();
		const payload = {
			dayOfWeek: daySelect ? daySelect.value : 'Monday',
			startTime: startInput ? startInput.value : '',
			endTime: endInput ? endInput.value : '',
			isAvailable: availableSwitch ? availableSwitch.checked : true
		};
		if (statusNode) {
			statusNode.textContent = '保存中...';
		}
		api.saveAvailableTime(payload).then(function(res) {
			if (!(res && res.data && res.data.code === 200)) {
				throw new Error('save failed');
			}
			if (statusNode) {
				statusNode.textContent = '时间段已保存';
			}
			return loadTimeSlots();
		}).catch(function(error) {
			if (statusNode) {
				statusNode.textContent = (error && error.response && error.response.data && error.response.data.msg) ? error.response.data.msg : '保存失败';
			}
		});
	}

	function initCounselorAppointment() {
		const listNode = appointmentListNode();
		const slotNode = timeSlotListNode();
		if (!listNode && !slotNode) {
			return;
		}
		if (initialized) {
			loadAppointments();
			loadTimeSlots();
			return;
		}
		initialized = true;
		const form = timeSlotFormNode();
		if (form) {
			form.addEventListener('submit', handleTimeSlotSubmit);
		}
		if (listNode) {
			listNode.addEventListener('click', handleStatusClick);
		}
		if (slotNode) {
			slotNode.addEventListener('click', handleSlotToggle);
		}
		loadAppointments();
		loadTimeSlots();
	}

	window.initCounselorAppointment = initCounselorAppointment;
	window.loadCounselorAppointmentSummary = loadCounselorAppointmentSummary;

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', function() {
			if (document.getElementById('appointment-content')) {
				initCounselorAppointment();
			}
		});
	} else if (document.getElementById('appointment-content')) {
		initCounselorAppointment();
	}
})();
