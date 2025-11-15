import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { VariableTextarea } from '@/components/ui/variable-textarea';
import { ChatbotTemplate, CatalogMessage } from '@/types/chatbot';

interface CatalogEditorProps {
  template: ChatbotTemplate;
  onUpdate: (updates: Partial<CatalogMessage>) => void;
}

export const CatalogEditor = ({ template, onUpdate }: CatalogEditorProps) => {
  const msg = template.message as CatalogMessage;

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
        <Label>Product ID (Optional)</Label>
        <Input
          value={msg.productId || ''}
          onChange={(e) => onUpdate({ productId: e.target.value })}
          placeholder="Specific product ID to showcase"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Leave empty to show full catalog
        </p>
      </div>
    </div>
  );
};
