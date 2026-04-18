// chat.js - 悬浮 AI 聊天模块

const chatInput = document.getElementById('chatInput');
const sendChatBtn = document.getElementById('sendChatBtn');
const chatHistory = document.getElementById('chatHistory');
const chatSessionList = document.getElementById('chatSessionList');
const chatTitle = document.getElementById('chatTitle');
const newChatBtn = document.getElementById('newChatBtn');
const aiChatBubble = document.getElementById('aiChatBubble');
const aiChatWidget = document.getElementById('aiChatWidget');
const closeAiChatBtn = document.getElementById('closeAiChatBtn');

let user_id = localStorage.getItem('user_id') || '';
let chat_id = null;
let hasInitialized = false;

function ensureUserId() {
    if (user_id) return user_id;
    const raw = localStorage.getItem('user');
    if (!raw) return '';
    try {
        const parsed = JSON.parse(raw) || {};
        user_id = parsed.user_id || parsed.userId || parsed.id || '';
    } catch (error) {
        user_id = '';
    }
    return user_id;
}

function generateChatId() {
    return 'cid_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 8);
}

function escapeHtml(str) {
    return String(str || '').replace(/[&<>"']/g, function(c) {
        return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&#39;' })[c];
    });
}

function scrollToBottom() {
    if (!chatHistory) return;
    chatHistory.scrollTop = chatHistory.scrollHeight;
}

function appendMessage(role, content) {
    if (!chatHistory) return;
    const msgDiv = document.createElement('div');
    msgDiv.className = 'chat-message' + (role === 'user' ? ' user' : '');
    msgDiv.innerHTML =
        '<div class="avatar">' + (role === 'user' ? '🧑' : '🤖') + '</div>' +
        '<div class="bubble">' + escapeHtml(content) + '</div>';
    chatHistory.appendChild(msgDiv);
}

function aiGreet() {
    if (!chatHistory) return;
    chatHistory.innerHTML = '';
    appendMessage('ai', '你好！我是心晴小屋AI心理师，有什么可以帮您？');
    scrollToBottom();
}

function collectHistoryText() {
    if (!chatHistory) return '';
    const messages = chatHistory.querySelectorAll('.chat-message');
    let text = '';
    messages.forEach(function(msg) {
        const isUser = msg.classList.contains('user');
        const content = msg.querySelector('.bubble') ? msg.querySelector('.bubble').innerText : '';
        text += (isUser ? '用户：' : 'AI：') + content + '\n';
    });
    return text.trim();
}

function hasMeaningfulHistory() {
    const historyText = collectHistoryText();
    const greetText = 'AI：你好！我是心晴小屋AI心理师，有什么可以帮您？';
    return !!historyText && historyText.trim() !== greetText;
}

function setActiveSession(chatIdStr) {
    if (!chatSessionList) return;
    const items = chatSessionList.querySelectorAll('li');
    items.forEach(function(li) {
        li.classList.toggle('active', String(li.getAttribute('data-chatid')) === String(chatIdStr));
    });
}

function ensureSessionItem(summary, chatIdVal) {
    if (!chatSessionList) return;
    const chatIdStr = String(chatIdVal);
    const existing = chatSessionList.querySelector('li[data-chatid="' + chatIdStr + '"]');
    if (existing) {
        const title = existing.querySelector('.session-title');
        if (title && summary) title.textContent = summary;
        setActiveSession(chatIdStr);
        return;
    }

    const li = document.createElement('li');
    li.setAttribute('data-chatid', chatIdStr);
    li.innerHTML = '<span class="session-title">' + escapeHtml(summary || '未命名会话') + '</span>';
    li.addEventListener('click', function() {
        loadHistoryByChatId(chatIdStr);
    });
    chatSessionList.insertBefore(li, chatSessionList.firstChild);
    setActiveSession(chatIdStr);
}

function sendMessage(messageText) {
    if (!chatInput || !sendChatBtn) return;
    const user_message = typeof messageText === 'string' ? messageText.trim() : chatInput.value.trim();
    if (!user_message) return;
    const currentUserId = ensureUserId();
    if (!currentUserId) {
        appendMessage('ai', '未获取到用户信息，请重新登录后再试。');
        return;
    }
    if (!chat_id) {
        chat_id = String(generateChatId());
    }

    sendChatBtn.disabled = true;
    appendMessage('user', user_message);
    chatInput.value = '';
    chatInput.focus();

    axios.get('/ai/chat', {
        params: {
            user_id: currentUserId,
            chat_id: chat_id,
            message: user_message
        }
    }).then(function(res) {
        if (res.data && res.data.code === 200 && res.data.data) {
            appendMessage('ai', res.data.data.ai_reply);
        } else {
            appendMessage('ai', 'AI暂时无法回复，请稍后再试。');
        }
    }).catch(function() {
        appendMessage('ai', 'AI暂时无法回复，请稍后再试。');
    }).finally(function() {
        sendChatBtn.disabled = false;
        scrollToBottom();
    });

    scrollToBottom();
}

