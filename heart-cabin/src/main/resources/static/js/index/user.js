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

let bluetoothModal = null;
let bluetoothCloseBtn = null;
let bluetoothBackdrop = null;
let bluetoothTrigger = null;
let bluetoothConnectBtn = null;
let bluetoothCompatConnectBtn = null;
let bluetoothDisconnectBtn = null;
let bluetoothSyncBtn = null;
let bluetoothStatusChip = null;
let bluetoothDeviceName = null;
let bluetoothHeartRateValue = null;
let bluetoothLastSyncValue = null;
let bluetoothRecordDateValue = null;
let bluetoothSupportHint = null;
let bluetoothLog = null;
let bluetoothDevice = null;
let bluetoothServer = null;
let bluetoothHeartRateCharacteristic = null;
let bluetoothMeasurementListener = null;
let bluetoothCurrentHeartRate = null;
let bluetoothLastSyncAt = 0;
let bluetoothIsConnecting = false;
let bluetoothIsSyncing = false;

const BLUETOOTH_HEART_RATE_SERVICE_UUID = 'heart_rate';
const BLUETOOTH_HEART_RATE_MEASUREMENT_UUID = 'heart_rate_measurement';
const BLUETOOTH_SYNC_INTERVAL = 30000;

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
	closeBluetoothModal();
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

function escapeHtml(value) {
	if (value === null || value === undefined) {
		return '';
	}
	return String(value)
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}

function isBluetoothSupported() {
	return typeof navigator !== 'undefined' && Boolean(navigator.bluetooth) && window.isSecureContext;
}

function getLocalDateString(date) {
	const currentDate = date instanceof Date ? date : new Date();
	const year = currentDate.getFullYear();
	const month = String(currentDate.getMonth() + 1).padStart(2, '0');
	const day = String(currentDate.getDate()).padStart(2, '0');
	return year + '-' + month + '-' + day;
}

function formatBluetoothDateTime(value) {
	const currentDate = value instanceof Date ? value : new Date(value);
	if (Number.isNaN(currentDate.getTime())) {
		return '--';
	}
	const year = currentDate.getFullYear();
	const month = String(currentDate.getMonth() + 1).padStart(2, '0');
	const day = String(currentDate.getDate()).padStart(2, '0');
	const hours = String(currentDate.getHours()).padStart(2, '0');
	const minutes = String(currentDate.getMinutes()).padStart(2, '0');
	const seconds = String(currentDate.getSeconds()).padStart(2, '0');
	return year + '-' + month + '-' + day + ' ' + hours + ':' + minutes + ':' + seconds;
}

function getBluetoothSupportText() {
	if (typeof navigator === 'undefined' || !navigator.bluetooth) {
		return '当前浏览器不支持 Web Bluetooth，请使用 Chrome 或 Edge。';
	}
	if (!window.isSecureContext) {
		return 'Web Bluetooth 需要安全上下文，请通过 localhost 或 https 打开页面。';
	}
	return '支持标准 BLE 心率设备。若是小米手环，建议先断开手机 App 占用，再尝试兼容搜索。';
}

function isBluetoothConnected() {
	return Boolean(bluetoothDevice && bluetoothDevice.gatt && bluetoothDevice.gatt.connected);
}

function setBluetoothStatusChip(text, type) {
	if (!bluetoothStatusChip) {
		return;
	}
	bluetoothStatusChip.textContent = text;
	bluetoothStatusChip.classList.remove('is-success', 'is-warning', 'is-error');
	if (type) {
		bluetoothStatusChip.classList.add('is-' + type);
	}
}

function setBluetoothLog(message, isError) {
	if (!bluetoothLog) {
		return;
	}
	bluetoothLog.textContent = message || '';
	bluetoothLog.classList.toggle('is-error', Boolean(isError));
}

function clearBluetoothCharacteristicListener() {
	if (bluetoothHeartRateCharacteristic && bluetoothMeasurementListener) {
		try {
			bluetoothHeartRateCharacteristic.removeEventListener('characteristicvaluechanged', bluetoothMeasurementListener);
		} catch (error) {
			// ignore cleanup failures
		}
	}
	bluetoothHeartRateCharacteristic = null;
	bluetoothMeasurementListener = null;
}

