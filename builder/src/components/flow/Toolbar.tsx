import { Button } from '@/components/ui/button';
import { 
  Undo2, Redo2, Maximize, Download, Upload, Plus, 
  LayoutGrid, Ruler 
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { TemplateType } from '@/types/chatbot';

interface ToolbarProps {
  onUndo: () => void;
  onRedo: () => void;
  onAutoLayout: () => void;
  onToggleMinimap: () => void;
  onExport: () => void;
  onImport: () => void;
  onAddTemplate: (type: TemplateType) => void;
  onToggleEdgeType: () => void;
  canUndo: boolean;
  canRedo: boolean;
  minimapVisible: boolean;
  edgeType: 'default' | 'straight' | 'step' | 'smoothstep';
}

const templateTypes: { type: TemplateType; label: string }[] = [
  { type: 'text', label: 'Text Message' },
  { type: 'button', label: 'Button Message' },
  { type: 'list', label: 'List Message' },
  { type: 'flow', label: 'Flow Message' },
  { type: 'media', label: 'Media Message' },
  { type: 'catalog', label: 'Catalog' },
  { type: 'product', label: 'Product' },
  { type: 'multi-product', label: 'Multi Product' },
  { type: 'location', label: 'Location' },
  { type: 'request-location', label: 'Request Location' },
  { type: 'cta', label: 'Call to Action' },
  { type: 'dynamic', label: 'Dynamic' },
  { type: 'template', label: 'Template' },
];

export const Toolbar = ({
  onUndo,
  onRedo,
  onAutoLayout,
  onToggleMinimap,
  onExport,
  onImport,
  onAddTemplate,
  onToggleEdgeType,
  canUndo,
  canRedo,
  minimapVisible,
  edgeType,
}: ToolbarProps) => {
  return (
    <div className="absolute top-4 left-4 z-10 flex gap-2 bg-background border rounded-lg shadow-lg p-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Template
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          {templateTypes.map((template) => (
            <DropdownMenuItem
              key={template.type}
              onClick={() => onAddTemplate(template.type)}
            >
              {template.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="h-8 w-px bg-border" />

      <Button
        variant="outline"
        size="sm"
        onClick={onUndo}
        disabled={!canUndo}
        title="Undo"
      >
        <Undo2 className="h-4 w-4" />
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={onRedo}
        disabled={!canRedo}
        title="Redo"
      >
        <Redo2 className="h-4 w-4" />
      </Button>

      <div className="h-8 w-px bg-border" />

      <Button
        variant="outline"
        size="sm"
        onClick={onAutoLayout}
        title="Auto Layout"
      >
        <LayoutGrid className="h-4 w-4" />
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={onToggleMinimap}
        title="Toggle Minimap"
        className={minimapVisible ? 'bg-accent' : ''}
      >
        <Maximize className="h-4 w-4" />
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={onToggleEdgeType}
        title={`Edge Type: ${edgeType}`}
        className="capitalize"
      >
        <Ruler className="h-4 w-4 mr-1" />
        {edgeType}
      </Button>

      <div className="h-8 w-px bg-border" />

      <Button variant="outline" size="sm" onClick={onImport} title="Import">
        <Upload className="h-4 w-4" />
      </Button>

      <Button variant="outline" size="sm" onClick={onExport} title="Export">
        <Download className="h-4 w-4" />
      </Button>
    </div>
  );
};
