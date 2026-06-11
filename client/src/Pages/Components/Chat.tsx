import { useEffect, useRef, useState } from 'react'
import type { ChatMessage } from '../../types'
import Img from './Img'
import '../../styles/chat.css'

type ChatProps = {
    messages: ChatMessage[]
    sendChat: (text: string) => void
    currentUserId: string | undefined
}

const Chat = ({ messages, sendChat, currentUserId }: ChatProps) => {
    const [open, setOpenRaw] = useState(false)
    const [draft, setDraft] = useState('')
    const [isFullscreen, setIsFullscreen] = useState(false)

    // How many messages were in the list when the panel was last opened or
    // closed. Unread is derived from it, so no effect has to track arrivals.
    const [seenCount, setSeenCount] = useState(messages.length)

    const listRef = useRef<HTMLDivElement>(null)

    const setOpen = (next: boolean) => {
        // Opening shows everything; closing means everything so far was seen.
        setSeenCount(messages.length)
        setOpenRaw(next)
    }

    const unread = open ? 0 : messages.slice(seenCount).filter((m) => m.senderId !== currentUserId).length

    // Keep the icon in sync with the actual fullscreen state (incl. Esc exits).
    useEffect(() => {
        const onChange = () => setIsFullscreen(!!document.fullscreenElement)
        document.addEventListener('fullscreenchange', onChange)
        return () => document.removeEventListener('fullscreenchange', onChange)
    }, [])

    const toggleFullscreen = () => {
        if (document.fullscreenElement) {
            document.exitFullscreen().catch(() => {})
        } else {
            document.documentElement.requestFullscreen().catch(() => {})
        }
    }

    // Keep the conversation pinned to the latest message while open.
    useEffect(() => {
        if (open && listRef.current) {
            listRef.current.scrollTop = listRef.current.scrollHeight
        }
    }, [messages, open])

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault()
        const text = draft.trim()
        if (!text) return
        sendChat(text)
        setDraft('')
    }

    return (
        <>
            <button
                className={`chat-toggle ${open ? 'open' : ''}`}
                onClick={() => setOpen(!open)}
                aria-label={open ? 'Close chat' : 'Open chat'}
            >
                {open ? <CloseIcon /> : <ChatIcon />}
                {!open && unread > 0 && <span className="chat-badge">{unread > 9 ? '9+' : unread}</span>}
            </button>

            <div className={`chat-panel ${open ? 'open' : ''}`} role="dialog" aria-hidden={!open}>
                <header className="chat-header">
                    <h3>Chat</h3>
                    <div className="chat-header-actions">
                        <button
                            className="chat-close"
                            onClick={toggleFullscreen}
                            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                        >
                            {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
                        </button>
                        <button className="chat-close" onClick={() => setOpen(false)} aria-label="Close chat">
                            <CloseIcon />
                        </button>
                    </div>
                </header>

                <div className="chat-messages" ref={listRef}>
                    {messages.length === 0 ? (
                        <p className="chat-empty">No messages yet. Say hello 👋</p>
                    ) : (
                        messages.map((m) => {
                            const mine = m.senderId === currentUserId
                            return (
                                <div key={m.id} className={`chat-message ${mine ? 'mine' : ''}`}>
                                    {!mine && (
                                        <div className="chat-avatar">
                                            <Img src={m.picture} />
                                        </div>
                                    )}
                                    <div className="chat-bubble">
                                        {!mine && <span className="chat-sender">{m.username}</span>}
                                        <span className="chat-text">{m.text}</span>
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>

                <form className="chat-input-row" onSubmit={handleSend}>
                    <input
                        className="chat-input"
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        placeholder="Type a message…"
                        maxLength={500}
                    />
                    <button className="chat-send" type="submit" disabled={!draft.trim()} aria-label="Send message">
                        <SendIcon />
                    </button>
                </form>
            </div>
        </>
    )
}

const ChatIcon = () => (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
)

const CloseIcon = () => (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
)

const FullscreenIcon = () => (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 3H5a2 2 0 0 0-2 2v3" />
        <path d="M16 3h3a2 2 0 0 1 2 2v3" />
        <path d="M21 16v3a2 2 0 0 1-2 2h-3" />
        <path d="M3 16v3a2 2 0 0 0 2 2h3" />
    </svg>
)

const FullscreenExitIcon = () => (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 3v3a2 2 0 0 1-2 2H3" />
        <path d="M21 8h-3a2 2 0 0 1-2-2V3" />
        <path d="M3 16h3a2 2 0 0 1 2 2v3" />
        <path d="M16 21v-3a2 2 0 0 1 2-2h3" />
    </svg>
)

const SendIcon = () => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="22" y1="2" x2="11" y2="13" />
        <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
)

export default Chat
