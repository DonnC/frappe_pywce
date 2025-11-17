import { LocationPayload } from '@/types/message';
import { MapPin } from 'lucide-react';

interface LocationMessageProps {
  payload: LocationPayload;
}

export const LocationMessage = ({ payload }: LocationMessageProps) => {
  return (
    <div className="space-y-2">
      <div className="flex items-start gap-2">
        <MapPin className="w-5 h-5 mt-1 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="font-semibold">{payload.name}</div>
          <div className="text-sm opacity-80">{payload.address}</div>
          <div className="text-xs opacity-60 mt-1">
            {payload.latitude.toFixed(4)}, {payload.longitude.toFixed(4)}
          </div>
        </div>
      </div>
    </div>
  );
};
