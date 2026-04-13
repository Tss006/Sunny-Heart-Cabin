// music.js - 治愈音乐页面脚本

(function() {
	const musicPage = document.getElementById('music-content');
	if (!musicPage) return;

	const musicList = document.getElementById('musicList');
	const musicEmptyState = document.getElementById('musicEmptyState');
	const musicSearchInput = document.getElementById('musicSearchInput');
	const musicClearSearchBtn = document.getElementById('musicClearSearchBtn');
	const musicTotalCount = document.getElementById('musicTotalCount');
	const musicFilteredCount = document.getElementById('musicFilteredCount');
	const musicSearchCount = document.getElementById('musicSearchCount');
	const musicDisplayCount = document.getElementById('musicDisplayCount');
	const musicCurrentTitle = document.getElementById('musicCurrentTitle');
	const musicCurrentMeta = document.getElementById('musicCurrentMeta');
	const musicCurrentStatus = document.getElementById('musicCurrentStatus');
	const musicProgressBar = document.getElementById('musicProgressBar');
	const musicCurrentTime = document.getElementById('musicCurrentTime');
	const musicDuration = document.getElementById('musicDuration');
	const prevBtn = document.getElementById('musicPrevBtn');
	const playBtn = document.getElementById('musicPlayBtn');
	const pauseBtn = document.getElementById('musicPauseBtn');
	const nextBtn = document.getElementById('musicNextBtn');
	const modeButtons = Array.from(document.querySelectorAll('[data-music-mode]'));
	const audio = document.getElementById('musicAudio');

	const state = {
		songs: [],
		filteredSongs: [],
		currentSongId: '',
		mode: 'list',
		isLoaded: false
	};

	function normalizeText(value) {
		return String(value == null ? '' : value).trim();
	}

	function formatTime(seconds) {
		if (!Number.isFinite(seconds) || seconds < 0) return '00:00';
		const totalSeconds = Math.floor(seconds);
		const minutes = Math.floor(totalSeconds / 60);
		const remainSeconds = totalSeconds % 60;
		return `${String(minutes).padStart(2, '0')}:${String(remainSeconds).padStart(2, '0')}`;
	}

	function normalizeSong(song, index) {
		return {
			id: String(song.id != null ? song.id : `music-${index}`),
			title: normalizeText(song.title) || '未命名歌曲',
			author: normalizeText(song.author) || '未知作者',
			type: normalizeText(song.type) || '未知类型',
			url: normalizeText(song.url)
		};
	}

	function getCurrentSong() {
		return state.songs.find(song => song.id === state.currentSongId) || null;
	}

	function getFilteredCurrentIndex() {
		return state.filteredSongs.findIndex(song => song.id === state.currentSongId);
	}

	function setEmptyState(message, visible) {
		if (!musicEmptyState) return;
		musicEmptyState.textContent = message;
		musicEmptyState.style.display = visible ? 'block' : 'none';
	}

	function updateCounts() {
		const totalCount = state.songs.length;
		const filteredCount = state.filteredSongs.length;
		if (musicTotalCount) musicTotalCount.textContent = String(totalCount);
		if (musicFilteredCount) musicFilteredCount.textContent = String(filteredCount);
		if (musicSearchCount) musicSearchCount.textContent = `共 ${filteredCount} 首`;
		if (musicDisplayCount) musicDisplayCount.textContent = `${filteredCount} 首`;
	}

	function updatePlayerHeader() {
		const currentSong = getCurrentSong();
		if (currentSong) {
			if (musicCurrentTitle) musicCurrentTitle.textContent = currentSong.title;
			if (musicCurrentMeta) musicCurrentMeta.textContent = `${currentSong.author} · ${currentSong.type}`;
		} else {
			if (musicCurrentTitle) musicCurrentTitle.textContent = '请选择一首歌曲';
			if (musicCurrentMeta) musicCurrentMeta.textContent = '点击下方歌曲即可开始播放';
		}

		if (musicCurrentStatus) {
			if (!currentSong) {
				musicCurrentStatus.textContent = '等待播放';
			} else if (audio && !audio.paused) {
				musicCurrentStatus.textContent = '播放中';
			} else {
				musicCurrentStatus.textContent = '已暂停';
			}
		}

		if (playBtn) playBtn.disabled = state.filteredSongs.length === 0;
		if (pauseBtn) pauseBtn.disabled = !currentSong || !!audio.paused;
		if (prevBtn) prevBtn.disabled = state.filteredSongs.length === 0;
		if (nextBtn) nextBtn.disabled = state.filteredSongs.length === 0;
	}

	function updateProgress() {
		if (!audio) return;
		if (musicCurrentTime) musicCurrentTime.textContent = formatTime(audio.currentTime);
		if (musicDuration) musicDuration.textContent = formatTime(audio.duration);
		if (musicProgressBar) {
			const duration = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : 0;
			const percent = duration > 0 ? (audio.currentTime / duration) * 100 : 0;
			musicProgressBar.style.width = `${Math.min(100, Math.max(0, percent))}%`;
		}
	}

	function updateModeButtons() {
		modeButtons.forEach(button => {
			const active = button.getAttribute('data-music-mode') === state.mode;
			button.classList.toggle('active', active);
			button.setAttribute('aria-pressed', String(active));
		});
		if (audio) {
			audio.loop = state.mode === 'single';
		}
	}

	function renderMusicList() {
		if (!musicList) return;
		musicList.innerHTML = '';

		if (!state.filteredSongs.length) {
			const query = normalizeText(musicSearchInput && musicSearchInput.value);
			if (!state.songs.length) {
				setEmptyState('暂无音乐数据，请稍后再试', true);
			} else if (query) {
				setEmptyState(`没有找到匹配“${query}”的歌曲`, true);
			} else {
				setEmptyState('暂无可展示的歌曲', true);
			}
			updateCounts();
			updatePlayerHeader();
			return;
		}

		setEmptyState('', false);
		state.filteredSongs.forEach((song, index) => {
			const card = document.createElement('button');
			card.type = 'button';
			card.className = 'music-song-card' + (song.id === state.currentSongId ? ' active' : '');
			card.innerHTML = `
				<div class="music-song-top">
					<div class="music-song-index">${String(index + 1).padStart(2, '0')}</div>
					<div class="music-song-body">
						<div class="music-song-title">${escapeHtml(song.title)}</div>
						<div class="music-song-author">作者：${escapeHtml(song.author)}</div>
					</div>
				</div>
				<div class="music-song-badge-row">
					<span class="music-song-tag">类型：${escapeHtml(song.type)}</span>
					<span class="music-song-play">${song.id === state.currentSongId && audio && !audio.paused ? '播放中' : '播放'}</span>
				</div>
			`;
			card.addEventListener('click', function() {
				playSongById(song.id);
			});
			musicList.appendChild(card);
		});

		updateCounts();
		updatePlayerHeader();
	}

	function escapeHtml(text) {
		return String(text || '').replace(/[&<>"]/g, function(character) {
			return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[character];
		});
	}

	function filterSongs() {
		const query = normalizeText(musicSearchInput && musicSearchInput.value).toLowerCase();
		if (!query) {
			state.filteredSongs = state.songs.slice();
		} else {
			state.filteredSongs = state.songs.filter(song => song.title.toLowerCase().includes(query));
		}
		renderMusicList();
	}

	function playSongById(songId) {
		const song = state.songs.find(item => item.id === songId);
		if (!song) return;
		if (!song.url) {
			alert('该歌曲暂无播放地址');
			return;
		}
		if (!audio) return;

		state.currentSongId = song.id;
		audio.src = song.url;
		audio.dataset.songId = song.id;
		audio.loop = state.mode === 'single';
		audio.currentTime = 0;
		updatePlayerHeader();
		renderMusicList();

		audio.play().catch(function(error) {
			console.error('播放失败:', error);
			alert('当前歌曲播放失败，请检查歌曲地址');
		});
	}

	function playSelectedOrFirst() {
		if (!state.filteredSongs.length) return;
		const currentSong = getCurrentSong();
		if (!currentSong) {
			playSongById(state.filteredSongs[0].id);
			return;
		}
		if (!audio || audio.dataset.songId !== currentSong.id) {
			playSongById(currentSong.id);
			return;
		}
		audio.play().catch(function(error) {
			console.error('恢复播放失败:', error);
			alert('当前歌曲播放失败，请检查歌曲地址');
		});
	}

	function pauseCurrentSong() {
		if (!audio || audio.paused) return;
		audio.pause();
		updatePlayerHeader();
	}

	function getRandomIndex() {
		if (!state.filteredSongs.length) return -1;
		if (state.filteredSongs.length === 1) return 0;
		const currentIndex = getFilteredCurrentIndex();
		let nextIndex = Math.floor(Math.random() * state.filteredSongs.length);
		if (nextIndex === currentIndex) {
			nextIndex = (nextIndex + 1) % state.filteredSongs.length;
		}
		return nextIndex;
	}

	function getSequentialIndex(step) {
		if (!state.filteredSongs.length) return -1;
		const currentIndex = getFilteredCurrentIndex();
		if (currentIndex < 0) {
			return step > 0 ? 0 : state.filteredSongs.length - 1;
		}
		return (currentIndex + step + state.filteredSongs.length) % state.filteredSongs.length;
	}

	function playNextSong() {
		if (!state.filteredSongs.length) return;
		const nextIndex = state.mode === 'random' ? getRandomIndex() : getSequentialIndex(1);
		if (nextIndex < 0) return;
		playSongById(state.filteredSongs[nextIndex].id);
	}

	function playPreviousSong() {
		if (!state.filteredSongs.length) return;
		const nextIndex = state.mode === 'random' ? getRandomIndex() : getSequentialIndex(-1);
		if (nextIndex < 0) return;
		playSongById(state.filteredSongs[nextIndex].id);
	}

	function handleEnded() {
		if (!state.filteredSongs.length) return;
		if (state.mode === 'single') return;
		if (state.mode === 'random') {
			const randomIndex = getRandomIndex();
			if (randomIndex >= 0) playSongById(state.filteredSongs[randomIndex].id);
			return;
		}
		const nextIndex = getSequentialIndex(1);
		if (nextIndex >= 0) playSongById(state.filteredSongs[nextIndex].id);
	}

	function loadMusicLibrary() {
		if (state.isLoaded) return;
		state.isLoaded = true;
		setEmptyState('正在加载音乐列表...', true);
		axios.get('/music/all').then(function(res) {
			if (res.data && res.data.code === 200 && Array.isArray(res.data.data)) {
				state.songs = res.data.data.map(normalizeSong);
				state.filteredSongs = state.songs.slice();
				updateCounts();
				renderMusicList();
				updateModeButtons();
				updatePlayerHeader();
			} else {
				state.songs = [];
				state.filteredSongs = [];
				setEmptyState('暂无音乐数据，请稍后再试', true);
				updateCounts();
				renderMusicList();
			}
		}).catch(function(error) {
			console.error('加载音乐列表失败:', error);
			state.songs = [];
			state.filteredSongs = [];
			setEmptyState('音乐列表加载失败，请稍后重试', true);
			updateCounts();
			renderMusicList();
		});
	}

	function initMusicPage() {
		if (!musicPage || musicPage.dataset.initialized === 'true') return;
		musicPage.dataset.initialized = 'true';

		if (musicSearchInput) {
			musicSearchInput.addEventListener('input', filterSongs);
		}

		if (musicClearSearchBtn) {
			musicClearSearchBtn.addEventListener('click', function() {
				if (musicSearchInput) musicSearchInput.value = '';
				filterSongs();
				if (musicSearchInput) musicSearchInput.focus();
			});
		}

		if (playBtn) {
			playBtn.addEventListener('click', playSelectedOrFirst);
		}

		if (pauseBtn) {
			pauseBtn.addEventListener('click', pauseCurrentSong);
		}

		if (prevBtn) {
			prevBtn.addEventListener('click', playPreviousSong);
		}

		if (nextBtn) {
			nextBtn.addEventListener('click', playNextSong);
		}

		modeButtons.forEach(function(button) {
			button.addEventListener('click', function() {
				state.mode = button.getAttribute('data-music-mode') || 'list';
				updateModeButtons();
			});
		});

		if (audio) {
			audio.addEventListener('timeupdate', updateProgress);
			audio.addEventListener('loadedmetadata', updateProgress);
			audio.addEventListener('play', function() {
				updatePlayerHeader();
			});
			audio.addEventListener('pause', function() {
				updatePlayerHeader();
			});
			audio.addEventListener('ended', handleEnded);
			audio.addEventListener('error', function() {
				updatePlayerHeader();
			});
		}

		updateModeButtons();
		updateCounts();
		updatePlayerHeader();
		loadMusicLibrary();
	}

	document.addEventListener('DOMContentLoaded', initMusicPage);
	if (document.readyState !== 'loading') {
		initMusicPage();
	}
})();