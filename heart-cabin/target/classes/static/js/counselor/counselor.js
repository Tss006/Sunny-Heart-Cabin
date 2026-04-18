// 咨询师端-个人中心与导航脚本

(function() {
	const navLinks = Array.from(document.querySelectorAll('.sidebar-menu a'));
	const logoutBtn = document.getElementById('logout');
	if (!localStorage.getItem('isLogin')) {
		location.href = 'login.html';
		return;
	}
	const storedRole = String(localStorage.getItem('user_role') || '');
	let currentAccount = {};

	try {
		currentAccount = JSON.parse(localStorage.getItem('user') || '{}') || {};
	} catch (error) {
		currentAccount = {};
	}

	if ((storedRole && storedRole !== 'counselor') || (currentAccount.role && currentAccount.role !== 'counselor')) {
		location.href = 'index.html';
		return;
	}

	function getAccount() {
		return currentAccount || {};
	}

	function formatTime(value) {
		if (!value) return '未知';
		return String(value).replace('T', ' ').slice(0, 19);
	}

	function formatStatus(value) {
		return Number(value) === 1 ? '启用' : '禁用';
	}

	function hideAllPages() {
		document.getElementById('home-content').style.display = 'none';
		document.getElementById('profile-content').style.display = 'none';
		document.getElementById('consult-content').style.display = 'none';
		document.getElementById('appointment-content').style.display = 'none';
	}

	function updateActiveLink(link) {
		navLinks.forEach(function(item) {
			item.classList.remove('active');
		});
		if (link) {
			link.classList.add('active');
		}
	}

	function renderProfile() {
		const account = getAccount();
		const name = account.name || account.nickname || account.username || '咨询师';
		const title = account.title || '心理咨询师';
		const profileAvatar = document.getElementById('profileAvatar');
		if (profileAvatar) {
			profileAvatar.src = account.avatar || 'images/avatar-default.png';
			profileAvatar.alt = name + '头像';
		}

		const bindings = {
			profileName: name,
			profileTitle: title,
			profileRealName: account.name || '-',
			profileUsername: account.username || '-',
			profileNickname: account.nickname || '-',
			profilePhone: account.phone || '-',
			profileAge: account.age != null ? String(account.age) : '-',
			profileGender: account.gender || '-',
			profileStatus: formatStatus(account.status),
			profileCreateTime: formatTime(account.create_time),
			profileSignature: account.signature || '温和倾听、耐心陪伴、科学支持。'
		};

		Object.keys(bindings).forEach(function(id) {
			const node = document.getElementById(id);
			if (!node) return;
			node.textContent = bindings[id];
		});
	}

	function showPage(page, link) {
		hideAllPages();
		const selectedPage = document.getElementById(page + '-content');
		if (!selectedPage) return;
		selectedPage.style.display = 'flex';
		if (page === 'home' && typeof window.renderCounselorHome === 'function') {
			window.renderCounselorHome();
		}
		if (page === 'profile') {
			renderProfile();
		}
		if (page === 'consult' && typeof window.initCounselorConsult === 'function') {
			window.initCounselorConsult();
		}
		if (page === 'appointment' && typeof window.initCounselorAppointment === 'function') {
			window.initCounselorAppointment();
		}
		updateActiveLink(link);
	}

	function logout() {
		if (confirm('确定要退出登录吗？')) {
			localStorage.removeItem('isLogin');
			localStorage.removeItem('token');
			localStorage.removeItem('user');
			localStorage.removeItem('user_id');
			localStorage.removeItem('user_role');
			location.href = 'login.html';
		}
	}

	window.showPage = showPage;

	if (logoutBtn) {
		logoutBtn.onclick = logout;
	}

	if (!localStorage.getItem('isLogin')) {
		location.href = 'login.html';
	}

	document.addEventListener('DOMContentLoaded', function() {
		renderProfile();
		showPage('home', navLinks[0]);
	});
})();
