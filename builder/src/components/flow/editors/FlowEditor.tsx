import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { VariableTextarea } from '@/components/ui/variable-textarea';
import { Switch } from '@/components/ui/switch';
import { ChatbotTemplate, FlowMessage } from '@/types/chatbot';

interface FlowEditorProps {
  template: ChatbotTemplate;
  onUpdate: (updates: Partial<FlowMessage>) => void;
}

export const FlowEditor = ({ template, onUpdate }: FlowEditorProps) => {
  const msg = template.message as FlowMessage;

  return (
    <div className="space-y-4">
      <div>
        <Label>Title (Optional)</Label>
        <Input
          value={msg.title || ''}
          onChange={(e) => onUpdate({ title: e.target.value })}
          placeholder="Message title"
        />
      </div>
      <div>
        <Label>Body</Label>
        <VariableTextarea
          value={msg.body || ''}
          onChange={(e) => onUpdate({ body: e.target.value })}
          placeholder="Message body. Use {{variable}} for dynamic values."
          rows={3}
        />
      </div>
      <div>
        <Label>Footer (Optional)</Label>
        <Input
          value={msg.footer || ''}
          onChange={(e) => onUpdate({ footer: e.target.value })}
          placeholder="Message footer"
        />
      </div>
      <div>
        <Label>Flow ID</Label>
        <Input
          value={msg.id || ''}
          onChange={(e) => onUpdate({ id: e.target.value })}
          placeholder="Flow ID from WhatsApp Flow Manager"
        />
      </div>
      <div>
        <Label>Flow Name</Label>
        <Input
          value={msg.name || ''}
          onChange={(e) => onUpdate({ name: e.target.value })}
          placeholder="Flow name"
        />
      </div>
      <div>
        <Label>Button Text</Label>
        <Input
          value={msg.button || ''}
          onChange={(e) => onUpdate({ button: e.target.value })}
          placeholder="Open Flow"
          maxLength={20}
        />
      </div>
      <div className="flex items-center justify-between">
        <Label>Draft Mode</Label>
        <Switch
          checked={msg.draft || false}
          onCheckedChange={(checked) => onUpdate({ draft: checked })}
        />
      </div>
      <div>
        <Label>Flow Token (Optional)</Label>
        <Input
          value={msg.token || ''}
          onChange={(e) => onUpdate({ token: e.target.value })}
          placeholder="Flow token"
        />
      </div>
    </div>
  );
};