function updateBluetoothUi() {
	const supportReady = isBluetoothSupported();
	const connected = isBluetoothConnected();

	if (bluetoothSupportHint) {
		bluetoothSupportHint.textContent = getBluetoothSupportText();
	}

	if (bluetoothDeviceName) {
		if (bluetoothDevice && bluetoothDevice.name) {
			bluetoothDeviceName.textContent = bluetoothDevice.name;
		} else if (connected) {
			bluetoothDeviceName.textContent = '未知设备';
		} else {
			bluetoothDeviceName.textContent = '未连接';
		}
	}

	if (bluetoothHeartRateValue) {
		bluetoothHeartRateValue.textContent = bluetoothCurrentHeartRate ? bluetoothCurrentHeartRate + ' 次/分' : '等待数据';
	}

	if (bluetoothLastSyncValue) {
		bluetoothLastSyncValue.textContent = bluetoothLastSyncAt ? formatBluetoothDateTime(bluetoothLastSyncAt) : '尚未同步';
	}

	if (bluetoothRecordDateValue) {
		bluetoothRecordDateValue.textContent = getLocalDateString();
	}

	if (bluetoothConnectBtn) {
		bluetoothConnectBtn.disabled = !supportReady || bluetoothIsConnecting || connected;
		if (bluetoothIsConnecting) {
			bluetoothConnectBtn.textContent = '连接中...';
		} else if (connected) {
			bluetoothConnectBtn.textContent = '已连接';
		} else if (bluetoothDevice) {
			bluetoothConnectBtn.textContent = '重新连接';
		} else {
			bluetoothConnectBtn.textContent = '连接设备';
		}
	}

	if (bluetoothCompatConnectBtn) {
		bluetoothCompatConnectBtn.disabled = !supportReady || bluetoothIsConnecting || connected;
		if (bluetoothIsConnecting) {
			bluetoothCompatConnectBtn.textContent = '连接中...';
		} else if (connected) {
			bluetoothCompatConnectBtn.textContent = '已连接';
		} else {
			bluetoothCompatConnectBtn.textContent = '兼容搜索';
		}
	}

	if (bluetoothDisconnectBtn) {
		bluetoothDisconnectBtn.disabled = !connected || bluetoothIsConnecting;
	}

	if (bluetoothSyncBtn) {
		bluetoothSyncBtn.disabled = !connected || bluetoothIsConnecting || bluetoothIsSyncing || !bluetoothCurrentHeartRate;
	}

	if (bluetoothStatusChip) {
		if (!supportReady) {
			setBluetoothStatusChip('不支持', 'error');
		} else if (bluetoothIsConnecting) {
			setBluetoothStatusChip('连接中', 'warning');
		} else if (bluetoothIsSyncing) {
			setBluetoothStatusChip('同步中', 'warning');
		} else if (connected) {
			setBluetoothStatusChip('已连接', 'success');
		} else if (bluetoothDevice) {
			setBluetoothStatusChip('已断开', 'warning');
		} else {
			setBluetoothStatusChip('未连接');
		}
	}
}

function closeBluetoothModal() {
	if (!bluetoothModal) {
		return;
	}
	bluetoothModal.style.display = 'none';
	document.body.classList.remove('bluetooth-modal-open');
}

function openBluetoothModal() {
	if (!bluetoothModal) {
		return;
	}
	closeReportModal();
	closeSettingsModal();
	updateBluetoothUi();
	bluetoothModal.style.display = 'flex';
	document.body.classList.add('bluetooth-modal-open');
}

function handleBluetoothDisconnected() {
	bluetoothIsConnecting = false;
	bluetoothIsSyncing = false;
	bluetoothServer = null;
	clearBluetoothCharacteristicListener();
	setBluetoothStatusChip('已断开', 'warning');
	setBluetoothLog('设备连接已断开，可以重新连接。');
	updateBluetoothUi();
}

function parseBluetoothHeartRate(dataView) {
	if (!dataView || dataView.byteLength < 2) {
		return null;
	}
	const flags = dataView.getUint8(0);
	const isUint16 = Boolean(flags & 0x01);
	return isUint16 ? dataView.getUint16(1, true) : dataView.getUint8(1);
}

function handleBluetoothMeasurement(event) {
	const dataView = event && event.target ? event.target.value : null;
	const heartRate = parseBluetoothHeartRate(dataView);
	if (!heartRate || heartRate <= 0) {
		return;
	}
	bluetoothCurrentHeartRate = heartRate;
	updateBluetoothUi();
	setBluetoothLog('已接收到心率 ' + heartRate + ' 次/分。');
	if (!bluetoothLastSyncAt || Date.now() - bluetoothLastSyncAt >= BLUETOOTH_SYNC_INTERVAL) {
		syncBluetoothHeartRate(false);
	}
}

