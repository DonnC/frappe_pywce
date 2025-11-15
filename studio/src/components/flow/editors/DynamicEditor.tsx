import { Label } from '@/components/ui/label';
import { VariableTextarea } from '@/components/ui/variable-textarea';
import { ChatbotTemplate } from '@/types/chatbot';

interface DynamicEditorProps {
  template: ChatbotTemplate;
  onUpdate: (updates: any) => void;
}

export const DynamicEditor = ({ template, onUpdate }: DynamicEditorProps) => {
  return (
    <div className="space-y-4">
      <div>
        <Label>Dynamic Content</Label>
        <VariableTextarea
          value={template.message as string}
          onChange={(e) => onUpdate(e.target.value)}
          placeholder="Enter dynamic message content. Use {{variable}} for dynamic values."
          rows={4}
        />
        <p className="text-xs text-muted-foreground mt-1">
          Use <code className="bg-muted px-1 rounded">{"{{variable}}"}</code> syntax for dynamic values
        </p>
      </div>
    </div>
  );
};
