import { VideoPayload } from '@/types/message';

interface VideoMessageProps {
  payload: VideoPayload;
}

export const VideoMessage = ({ payload }: VideoMessageProps) => {
  return (
    <div className="space-y-2">
      <video
        src={payload.link}
        controls
        className="rounded-lg max-w-full h-auto"
      >
        Your browser does not support the video tag.
      </video>
      {payload.caption && (
        <div className="text-sm opacity-90">{payload.caption}</div>
      )}
    </div>
  );
};