async function syncBluetoothHeartRate(force) {
	if (!isBluetoothConnected()) {
		setBluetoothLog('请先连接蓝牙设备后再同步。', true);
		updateBluetoothUi();
		return;
	}
	if (!bluetoothCurrentHeartRate) {
		setBluetoothLog('当前没有可同步的心率数据。', true);
		updateBluetoothUi();
		return;
	}
	const now = Date.now();
	if (!force && bluetoothLastSyncAt && now - bluetoothLastSyncAt < BLUETOOTH_SYNC_INTERVAL) {
		return;
	}
	const userId = getCurrentUserId();
	if (!userId) {
		setBluetoothLog('未获取到用户信息，请先登录后再同步。', true);
		updateBluetoothUi();
		return;
	}
	const parsedUserId = Number(userId);
	const payloadUserId = Number.isNaN(parsedUserId) ? userId : parsedUserId;
	const token = localStorage.getItem('token');
	const requestConfig = token ? {
		headers: {
			token: token
		}
	} : {};

	bluetoothIsSyncing = true;
	setBluetoothStatusChip('同步中', 'warning');
	setBluetoothLog('正在把心率写入报告...');
	updateBluetoothUi();

	try {
		const response = await axios.post('/report/add', {
			userId: payloadUserId,
			heartRate: bluetoothCurrentHeartRate,
			sleepHours: null,
			steps: null,
			recordDate: getLocalDateString()
		}, requestConfig);
		if (response && response.data && response.data.code === 200) {
			bluetoothLastSyncAt = Date.now();
			setBluetoothStatusChip('已连接', 'success');
			setBluetoothLog('心率已同步到我的报告。');
			return;
		}
		setBluetoothLog((response && response.data && response.data.msg) || '心率同步失败。', true);
	} catch (error) {
		setBluetoothLog('心率同步失败，请稍后重试。', true);
	} finally {
		bluetoothIsSyncing = false;
		updateBluetoothUi();
	}
}

async function connectBluetoothDevice() {
	return connectBluetoothDeviceWithMode('standard');
}

async function connectBluetoothCompatDevice() {
	return connectBluetoothDeviceWithMode('compat');
}

async function connectBluetoothDeviceWithMode(mode) {
	if (!isBluetoothSupported()) {
		setBluetoothStatusChip('不支持', 'error');
		setBluetoothLog(getBluetoothSupportText(), true);
		updateBluetoothUi();
		return;
	}
	if (bluetoothIsConnecting) {
		return;
	}

	bluetoothIsConnecting = true;
	setBluetoothStatusChip('连接中', 'warning');
	setBluetoothLog(mode === 'compat' ? '正在打开兼容设备选择器...' : '正在打开设备选择器...');
	updateBluetoothUi();

	try {
		const requestOptions = mode === 'compat' ? {
			acceptAllDevices: true,
			optionalServices: [BLUETOOTH_HEART_RATE_SERVICE_UUID, 'battery_service', 'device_information']
		} : {
			filters: [
				{ services: [BLUETOOTH_HEART_RATE_SERVICE_UUID] },
				{ namePrefix: 'Mi' },
				{ namePrefix: 'Xiaomi' },
				{ namePrefix: 'Redmi' },
				{ namePrefix: 'Miband' },
				{ namePrefix: 'Mi Smart Band' }
			],
			optionalServices: [BLUETOOTH_HEART_RATE_SERVICE_UUID, 'battery_service', 'device_information']
		};
		const device = await navigator.bluetooth.requestDevice(requestOptions);
		bluetoothDevice = device;
		if (bluetoothDevice) {
			bluetoothDevice.removeEventListener('gattserverdisconnected', handleBluetoothDisconnected);
			bluetoothDevice.addEventListener('gattserverdisconnected', handleBluetoothDisconnected);
		}

		bluetoothServer = await bluetoothDevice.gatt.connect();
		const service = await bluetoothServer.getPrimaryService(BLUETOOTH_HEART_RATE_SERVICE_UUID);
		const characteristic = await service.getCharacteristic(BLUETOOTH_HEART_RATE_MEASUREMENT_UUID);
		clearBluetoothCharacteristicListener();
		bluetoothHeartRateCharacteristic = characteristic;
		bluetoothMeasurementListener = handleBluetoothMeasurement;
		bluetoothHeartRateCharacteristic.addEventListener('characteristicvaluechanged', bluetoothMeasurementListener);
		await bluetoothHeartRateCharacteristic.startNotifications();

		bluetoothCurrentHeartRate = null;
		bluetoothLastSyncAt = 0;
		setBluetoothStatusChip('已连接', 'success');
		setBluetoothLog(mode === 'compat' ? '兼容设备已连接，等待心率数据。' : '设备已连接，等待心率数据。');
	} catch (error) {
		bluetoothServer = null;
		clearBluetoothCharacteristicListener();
		if (error && error.name === 'NotFoundError') {
			setBluetoothLog(mode === 'compat' ? '没有找到可连接的设备，请确认手环已进入可发现状态。' : '没有找到匹配设备，建议改用兼容搜索。');
		} else if (error && error.name === 'NotAllowedError') {
			setBluetoothLog('浏览器阻止了蓝牙请求，请检查权限。', true);
		} else {
			setBluetoothLog(mode === 'compat' ? '兼容搜索仍然失败，请确认手环未被手机 App 占用并且已可发现。' : '蓝牙连接失败，请确认设备已开启并支持心率服务。', true);
		}
	} finally {
		bluetoothIsConnecting = false;
		updateBluetoothUi();
	}
}

