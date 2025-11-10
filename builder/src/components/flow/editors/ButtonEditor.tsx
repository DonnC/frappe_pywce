import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { VariableTextarea } from '@/components/ui/variable-textarea';
import { Button } from '@/components/ui/button';
import { ChatbotTemplate, ButtonMessage } from '@/types/chatbot';
import { Plus, Trash2 } from 'lucide-react';

interface ButtonEditorProps {
  template: ChatbotTemplate;
  onUpdate: (updates: Partial<ButtonMessage>) => void;
}

export const ButtonEditor = ({ template, onUpdate }: ButtonEditorProps) => {
  const msg = template.message as ButtonMessage;

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
        <Label>Buttons (max 3)</Label>
        {msg.buttons?.map((button, index) => (
          <div key={index} className="flex gap-2 mb-2">
            <Input
              value={button}
              onChange={(e) => {
                const newButtons = [...(msg.buttons || [])];
                newButtons[index] = e.target.value;
                onUpdate({ buttons: newButtons });
              }}
              placeholder="Button text"
              maxLength={20}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const newButtons = msg.buttons?.filter((_, i) => i !== index);
                onUpdate({ buttons: newButtons });
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        {(!msg.buttons || msg.buttons.length < 3) && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              onUpdate({ buttons: [...(msg.buttons || []), ''] });
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Button
          </Button>
        )}
      </div>
    </div>
  );
};
