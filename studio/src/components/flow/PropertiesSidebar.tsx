import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChatbotTemplate } from '@/types/chatbot';
import { MessageTab } from './tabs/MessageTab';
import { RoutesTab } from './tabs/RoutesTab';
import { HooksTab } from './tabs/HooksTab';
import { SettingsTab } from './tabs/SettingsTab';

interface PropertiesSidebarProps {
  template: ChatbotTemplate | null;
  onClose: () => void;
  onUpdate: (template: ChatbotTemplate) => void;
  onDelete: () => void;
}

export const PropertiesSidebar = ({
  template,
  onClose,
  onUpdate,
  onDelete,
}: PropertiesSidebarProps) => {
  if (!template) return null;

  return (
    <div className="w-[500px] h-full bg-sidebar-background border-l border-sidebar-border flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
        <div>
          <h2 className="font-semibold">Template: {template.name || template.id}</h2>
          <span className="inline-block mt-1 px-2 py-1 bg-foreground text-background text-xs rounded-full uppercase">
            {template.type}
          </span>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <Tabs defaultValue="message" className="flex-1 flex flex-col">
        <TabsList className="w-full justify-start rounded-none border-b px-4">
          <TabsTrigger value="message">Message</TabsTrigger>
          <TabsTrigger value="routes">Routes</TabsTrigger>
          <TabsTrigger value="hooks">Hooks</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-y-auto">
          <TabsContent value="message" className="m-0 p-4">
            <MessageTab template={template} onUpdate={onUpdate} />
          </TabsContent>

          <TabsContent value="routes" className="m-0 p-4">
            <RoutesTab template={template} onUpdate={onUpdate} />
          </TabsContent>

          <TabsContent value="hooks" className="m-0 p-4">
            <HooksTab template={template} onUpdate={onUpdate} />
          </TabsContent>

          <TabsContent value="settings" className="m-0 p-4">
            <SettingsTab template={template} onUpdate={onUpdate} />
          </TabsContent>
        </div>
      </Tabs>

      <div className="p-4 border-t border-sidebar-border flex gap-2">
        <Button className="flex-1" onClick={onClose}>
          Save Changes
        </Button>
        <Button variant="destructive" onClick={onDelete}>
          Delete Template
        </Button>
      </div>
    </div>
  );
};
