import { DocumentPayload } from '@/types/message';
import { FileText } from 'lucide-react';

interface DocumentMessageProps {
  payload: DocumentPayload;
}

export const DocumentMessage = ({ payload }: DocumentMessageProps) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
        <FileText className="w-8 h-8 text-primary flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="font-semibold truncate">{payload.filename}</div>
          <div className="text-xs opacity-60">Document</div>
        </div>
      </div>
      {payload.caption && (
        <div className="text-sm opacity-90">{payload.caption}</div>
      )}
    </div>
  );
};
