import { TextPayload } from '@/types/message';

interface TextMessageProps {
    payload: TextPayload;
}

export const TextMessage = ({ payload }: TextMessageProps) => {
    return (
        <div className="whitespace-pre-wrap break-words">
            {payload.body}
        </div>
    );
};
