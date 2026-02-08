:root {
    --bg-main: #171717;
    --bg-sidebar: #0f0f0f;
    --bg-message-user: #2f2f2f;
    --bg-card: #212121;
    --text-main: #ececec;
    --text-muted: #b4b4b4;
    --accent: #d97757;
    --border: rgba(255, 255, 255, 0.1);
    --radius: 12px;
}

* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: system-ui, -apple-system, sans-serif; background: var(--bg-main); color: var(--text-main); height: 100vh; overflow: hidden; }

.app-container { display: flex; height: 100%; }

/* Sidebar */
.sidebar { width: 260px; background: var(--bg-sidebar); border-right: 1px solid var(--border); display: flex; flex-direction: column; transition: transform 0.3s ease; }
.sidebar-header { padding: 1.5rem 1rem; }
.chat-history { flex: 1; overflow-y: auto; padding: 0.5rem; }
.chat-item { padding: 0.8rem; border-radius: 8px; cursor: pointer; margin-bottom: 4px; display: flex; justify-content: space-between; align-items: center; font-size: 0.9rem; position: relative; }
.chat-item:hover { background: var(--bg-message-user); }
.chat-item.active { background: #343434; }
.delete-btn { opacity: 0; background: transparent; border: none; color: #ff5f56; cursor: pointer; padding: 4px; }
.chat-item:hover .delete-btn { opacity: 1; }

/* Main Area */
.main-content { flex: 1; display: flex; flex-direction: column; position: relative; }
.top-bar { height: 60px; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; padding: 0 1rem; }

.chat-window { flex: 1; overflow-y: auto; padding: 2rem 1rem; scroll-behavior: smooth; }
.messages-container { max-width: 800px; margin: 0 auto; display: flex; flex-direction: column; gap: 1.5rem; }

.message { max-width: 85%; padding: 1rem; border-radius: var(--radius); line-height: 1.6; word-wrap: break-word; }
.message.user { align-self: flex-end; background: var(--bg-message-user); border-bottom-right-radius: 4px; }
.message.assistant { align-self: flex-start; background: transparent; }

.message pre { background: #000; padding: 1rem; border-radius: 8px; overflow-x: auto; margin: 0.8rem 0; position: relative; font-family: monospace; }
.copy-btn { position: absolute; top: 5px; right: 5px; font-size: 0.7rem; background: #333; color: #fff; border: none; padding: 2px 6px; border-radius: 4px; cursor: pointer; }

/* Composer */
.composer-container { padding: 1rem 2rem 2rem; max-width: 840px; margin: 0 auto; width: 100%; }
.input-wrapper { background: var(--bg-card); border: 1px solid var(--border); border-radius: 16px; padding: 0.75rem 1rem; display: flex; align-items: flex-end; gap: 0.8rem; }
textarea { flex: 1; background: transparent; border: none; color: white; resize: none; font-size: 1rem; outline: none; min-height: 24px; }

/* Buttons & Utils */
.btn-primary { background: var(--accent); color: white; border: none; padding: 0.6rem 1rem; border-radius: 8px; cursor: pointer; width: 100%; font-weight: 600; }
.btn-send { background: white; color: black; border: none; border-radius: 8px; width: 36px; height: 36px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
.btn-send:disabled { opacity: 0.3; }
.btn-stop { background: #e74c3c; color: white; border: none; padding: 0.5rem 1rem; border-radius: 8px; cursor: pointer; }
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal { background: var(--bg-card); padding: 2rem; border-radius: 16px; width: 450px; border: 1px solid var(--border); }
.hidden { display: none !important; }

@media (max-width: 768px) {
    .sidebar { position: absolute; height: 100%; z-index: 100; transform: translateX(-100%); }
    .sidebar.open { transform: translateX(0); }
}
