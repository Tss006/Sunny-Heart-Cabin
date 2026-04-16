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
	const musicProgressThumb = document.getElementById('musicProgressThumb');
	const musicProgressTrack = document.getElementById('musicProgressTrack');
	const musicCurrentTime = document.getElementById('musicCurrentTime');
	const musicDuration = document.getElementById('musicDuration');
	const prevBtn = document.getElementById('musicPrevBtn');
	const playToggleBtn = document.getElementById('musicPlayToggleBtn');
	const playToggleIcon = document.getElementById('musicPlayToggleIcon');
	const playToggleText = document.getElementById('musicPlayToggleText');
	const nextBtn = document.getElementById('musicNextBtn');
	const modeBtn = document.getElementById('musicModeBtn');
	const modeIcon = document.getElementById('musicModeIcon');
	const modeText = document.getElementById('musicModeText');
	const audio = document.getElementById('musicAudio');

	const MODE_SEQUENCE = ['list', 'single', 'random'];
	const MODE_META = {
		list: { label: '列表循环', icon: 'icons/music-loop-list.svg' },
		single: { label: '单曲循环', icon: 'icons/music-loop-single.svg' },
		random: { label: '随机播放', icon: 'icons/music-random.svg' }
	};
	const PLAY_META = {
		play: { label: '播放', icon: 'icons/music-fast-forward.svg' },
		pause: { label: '暂停', icon: 'icons/music-pause.svg' }
	};
	const RECOMMENDATION_SCORE_KEY = 'music_recommend_score';

	const state = {
		songs: [],
		filteredSongs: [],
		currentSongId: '',
		mode: 'list',
		isLoaded: false,
		isSeeking: false,
		activePointerId: null,
		pendingRecommendationScore: null,
		recommendationPlayed: false
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

	function getMusicTypeByScore(score) {
		if (score <= 25) return 'relax';
		if (score <= 40) return 'light';
		if (score <= 55) return 'relieve';
		return 'calm';
	}

	function normalizeSong(song, index) {
		const title = normalizeText(song.title || song.name || song.songName || song.music_name);
		const author = normalizeText(song.author || song.artist || song.singer || song.creator);
		const type = normalizeText(song.type);
		const url = normalizeText(song.url || song.musicUrl || song.music_url || song.path || song.filePath);
		return {
			id: String(song.id != null ? song.id : `music-${index}`),
			title: title || '未命名歌曲',
			author: author || '未知作者',
			type: type || '未知类型',
			url: url
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
		const isPlaying = !!(currentSong && audio && !audio.paused);
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

		if (prevBtn) prevBtn.disabled = state.filteredSongs.length === 0;
		if (nextBtn) nextBtn.disabled = state.filteredSongs.length === 0;
		if (playToggleBtn) playToggleBtn.disabled = state.filteredSongs.length === 0;
		if (playToggleIcon) playToggleIcon.src = isPlaying ? PLAY_META.pause.icon : PLAY_META.play.icon;
		if (playToggleText) playToggleText.textContent = isPlaying ? PLAY_META.pause.label : PLAY_META.play.label;
		if (playToggleBtn) playToggleBtn.title = isPlaying ? PLAY_META.pause.label : PLAY_META.play.label;
		if (musicProgressTrack) musicProgressTrack.setAttribute('aria-valuenow', String(Math.round(getProgressPercent())));
	}

	function updateProgress() {
		if (!audio) return;
		if (musicCurrentTime) musicCurrentTime.textContent = formatTime(audio.currentTime);
		if (musicDuration) musicDuration.textContent = formatTime(audio.duration);
		const percent = getProgressPercent();
		if (musicProgressBar) musicProgressBar.style.width = `${percent}%`;
		if (musicProgressThumb) musicProgressThumb.style.left = `${percent}%`;
		if (musicProgressTrack) musicProgressTrack.setAttribute('aria-valuenow', String(Math.round(percent)));
	}

	function updateModeButtons() {
		const meta = MODE_META[state.mode] || MODE_META.list;
		if (modeIcon) modeIcon.src = meta.icon;
		if (modeText) modeText.textContent = meta.label;
		if (modeBtn) {
			modeBtn.title = meta.label;
			modeBtn.setAttribute('aria-label', `切换播放模式，当前：${meta.label}`);
		}
		if (audio) {
			audio.loop = state.mode === 'single';
		}
	}

	function getRecommendationScore() {
		if (state.pendingRecommendationScore != null && !Number.isNaN(Number(state.pendingRecommendationScore))) {
			return Number(state.pendingRecommendationScore);
		}
		const storedScore = localStorage.getItem(RECOMMENDATION_SCORE_KEY);
		if (storedScore == null || storedScore === '') return null;
		const parsedScore = Number(storedScore);
		if (Number.isNaN(parsedScore)) return null;
		state.pendingRecommendationScore = parsedScore;
		return parsedScore;
	}

	function consumeRecommendationScore() {
		localStorage.removeItem(RECOMMENDATION_SCORE_KEY);
		state.pendingRecommendationScore = null;
		state.recommendationPlayed = true;
	}

	function playRecommendedSongIfNeeded() {
		if (state.recommendationPlayed) return;
		const score = getRecommendationScore();
		if (score == null || !state.songs.length) return;
		const recommendedType = getMusicTypeByScore(score);
		let candidates = state.songs.filter(song => normalizeText(song.type).toLowerCase() === recommendedType);
		if (!candidates.length) {
			candidates = state.songs.slice();
		}
		if (!candidates.length) return;
		const pickedSong = candidates[Math.floor(Math.random() * candidates.length)];
		consumeRecommendationScore();
		playSongById(pickedSong.id);
	}

	function getProgressPercent() {
		if (!audio || !Number.isFinite(audio.duration) || audio.duration <= 0) return 0;
		return Math.min(100, Math.max(0, (audio.currentTime / audio.duration) * 100));
	}

	function seekByClientX(clientX) {
		if (!audio || !musicProgressTrack || !Number.isFinite(audio.duration) || audio.duration <= 0) return;
		const rect = musicProgressTrack.getBoundingClientRect();
		if (!rect.width) return;
		const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
		audio.currentTime = ratio * audio.duration;
		updateProgress();
	}

	function startSeeking(event) {
		if (!audio || !musicProgressTrack || !Number.isFinite(audio.duration) || audio.duration <= 0) return;
		state.isSeeking = true;
		state.activePointerId = event.pointerId;
		musicProgressTrack.setPointerCapture(event.pointerId);
		seekByClientX(event.clientX);
	}

	function moveSeeking(event) {
		if (!state.isSeeking) return;
		seekByClientX(event.clientX);
	}

	function endSeeking(event) {
		if (!state.isSeeking) return;
		state.isSeeking = false;
		if (musicProgressTrack && state.activePointerId != null) {
			try {
				musicProgressTrack.releasePointerCapture(state.activePointerId);
			} catch (error) {
				// ignore pointer capture errors
			}
		}
		state.activePointerId = null;
		if (event && typeof event.clientX === 'number') {
			seekByClientX(event.clientX);
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

		Promise.resolve(audio.play()).then(function() {
			if (typeof window.incrementUserStat === 'function') {
				window.incrementUserStat('music_num');
			}
		}).catch(function(error) {
			console.error('播放失败:', error);
			alert('当前歌曲播放失败，请检查歌曲地址');
		});
	}

	function togglePlayback() {
		if (!state.filteredSongs.length) return;
		const currentSong = getCurrentSong();
		if (!currentSong) {
			playSongById(state.filteredSongs[0].id);
			return;
		}
		if (!audio) return;
		if (audio.paused) {
			if (!audio.src || audio.dataset.songId !== currentSong.id) {
				playSongById(currentSong.id);
				return;
			}
			audio.play().catch(function(error) {
				console.error('恢复播放失败:', error);
				alert('当前歌曲播放失败，请检查歌曲地址');
			});
			return;
		}
		audio.pause();
		updatePlayerHeader();
	}

	function cyclePlayMode() {
		const currentIndex = MODE_SEQUENCE.indexOf(state.mode);
		const nextIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % MODE_SEQUENCE.length;
		state.mode = MODE_SEQUENCE[nextIndex];
		updateModeButtons();
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
				playRecommendedSongIfNeeded();
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

	window.playMusicRecommendation = function(score) {
		const parsedScore = Number(score);
		if (Number.isNaN(parsedScore)) return;
		state.pendingRecommendationScore = parsedScore;
		state.recommendationPlayed = false;
		localStorage.setItem(RECOMMENDATION_SCORE_KEY, String(parsedScore));
		if (state.isLoaded) {
			playRecommendedSongIfNeeded();
		}
	};

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

		if (playToggleBtn) {
			playToggleBtn.addEventListener('click', togglePlayback);
		}

		if (prevBtn) {
			prevBtn.addEventListener('click', playPreviousSong);
		}

		if (nextBtn) {
			nextBtn.addEventListener('click', playNextSong);
		}

		if (modeBtn) {
			modeBtn.addEventListener('click', cyclePlayMode);
		}

		if (musicProgressTrack) {
			musicProgressTrack.addEventListener('pointerdown', startSeeking);
			musicProgressTrack.addEventListener('pointermove', moveSeeking);
			musicProgressTrack.addEventListener('pointerup', endSeeking);
			musicProgressTrack.addEventListener('pointercancel', endSeeking);
			musicProgressTrack.addEventListener('lostpointercapture', endSeeking);
		}

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