import { TextPreviewPayload } from '@/types/message';
import { ExternalLink } from 'lucide-react';

interface TextPreviewMessageProps {
    payload: TextPreviewPayload;
}

export const TextPreviewMessage = ({ payload }: TextPreviewMessageProps) => {
    return (
        <div className="space-y-2">
            <div className="whitespace-pre-wrap break-words">
                {payload.body}
            </div>
            <div className="flex items-center gap-2 text-sm opacity-80 border-t pt-2 mt-2">
                <ExternalLink className="w-3 h-3" />
                <span className="truncate">{payload.preview}</span>
            </div>
        </div>
    );
};
