import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChatbotTemplate, MediaMessage } from '@/types/chatbot';

interface MediaEditorProps {
  template: ChatbotTemplate;
  onUpdate: (updates: Partial<MediaMessage>) => void;
}

export const MediaEditor = ({ template, onUpdate }: MediaEditorProps) => {
  const msg = template.message as MediaMessage;

  return (
    <div className="space-y-4">
      <div>
        <Label>Media Type</Label>
        <Select
          value={msg.type}
          onValueChange={(value: any) => onUpdate({ type: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="image">Image</SelectItem>
            <SelectItem value="video">Video</SelectItem>
            <SelectItem value="audio">Audio</SelectItem>
            <SelectItem value="document">Document</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Media URL</Label>
        <Input
          value={msg.url || ''}
          onChange={(e) => onUpdate({ url: e.target.value })}
          placeholder="https://example.com/media.png"
          type="url"
        />
      </div>
      <div>
        <Label>Media ID (Alternative)</Label>
        <Input
          value={msg.mediaId || ''}
          onChange={(e) => onUpdate({ mediaId: e.target.value })}
          placeholder="media_id_from_whatsapp"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Use either URL or Media ID
        </p>
      </div>
      <div>
        <Label>Caption (Optional)</Label>
        <Input
          value={msg.caption || ''}
          onChange={(e) => onUpdate({ caption: e.target.value })}
          placeholder="Media caption"
        />
      </div>
      {msg.type === 'document' && (
        <div>
          <Label>Filename (Optional)</Label>
          <Input
            value={msg.filename || ''}
            onChange={(e) => onUpdate({ filename: e.target.value })}
            placeholder="document.pdf"
          />
        </div>
      )}
    </div>
  );
};
