// moodWidget.js - 浮动心情日记面板

(function() {
    const moodBubble = document.getElementById('moodBubble');
    const moodWidget = document.getElementById('moodWidget');
    const closeMoodWidgetBtn = document.getElementById('closeMoodWidgetBtn');
    const moodRefreshBtn = document.getElementById('moodRefreshBtn');
    const moodForm = document.getElementById('moodForm');
    const moodDiaryTitle = document.getElementById('moodDiaryTitle');
    const moodDiaryContent = document.getElementById('moodDiaryContent');
    const moodSelector = document.getElementById('moodSelector');
    const weatherSelector = document.getElementById('weatherSelector');
    const moodSubmitBtn = document.getElementById('moodSubmitBtn');
    const moodStatus = document.getElementById('moodStatus');
    const moodList = document.getElementById('moodList');
    const moodEmptyState = document.getElementById('moodEmptyState');
    const moodCount = document.getElementById('moodCount');

    const moodOptions = [
        { value: '', label: '不选择', emoji: '🌿' },
        { value: 'happy', label: '开心', emoji: '😊' },
        { value: 'peaceful', label: '平静', emoji: '😌' },
        { value: 'worried', label: '担忧', emoji: '😟' },
        { value: 'sad', label: '难过', emoji: '😢' },
        { value: 'angry', label: '生气', emoji: '😠' },
        { value: 'anxious', label: '焦虑', emoji: '😰' }
    ];

    const weatherOptions = [
        { value: '', label: '不选择', emoji: '🌤️' },
        { value: 'sunny', label: '晴天', emoji: '☀️' },
        { value: 'cloudy', label: '多云', emoji: '⛅' },
        { value: 'rainy', label: '雨天', emoji: '🌧️' },
        { value: 'snowy', label: '雪天', emoji: '❄️' },
        { value: 'windy', label: '大风', emoji: '💨' }
    ];

    let currentUserId = '';
    let selectedMood = '';
    let selectedWeather = '';

    function escapeHtml(value) {
        return String(value || '').replace(/[&<>"']/g, function(character) {
            return ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                '\'': '&#39;'
            })[character];
        });
    }

    function truncateText(text, maxLength) {
        const normalized = String(text || '');
        if (normalized.length <= maxLength) {
            return normalized;
        }
        if (maxLength <= 3) {
            return '...';
        }
        return normalized.slice(0, maxLength - 3) + '...';
    }

    function formatDate(dateValue) {
        if (!dateValue) {
            return '';
        }
        const date = new Date(dateValue);
        if (Number.isNaN(date.getTime())) {
            return String(dateValue);
        }
        return date.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    }

    function getOptionMeta(options, value) {
        return options.find(function(option) {
            return option.value === value;
        }) || null;
    }

    function getMoodLabel(value) {
        const meta = getOptionMeta(moodOptions, value);
        return meta ? meta.label : '';
    }

    function getMoodEmoji(value) {
        const meta = getOptionMeta(moodOptions, value);
        return meta ? meta.emoji : '';
    }

    function getWeatherLabel(value) {
        const meta = getOptionMeta(weatherOptions, value);
        return meta ? meta.label : '';
    }

    function getWeatherEmoji(value) {
        const meta = getOptionMeta(weatherOptions, value);
        return meta ? meta.emoji : '';
    }

    function setStatus(message, isError) {
        if (!moodStatus) return;
        moodStatus.textContent = message || '';
        moodStatus.dataset.state = isError ? 'error' : 'info';
    }

    function ensureUserId() {
        if (currentUserId) {
            return currentUserId;
        }
        const storedUserId = localStorage.getItem('user_id');
        if (storedUserId) {
            currentUserId = storedUserId;
            return currentUserId;
        }
        const rawUser = localStorage.getItem('user');
        if (!rawUser) {
            return '';
        }
        try {
            const parsedUser = JSON.parse(rawUser) || {};
            currentUserId = String(parsedUser.user_id || parsedUser.userId || parsedUser.id || '');
        } catch (error) {
            currentUserId = '';
        }
        return currentUserId;
    }

    function renderChoiceGroup(container, options, selectedValue, onSelect, kind) {
        if (!container) return;
        container.innerHTML = '';
        options.forEach(function(option) {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = kind === 'mood'
                ? 'mood-option' + (selectedValue === option.value ? ' selected' : '')
                : 'weather-option' + (selectedValue === option.value ? ' selected' : '');
            button.innerHTML =
                '<span class="' + kind + '-option-emoji">' + escapeHtml(option.emoji) + '</span>' +
                '<span class="' + kind + '-option-label">' + escapeHtml(option.label) + '</span>';
            button.addEventListener('click', function() {
                onSelect(option.value);
            });
            container.appendChild(button);
        });
    }

    function refreshSelectors() {
        renderChoiceGroup(moodSelector, moodOptions, selectedMood, function(value) {
            selectedMood = value;
            refreshSelectors();
        }, 'mood');

        renderChoiceGroup(weatherSelector, weatherOptions, selectedWeather, function(value) {
            selectedWeather = value;
            refreshSelectors();
        }, 'weather');
    }

    function updateMoodCount(count) {
        if (moodCount) {
            moodCount.textContent = String(count || 0) + ' 篇';
        }
    }

    function renderMoodList(list) {
        if (!moodList) return;
        const diaries = Array.isArray(list) ? list : [];
        moodList.innerHTML = '';
        updateMoodCount(diaries.length);

        if (moodEmptyState) {
            moodEmptyState.style.display = diaries.length ? 'none' : 'block';
        }

        diaries.forEach(function(item) {
            const card = document.createElement('article');
            card.className = 'mood-entry-card';

            const title = item && item.title ? item.title : '心情日记';
            const content = item && item.content ? item.content : '';
            const moodLabel = item && item.mood ? getMoodLabel(item.mood) : '';
            const moodEmoji = item && item.mood ? getMoodEmoji(item.mood) : '';
            const weatherLabel = item && item.weather ? getWeatherLabel(item.weather) : '';
            const weatherEmoji = item && item.weather ? getWeatherEmoji(item.weather) : '';
            const createdTime = item && item.create_time ? formatDate(item.create_time) : '';

            card.innerHTML =
                '<button type="button" class="mood-entry-delete" data-id="' + escapeHtml(item.id) + '">删除</button>' +
                '<div class="mood-entry-title">' + escapeHtml(truncateText(title, 60)) + '</div>' +
                '<div class="mood-entry-content">' + escapeHtml(truncateText(content, 180)) + '</div>' +
                '<div class="mood-entry-meta">' +
                    (moodLabel ? '<span class="mood-tag">' + escapeHtml(moodEmoji ? moodEmoji + ' ' : '') + escapeHtml(moodLabel) + '</span>' : '') +
                    (weatherLabel ? '<span class="mood-tag">' + escapeHtml(weatherEmoji ? weatherEmoji + ' ' : '') + escapeHtml(weatherLabel) + '</span>' : '') +
                    '<span class="mood-entry-date">' + escapeHtml(createdTime) + '</span>' +
                '</div>';

            moodList.appendChild(card);
        });
    }

    function loadMoodList() {
        const userId = ensureUserId();
        if (!userId) {
            renderMoodList([]);
            setStatus('未获取到用户信息，请重新登录', true);
            return Promise.resolve([]);
        }

        setStatus('正在加载日记...', false);
        return axios.get('/diary/list', {
            params: {
                user_id: userId
            }
        }).then(function(res) {
            const list = res && res.data && res.data.code === 200 && Array.isArray(res.data.data) ? res.data.data : [];
            renderMoodList(list);
            setStatus(list.length ? '已加载最新日记' : '还没有日记，先写一篇吧');
            return list;
        }).catch(function() {
            renderMoodList([]);
            setStatus('加载日记失败，请稍后重试', true);
            return [];
        });
    }

    function deleteMoodDiary(id) {
        const userId = ensureUserId();
        if (!userId) {
            setStatus('未获取到用户信息，请重新登录', true);
            return;
        }
        if (!window.confirm('确定删除这条日记吗？')) {
            return;
        }

        setStatus('正在删除日记...', false);
        axios.post('/diary/delete', null, {
            params: {
                id: id,
                user_id: userId
            }
        }).then(function(res) {
            if (res && res.data && res.data.code === 200) {
                setStatus('日记已删除');
                loadMoodList();
                return;
            }
            setStatus((res && res.data && res.data.msg) || '删除失败', true);
        }).catch(function() {
            setStatus('删除失败，请稍后重试', true);
        });
    }

    function handleSubmit(event) {
        event.preventDefault();

        const userId = ensureUserId();
        if (!userId) {
            setStatus('未获取到用户信息，请重新登录', true);
            return;
        }

        const title = moodDiaryTitle ? moodDiaryTitle.value.trim() : '';
        const content = moodDiaryContent ? moodDiaryContent.value.trim() : '';
        if (!title || !content) {
            setStatus('请填写标题和内容', true);
            return;
        }

        if (moodSubmitBtn) {
            moodSubmitBtn.disabled = true;
        }
        setStatus('正在保存日记...', false);

        axios.post('/diary/add', {
            user_id: userId,
            title: title,
            content: content,
            mood: selectedMood,
            weather: selectedWeather
        }).then(function(res) {
            if (res && res.data && res.data.code === 200) {
                if (moodDiaryTitle) moodDiaryTitle.value = '';
                if (moodDiaryContent) moodDiaryContent.value = '';
                selectedMood = '';
                selectedWeather = '';
                refreshSelectors();
                setStatus('日记已保存');
                loadMoodList();
                return;
            }
            setStatus((res && res.data && res.data.msg) || '保存失败', true);
        }).catch(function() {
            setStatus('保存失败，请稍后重试', true);
        }).finally(function() {
            if (moodSubmitBtn) {
                moodSubmitBtn.disabled = false;
            }
        });
    }

    function isWidgetVisible() {
        return !!(moodWidget && moodWidget.style.display !== 'none' && moodWidget.style.display !== '');
    }

    function openMoodWidget() {
        if (!moodWidget) return;
        if (typeof window.closeTestWidget === 'function') {
            window.closeTestWidget();
        }
        if (typeof window.closeMusicWidget === 'function') {
            window.closeMusicWidget();
        }
        if (typeof window.closeHomeMessageWidget === 'function') {
            window.closeHomeMessageWidget();
        }
        if (typeof window.closeAiChatWidget === 'function') {
            window.closeAiChatWidget();
        }
        moodWidget.style.display = 'flex';
        document.body.classList.add('widget-modal-open');
        loadMoodList();
        if (moodDiaryTitle) {
            moodDiaryTitle.focus();
        }
    }

    function closeMoodWidget() {
        if (!moodWidget) return;
        moodWidget.style.display = 'none';
        document.body.classList.remove('widget-modal-open');
    }

    function toggleMoodWidget() {
        if (!moodWidget) return;
        if (isWidgetVisible()) {
            closeMoodWidget();
        } else {
            openMoodWidget();
        }
    }

    if (moodBubble) {
        moodBubble.addEventListener('click', toggleMoodWidget);
    }

    if (closeMoodWidgetBtn) {
        closeMoodWidgetBtn.addEventListener('click', closeMoodWidget);
    }

    if (moodRefreshBtn) {
        moodRefreshBtn.addEventListener('click', function() {
            loadMoodList();
        });
    }

    if (moodForm) {
        moodForm.addEventListener('submit', handleSubmit);
    }

    if (moodList) {
        moodList.addEventListener('click', function(event) {
            const deleteButton = event.target.closest('.mood-entry-delete');
            if (!deleteButton) return;
            const diaryId = deleteButton.getAttribute('data-id');
            if (!diaryId) return;
            deleteMoodDiary(diaryId);
        });
    }

    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape' && isWidgetVisible()) {
            closeMoodWidget();
        }
    });

    refreshSelectors();
    loadMoodList();

    window.openMoodWidget = openMoodWidget;
    window.closeMoodWidget = closeMoodWidget;
    window.toggleMoodWidget = toggleMoodWidget;
    window.loadMoodList = loadMoodList;
})();
