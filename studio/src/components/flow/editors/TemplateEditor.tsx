import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChatbotTemplate, TemplateMessage } from '@/types/chatbot';

interface TemplateEditorProps {
  template: ChatbotTemplate;
  onUpdate: (updates: Partial<TemplateMessage>) => void;
}

export const TemplateEditor = ({ template, onUpdate }: TemplateEditorProps) => {
  const msg = template.message as TemplateMessage;

  return (
    <div className="space-y-4">
      <div>
        <Label>Template Name</Label>
        <Input
          value={msg.name || ''}
          onChange={(e) => onUpdate({ name: e.target.value })}
          placeholder="hello_world"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Template name from WhatsApp Business Manager
        </p>
      </div>
      <div>
        <Label>Language Code</Label>
        <Input
          value={msg.language || ''}
          onChange={(e) => onUpdate({ language: e.target.value })}
          placeholder="en_US"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Language code (e.g., en_US, es_ES)
        </p>
      </div>
    </div>
  );
};
