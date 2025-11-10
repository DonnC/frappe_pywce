import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { ChatbotTemplate, RouteConfig } from '@/types/chatbot';
import { Plus, Trash2 } from 'lucide-react';

interface RoutesTabProps {
  template: ChatbotTemplate;
  onUpdate: (template: ChatbotTemplate) => void;
}

export const RoutesTab = ({ template, onUpdate }: RoutesTabProps) => {
  const addRoute = () => {
    const newRoute: RouteConfig = {
      id: `route_${Date.now()}`,
      pattern: '',
      isRegex: false,
    };
    onUpdate({
      ...template,
      routes: [...(template.routes || []), newRoute],
    });
  };

  const updateRoute = (index: number, updates: Partial<RouteConfig>) => {
    const newRoutes = [...(template.routes || [])];
    newRoutes[index] = { ...newRoutes[index], ...updates };
    onUpdate({
      ...template,
      routes: newRoutes,
    });
  };

  const deleteRoute = (index: number) => {
    const newRoutes = template.routes?.filter((_, i) => i !== index);
    onUpdate({
      ...template,
      routes: newRoutes,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Routes ({template.routes?.length || 0})</h3>
        <Button variant="outline" size="sm" onClick={addRoute}>
          <Plus className="h-4 w-4 mr-2" />
          Add Route
        </Button>
      </div>

      {template.routes?.map((route, index) => (
        <div key={route.id} className="p-4 border rounded-lg space-y-3">
          <div className="flex items-center justify-between">
            <Label>Route {index + 1}</Label>
            <Button variant="ghost" size="sm" onClick={() => deleteRoute(index)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <div>
            <Label>User Input Pattern</Label>
            <Input
              value={route.pattern}
              onChange={(e) => updateRoute(index, { pattern: e.target.value })}
              placeholder={route.isRegex ? '.*' : 'exact text to match'}
              className="font-mono text-sm"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Use as Regex Pattern</Label>
              <p className="text-xs text-muted-foreground">
                Match user input using regular expressions
              </p>
            </div>
            <Switch
              checked={route.isRegex}
              onCheckedChange={(checked) => updateRoute(index, { isRegex: checked })}
            />
          </div>

          {route.connectedTo && (
            <div className="pt-2 border-t">
              <Label className="text-xs text-muted-foreground">Connected To</Label>
              <p className="font-mono text-sm">{route.connectedTo}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Use the visual editor to connect nodes by dragging between them
              </p>
            </div>
          )}
        </div>
      ))}

      {(!template.routes || template.routes.length === 0) && (
        <div className="text-center py-8 text-muted-foreground">
          <p>No routes configured</p>
          <p className="text-sm mt-1">Add routes to define navigation flow</p>
        </div>
      )}
    </div>
  );
};
