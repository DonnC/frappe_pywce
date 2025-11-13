import { InteractiveLocationRequestPayload } from '@/types/message';
import { Button } from '@/components/ui/button';
import { MapPin } from 'lucide-react';
import { UIReply } from '@/types/message';

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
        name: 'Harare Location [mock]',
        address: 'Harare, Zimbabwe',
      },
    });
  };

  return (
    <div className="space-y-3">
      {payload.header && (
        <div className="font-semibold text-sm">{payload.header}</div>
      )}
      <div className="whitespace-pre-wrap break-words">{payload.body}</div>
      {payload.footer && (
        <div className="text-xs opacity-70">{payload.footer}</div>
      )}
      <Button
        onClick={handleSendLocation}
        className="w-full mt-2"
        variant="default"
        size="sm"
      >
        <MapPin className="w-4 h-4 mr-2" />
        Send Location
      </Button>
    </div>
  );
};
