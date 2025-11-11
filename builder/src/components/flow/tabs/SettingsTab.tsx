import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ChatbotTemplate } from '@/types/chatbot';

interface SettingsTabProps {
  template: ChatbotTemplate;
  onUpdate: (template: ChatbotTemplate) => void;
}

export const SettingsTab = ({ template, onUpdate }: SettingsTabProps) => {
  const updateSetting = (key: string, value: any) => {
    onUpdate({
      ...template,
      settings: {
        ...template.settings,
        [key]: value,
      },
    });
  };

  const settings = template.settings || {};

  const settingItems = [
    {
      key: 'authenticated',
      label: 'Authentication Required',
      description: 'User must be authenticated to access this template',
    },
    {
      key: 'checkpoint',
      label: 'Checkpoint',
      description: 'Save user progress at this template',
    },
    {
      key: 'typing',
      label: 'Show Typing Indicator',
      description: 'Show typing indicator before sending message',
    },
    {
      key: 'ack',
      label: 'Acknowledge Receipt',
      description: 'Send read receipts back to user (blue tick message)',
    },
    {
      key: 'session',
      label: 'Enable Session',
      description: 'Enable session tracking for this template',
      defaultValue: true,
    },
  ];

  const handleStartToggle = (checked: boolean) => {
    onUpdate({
      ...template,
      settings: {
        ...(template.settings || {}),
        isStart: checked,
        // If start is enabled, force report to false; otherwise keep existing
        isReport: checked ? false : (settings.isReport ?? false),
      },
    });
  };

  const handleReportToggle = (checked: boolean) => {
    onUpdate({
      ...template,
      settings: {
        ...(template.settings || {}),
        isReport: checked,
        // If report is enabled, force start to false; otherwise keep existing
        isStart: checked ? false : (settings.isStart ?? false),
      },
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold mb-4">Template Settings</h3>
        <div className="space-y-4">
          {settingItems.map((item) => (
            <div key={item.key} className="flex items-start justify-between p-4 border rounded-lg">
              <div className="space-y-1 flex-1">
                <Label className="font-medium">{item.label}</Label>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
              <Switch
                checked={Boolean(settings[item.key as keyof typeof settings] ?? item.defaultValue ?? false)}
                onCheckedChange={(checked) => updateSetting(item.key, checked)}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="pt-4 border-t space-y-4">
        <div>
          <h3 className="font-semibold mb-4">Template Type</h3>
          <div className="space-y-4">
            <div className="flex items-start justify-between p-4 border rounded-lg bg-primary/5">
              <div className="space-y-1 flex-1">
                <Label className="font-medium">Is Start Template</Label>
                <p className="text-sm text-muted-foreground">
                  This message will be processed at the start of a conversation (only 1 allowed)
                </p>
              </div>
              <Switch
                checked={settings.isStart === true}
                onCheckedChange={handleStartToggle}
              />
            </div>

            <div className="flex items-start justify-between p-4 border rounded-lg bg-accent/5">
              <div className="space-y-1 flex-1">
                <Label className="font-medium">Is Report Template</Label>
                <p className="text-sm text-muted-foreground">
                  Display this when user clicks report or types "report" (only 1 allowed)
                </p>
              </div>
              <Switch
                checked={settings.isReport === true}
                onCheckedChange={handleReportToggle}
              />
            </div>
          </div>
        </div>

        <div>
          <Label>Trigger (Python Regex)</Label>
          <Input
            value={settings.trigger || ''}
            onChange={(e) => updateSetting('trigger', e.target.value)}
            placeholder="e.g., account|balance|statement"
            className="font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Python regex pattern to trigger this template in the flow engine
          </p>
        </div>

        <div>
          <Label>Property to Save</Label>
          <Input
            value={settings.prop || ''}
            onChange={(e) => updateSetting('prop', e.target.value)}
            placeholder="e.g., user_name, phone_number"
            className="font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Session property name to save user input to
          </p>
        </div>

        <div>
          <Label>Reply Message ID</Label>
          <Input
            value={settings.replyMsgId || ''}
            onChange={(e) => updateSetting('replyMsgId', e.target.value)}
            placeholder="Message ID to reply to"
            className="font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Last message ID to tag on reply
          </p>
        </div>

        <div>
          <Label>Reaction Emoji</Label>
          <Input
            value={settings.react || ''}
            onChange={(e) => updateSetting('react', e.target.value)}
            placeholder="e.g., 👍 ❤️ 😊"
            className="text-2xl"
            maxLength={2}
          />
          <p className="text-xs text-muted-foreground mt-1">
            WhatsApp reaction emoji to send with this message
          </p>
        </div>
      </div>
    </div>
  );
};
