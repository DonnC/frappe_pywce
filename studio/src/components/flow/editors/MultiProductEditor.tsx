import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { VariableTextarea } from '@/components/ui/variable-textarea';
import { Button } from '@/components/ui/button';
import { ChatbotTemplate, MultiProductMessage } from '@/types/chatbot';
import { Plus, Trash2 } from 'lucide-react';

interface MultiProductEditorProps {
  template: ChatbotTemplate;
  onUpdate: (updates: Partial<MultiProductMessage>) => void;
}

export const MultiProductEditor = ({ template, onUpdate }: MultiProductEditorProps) => {
  const msg = template.message as MultiProductMessage;

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
        <Label>Catalog ID</Label>
        <Input
          value={msg.catalogId || ''}
          onChange={(e) => onUpdate({ catalogId: e.target.value })}
          placeholder="Your catalog ID"
        />
      </div>
      <div>
        <Label>Product Sections</Label>
        {msg.sections?.map((section, sectionIndex) => (
          <div key={sectionIndex} className="border rounded-lg p-3 mb-3 space-y-2">
            <div className="flex gap-2">
              <Input
                value={section.title}
                onChange={(e) => {
                  const newSections = [...(msg.sections || [])];
                  newSections[sectionIndex] = { ...section, title: e.target.value };
                  onUpdate({ sections: newSections });
                }}
                placeholder="Section title"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const newSections = msg.sections?.filter((_, i) => i !== sectionIndex);
                  onUpdate({ sections: newSections });
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <div className="ml-4 space-y-2">
              <Label className="text-xs">Product IDs</Label>
              {section.products?.map((productId, productIndex) => (
                <div key={productIndex} className="flex gap-2">
                  <Input
                    value={productId}
                    onChange={(e) => {
                      const newSections = [...(msg.sections || [])];
                      const newProducts = [...section.products];
                      newProducts[productIndex] = e.target.value;
                      newSections[sectionIndex] = { ...section, products: newProducts };
                      onUpdate({ sections: newSections });
                    }}
                    placeholder="Product ID"
                    className="text-xs"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const newSections = [...(msg.sections || [])];
                      const newProducts = section.products.filter((_, i) => i !== productIndex);
                      newSections[sectionIndex] = { ...section, products: newProducts };
                      onUpdate({ sections: newSections });
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const newSections = [...(msg.sections || [])];
                  const newProducts = [...(section.products || []), ''];
                  newSections[sectionIndex] = { ...section, products: newProducts };
                  onUpdate({ sections: newSections });
                }}
              >
                <Plus className="h-3 w-3 mr-2" />
                Add Product
              </Button>
            </div>
          </div>
        ))}
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            onUpdate({ sections: [...(msg.sections || []), { title: '', products: [] }] });
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Section
        </Button>
      </div>
    </div>
  );
};
