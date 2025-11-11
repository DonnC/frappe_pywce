import { ImagePayload } from '@/types/message';
import { ImageIcon } from 'lucide-react';
import { useState } from 'react';

interface ImageMessageProps {
  payload: ImagePayload;
}

export const ImageMessage = ({ payload }: ImageMessageProps) => {
  const [imageError, setImageError] = useState(false);

  return (
    <div className="space-y-2">
      {imageError ? (
        <div className="flex items-center justify-center bg-muted rounded-lg p-8">
          <ImageIcon className="w-12 h-12 text-muted-foreground" />
        </div>
      ) : (
        <img
          src={payload.link}
          alt={payload.caption || 'Image'}
          className="rounded-lg max-w-full h-auto"
          onError={() => setImageError(true)}
        />
      )}
      {payload.caption && (
        <div className="text-sm opacity-90">{payload.caption}</div>
      )}
    </div>
  );
};
