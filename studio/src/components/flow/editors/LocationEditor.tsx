import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChatbotTemplate, LocationMessage } from '@/types/chatbot';

interface LocationEditorProps {
  template: ChatbotTemplate;
  onUpdate: (updates: Partial<LocationMessage>) => void;
}

export const LocationEditor = ({ template, onUpdate }: LocationEditorProps) => {
  const msg = template.message as LocationMessage;

  return (
    <div className="space-y-4">
      <div>
        <Label>Latitude</Label>
        <Input
          value={msg.lat || ''}
          onChange={(e) => onUpdate({ lat: parseFloat(e.target.value) || 0 })}
          placeholder="37.7749"
          type="number"
          step="any"
        />
      </div>
      <div>
        <Label>Longitude</Label>
        <Input
          value={msg.lon || ''}
          onChange={(e) => onUpdate({ lon: parseFloat(e.target.value) || 0 })}
          placeholder="-122.4194"
          type="number"
          step="any"
        />
      </div>
      <div>
        <Label>Name (Optional)</Label>
        <Input
          value={msg.name || ''}
          onChange={(e) => onUpdate({ name: e.target.value })}
          placeholder="Location name"
        />
      </div>
      <div>
        <Label>Address (Optional)</Label>
        <Input
          value={msg.address || ''}
          onChange={(e) => onUpdate({ address: e.target.value })}
          placeholder="Full address"
        />
      </div>
    </div>
  );
};
