import { InteractiveCTAPayload } from '@/types/message';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';
import { parseWhatsAppFormatting } from '@/lib/whatsappFormatter';

interface CtaMessageProps {
  payload: InteractiveCTAPayload;
}

export const CtaMessage = ({ payload }: CtaMessageProps) => {
  const handleClick = () => {
    window.open(payload.url, '_blank', 'noopener,noreferrer');
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
      <div className="pt-2 border-t">
        <Button
          variant="outline"
          size="sm"
          onClick={handleClick}
          className="w-full justify-center gap-2 text-primary hover:bg-primary/10 border-primary/30"
        >
          <ExternalLink className="w-4 h-4" />
          {payload.displayText}
        </Button>
      </div>
    </div>
  );
};
