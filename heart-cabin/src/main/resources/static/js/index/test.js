// test.js - 心理测试页面脚本

(function() {
	const questionTitle = document.getElementById('testQuestionTitle');
	const questionCard = document.getElementById('testQuestionCard');
	const optionsWrap = document.getElementById('testOptions');
	const progressText = document.getElementById('testProgressText');
	const progressBar = document.getElementById('testProgressBar');
	const prevBtn = document.getElementById('testPrevBtn');
	const nextBtn = document.getElementById('testNextBtn');
	const navHint = document.getElementById('testNavHint');
	const resultCard = document.getElementById('testResultCard');
	const resultLevel = document.getElementById('testResultLevel');
	const resultAdvice = document.getElementById('testResultAdvice');
	const resultScore = document.getElementById('testResultScore');
	const aiAnalyzeBtn = document.getElementById('testAiAnalyzeBtn');
	const musicRecommendBtn = document.getElementById('testMusicRecommendBtn');
	const restartBtn = document.getElementById('testRestartBtn');
	const infoBtn = document.getElementById('testInfoBtn');
	const guideModal = document.getElementById('testGuideModal');
	const guideBackdrop = document.getElementById('testGuideBackdrop');
	const guideClose = document.getElementById('testGuideClose');
	const testContent = document.getElementById('test-content');
	const quizShell = document.querySelector('.test-quiz-shell');

	let questions = [];
	let answers = [];
	let currentIndex = 0;
	let lastResultScore = null;
	let userId = resolveUserId();
	let initialized = false;

	function resolveUserId() {
		const storedUserId = localStorage.getItem('user_id');
		if (storedUserId) return storedUserId;
		const storedUser = localStorage.getItem('user');
		if (!storedUser) return '';
		try {
			const parsedUser = JSON.parse(storedUser);
			return parsedUser.user_id || parsedUser.userId || (parsedUser.user && parsedUser.user.id) || parsedUser.id || '';
		} catch (error) {
			return '';
		}
	}

	function escapeHtml(str) {
		return String(str || '').replace(/[&<>"']/g, function (c) {
			return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&#39;' })[c];
		});
	}

	function readQuestionText(question, keys) {
		for (let i = 0; i < keys.length; i += 1) {
			const value = question[keys[i]];
			if (value != null && String(value).trim() !== '') {
				return String(value);
			}
		}
		return '';
	}

	function readQuestionScore(question, keys) {
		for (let i = 0; i < keys.length; i += 1) {
			const value = question[keys[i]];
			if (value != null && String(value).trim() !== '') {
				const score = Number(value);
				return Number.isNaN(score) ? null : score;
			}
		}
		return null;
	}

	function setVisible(state) {
		if (questionCard) questionCard.style.display = state ? 'flex' : 'none';
		if (resultCard) resultCard.style.display = state ? 'none' : 'flex';
		if (quizShell) quizShell.style.display = state ? 'flex' : 'none';
	}

	function updateProgress() {
		if (!questions.length) return;
		const total = questions.length;
		const current = currentIndex + 1;
		if (progressText) progressText.textContent = `第 ${current} / ${total} 题`;
		if (progressBar) progressBar.style.width = `${(current / total) * 100}%`;
		if (navHint) {
			if (currentIndex === total - 1) {
				navHint.textContent = '最后一题作答后将自动提交';
			} else {
				navHint.textContent = answers[currentIndex] != null ? '可以继续下一题' : '选择答案后继续下一题';
			}
		}
		if (prevBtn) prevBtn.disabled = currentIndex === 0;
		if (nextBtn) {
			nextBtn.style.display = currentIndex === total - 1 ? 'none' : 'inline-flex';
			nextBtn.textContent = '下一题';
		}
	}

	function buildOptionList(question) {
		return [
			{ key: 'A', text: readQuestionText(question, ['optionA', 'option_a', 'optiona', 'option1']), score: readQuestionScore(question, ['scoreA', 'score_a', 'scorea', 'score1']) },
			{ key: 'B', text: readQuestionText(question, ['optionB', 'option_b', 'optionb', 'option2']), score: readQuestionScore(question, ['scoreB', 'score_b', 'scoreb', 'score2']) },
			{ key: 'C', text: readQuestionText(question, ['optionC', 'option_c', 'optionc', 'option3']), score: readQuestionScore(question, ['scoreC', 'score_c', 'scorec', 'score3']) },
			{ key: 'D', text: readQuestionText(question, ['optionD', 'option_d', 'optiond', 'option4']), score: readQuestionScore(question, ['scoreD', 'score_d', 'scored', 'score4']) }
		].filter(option => option.text !== '');
	}

	function renderOptions() {
		if (!optionsWrap) return;
		const currentQuestion = questions[currentIndex] || {};
		const optionList = buildOptionList(currentQuestion);
		optionsWrap.innerHTML = '';
		optionList.forEach(option => {
			const optionScore = option.score != null ? Number(option.score) : null;
			const button = document.createElement('button');
			button.type = 'button';
			button.className = 'test-option' + (answers[currentIndex] === optionScore ? ' selected' : '');
			button.innerHTML = `
				<span class="test-option-index">${option.key}</span>
				<span class="test-option-copy">
					<strong>${escapeHtml(option.text)}</strong>
				</span>
			`;
			button.onclick = function() {
				answers[currentIndex] = optionScore;
				if (currentIndex === questions.length - 1) {
					submitTest();
					return;
				}
				currentIndex += 1;
				renderCurrentQuestion();
			};
			if (optionScore == null) {
				button.disabled = true;
			}
			optionsWrap.appendChild(button);
		});
		if (!optionList.length) {
			const emptyState = document.createElement('div');
			emptyState.className = 'test-empty-options';
			emptyState.textContent = '当前题目未配置选项';
			optionsWrap.appendChild(emptyState);
		}
	}

	function renderCurrentQuestion() {
		if (!questions.length || !questionTitle) return;
		const currentQuestion = questions[currentIndex];
		questionTitle.textContent = currentQuestion.question || '题目加载中';
		renderOptions();
		updateProgress();
	}

	function showLoading(message) {
		if (questionTitle) questionTitle.textContent = message || '正在加载题目...';
		if (optionsWrap) optionsWrap.innerHTML = '';
		if (progressText) progressText.textContent = '第 0 / 0 题';
		if (progressBar) progressBar.style.width = '0%';
	}

	function loadQuestions() {
		showLoading('正在加载题目...');
		axios.get('/test/questions').then(res => {
			if (res.data && res.data.code === 200 && Array.isArray(res.data.data) && res.data.data.length) {
				questions = res.data.data;
				answers = new Array(questions.length).fill(null);
				currentIndex = 0;
				setVisible(true);
				renderCurrentQuestion();
			} else {
				showLoading('暂无测试题目');
			}
		}).catch(error => {
			console.error('加载测试题失败:', error);
			showLoading('题目加载失败，请稍后重试');
		});
	}

	function goNext() {
		if (!questions.length) return;
		if (answers[currentIndex] == null) {
			alert('请先选择一个答案');
			return;
		}
		if (currentIndex === questions.length - 1) {
			return;
		}
		currentIndex += 1;
		renderCurrentQuestion();
	}

	function goPrev() {
		if (!questions.length || currentIndex === 0) return;
		currentIndex -= 1;
		renderCurrentQuestion();
	}

	function submitTest() {
		if (!userId) {
			alert('未获取到用户信息，请重新登录');
			return;
		}
		if (answers.some(answer => answer == null)) {
			alert('还有题目未作答，请补全后再提交');
			return;
		}
		if (nextBtn) nextBtn.disabled = true;
		if (prevBtn) prevBtn.disabled = true;
		if (navHint) navHint.textContent = '正在提交测评...';

		axios.post(`/test/submit?userId=${encodeURIComponent(userId)}`, answers).then(res => {
			if (res.data && res.data.code === 200 && res.data.data) {
				showResult(res.data.data);
			} else {
				alert(res.data.msg || '提交失败');
			}
		}).catch(error => {
			console.error('提交测试失败:', error);
			alert('提交失败，请稍后重试');
		}).finally(() => {
			if (nextBtn) nextBtn.disabled = false;
			if (prevBtn) prevBtn.disabled = false;
			updateProgress();
		});
	}

	function showResult(data) {
		if (testContent) testContent.classList.add('test-result-mode');
		setVisible(false);
		if (resultCard) resultCard.style.display = 'flex';
		if (aiAnalyzeBtn) aiAnalyzeBtn.disabled = false;
		if (musicRecommendBtn) musicRecommendBtn.disabled = false;
		lastResultScore = Number(data.score != null ? data.score : 0);
		if (resultScore) resultScore.textContent = data.score != null ? data.score : '0';
		if (resultLevel) resultLevel.textContent = data.level || '测评完成';
		if (resultAdvice) resultAdvice.textContent = data.advice || '已完成测评';
		if (testContent) {
			const top = testContent.getBoundingClientRect().top + window.scrollY - 24;
			window.scrollTo({ top: Math.max(0, top), left: 0, behavior: 'smooth' });
		}
	}

	function restartTest() {
		answers = new Array(questions.length).fill(null);
		currentIndex = 0;
		lastResultScore = null;
		if (testContent) testContent.classList.remove('test-result-mode');
		if (resultCard) resultCard.style.display = 'none';
		if (musicRecommendBtn) musicRecommendBtn.disabled = true;
		setVisible(true);
		renderCurrentQuestion();
	}

	function getSelectedOption(question, answerScore) {
		const optionList = buildOptionList(question);
		return optionList.find(option => option.score === answerScore) || null;
	}

	function buildAnalysisPrompt() {
		const lines = questions.map((question, index) => {
			const selectedOption = getSelectedOption(question, answers[index]);
			const questionText = question.question || `第 ${index + 1} 题`;
			const optionText = selectedOption ? `${selectedOption.key}. ${selectedOption.text}` : '未选择';
			return `${index + 1}. 题目：${questionText}\n   用户选择：${optionText}`;
		}).join('\n');

		return [
			'请基于下面的心理测评作答，为用户做一段简洁、温和、具体的 AI 分析。',
			'请重点说明可能的心理状态、需要注意的方面，以及可执行的建议。',
			'不要机械重复题目，尽量给出有温度的反馈。',
			'',
			'测评题目与作答：',
			lines
		].join('\n');
	}

	function openAiAnalysisChat() {
		if (!questions.length || !answers.length) return;
		if (answers.some(answer => answer == null)) {
			alert('测评还未完成，暂时不能进行 AI 分析');
			return;
		}
		const chatLink = Array.from(document.querySelectorAll('.sidebar-menu a')).find(link => link.textContent.trim() === 'AI 聊天');
		if (!chatLink || typeof showPage !== 'function') {
			alert('无法打开 AI 聊天页面');
			return;
		}
		const analysisPrompt = buildAnalysisPrompt();
		showPage('chat', chatLink);
		if (typeof chatInput !== 'undefined') {
			chatInput.value = analysisPrompt;
		}
		if (typeof sendMessage === 'function') {
			sendMessage();
		}
	}

	function openMusicRecommendation() {
		if (lastResultScore == null) {
			alert('暂无可用的测评结果');
			return;
		}
		const musicLink = Array.from(document.querySelectorAll('.sidebar-menu a')).find(link => link.textContent.trim() === '治愈音乐');
		if (!musicLink || typeof showPage !== 'function') {
			alert('无法打开治愈音乐页面');
			return;
		}
		localStorage.setItem('music_recommend_score', String(lastResultScore));
		showPage('music', musicLink);
		if (typeof window.playMusicRecommendation === 'function') {
			window.playMusicRecommendation(lastResultScore);
		}
	}

	function openGuideModal() {
		if (guideModal) guideModal.style.display = 'flex';
	}

	function closeGuideModal() {
		if (guideModal) guideModal.style.display = 'none';
	}

	function bindGuideModal() {
		if (infoBtn) infoBtn.onclick = openGuideModal;
		if (guideBackdrop) guideBackdrop.onclick = closeGuideModal;
		if (guideClose) guideClose.onclick = closeGuideModal;
		window.addEventListener('keydown', function(event) {
			if (event.key === 'Escape') {
				closeGuideModal();
			}
		});
	}

	function init() {
		if (initialized) return;
		initialized = true;
		userId = resolveUserId();
		if (prevBtn) prevBtn.onclick = goPrev;
		if (nextBtn) nextBtn.onclick = goNext;
		if (aiAnalyzeBtn) aiAnalyzeBtn.onclick = openAiAnalysisChat;
		if (musicRecommendBtn) musicRecommendBtn.onclick = openMusicRecommendation;
		if (musicRecommendBtn) musicRecommendBtn.disabled = true;
		if (restartBtn) restartBtn.onclick = restartTest;
		bindGuideModal();
		loadQuestions();
	}

	window.addEventListener('DOMContentLoaded', init);
	if (document.readyState !== 'loading') {
		init();
	}
})();