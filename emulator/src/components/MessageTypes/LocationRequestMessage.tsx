import { InteractiveLocationRequestPayload } from '@/types/message';
import { Button } from '@/components/ui/button';
import { MapPin } from 'lucide-react';
import { UIReply } from '@/types/message';
import { parseWhatsAppFormatting } from '@/lib/whatsappFormatter';

interface LocationRequestMessageProps {
  payload: InteractiveLocationRequestPayload;
  contextMessageId: string;
  onReply: (reply: UIReply) => void;
}

export const LocationRequestMessage = ({ payload, contextMessageId, onReply }: LocationRequestMessageProps) => {
  const handleSendLocation = () => {
    onReply({
      type: 'location',
      contextMessageId,
      payload: {
        latitude: -17.8216,
        longitude: 31.0492,
        name: 'Dummy Location',
        address: 'Harare, Zimbabwe',
      },
    });
  };

  return (
    <div className="space-y-3">
      {payload.header && (
        <div className="font-semibold text-sm space-y-1">{parseWhatsAppFormatting(payload.header)}</div>
      )}
      <div className="break-words space-y-1">{parseWhatsAppFormatting(payload.body)}</div>
      {payload.footer && (
        <div className="text-xs opacity-70 space-y-1">{parseWhatsAppFormatting(payload.footer)}</div>
      )}
      <Button
        onClick={handleSendLocation}
        className="w-full mt-2"
        variant="default"
        size="sm"
      >
        <MapPin className="w-4 h-4 mr-2" />
        Send Dummy Location
      </Button>
    </div>
  );
};
