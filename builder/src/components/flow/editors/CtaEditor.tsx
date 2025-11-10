import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { VariableTextarea } from '@/components/ui/variable-textarea';
import { ChatbotTemplate, CtaMessage } from '@/types/chatbot';

interface CtaEditorProps {
  template: ChatbotTemplate;
  onUpdate: (updates: Partial<CtaMessage>) => void;
}

export const CtaEditor = ({ template, onUpdate }: CtaEditorProps) => {
  const msg = template.message as CtaMessage;

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
        <Label>Call-to-Action URL</Label>
        <Input
          value={msg.url || ''}
          onChange={(e) => onUpdate({ url: e.target.value })}
          placeholder="https://example.com"
          type="url"
        />
      </div>
      <div>
        <Label>Button Text</Label>
        <Input
          value={msg.button || ''}
          onChange={(e) => onUpdate({ button: e.target.value })}
          placeholder="Visit Website"
          maxLength={20}
        />
      </div>
    </div>
  );
};
