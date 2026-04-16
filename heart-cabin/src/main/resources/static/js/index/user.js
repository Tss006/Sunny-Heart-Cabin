// user.js - 个人中心脚本

let currentUserProfile = null;
let profileEditing = false;
let profileEditButton = null;
let pendingProfileEdit = false;
let reportModal = null;
let reportList = null;
let reportEmpty = null;
let reportCloseBtn = null;
let reportBackdrop = null;
let settingsModal = null;
let settingsCloseBtn = null;
let settingsBackdrop = null;
let settingsThemeLightBtn = null;
let settingsThemeDarkBtn = null;
let settingsStatus = null;
let settingsPhoneInput = null;
let settingsOldPasswordInput = null;
let settingsNewPasswordInput = null;
let settingsConfirmPasswordInput = null;
let settingsSavePasswordBtn = null;
let settingsSavePhoneBtn = null;
let settingsExportBtn = null;
let settingsTrigger = null;

const THEME_STORAGE_KEY = 'site_theme';

function formatCount(value) {
	const count = Number(value);
	return Number.isFinite(count) ? String(count) : '0';
}

function getCurrentUserId() {
	if (currentUserProfile && currentUserProfile.id) {
		return currentUserProfile.id;
	}
	const storedUserId = localStorage.getItem('user_id');
	if (storedUserId) {
		const parsedUserId = Number(storedUserId);
		return Number.isNaN(parsedUserId) ? storedUserId : parsedUserId;
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

function getProfileItem(index) {
	return document.querySelector('#user-content .profile-info .info-item:nth-child(' + index + ')');
}

function createLabelNode(text) {
	const label = document.createElement('span');
	label.className = 'label';
	label.textContent = text;
	return label;
}

function createValueNode(id, text) {
	const value = document.createElement('span');
	value.className = 'value';
	if (id) {
		value.id = id;
	}
	value.textContent = text;
	return value;
}

function createInputNode(id, type, value) {
	const input = document.createElement('input');
	input.className = 'edit-input';
	input.id = id;
	input.type = type;
	input.value = value;
	return input;
}

function setProfileItem(index, labelText, valueNode) {
	const item = getProfileItem(index);
	if (!item) return;
	item.innerHTML = '';
	item.appendChild(createLabelNode(labelText));
	item.appendChild(valueNode);
}

function formatCreateTime(createTime) {
	if (!createTime) {
		return '未知';
	}
	if (typeof createTime !== 'string') {
		createTime = String(createTime);
	}
	return createTime.split('T')[0].replace(/-/g, '年').replace(/(\d{4})年(\d{2})年(\d{2})/, '$1年$2月$3日');
}

function getCreateTimeValue(user) {
	if (!user) {
		return '';
	}
	return user.createTime || user.create_time || '';
}

function updateUsageStats(user) {
	const diaryCountElem = document.getElementById('diaryCount');
	const testCountElem = document.getElementById('testCount');
	const musicCountElem = document.getElementById('musicCount');
	if (diaryCountElem) {
		diaryCountElem.textContent = formatCount(user && user.diary_num);
	}
	if (testCountElem) {
		testCountElem.textContent = formatCount(user && user.test_num);
	}
	if (musicCountElem) {
		musicCountElem.textContent = formatCount(user && user.music_num);
	}
}

function incrementUserStat(field) {
	const allowedFields = {
		test_num: true,
		diary_num: true,
		music_num: true
	};
	if (!allowedFields[field]) {
		return Promise.resolve(null);
	}
	const token = localStorage.getItem('token');
	if (!token) {
		return Promise.resolve(null);
	}
	return axios.post('/user/stat/increase', null, {
		headers: {
			token: token
		},
		params: {
			field: field
		}
	}).then(function(res) {
		if (res && res.data && res.data.code === 200 && currentUserProfile) {
			const currentValue = Number(currentUserProfile[field] || 0);
			currentUserProfile[field] = Number.isNaN(currentValue) ? 1 : currentValue + 1;
			updateUsageStats(currentUserProfile);
		}
		return res;
	}).catch(() => null);
}

function formatRole(role) {
	if (role === 'admin') {
		return '管理员';
	}
	if (role === 'user') {
		return '普通会员';
	}
	return role || '普通会员';
}

function formatStatus(status) {
	if (status === 1) {
		return '已登录';
	}
	if (status === 0) {
		return '已禁用';
	}
	return '未知';
}

function formatReportTime(createTime) {
	if (!createTime) {
		return '未知时间';
	}
	const text = typeof createTime === 'string' ? createTime : String(createTime);
	return text.replace('T', ' ').replace(/\.\d+$/, '').slice(0, 16);
}

function getHistoryTimeValue(item) {
	if (!item) {
		return '';
	}
	return item.create_time || item.createTime || '';
}

function getStoredTheme() {
	const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
	return savedTheme === 'dark' ? 'dark' : 'light';
}

function setSettingsStatus(message, isError) {
	if (!settingsStatus) {
		return;
	}
	settingsStatus.textContent = message;
	settingsStatus.classList.toggle('is-error', Boolean(isError));
}

function syncThemeButtons(theme) {
	if (settingsThemeLightBtn) {
		settingsThemeLightBtn.classList.toggle('active', theme === 'light');
	}
	if (settingsThemeDarkBtn) {
		settingsThemeDarkBtn.classList.toggle('active', theme === 'dark');
	}
}

function applyTheme(theme) {
	const nextTheme = theme === 'dark' ? 'dark' : 'light';
	document.body.classList.toggle('theme-dark', nextTheme === 'dark');
	document.body.classList.toggle('theme-light', nextTheme === 'light');
	localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
	syncThemeButtons(nextTheme);
}

function openSettingsModal() {
	if (!settingsModal) {
		return;
	}
	closeReportModal();
	const theme = getStoredTheme();
	applyTheme(theme);
	if (settingsPhoneInput) {
		settingsPhoneInput.value = currentUserProfile && currentUserProfile.phone ? currentUserProfile.phone : '';
	}
	if (settingsOldPasswordInput) {
		settingsOldPasswordInput.value = '';
	}
	if (settingsNewPasswordInput) {
		settingsNewPasswordInput.value = '';
	}
	if (settingsConfirmPasswordInput) {
		settingsConfirmPasswordInput.value = '';
	}
	setSettingsStatus('');
	settingsModal.style.display = 'flex';
	document.body.classList.add('settings-modal-open');
}

function closeSettingsModal() {
	if (!settingsModal) {
		return;
	}
	settingsModal.style.display = 'none';
	document.body.classList.remove('settings-modal-open');
	setSettingsStatus('');
}

function downloadJsonFile(filename, data) {
	const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' });
	const url = URL.createObjectURL(blob);
	const anchor = document.createElement('a');
	anchor.href = url;
	anchor.download = filename;
	document.body.appendChild(anchor);
	anchor.click();
	document.body.removeChild(anchor);
	URL.revokeObjectURL(url);
}

function getResponseData(response) {
	return response && response.data && response.data.code === 200 ? response.data.data : null;
}

function updateProfilePhone(phone) {
	if (!currentUserProfile) {
		return;
	}
	currentUserProfile.phone = phone;
	updateUsageStats(currentUserProfile);
	const nicknameElem = document.getElementById('nickname');
	if (nicknameElem) {
		nicknameElem.textContent = currentUserProfile.nickname || currentUserProfile.username || '心晴小屋用户';
	}
	if (settingsPhoneInput) {
		settingsPhoneInput.value = phone;
	}
}

function savePhoneBinding() {
	const token = localStorage.getItem('token');
	if (!token) {
		setSettingsStatus('请先登录后再绑定手机号', true);
		return;
	}
	if (!currentUserProfile || !currentUserProfile.id) {
		setSettingsStatus('用户信息未加载完成，请稍后再试', true);
		return;
	}
	const phone = settingsPhoneInput ? settingsPhoneInput.value.trim() : '';
	if (!phone) {
		setSettingsStatus('请输入手机号', true);
		return;
	}
	setSettingsStatus('正在保存手机号...');
	axios.post('user/info/update', {
		id: currentUserProfile.id,
		nickname: currentUserProfile.nickname || currentUserProfile.username || '',
		age: currentUserProfile.age || 0,
		gender: currentUserProfile.gender || '',
		signature: currentUserProfile.signature || '',
		avatar: currentUserProfile.avatar || '',
		phone: phone
	}, {
		headers: {
			token: token
		}
	}).then(function(res) {
		if (res && res.data && res.data.code === 200) {
			updateProfilePhone(phone);
			setSettingsStatus('手机号已绑定');
			return;
		}
		setSettingsStatus((res && res.data && res.data.msg) || '手机号绑定失败', true);
	}).catch(function() {
		setSettingsStatus('手机号绑定失败，请稍后重试', true);
	});
}

function savePassword() {
	const token = localStorage.getItem('token');
	if (!token) {
		setSettingsStatus('请先登录后再修改密码', true);
		return;
	}
	if (!currentUserProfile || !currentUserProfile.id) {
		setSettingsStatus('用户信息未加载完成，请稍后再试', true);
		return;
	}
	const oldPassword = settingsOldPasswordInput ? settingsOldPasswordInput.value.trim() : '';
	const newPassword = settingsNewPasswordInput ? settingsNewPasswordInput.value.trim() : '';
	const confirmPassword = settingsConfirmPasswordInput ? settingsConfirmPasswordInput.value.trim() : '';
	if (!oldPassword || !newPassword || !confirmPassword) {
		setSettingsStatus('请完整填写密码信息', true);
		return;
	}
	if (newPassword.length < 6) {
		setSettingsStatus('新密码长度不能少于6位', true);
		return;
	}
	if (newPassword !== confirmPassword) {
		setSettingsStatus('两次输入的新密码不一致', true);
		return;
	}
	setSettingsStatus('正在修改密码...');
	axios.post('user/password/update', {
		id: currentUserProfile.id,
		oldPassword: oldPassword,
		newPassword: newPassword
	}, {
		headers: {
			token: token
		}
	}).then(function(res) {
		if (res && res.data && res.data.code === 200) {
			if (settingsOldPasswordInput) {
				settingsOldPasswordInput.value = '';
			}
			if (settingsNewPasswordInput) {
				settingsNewPasswordInput.value = '';
			}
			if (settingsConfirmPasswordInput) {
				settingsConfirmPasswordInput.value = '';
			}
			setSettingsStatus('密码已修改');
			return;
		}
		setSettingsStatus((res && res.data && res.data.msg) || '密码修改失败', true);
	}).catch(function() {
		setSettingsStatus('密码修改失败，请稍后重试', true);
	});
}

function exportPersonalData() {
	const token = localStorage.getItem('token');
	const userId = getCurrentUserId();
	if (!token || !userId) {
		setSettingsStatus('请先登录后再导出数据', true);
		return;
	}
	setSettingsStatus('正在准备导出数据...');
	Promise.all([
		axios.get('user/info', {
			headers: {
				token: token
			}
		}),
		axios.get('/diary/list', {
			headers: {
				token: token
			},
			params: {
				userId: userId
			}
		}),
		axios.get('/test/history/list', {
			headers: {
				token: token
			},
			params: {
				userId: userId
			}
		})
	]).then(function(results) {
		const profile = getResponseData(results[0]);
		const diaryList = getResponseData(results[1]);
		const testList = getResponseData(results[2]);
		downloadJsonFile('heart-cabin-export.json', {
			exportedAt: new Date().toISOString(),
			user: profile,
			diaries: Array.isArray(diaryList) ? diaryList : [],
			testHistory: Array.isArray(testList) ? testList : []
		});
		setSettingsStatus('数据已导出');
	}).catch(function() {
		setSettingsStatus('数据导出失败，请稍后重试', true);
	});
}

function syncSettingsProfileFields(user) {
	if (settingsPhoneInput) {
		settingsPhoneInput.value = user && user.phone ? user.phone : '';
	}
}

function openReportModal() {
	if (reportModal) {
		closeSettingsModal();
		reportModal.style.display = 'flex';
		document.body.classList.add('report-modal-open');
	}
}

function closeReportModal() {
	if (reportModal) {
		reportModal.style.display = 'none';
		document.body.classList.remove('report-modal-open');
	}
}

function renderReportList(list) {
	if (!reportList || !reportEmpty) {
		return;
	}
	if (!list.length) {
		reportList.innerHTML = '';
		reportEmpty.textContent = '暂无历史测评记录';
		reportEmpty.style.display = 'block';
		return;
	}
	reportEmpty.style.display = 'none';
	reportList.innerHTML = list.map(function(item) {
		const score = item && item.score != null ? item.score : '0';
		const createTime = formatReportTime(getHistoryTimeValue(item));
		return '\n\t\t<div class="report-item">\n\t\t\t<div class="report-item-score">' + escapeHtml(String(score)) + '</div>\n\t\t\t<div class="report-item-meta">\n\t\t\t\t<strong>' + escapeHtml(item && item.level ? item.level : '测评记录') + '</strong>\n\t\t\t\t<span>创建时间：' + escapeHtml(createTime) + '</span>\n\t\t\t</div>\n\t\t</div>';
	}).join('');
}

function loadTestReports() {
	const userId = getCurrentUserId();
	if (!userId) {
		alert('未获取到用户信息，请重新登录');
		return;
	}
	openReportModal();
	if (reportEmpty) {
		reportEmpty.style.display = 'block';
		reportEmpty.textContent = '正在加载历史测评记录...';
	}
	if (reportList) {
		reportList.innerHTML = '';
	}
	axios.get('/test/history/list', {
		params: {
			userId: userId
		}
	}).then(function(res) {
		const data = res.data && res.data.code === 200 && Array.isArray(res.data.data) ? res.data.data : [];
		const sortedList = data.slice().sort(function(a, b) {
			const timeA = new Date(getHistoryTimeValue(a)).getTime();
			const timeB = new Date(getHistoryTimeValue(b)).getTime();
			return (Number.isNaN(timeB) ? 0 : timeB) - (Number.isNaN(timeA) ? 0 : timeA);
		});
		renderReportList(sortedList);
	}).catch(function() {
		if (reportEmpty) {
			reportEmpty.style.display = 'block';
			reportEmpty.textContent = '加载历史测评记录失败，请稍后重试';
		}
		if (reportList) {
			reportList.innerHTML = '';
		}
	});
}

function renderProfileView(user) {
	currentUserProfile = user || null;
	profileEditing = false;

	setProfileItem(1, '昵称：', createValueNode('nickname', user ? (user.nickname || user.username || '心晴小屋用户') : '心晴小屋用户'));
	setProfileItem(2, '年龄：', createValueNode('age', user && user.age !== undefined && user.age !== null && user.age !== '' ? String(user.age) : '无'));
	setProfileItem(3, '性别：', createValueNode('gender', user ? (user.gender || '无') : '无'));
	setProfileItem(4, '个性签名：', createValueNode('signature', user ? (user.signature || '无') : '无'));
	setProfileItem(5, '注册时间：', createValueNode(null, formatCreateTime(getCreateTimeValue(user))));
	setProfileItem(6, '会员等级：', createValueNode(null, formatRole(user && user.role)));
	setProfileItem(7, '当前状态：', createValueNode(null, formatStatus(user && user.status)));
	updateUsageStats(user);
	syncSettingsProfileFields(user);

	if (profileEditButton) {
		profileEditButton.textContent = '编辑资料';
		profileEditButton.disabled = false;
	}

	if (pendingProfileEdit && currentUserProfile) {
		pendingProfileEdit = false;
		renderProfileEdit(currentUserProfile);
	}

	if (reportModal && reportModal.style.display === 'flex') {
		const reportTrigger = document.getElementById('myReportBtn');
		if (reportTrigger && reportTrigger.dataset.loading === 'true') {
			loadTestReports();
		}
	}
}

function renderProfileEdit(user) {
	profileEditing = true;
	setProfileItem(1, '昵称：', createInputNode('nicknameInput', 'text', user.nickname || user.username || ''));
	setProfileItem(2, '年龄：', createInputNode('ageInput', 'number', user.age !== undefined && user.age !== null ? String(user.age) : ''));
	setProfileItem(3, '性别：', createInputNode('genderInput', 'text', user.gender || ''));
	setProfileItem(4, '个性签名：', createInputNode('signatureInput', 'text', user.signature || ''));
	setProfileItem(5, '注册时间：', createValueNode(null, formatCreateTime(getCreateTimeValue(user))));
	setProfileItem(6, '会员等级：', createValueNode(null, formatRole(user.role)));
	setProfileItem(7, '当前状态：', createValueNode(null, formatStatus(user.status)));
	updateUsageStats(user);

	if (profileEditButton) {
		profileEditButton.textContent = '保存资料';
		profileEditButton.disabled = false;
	}
}

function loadUserProfile(token) {
	if (!token) {
		pendingProfileEdit = false;
		renderProfileView(null);
		updateUsageStats(null);
		const nicknameElem = document.getElementById('nickname');
		if (nicknameElem) {
			nicknameElem.textContent = '未获取到用户信息';
		}
		return;
	}

	axios.get('user/info', {
		headers: {
			token: token
		}
	}).then(res => {
		if (res.data && res.data.code === 200 && res.data.data) {
			const user = res.data.data;
			renderProfileView(user);
		} else {
			pendingProfileEdit = false;
			renderProfileView(null);
			updateUsageStats(null);
			const nicknameElem = document.getElementById('nickname');
			if (nicknameElem) {
				nicknameElem.textContent = '未获取到用户信息';
			}
			alert(res.data.msg || '获取用户信息失败');
		}
	}).catch(() => {
		pendingProfileEdit = false;
		renderProfileView(null);
		updateUsageStats(null);
		const nicknameElem = document.getElementById('nickname');
		if (nicknameElem) {
			nicknameElem.textContent = '获取用户信息失败';
		}
	});
}

function changeAvatar() {
	const avatarInput = document.getElementById('avatarInput');
	if (avatarInput) {
		avatarInput.click();
	}
}

function bindAvatarInput() {
	const avatarInput = document.getElementById('avatarInput');
	const avatarImg = document.getElementById('avatarImg');
	if (!avatarInput || !avatarImg) return;

	avatarInput.addEventListener('change', function() {
		const file = avatarInput.files && avatarInput.files[0];
		if (!file) return;
		const reader = new FileReader();
		reader.onload = function() {
			avatarImg.src = reader.result;
		};
		reader.readAsDataURL(file);
	});
}

function saveProfile(token) {
	if (!currentUserProfile || !currentUserProfile.id) {
		alert('用户资料尚未加载完成，请稍后再试');
		return;
	}

	const nicknameInput = document.getElementById('nicknameInput');
	const ageInput = document.getElementById('ageInput');
	const genderInput = document.getElementById('genderInput');
	const signatureInput = document.getElementById('signatureInput');

	const nickname = nicknameInput ? nicknameInput.value.trim() : '';
	const ageText = ageInput ? ageInput.value.trim() : '';
	const gender = genderInput ? genderInput.value.trim() : '';
	const signature = signatureInput ? signatureInput.value.trim() : '';
	const parsedAge = ageText === '' ? currentUserProfile.age : Number.parseInt(ageText, 10);
	const age = Number.isNaN(parsedAge) ? (currentUserProfile.age || 0) : parsedAge;

	if (!nickname) {
		alert('昵称不能为空');
		return;
	}

	if (profileEditButton) {
		profileEditButton.disabled = true;
		profileEditButton.textContent = '保存中...';
	}

	const payload = {
		id: currentUserProfile.id,
		nickname: nickname,
		age: age,
		gender: gender,
		signature: signature,
		avatar: currentUserProfile.avatar || '',
		phone: currentUserProfile.phone || ''
	};

	axios.post('user/info/update', payload, {
		headers: {
			token: token
		}
	}).then(res => {
		if (res.data && res.data.code === 200) {
			loadUserProfile(token);
			alert('资料已更新');
			return;
		}

		if (profileEditButton) {
			profileEditButton.disabled = false;
			profileEditButton.textContent = '保存资料';
		}
		alert(res.data.msg || '保存失败');
	}).catch(() => {
		if (profileEditButton) {
			profileEditButton.disabled = false;
			profileEditButton.textContent = '保存资料';
		}
		alert('保存失败，请稍后重试');
	});
}

function handleEditProfileClick() {
	const token = localStorage.getItem('token');
	if (!token) {
		alert('未登录，无法编辑资料');
		return;
	}

	if (!currentUserProfile) {
		pendingProfileEdit = true;
		if (profileEditButton) {
			profileEditButton.disabled = true;
			profileEditButton.textContent = '加载中...';
		}
		loadUserProfile(token);
		return;
	}

	if (!profileEditing) {
		renderProfileEdit(currentUserProfile);
		return;
	}

	saveProfile(token);
}

window.loadUserProfile = loadUserProfile;
window.changeAvatar = changeAvatar;
window.incrementUserStat = incrementUserStat;
window.loadTestReports = loadTestReports;
window.openSettingsModal = openSettingsModal;

document.addEventListener('DOMContentLoaded', function() {
	applyTheme(getStoredTheme());
	bindAvatarInput();
	profileEditButton = document.getElementById('editProfileBtn');
	if (profileEditButton) {
		profileEditButton.addEventListener('click', handleEditProfileClick);
	}
	reportModal = document.getElementById('testReportModal');
	reportList = document.getElementById('testReportList');
	reportEmpty = document.getElementById('testReportEmpty');
	reportCloseBtn = document.getElementById('testReportClose');
	reportBackdrop = document.getElementById('testReportBackdrop');
	settingsModal = document.getElementById('settingsModal');
	settingsCloseBtn = document.getElementById('settingsClose');
	settingsBackdrop = document.getElementById('settingsBackdrop');
	settingsThemeLightBtn = document.getElementById('settingsThemeLightBtn');
	settingsThemeDarkBtn = document.getElementById('settingsThemeDarkBtn');
	settingsStatus = document.getElementById('settingsStatus');
	settingsPhoneInput = document.getElementById('settingsPhoneInput');
	settingsOldPasswordInput = document.getElementById('settingsOldPasswordInput');
	settingsNewPasswordInput = document.getElementById('settingsNewPasswordInput');
	settingsConfirmPasswordInput = document.getElementById('settingsConfirmPasswordInput');
	settingsSavePasswordBtn = document.getElementById('settingsSavePasswordBtn');
	settingsSavePhoneBtn = document.getElementById('settingsSavePhoneBtn');
	settingsExportBtn = document.getElementById('settingsExportBtn');
	settingsTrigger = document.getElementById('settingBtn');
	const reportTrigger = document.getElementById('myReportBtn');
	if (reportTrigger) {
		reportTrigger.addEventListener('click', function() {
			closeSettingsModal();
			reportTrigger.dataset.loading = 'true';
			loadTestReports();
			reportTrigger.dataset.loading = 'false';
		});
		reportTrigger.addEventListener('keydown', function(event) {
			if (event.key === 'Enter' || event.key === ' ') {
				event.preventDefault();
				reportTrigger.click();
			}
		});
	}
	if (reportCloseBtn) {
		reportCloseBtn.addEventListener('click', closeReportModal);
	}
	if (reportBackdrop) {
		reportBackdrop.addEventListener('click', closeReportModal);
	}
	if (settingsTrigger) {
		settingsTrigger.addEventListener('click', openSettingsModal);
		settingsTrigger.addEventListener('keydown', function(event) {
			if (event.key === 'Enter' || event.key === ' ') {
				event.preventDefault();
				openSettingsModal();
			}
		});
	}
	if (settingsCloseBtn) {
		settingsCloseBtn.addEventListener('click', closeSettingsModal);
	}
	if (settingsBackdrop) {
		settingsBackdrop.addEventListener('click', closeSettingsModal);
	}
	if (settingsThemeLightBtn) {
		settingsThemeLightBtn.addEventListener('click', function() {
			applyTheme('light');
		});
	}
	if (settingsThemeDarkBtn) {
		settingsThemeDarkBtn.addEventListener('click', function() {
			applyTheme('dark');
		});
	}
	if (settingsSavePasswordBtn) {
		settingsSavePasswordBtn.addEventListener('click', savePassword);
	}
	if (settingsSavePhoneBtn) {
		settingsSavePhoneBtn.addEventListener('click', savePhoneBinding);
	}
	if (settingsExportBtn) {
		settingsExportBtn.addEventListener('click', exportPersonalData);
	}
	window.addEventListener('keydown', function(event) {
		if (event.key === 'Escape') {
			closeReportModal();
			closeSettingsModal();
		}
	});
});