function summarizeAndShowSession() {
    const historyText = collectHistoryText();
    if (!historyText || !chat_id) return;
    const greetText = 'AI：你好！我是心晴小屋AI心理师，有什么可以帮您？';
    if (historyText.trim() === greetText) return;

    const currentUserId = ensureUserId();
    if (!currentUserId) return;
    const currentChatId = String(chat_id);

    axios.get('/ai/summaries', {
        params: { user_id: currentUserId }
    }).then(function(res) {
        if (res.data && res.data.code === 200 && Array.isArray(res.data.data)) {
            const exist = res.data.data.find(function(item) {
                return String(item.chat_id) === currentChatId;
            });
            if (exist) {
                ensureSessionItem(exist.ai_reply, currentChatId);
                return;
            }
        }

        axios.post('/ai/summary', {
            user_id: currentUserId,
            chat_id: currentChatId,
            historyText: historyText
        }).then(function(res2) {
            if (res2.data && res2.data.code === 200 && res2.data.data) {
                ensureSessionItem(res2.data.data.ai_reply, currentChatId);
            } else {
                ensureSessionItem('AI总结失败', currentChatId);
            }
        }).catch(function() {
            ensureSessionItem('AI总结失败', currentChatId);
        });
    });
}

function loadHistoryByChatId(cid) {
    const currentUserId = ensureUserId();
    if (!currentUserId || !chatHistory) return;
    const chatIdStr = String(cid);

    axios.get('/ai/historyByChatId', {
        params: {
            user_id: currentUserId,
            chat_id: chatIdStr
        }
    }).then(function(res) {
        if (!(res.data && res.data.code === 200 && Array.isArray(res.data.data))) {
            return;
        }
        chatHistory.innerHTML = '';
        res.data.data.forEach(function(item) {
            if (item.user_message && item.user_message !== 'History_Summarize' && item.user_message !== '[历史总结]') {
                appendMessage('user', item.user_message);
            }
            if (item.ai_reply && item.user_message !== 'History_Summarize' && item.user_message !== '[历史总结]') {
                appendMessage('ai', item.ai_reply);
            }
        });
        chat_id = chatIdStr;
        setActiveSession(chatIdStr);
        if (chatTitle) chatTitle.textContent = '会话 ' + chatIdStr.slice(-6);
        openAiChatWidget();
        scrollToBottom();
    });
}

function loadChatSummaries() {
    const currentUserId = ensureUserId();
    if (!chatSessionList || !currentUserId) return;
    chatSessionList.innerHTML = '';

    axios.get('/ai/summaries', {
        params: { user_id: currentUserId }
    }).then(function(res) {
        if (!(res.data && res.data.code === 200 && Array.isArray(res.data.data))) return;
        res.data.data.forEach(function(item) {
            ensureSessionItem(item.ai_reply, item.chat_id);
        });
        if (chat_id) setActiveSession(chat_id);
    });
}

function startNewChatSession() {
    if (hasMeaningfulHistory()) {
        summarizeAndShowSession();
    }
    chat_id = String(generateChatId());
    if (chatTitle) chatTitle.textContent = '新会话';
    aiGreet();
    setActiveSession(chat_id);
    setTimeout(loadChatSummaries, 300);
}

function openAiChatWidget() {
    if (!aiChatWidget) return;
    if (typeof window.closeTestWidget === 'function') {
        window.closeTestWidget();
    }
    if (typeof window.closeMusicWidget === 'function') {
        window.closeMusicWidget();
    }
    if (typeof window.closeMoodWidget === 'function') {
        window.closeMoodWidget();
    }
    if (typeof window.closeHomeMessageWidget === 'function') {
        window.closeHomeMessageWidget();
    }
    aiChatWidget.style.display = 'flex';
    document.body.classList.add('widget-modal-open');
    if (!hasInitialized) {
        hasInitialized = true;
        loadChatSummaries();
        startNewChatSession();
    } else if (!chat_id) {
        startNewChatSession();
    }
}

function closeAiChatWidget() {
    if (!aiChatWidget) return;
    aiChatWidget.style.display = 'none';
    document.body.classList.remove('widget-modal-open');
}

function toggleAiChatWidget() {
    if (!aiChatWidget) return;
    if (aiChatWidget.style.display === 'none' || aiChatWidget.style.display === '') {
        openAiChatWidget();
    } else {
        closeAiChatWidget();
    }
}

function openAiChatWidgetWithPrompt(prompt, autoSend) {
    openAiChatWidget();
    if (!chatInput) return;
    chatInput.value = String(prompt || '').trim();
    chatInput.focus();
    if (autoSend && chatInput.value) {
        sendMessage(chatInput.value);
    }
}

if (sendChatBtn) {
    sendChatBtn.addEventListener('click', function() {
        sendMessage();
    });
}

if (chatInput) {
    chatInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
}

if (newChatBtn) {
    newChatBtn.addEventListener('click', function() {
        startNewChatSession();
    });
}

if (aiChatBubble) {
    aiChatBubble.addEventListener('click', toggleAiChatWidget);
}

if (closeAiChatBtn) {
    closeAiChatBtn.addEventListener('click', closeAiChatWidget);
}

window.sendMessage = sendMessage;
window.summarizeAndShowSession = summarizeAndShowSession;
window.startNewChatSession = startNewChatSession;
window.loadChatSummaries = loadChatSummaries;
window.loadHistoryByChatId = loadHistoryByChatId;
window.openAiChatWidget = openAiChatWidget;
window.openAiChatWidgetWithPrompt = openAiChatWidgetWithPrompt;

