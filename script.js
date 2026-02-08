/**
 * Claude-style Chat App
 * Pure Vanilla JS Implementation
 */

(function() {
    // --- State Management ---
    let state = {
        chats: JSON.parse(localStorage.getItem('cc_chats')) || [],
        activeChatId: localStorage.getItem('cc_active_chat') || null,
        apiKey: localStorage.getItem('cc_api_key') || '',
        systemPrompt: localStorage.getItem('cc_system_prompt') || 'You are Claude, a helpful AI assistant.',
        isStreaming: false,
        abortController: null,
        customModel: localStorage.getItem('cc_custom_model') || ''
    };

    // --- DOM Elements ---
    const elements = {
        chatHistory: document.getElementById('chat-history-list'),
        messagesContainer: document.getElementById('messages-container'),
        chatInput: document.getElementById('chat-input'),
        sendBtn: document.getElementById('send-btn'),
        stopBtn: document.getElementById('stop-btn'),
        newChatBtn: document.getElementById('new-chat-btn'),
        settingsBtn: document.getElementById('settings-btn'),
        modalOverlay: document.getElementById('modal-overlay'),
        settingsModal: document.getElementById('settings-modal'),
        apiKeyInput: document.getElementById('api-key-input'),
        systemPromptInput: document.getElementById('system-prompt-input'),
        saveSettings: document.getElementById('save-settings'),
        modelSelector: document.getElementById('model-selector'),
        customModelInput: document.getElementById('custom-model-input'),
        jumpToBottom: document.getElementById('jump-to-bottom'),
        chatWindow: document.getElementById('chat-window'),
        menuToggle: document.getElementById('menu-toggle'),
        sidebar: document.getElementById('sidebar')
    };

    // --- Initialization ---
    function init() {
        renderSidebar();
        if (state.activeChatId) {
            loadChat(state.activeChatId);
        } else {
            showEmptyState();
        }
        setupEventListeners();
        autoResizeTextarea();
    }

    // --- Core Logic ---
    function saveState() {
        localStorage.setItem('cc_chats', JSON.stringify(state.chats));
        localStorage.setItem('cc_active_chat', state.activeChatId);
        localStorage.setItem('cc_api_key', state.apiKey);
        localStorage.setItem('cc_system_prompt', state.systemPrompt);
        localStorage.setItem('cc_custom_model', state.customModel);
    }

    async function sendMessage() {
        const text = elements.chatInput.value.trim();
        if (!text || state.isStreaming) return;
        if (!state.apiKey) {
            showToast("Please enter an API Key in settings first!", "error");
            openSettings();
            return;
        }

        // Create new chat if none active
        if (!state.activeChatId) {
            const newId = Date.now().toString();
            state.chats.unshift({
                id: newId,
                title: text.substring(0, 30) + (text.length > 30 ? '...' : ''),
                messages: [],
                model: getSelectedModel(),
                createdAt: new Date().toISOString()
            });
            state.activeChatId = newId;
            renderSidebar();
        }

        const chat = state.chats.find(c => c.id === state.activeChatId);
        const userMsg = { id: Date.now().toString(), role: 'user', content: text, createdAt: new Date().toISOString() };
        chat.messages.push(userMsg);
        
        elements.chatInput.value = '';
        elements.chatInput.style.height = 'auto';
        renderMessages();
        
        await streamAssistantResponse(chat);
    }

    async function streamAssistantResponse(chat) {
        state.isStreaming = true;
        updateUIStreaming(true);
        state.abortController = new AbortController();

        const assistantMsgId = (Date.now() + 1).toString();
        let assistantContent = '';
        
        // Add placeholder message
        chat.messages.push({ id: assistantMsgId, role: 'assistant', content: '', createdAt: new Date().toISOString() });
        const messageEl = renderMessages(); 
        const contentEl = messageEl.querySelector(`[data-id="${assistantMsgId}"] .msg-content`);

        try {
            const messages = [
                { role: 'system', content: state.systemPrompt },
                ...chat.messages.slice(0, -1).map(m => ({ role: m.role, content: m.content }))
            ];

            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${state.apiKey}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': window.location.origin,
                    'X-Title': 'Claude Clone'
                },
                body: JSON.stringify({
                    model: getSelectedModel(),
                    messages: messages,
                    stream: true
                }),
                signal: state.abortController.signal
            });

            if (!response.ok) throw new Error(await response.text());

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n').filter(line => line.trim() !== '');

                for (const line of lines) {
                    if (line.includes('[DONE]')) break;
                    if (!line.startsWith('data: ')) continue;

                    try {
                        const data = JSON.parse(line.replace('data: ', ''));
                        const delta = data.choices[0]?.delta?.content || '';
                        assistantContent += delta;
                        
                        // Update chat object and UI
                        const msgObj = chat.messages.find(m => m.id === assistantMsgId);
                        msgObj.content = assistantContent;
                        contentEl.innerHTML = formatMarkdown(assistantContent);
                        
                        if (isAtBottom()) scrollToBottom();
                    } catch (e) {
                        console.warn("Error parsing chunk", e);
                    }
                }
            }
        } catch (err) {
            if (err.name === 'AbortError') {
                showToast("Stream stopped", "info");
            } else {
                showToast("Error: " + err.message, "error");
            }
        } finally {
            state.isStreaming = false;
            updateUIStreaming(false);
            saveState();
        }
    }

    // --- UI Helpers ---
    function renderSidebar() {
        elements.chatHistory.innerHTML = state.chats.map(chat => `
            <div class="chat-item ${chat.id === state.activeChatId ? 'active' : ''}" data-id="${chat.id}">
                <span class="title">${chat.title}</span>
                <button class="delete-btn" onclick="event.stopPropagation(); window.app.deleteChat('${chat.id}')">🗑</button>
            </div>
        `).join('');

        document.querySelectorAll('.chat-item').forEach(item => {
            item.onclick = () => loadChat(item.dataset.id);
        });
    }

    function renderMessages() {
        const chat = state.chats.find(c => c.id === state.activeChatId);
        if (!chat) return;

        elements.messagesContainer.innerHTML = chat.messages.map(m => `
            <div class="message ${m.role}" data-id="${m.id}">
                <div class="msg-content">${formatMarkdown(m.content)}</div>
            </div>
        `).join('');
        
        scrollToBottom();
        return elements.messagesContainer;
    }

    function formatMarkdown(text) {
        // Simple Markdown: Escape HTML, handle code blocks, and newlines
        let html = text
            .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
            .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code><button class="copy-btn" onclick="window.app.copyCode(this)">Copy</button></pre>')
            .replace(/\n/g, '<br>');
        return html || '<span class="typing-dots">...</span>';
    }

    function loadChat(id) {
        state.activeChatId = id;
        renderSidebar();
        renderMessages();
        elements.sidebar.classList.remove('open');
    }

    function updateUIStreaming(isStreaming) {
        elements.sendBtn.disabled = isStreaming;
        elements.stopBtn.classList.toggle('hidden', !isStreaming);
    }

    function showToast(msg, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerText = msg;
        document.getElementById('toast-container').appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }

    function getSelectedModel() {
        const val = elements.modelSelector.value;
        return val === 'custom' ? state.customModel : val;
    }

    // --- Event Listeners ---
    function setupEventListeners() {
        elements.sendBtn.onclick = sendMessage;
        elements.chatInput.onkeydown = (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        };

        elements.stopBtn.onclick = () => {
            if (state.abortController) state.abortController.abort();
        };

        elements.newChatBtn.onclick = () => {
            state.activeChatId = null;
            elements.messagesContainer.innerHTML = '';
            showEmptyState();
            renderSidebar();
        };

        elements.settingsBtn.onclick = openSettings;
        elements.saveSettings.onclick = () => {
            state.apiKey = elements.apiKeyInput.value;
            state.systemPrompt = elements.systemPromptInput.value;
            state.customModel = elements.customModelInput.value;
            saveState();
            closeSettings();
            showToast("Settings saved");
        };

        elements.closeSettings.onclick = closeSettings;
        elements.menuToggle.onclick = () => elements.sidebar.classList.toggle('open');
        
        elements.chatWindow.onscroll = () => {
            const shouldShow = elements.chatWindow.scrollTop < (elements.chatWindow.scrollHeight - elements.chatWindow.clientHeight - 100);
            elements.jumpToBottom.classList.toggle('hidden', !shouldShow);
        };
        
        elements.jumpToBottom.onclick = scrollToBottom;
    }

    function autoResizeTextarea() {
        elements.chatInput.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = (this.scrollHeight) + 'px';
        });
    }

    function openSettings() {
        elements.apiKeyInput.value = state.apiKey;
        elements.systemPromptInput.value = state.systemPrompt;
        elements.customModelInput.value = state.customModel;
        elements.modalOverlay.classList.remove('hidden');
        elements.settingsModal.classList.remove('hidden');
    }

    function closeSettings() {
        elements.modalOverlay.classList.add('hidden');
    }

    function scrollToBottom() {
        elements.chatWindow.scrollTop = elements.chatWindow.scrollHeight;
    }

    function isAtBottom() {
        return elements.chatWindow.scrollHeight - elements.chatWindow.scrollTop <= elements.chatWindow.clientHeight + 50;
    }

    function showEmptyState() {
        elements.messagesContainer.innerHTML = `
            <div class="empty-state">
                <h2>How can I help you today?</h2>
                <p>Enter your OpenRouter API key in settings to start chatting with Claude 3.5 or other models.</p>
            </div>
        `;
    }

    // --- Exports for Inline HTML onclicks ---
    window.app = {
        deleteChat: (id) => {
            state.chats = state.chats.filter(c => c.id !== id);
            if (state.activeChatId === id) state.activeChatId = null;
            saveState();
            renderSidebar();
            if (!state.activeChatId) showEmptyState();
        },
        copyCode: (btn) => {
            const code = btn.previousElementSibling.innerText;
            navigator.clipboard.writeText(code);
            btn.innerText = 'Copied!';
            setTimeout(() => btn.innerText = 'Copy', 2000);
        }
    };

    init();
})();
