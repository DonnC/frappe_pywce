import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChatbotTemplate } from '@/types/chatbot';
import { TextEditor } from '../editors/TextEditor';
import { ButtonEditor } from '../editors/ButtonEditor';
import { CtaEditor } from '../editors/CtaEditor';
import { ListEditor } from '../editors/ListEditor';
import { FlowEditor } from '../editors/FlowEditor';
import { CatalogEditor } from '../editors/CatalogEditor';
import { MultiProductEditor } from '../editors/MultiProductEditor';
import { MediaEditor } from '../editors/MediaEditor';
import { LocationEditor } from '../editors/LocationEditor';
import { TemplateEditor } from '../editors/TemplateEditor';
import { DynamicEditor } from '../editors/DynamicEditor';

interface MessageTabProps {
  template: ChatbotTemplate;
  onUpdate: (template: ChatbotTemplate) => void;
}

export const MessageTab = ({ template, onUpdate }: MessageTabProps) => {
  const updateField = (field: string, value: any) => {
    onUpdate({
      ...template,
      [field]: value,
    });
  };

  const updateMessage = (updates: any) => {
    if (typeof template.message === 'string') {
      onUpdate({
        ...template,
        message: updates,
      });
    } else {
      onUpdate({
        ...template,
        message: { ...(template.message as any), ...updates },
      });
    }
  };

  const renderEditor = () => {
    switch (template.type) {
      case 'text':
        return <TextEditor template={template} onUpdate={(value) => updateField('message', value)} />;
      case 'button':
        return <ButtonEditor template={template} onUpdate={updateMessage} />;
      case 'cta':
        return <CtaEditor template={template} onUpdate={updateMessage} />;
      case 'list':
        return <ListEditor template={template} onUpdate={updateMessage} />;
      case 'flow':
        return <FlowEditor template={template} onUpdate={updateMessage} />;
      case 'catalog':
      case 'product':
        return <CatalogEditor template={template} onUpdate={updateMessage} />;
      case 'multi-product':
        return <MultiProductEditor template={template} onUpdate={updateMessage} />;
      case 'media':
        return <MediaEditor template={template} onUpdate={updateMessage} />;
      case 'location':
        return <LocationEditor template={template} onUpdate={updateMessage} />;
      case 'request-location':
        return <TextEditor template={template} onUpdate={(value) => updateField('message', value)} />;
      case 'template':
        return <TemplateEditor template={template} onUpdate={updateMessage} />;
      case 'dynamic':
        return <DynamicEditor template={template} onUpdate={(value) => updateField('message', value)} />;
      default:
        return <div className="text-muted-foreground">No editor available for this template type</div>;
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Template Name</Label>
        <Input
          value={template.name}
          onChange={(e) => updateField('name', e.target.value)}
          placeholder="e.g., ASK-USER-EMAIL"
        />
      </div>

      <div>
        <Label>Handle Orientation</Label>
        <Select
          value={template.handleOrientation || 'vertical'}
          onValueChange={(value: 'vertical' | 'horizontal') => updateField('handleOrientation', value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="vertical">Top-Bottom (Vertical)</SelectItem>
            <SelectItem value="horizontal">Left-Right (Horizontal)</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground mt-1">
          Controls where connection handles appear on this node
        </p>
      </div>

      <div className="pt-4 border-t">
        <h3 className="font-semibold mb-4">Message Configuration</h3>
        {renderEditor()}
      </div>
    </div>
  );
};
