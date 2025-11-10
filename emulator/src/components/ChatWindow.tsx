import { useEffect, useRef, useState } from 'react';
import { ChatMessage, UIReply } from '@/types/message';
import { MessageRenderer } from './MessageRenderer';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Send } from 'lucide-react';

interface ChatWindowProps {
    messages: ChatMessage[];
    onReply: (reply: UIReply) => void;
}

export const ChatWindow = ({ messages, onReply }: ChatWindowProps) => {
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [inputValue, setInputValue] = useState('');

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendText = () => {
        if (inputValue.trim()) {
            onReply({
                type: 'text',
                payload: { body: inputValue.trim() },
            });
            setInputValue('');
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendText();
        }
    };

    return (
        <div className="flex flex-col h-full bg-chat-bg">
            {/* Chat Header */}
            <div className="bg-chat-header text-white px-4 py-3 shadow-md">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-semibold">
                        AI
                    </div>
                    <div>
                        <h2 className="font-semibold">Chatbot Emulator</h2>
                        <p className="text-xs opacity-90">WhatsApp UI</p>
                    </div>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
                {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                        No messages yet. Use the Demo Toolbar or connect to the bridge server.
                    </div>
                ) : (
                    messages.map((message) => (
                        <MessageRenderer key={message.id} message={message} onReply={onReply} />
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t bg-card px-4 py-3">
                <div className="flex gap-2 items-center">
                    <Input
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Type a message..."
                        className="flex-1"
                    />
                    <Button onClick={handleSendText} size="icon" disabled={!inputValue.trim()}>
                        <Send className="w-4 h-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
};
