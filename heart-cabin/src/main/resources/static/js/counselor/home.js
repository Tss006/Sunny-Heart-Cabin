// 咨询师端-首页脚本

(function() {
	function getAccount() {
		const raw = localStorage.getItem('user');
		if (!raw) return {};
		try {
			return JSON.parse(raw) || {};
		} catch (error) {
			return {};
		}
	}

	function renderHome() {
		const account = getAccount();
		const title = document.getElementById('homeTitle');
		const subtitle = document.getElementById('homeSubtitle');
		const homeAvatar = document.getElementById('homeAvatar');
		const pendingCount = document.getElementById('pendingCount');
		const activeCount = document.getElementById('activeCount');
		const totalCount = document.getElementById('totalCount');

		if (title) {
			title.textContent = '欢迎回来，' + (account.name || account.nickname || account.username || '咨询师') + '。';
		}
		if (subtitle) {
			subtitle.textContent = '你可以在个人中心更新资料，或进入用户咨询页继续处理来访消息。';
		}
		if (homeAvatar) {
			homeAvatar.src = account.avatar || 'images/avatar-default.png';
			homeAvatar.alt = (account.name || account.nickname || account.username || '咨询师') + '头像';
		}
		if (pendingCount) pendingCount.textContent = '3';
		if (activeCount) activeCount.textContent = '2';
		if (totalCount) totalCount.textContent = '18';
	}

	window.renderCounselorHome = renderHome;

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', renderHome);
	} else {
		renderHome();
	}
})();
