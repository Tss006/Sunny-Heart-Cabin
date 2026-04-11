// chat.js - AI聊天页面脚本

// 获取DOM元素
const chatInput = document.getElementById('chatInput');
const sendChatBtn = document.getElementById('sendChatBtn');
const chatHistory = document.getElementById('chatHistory');

let user_id = localStorage.getItem('user_id') || 1;
let chat_id = null;


function generateChatId() {
    // 生成唯一字符串chat_id，避免大整数精度丢失
    return 'cid_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 8);
}

function sendMessage() {
    const user_message = chatInput.value.trim();
    if (!user_message) return;
    sendChatBtn.disabled = true;
    appendMessage('user', user_message);
    chatInput.value = '';
    chatInput.focus();
    axios.get('/ai/chat', {
        params: {
            user_id: user_id,
            chat_id: chat_id,
            message: user_message
        }
    }).then(res => {
        if (res.data && res.data.code === 200 && res.data.data) {
            appendMessage('ai', res.data.data.ai_reply);
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


// AI问候语只展示，不保存到数据库
function aiGreet() {
    chatHistory.innerHTML = '';
    // 直接本地展示AI问候语
    appendMessage('ai', '你好！我是心晴小屋AI心理师，有什么可以帮您？');
    scrollToBottom();
}


function startNewChatSession() {
    chat_id = generateChatId();
    // 确保chat_id为字符串
    chat_id = String(chat_id);
    chatHistory.innerHTML = '';
    aiGreet();
    setTimeout(loadChatSummaries, 500);
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


// 判断数据库是否已有该chat_id的历史总结，若有则直接展示，否则调用AI总结
// 修正：总结时用当前会话的chat_id（总结前的chat_id），避免用新建的chat_id

function summarizeAndShowSession() {
    const historyText = collectHistoryText();
    if (!historyText) return;
    // 判断历史内容是否只包含AI问候语
    const greetText = 'AI：你好！我是心晴小屋AI心理师，有什么可以帮您？';
    if (historyText.trim() === greetText) return;
    // 记录当前会话id，防止新建会话后chat_id被覆盖
    const currentChatId = chat_id;
    // 先查summaries接口，判断是否已存在该chat_id的总结
    axios.get('/ai/summaries', {
        params: { user_id: user_id }
    }).then(res => {
        if (res.data && res.data.code === 200 && Array.isArray(res.data.data)) {
            const exist = res.data.data.find(item => String(item.chat_id) === String(currentChatId));
            if (exist) {
                addSessionToSidebar(exist.ai_reply, currentChatId);
                return;
            }
        }
        // 不存在则调用AI总结
        axios.post('/ai/summary', {
            user_id: user_id,
            chat_id: currentChatId,
            historyText: historyText
        }).then(res2 => {
            if (res2.data && res2.data.code === 200 && res2.data.data) {
                addSessionToSidebar(res2.data.data.ai_reply, currentChatId);
            } else {
                addSessionToSidebar('AI总结失败', currentChatId);
            }
        }).catch(() => {
            addSessionToSidebar('AI总结失败', currentChatId);
        });
    });
}

function addSessionToSidebar(summary, chat_id_val) {
    const sessionList = document.getElementById('chatSessionList');
    if (!sessionList) return;
    const li = document.createElement('li');
    li.setAttribute('data-chatid', chat_id_val);
    li.innerHTML = `<span class="session-title">${escapeHtml(summary)}</span>`;
    li.onclick = function() {
        loadHistoryByChatId(chat_id_val);
    };
    sessionList.insertBefore(li, sessionList.firstChild);
}


function loadHistoryByChatId(cid) {
    // 确保chat_id为字符串
    const chatIdStr = String(cid);
    axios.get('/ai/historyByChatId', {
        params: {
            user_id: user_id,
            chat_id: chatIdStr
        }
    }).then(res => {
        if (res.data && res.data.code === 200 && res.data.data) {
            chatHistory.innerHTML = '';
            res.data.data.forEach(item => {
                if(item.user_message && item.user_message !== 'History_Summarize' && item.user_message !== '[历史总结]') appendMessage('user', item.user_message);
                if(item.ai_reply && item.user_message !== 'History_Summarize' && item.user_message !== '[历史总结]') appendMessage('ai', item.ai_reply);
            });
            chat_id = chatIdStr;
        }
    });
}

// 进入AI聊天页面时加载历史总结
function loadChatSummaries() {
    const sessionList = document.getElementById('chatSessionList');
    if (!sessionList) return;
    sessionList.innerHTML = '';
    axios.get('/ai/summaries', {
        params: {
            user_id: user_id
        }
    }).then(res => {
        console.log('历史总结数据：', res.data);
        if (
            res.data && res.data.code === 200 && Array.isArray(res.data.data)) {
            res.data.data.forEach(item => {
                addSessionToSidebar(item.ai_reply, item.chat_id);
            });
        }
    });
}

