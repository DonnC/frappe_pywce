import { InteractiveButtonPayload } from '@/types/message';
import { Button } from '@/components/ui/button';
import { parseWhatsAppFormatting } from '@/lib/whatsappFormatter';

interface ButtonMessageProps {
  payload: InteractiveButtonPayload;
  contextMessageId: string;
  onReply: (reply: any) => void;
}

export const ButtonMessage = ({ payload, contextMessageId, onReply }: ButtonMessageProps) => {
  const handleButtonClick = (button: { id: string; title: string }) => {
    onReply({
      type: 'button_reply',
      contextMessageId,
      payload: {
        id: button.id,
        title: button.title,
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
      <div className="flex flex-col gap-2 pt-2 border-t">
        {payload.buttons.map((button) => (
          <Button
            key={button.id}
            variant="outline"
            size="sm"
            onClick={() => handleButtonClick(button)}
            className="w-full justify-center text-primary hover:bg-primary/10 border-primary/30"
          >
            {button.title}
          </Button>
        ))}
      </div>
    </div>
  );
};
