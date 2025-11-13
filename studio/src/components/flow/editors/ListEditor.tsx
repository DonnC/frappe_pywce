import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { VariableTextarea } from '@/components/ui/variable-textarea';
import { Button } from '@/components/ui/button';
import { ChatbotTemplate, ListMessage } from '@/types/chatbot';
import { Plus, Trash2 } from 'lucide-react';

interface ListEditorProps {
  template: ChatbotTemplate;
  onUpdate: (updates: Partial<ListMessage>) => void;
}

export const ListEditor = ({ template, onUpdate }: ListEditorProps) => {
  const msg = template.message as ListMessage;

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
        <Label>Button Text</Label>
        <Input
          value={msg.button || ''}
          onChange={(e) => onUpdate({ button: e.target.value })}
          placeholder="View Options"
          maxLength={20}
        />
      </div>
      <div>
        <Label>Sections</Label>
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
              <Label className="text-xs">Rows</Label>
              {section.rows?.map((row, rowIndex) => (
                <div key={rowIndex} className="grid grid-cols-2 gap-2">
                  <Input
                    value={row.id}
                    onChange={(e) => {
                      const newSections = [...(msg.sections || [])];
                      const newRows = [...section.rows];
                      newRows[rowIndex] = { ...row, id: e.target.value };
                      newSections[sectionIndex] = { ...section, rows: newRows };
                      onUpdate({ sections: newSections });
                    }}
                    placeholder="Row ID"
                    className="text-xs"
                  />
                  <Input
                    value={row.title}
                    onChange={(e) => {
                      const newSections = [...(msg.sections || [])];
                      const newRows = [...section.rows];
                      newRows[rowIndex] = { ...row, title: e.target.value };
                      newSections[sectionIndex] = { ...section, rows: newRows };
                      onUpdate({ sections: newSections });
                    }}
                    placeholder="Row title"
                    className="text-xs"
                  />
                  <Input
                    value={row.desc || ''}
                    onChange={(e) => {
                      const newSections = [...(msg.sections || [])];
                      const newRows = [...section.rows];
                      newRows[rowIndex] = { ...row, desc: e.target.value };
                      newSections[sectionIndex] = { ...section, rows: newRows };
                      onUpdate({ sections: newSections });
                    }}
                    placeholder="Description (optional)"
                    className="text-xs col-span-2"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const newSections = [...(msg.sections || [])];
                      const newRows = section.rows.filter((_, i) => i !== rowIndex);
                      newSections[sectionIndex] = { ...section, rows: newRows };
                      onUpdate({ sections: newSections });
                    }}
                    className="col-span-2"
                  >
                    <Trash2 className="h-3 w-3 mr-2" />
                    Remove Row
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const newSections = [...(msg.sections || [])];
                  const newRows = [...(section.rows || []), { id: '', title: '' }];
                  newSections[sectionIndex] = { ...section, rows: newRows };
                  onUpdate({ sections: newSections });
                }}
              >
                <Plus className="h-3 w-3 mr-2" />
                Add Row
              </Button>
            </div>
          </div>
        ))}
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            onUpdate({ sections: [...(msg.sections || []), { title: '', rows: [] }] });
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Section
        </Button>
      </div>
    </div>
  );
};
