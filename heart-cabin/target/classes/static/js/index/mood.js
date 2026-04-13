// mood.js - 心情日记页面脚本（支持标题）

(function() {
	const moodTitleInput = document.getElementById('moodTitle');
	const moodInput = document.getElementById('moodInput');
	const publishMoodBtn = document.getElementById('publishMoodBtn');
	const moodList = document.getElementById('moodList');
	const moodDetailModal = document.getElementById('moodDetailModal');
	const moodModalBackdrop = document.getElementById('moodModalBackdrop');
	const moodModalClose = document.getElementById('moodModalClose');
	const moodModalTitle = document.getElementById('moodModalTitle');
	const moodModalDate = document.getElementById('moodModalDate');
	const moodModalContent = document.getElementById('moodModalContent');

	// 从 localStorage 获取 user_id
	const storedUserId = localStorage.getItem('user_id');
	let user = localStorage.getItem('user');
	user = user ? JSON.parse(user) : null;
	let user_id = storedUserId || (user && (user.user_id || user.userId || (user.user && user.user.id) || user.id));
	if (!user_id) {
		if (moodList) moodList.innerHTML = '<li>未获取到用户信息，请重新登录</li>';
		return;
	}

	function closeMoodDetail() {
		if (moodDetailModal) {
			moodDetailModal.style.display = 'none';
			document.body.classList.remove('mood-modal-open');
		}
	}

	function openMoodDetail(item) {
		if (!moodDetailModal || !moodModalTitle || !moodModalDate || !moodModalContent) return;
		const title = item && item.title ? item.title : '心情日记';
		const dateText = item && item.create_time ? new Date(item.create_time).toLocaleString() : '';
		const content = item && item.content ? item.content : '';
		moodModalTitle.textContent = title;
		moodModalDate.textContent = dateText;
		moodModalContent.innerHTML = escapeHtml(content).replace(/\n/g, '<br>');
		moodDetailModal.style.display = 'flex';
		document.body.classList.add('mood-modal-open');
	}

	if (moodModalBackdrop) {
		moodModalBackdrop.onclick = closeMoodDetail;
	}
	if (moodModalClose) {
		moodModalClose.onclick = closeMoodDetail;
	}
	document.addEventListener('keydown', function(event) {
		if (event.key === 'Escape') {
			closeMoodDetail();
		}
	});

	// 发布日记
	if (publishMoodBtn) {
		publishMoodBtn.onclick = function() {
			const title = moodTitleInput ? moodTitleInput.value.trim() : '';
			const content = moodInput ? moodInput.value.trim() : '';
			if (!title) {
				alert('请输入日记标题');
				return;
			}
			if (!content) {
				alert('请输入日记内容');
				return;
			}
			axios.post('/diary/add', {
				user_id: user_id,
				title: title,
				content: content
			}).then(res => {
				if (res.data && res.data.code === 200) {
					if (moodTitleInput) moodTitleInput.value = '';
					if (moodInput) moodInput.value = '';
					loadMoodList();
					alert('发布成功');
				} else {
					alert(res.data.msg || '发布失败');
				}
			}).catch(err => {
				console.error('发布日记失败:', err);
				alert((err && err.response && err.response.data && err.response.data.msg) || '发布失败，请稍后重试');
			});
		};
	}

	// 查询日记
	function loadMoodList() {
		axios.get('/diary/list', {
			params: { user_id: user_id }
		}).then(res => {
			if (res.data && res.data.code === 200 && Array.isArray(res.data.data)) {
				renderMoodList(res.data.data);
			} else if (moodList) {
				moodList.innerHTML = '<li>暂无日记</li>';
			}
		}).catch(err => {
			console.error('加载日记失败:', err);
			if (moodList) moodList.innerHTML = '<li>加载失败，请稍后重试</li>';
		});
	}

	// 渲染日记列表
	function renderMoodList(list) {
		if (!moodList) return;
		if (!list.length) {
			moodList.innerHTML = '<li>暂无日记</li>';
			return;
		}
		moodList.innerHTML = '';
		list.forEach(item => {
			const li = document.createElement('li');
			li.className = 'mood-item';
			li.setAttribute('role', 'button');
			li.setAttribute('tabindex', '0');
			const safeTitle = truncateText(item && item.title ? item.title : '心情日记', 60);
			const safeContent = truncateText(item && item.content ? item.content : '', 60);
			const safeDate = item.create_time ? new Date(item.create_time).toLocaleString() : '';
			li.innerHTML = `
				<button class="delete-mood-btn" data-id="${item.id}">删除</button>
				<div class="mood-item-body">
					<div class="mood-title">${escapeHtml(safeTitle)}</div>
					<div class="mood-content">${escapeHtml(safeContent)}</div>
				</div>
				<div class="mood-item-footer">
					<div class="mood-date">${escapeHtml(safeDate)}</div>
				</div>
			`;
			li.onclick = function(event) {
				if (event.target.closest('.delete-mood-btn')) return;
				openMoodDetail(item);
			};
			li.onkeydown = function(event) {
				if (event.key === 'Enter' || event.key === ' ') {
					event.preventDefault();
					openMoodDetail(item);
				}
			};
			moodList.appendChild(li);
		});
		// 绑定删除事件
		document.querySelectorAll('.delete-mood-btn').forEach(btn => {
			btn.onclick = function(event) {
				event.stopPropagation();
				const id = btn.getAttribute('data-id');
				if (confirm('确定删除这条日记吗？')) {
					axios.post('/diary/delete', null, {
						params: { id: id, user_id: user_id }
					}).then(res => {
						if (res.data && res.data.code === 200) {
							loadMoodList();
						} else {
							alert(res.data.msg || '删除失败');
						}
					});
				}
			};
		});
	}

	// 工具函数：转义HTML
	function escapeHtml(str) {
		return String(str || '').replace(/[&<>"']/g, function (c) {
			return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'})[c];
		});
	}

	function truncateText(text, maxLength) {
		const normalizedText = String(text || '');
		if (normalizedText.length <= maxLength) {
			return normalizedText;
		}
		if (maxLength <= 3) {
			return '...';
		}
		return normalizedText.slice(0, maxLength - 3) + '...';
	}

	// 页面加载时自动查询
	if (moodList) {
		loadMoodList();
	}
})();