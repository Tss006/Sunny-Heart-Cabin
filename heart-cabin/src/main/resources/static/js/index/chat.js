// chat.js - AI聊天页面脚本

// 获取DOM元素
const chatInput = document.getElementById('chatInput');
const sendChatBtn = document.getElementById('sendChatBtn');
const chatHistory = document.getElementById('chatHistory');

let userId = localStorage.getItem('userId') || 1;
let chatId = null;

function generateChatId() {
    return Date.now().toString() + Math.floor(Math.random()*1000000).toString();
}

function sendMessage() {
    const message = chatInput.value.trim();
    if (!message) return;
    sendChatBtn.disabled = true;
    appendMessage('user', message);
    chatInput.value = '';
    chatInput.focus();
    axios.get('/ai/chat', {
        params: {
            userId: userId,
            chatId: chatId,
            message: message
        }
    }).then(res => {
        if (res.data && res.data.code === 200 && res.data.data) {
            appendMessage('ai', res.data.data.aiReply);
        } else {
            appendMessage('ai', 'AI暂时无法回复，请稍后再试。');
        }
    }).catch(() => {
        appendMessage('ai', 'AI暂时无法回复，请稍后再试。');
    }).finally(() => {
        sendChatBtn.disabled = false;
        scrollToBottom();
    });
    scrollToBottom();
}

function appendMessage(role, content) {
    const msgDiv = document.createElement('div');
    msgDiv.className = 'chat-message' + (role === 'user' ? ' user' : '');
    msgDiv.innerHTML = `
        <div class="avatar">${role === 'user' ? '🧑' : '🤖'}</div>
        <div class="bubble">${escapeHtml(content)}</div>
    `;
    chatHistory.appendChild(msgDiv);
}

function scrollToBottom() {
    chatHistory.scrollTop = chatHistory.scrollHeight;
}

function escapeHtml(str) {
    return str.replace(/[&<>"]'/g, function (c) {
        return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'})[c];
    });
}

sendChatBtn.addEventListener('click', sendMessage);
chatInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

function aiGreet() {
    chatHistory.innerHTML = '';
    axios.get('/ai/chat', {
        params: {
            userId: userId,
            chatId: chatId,
            message: '你好！'
        }
    }).then(res => {
        if (res.data && res.data.code === 200 && res.data.data) {
            appendMessage('ai', res.data.data.aiReply);
        } else {
            appendMessage('ai', '你好，我是AI心理师，有什么可以帮您？');
        }
    }).catch(() => {
        appendMessage('ai', '你好，我是AI心理师，有什么可以帮您？');
    }).finally(scrollToBottom);
}

function startNewChatSession() {
    chatId = generateChatId();
    chatHistory.innerHTML = '';
    aiGreet();
}

function collectHistoryText() {
    const messages = chatHistory.querySelectorAll('.chat-message');
    let text = '';
    messages.forEach(msg => {
        const isUser = msg.classList.contains('user');
        const content = msg.querySelector('.bubble')?.innerText || '';
        text += (isUser ? '用户：' : 'AI：') + content + '\n';
    });
    return text.trim();
}

function summarizeAndShowSession() {
    const historyText = collectHistoryText();
    if (!historyText) return;
    axios.post('/ai/summary', {
        userId: userId,
        chatId: chatId,
        historyText: historyText
    }).then(res => {
        if (res.data && res.data.code === 200 && res.data.data) {
            addSessionToSidebar(res.data.data.aiReply, chatId);
        } else {
            addSessionToSidebar('AI总结失败', chatId);
        }
    }).catch(() => {
        addSessionToSidebar('AI总结失败', chatId);
    });
}

function addSessionToSidebar(summary, chatIdVal) {
    const sessionList = document.getElementById('chatSessionList');
    if (!sessionList) return;
    const li = document.createElement('li');
    li.setAttribute('data-chatid', chatIdVal);
    li.innerHTML = `<span class="session-title">${escapeHtml(summary)}</span>`;
    li.onclick = function() {
        loadHistoryByChatId(chatIdVal);
    };
    sessionList.insertBefore(li, sessionList.firstChild);
}

function loadHistoryByChatId(cid) {
    axios.get('/ai/history', {
        params: {
            userId: userId,
            chatId: cid
        }
    }).then(res => {
        if (res.data && res.data.code === 200 && res.data.data) {
            chatHistory.innerHTML = '';
            res.data.data.forEach(item => {
                if(item.userMessage && item.userMessage !== '[历史总结]') appendMessage('user', item.userMessage);
                if(item.aiReply) appendMessage('ai', item.aiReply);
            });
            chatId = cid;
        }
    });
}