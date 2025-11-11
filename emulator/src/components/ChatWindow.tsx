import { useEffect, useRef, useState } from 'react';
import { ChatMessage, UIReply } from '@/types/message';
import { MessageRenderer } from './MessageRenderer';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Send, Paperclip, Image as ImageIcon, Video, FileText, MapPin } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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

  const handleSendDummyMedia = (type: 'image' | 'video' | 'document' | 'location') => {
    const dummyPayloads = {
      image: {
        type: 'image' as const,
        payload: {
          link: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4',
          caption: 'Nature Image [mock]',
        },
      },
      video: {
        type: 'video' as const,
        payload: {
          link: 'https://www.w3schools.com/html/mov_bbb.mp4',
          caption: 'Bunny Video [mock]',
        },
      },
      document: {
        type: 'document' as const,
        payload: {
          link: 'mock-link.pdf',
          filename: 'mock-document.pdf',
          caption: 'PDF Document [mock]',
        },
      },
      location: {
        type: 'location' as const,
        payload: {
          latitude: -17.8216,
          longitude: 31.0492,
          name: 'Harare Location [mock]',
          address: 'Harare, Zimbabwe',
        },
      },
    };

    onReply(dummyPayloads[type]);
  };

  return (
    <div className="flex flex-col h-full bg-chat-bg">
      {/* Chat Header */}
      <div className="bg-chat-header text-white px-4 py-3 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-semibold">
            WP
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Paperclip className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="bg-popover z-50">
              <DropdownMenuItem onClick={() => handleSendDummyMedia('image')}>
                <ImageIcon className="w-4 h-4 mr-2" />
                Send Image
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSendDummyMedia('video')}>
                <Video className="w-4 h-4 mr-2" />
                Send Video
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSendDummyMedia('document')}>
                <FileText className="w-4 h-4 mr-2" />
                Send Document
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSendDummyMedia('location')}>
                <MapPin className="w-4 h-4 mr-2" />
                Send Location
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