function disconnectBluetoothDevice() {
	if (!bluetoothDevice || !bluetoothDevice.gatt) {
		setBluetoothLog('当前没有可断开的蓝牙设备。');
		updateBluetoothUi();
		return;
	}
	if (!bluetoothDevice.gatt.connected) {
		handleBluetoothDisconnected();
		return;
	}
	bluetoothIsConnecting = false;
	bluetoothIsSyncing = false;
	setBluetoothStatusChip('断开中', 'warning');
	setBluetoothLog('正在断开设备连接...');
	updateBluetoothUi();
	bluetoothDevice.gatt.disconnect();
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
	axios.post('/user/info/update', {
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
		closeBluetoothModal();
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

	axios.get('/user/info', {
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

	axios.post('/user/info/update', payload, {
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
window.openBluetoothModal = openBluetoothModal;
window.syncBluetoothHeartRate = syncBluetoothHeartRate;

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
	bluetoothModal = document.getElementById('bluetoothModal');
	bluetoothCloseBtn = document.getElementById('bluetoothClose');
	bluetoothBackdrop = document.getElementById('bluetoothBackdrop');
	bluetoothTrigger = document.getElementById('bluetoothBtn');
	bluetoothConnectBtn = document.getElementById('bluetoothConnectBtn');
	bluetoothCompatConnectBtn = document.getElementById('bluetoothCompatConnectBtn');
	bluetoothDisconnectBtn = document.getElementById('bluetoothDisconnectBtn');
	bluetoothSyncBtn = document.getElementById('bluetoothSyncBtn');
	bluetoothStatusChip = document.getElementById('bluetoothStatusChip');
	bluetoothDeviceName = document.getElementById('bluetoothDeviceName');
	bluetoothHeartRateValue = document.getElementById('bluetoothHeartRateValue');
	bluetoothLastSyncValue = document.getElementById('bluetoothLastSyncValue');
	bluetoothRecordDateValue = document.getElementById('bluetoothRecordDateValue');
	bluetoothSupportHint = document.getElementById('bluetoothSupportHint');
	bluetoothLog = document.getElementById('bluetoothLog');
	updateBluetoothUi();
	if (document.getElementById('user-content')) {
		loadUserProfile(localStorage.getItem('token'));
	}
	const reportTrigger = document.getElementById('myReportBtn');
	if (reportTrigger) {
		reportTrigger.addEventListener('click', function() {
			closeSettingsModal();
			closeBluetoothModal();
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
	if (bluetoothTrigger) {
		bluetoothTrigger.addEventListener('click', openBluetoothModal);
		bluetoothTrigger.addEventListener('keydown', function(event) {
			if (event.key === 'Enter' || event.key === ' ') {
				event.preventDefault();
				openBluetoothModal();
			}
		});
	}
	if (bluetoothCloseBtn) {
		bluetoothCloseBtn.addEventListener('click', closeBluetoothModal);
	}
	if (bluetoothBackdrop) {
		bluetoothBackdrop.addEventListener('click', closeBluetoothModal);
	}
	if (bluetoothConnectBtn) {
		bluetoothConnectBtn.addEventListener('click', connectBluetoothDevice);
	}
	if (bluetoothCompatConnectBtn) {
		bluetoothCompatConnectBtn.addEventListener('click', connectBluetoothCompatDevice);
	}
	if (bluetoothDisconnectBtn) {
		bluetoothDisconnectBtn.addEventListener('click', disconnectBluetoothDevice);
	}
	if (bluetoothSyncBtn) {
		bluetoothSyncBtn.addEventListener('click', function() {
			syncBluetoothHeartRate(true);
		});
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
			closeBluetoothModal();
		}
	});
	updateBluetoothUi();
});