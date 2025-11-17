import { ChatMessage, UIReply } from '@/types/message';
import { TextMessage } from './MessageTypes/TextMessage';
import { TextPreviewMessage } from './MessageTypes/TextPreviewMessage';
import { ImageMessage } from './MessageTypes/ImageMessage';
import { VideoMessage } from './MessageTypes/VideoMessage';
import { DocumentMessage } from './MessageTypes/DocumentMessage';
import { LocationMessage } from './MessageTypes/LocationMessage';
import { LocationRequestMessage } from './MessageTypes/LocationRequestMessage';
import { ButtonMessage } from './MessageTypes/ButtonMessage';
import { ListMessage } from './MessageTypes/ListMessage';
import { CtaMessage } from './MessageTypes/CtaMessage';
import { TypingIndicator } from './MessageTypes/TypingIndicator';
import { cn } from '@/lib/utils';

interface MessageRendererProps {
  message: ChatMessage;
  onReply: (reply: UIReply) => void;
}

export const MessageRenderer = ({ message, onReply }: MessageRendererProps) => {
  const isOutgoing = message.direction === 'out';

  const renderMessageContent = () => {
    const { type, payload } = message.data;

    switch (type) {
      case 'text':
        return <TextMessage payload={payload as any} />;
      case 'text_preview':
        return <TextPreviewMessage payload={payload as any} />;
      case 'image':
        return <ImageMessage payload={payload as any} />;
      case 'video':
        return <VideoMessage payload={payload as any} />;
      case 'document':
        return <DocumentMessage payload={payload as any} />;
      case 'location':
        return <LocationMessage payload={payload as any} />;
      case 'interactive_location_request':
        return (
          <LocationRequestMessage
            payload={payload as any}
            contextMessageId={message.data.id}
            onReply={onReply}
          />
        );
      case 'interactive_button':
        return (
          <ButtonMessage
            payload={payload as any}
            contextMessageId={message.data.id}
            onReply={onReply}
          />
        );
      case 'interactive_list':
        return (
          <ListMessage
            payload={payload as any}
            contextMessageId={message.data.id}
            onReply={onReply}
          />
        );
      case 'interactive_cta':
        return <CtaMessage payload={payload as any} />;
      default:
        return <div>Unsupported message type: {type}</div>;
    }
  };

  return (
    <div className={cn('flex mb-3 animate-in slide-in-from-bottom-2', isOutgoing ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[75%] rounded-lg px-3 py-2 shadow-sm',
          isOutgoing
            ? 'bg-chat-messageOut text-chat-textOut rounded-br-none'
            : 'bg-chat-messageIn text-chat-textIn rounded-bl-none'
        )}
      >
        {renderMessageContent()}
        <div className={cn('text-[10px] mt-1 text-right', isOutgoing ? 'opacity-70' : 'opacity-50')}>
          {message.timestamp.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          })}
        </div>
      </div>
    </div>
  );
};
