import { TextPayload } from '@/types/message';
import { parseWhatsAppFormatting } from '@/lib/whatsappFormatter';

interface TextMessageProps {
  payload: TextPayload;
}

export const TextMessage = ({ payload }: TextMessageProps) => {
  return (
    <div className="break-words space-y-1">
      {parseWhatsAppFormatting(payload.body)}
    </div>
  );
};
