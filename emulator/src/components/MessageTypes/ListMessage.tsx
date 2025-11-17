import { useState } from 'react';
import { InteractiveListPayload, ListRow } from '@/types/message';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ChevronRight } from 'lucide-react';
import { parseWhatsAppFormatting } from '@/lib/whatsappFormatter';

interface ListMessageProps {
  payload: InteractiveListPayload;
  contextMessageId: string;
  onReply: (reply: any) => void;
}

export const ListMessage = ({ payload, contextMessageId, onReply }: ListMessageProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleRowClick = (row: ListRow) => {
    setIsOpen(false);
    onReply({
      type: 'list_reply',
      contextMessageId,
      payload: {
        id: row.id,
        title: row.title,
        description: row.description,
      },
    });
  };

  return (
    <>
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
            onClick={() => setIsOpen(true)}
            className="w-full justify-between text-primary hover:bg-primary/10 border-primary/30"
          >
            {payload.buttonText}
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{payload.buttonText}</DialogTitle>
          </DialogHeader>
          <div className="space-y-1 max-h-96 overflow-y-auto">
            {payload.sections.map((section, sectionIdx) => (
              <div key={sectionIdx} className="space-y-1">
                {section.title && (
                  <div className="text-xs font-semibold text-muted-foreground px-3 py-2">
                    {section.title}
                  </div>
                )}
                {section.rows.map((row) => (
                  <button
                    key={row.id}
                    onClick={() => handleRowClick(row)}
                    className="w-full text-left px-3 py-3 hover:bg-secondary/50 transition-colors rounded-md"
                  >
                    <div className="font-medium">{row.title}</div>
                    {row.description && (
                      <div className="text-sm text-muted-foreground mt-1">
                        {row.description}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
