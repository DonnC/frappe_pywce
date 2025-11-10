import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ChatbotTemplate, HookConfig, HookType } from '@/types/chatbot';
import * as React from 'react';
import { 
  FileCode, 
  MailCheck, 
  Send, 
  Shield, 
  GitBranch
} from 'lucide-react';

interface HooksTabProps {
  template: ChatbotTemplate;
  onUpdate: (template: ChatbotTemplate) => void;
}

const hookDefinitions: Record<HookType, { 
  icon: any; 
  label: string; 
  description: string;
  placeholder: string;
  order: number;
}> = {
  'template': {
    icon: FileCode,
    label: 'Template Hook',
    description: 'Pre-render: Dynamically prefill message template variables ({{ vars }})',
    placeholder: 'example.hooks.user.get_user_data',
    order: 1,
  },
  'on-receive': {
    icon: MailCheck,
    label: 'On Receive Hook',
    description: 'Post-input: Process business logic after user responds to this template',
    placeholder: 'example.hooks.validation.validate_email',
    order: 2,
  },
  'middleware': {
    icon: Shield,
    label: 'Middleware Hook',
    description: 'Interceptor: Process business logic after on-receive is executed',
    placeholder: 'example.hooks.middleware.check_permissions',
    order: 3,
  },
  'on-generate': {
    icon: Send,
    label: 'On Generate Hook',
    description: 'Pre-send: Process before template is constructed and sent to user',
    placeholder: 'example.hooks.formatter.format_message',
    order: 4,
  },
  'router': {
    icon: GitBranch,
    label: 'Router Hook',
    description: 'Dynamic routing: Dynamically compute next route, overrides template routes',
    placeholder: 'example.hooks.router.dynamic_route',
    order: 5,
  },
};

const sortedHookTypes = Object.entries(hookDefinitions)
  .sort(([, a], [, b]) => a.order - b.order)
  .map(([type]) => type as HookType);

export const HooksTab = ({ template, onUpdate }: HooksTabProps) => {
  const [paramsValue, setParamsValue] = React.useState('');

  React.useEffect(() => {
    // Initialize params value when template changes
    const sourceParams = (template.settings && template.settings.params !== undefined)
      ? template.settings.params
      : (template.hooks?.length ? template.hooks[0].params : undefined);
    const paramsString = JSON.stringify(sourceParams ?? {}, null, 2);
    setParamsValue(paramsString);
  }, [template.id]); // Only re-initialize when template ID changes

  const updateHook = (type: HookType, path: string, params?: string) => {
    const hooks = template.hooks || [];
    const existingIndex = hooks.findIndex((h) => h.type === type);
    
    let parsedParams: Record<string, any> | undefined;
    if (params) {
      try {
        parsedParams = JSON.parse(params);
      } catch {
        parsedParams = undefined;
      }
    }

    if (!path && existingIndex >= 0) {
      // Remove hook if path is empty
      const newHooks = hooks.filter((_, i) => i !== existingIndex);
      onUpdate({
        ...template,
        hooks: newHooks.length > 0 ? newHooks : undefined,
      });
    } else if (path) {
      const newHook: HookConfig = { type, path, params: parsedParams };
      
      if (existingIndex >= 0) {
        const newHooks = [...hooks];
        newHooks[existingIndex] = newHook;
        onUpdate({
          ...template,
          hooks: newHooks,
        });
      } else {
        onUpdate({
          ...template,
          hooks: [...hooks, newHook],
        });
      }
    }
  };

  const getHook = (type: HookType): HookConfig | undefined => {
    return template.hooks?.find((h) => h.type === type);
  };

  return (
    <div className="space-y-6">
      <div className="text-sm text-muted-foreground">
        Configure Python dotted paths to custom business logic functions or classes
      </div>

      {sortedHookTypes.map((type) => {
        const def = hookDefinitions[type];
        const hook = getHook(type);
        const Icon = def.icon;

        return (
          <div key={type} className="p-4 border rounded-lg space-y-3">
            <div className="flex items-start gap-2">
              <Icon className="h-5 w-5 mt-0.5 text-primary" />
              <div className="flex-1">
                <Label className="font-semibold">{def.label}</Label>
                <p className="text-xs text-muted-foreground mt-1">{def.description}</p>
              </div>
            </div>

            <div>
              <Label className="text-sm">Python Dotted Path</Label>
              <Input
                value={hook?.path || ''}
                onChange={(e) => updateHook(type, e.target.value, hook?.params ? JSON.stringify(hook.params) : '')}
                placeholder={def.placeholder}
                className="font-mono text-sm"
              />
            </div>
          </div>
        );
      })}

      <div className="space-y-3 pt-4 border-t">
        <Label className="text-sm font-semibold">Hook Parameters (JSON)</Label>
        <Textarea
          value={paramsValue}
          onChange={(e) => {
            const newValue = e.target.value;
            setParamsValue(newValue);
            
            // Try to parse and save valid JSON immediately
            try {
              const parsed = newValue.trim() ? JSON.parse(newValue) : undefined;
              const hooks = template.hooks || [];
              
              // Build a single updated template to avoid race conditions
              const updatedTemplate = {
                ...template,
                settings: {
                  ...(template.settings || {}),
                  params: parsed,
                },
              } as ChatbotTemplate;

              if (hooks.length > 0) {
                updatedTemplate.hooks = hooks.map(hook => ({
                  ...hook,
                  params: parsed,
                }));
              }

              onUpdate(updatedTemplate);
            } catch {
              // Invalid JSON - keep editing, don't save yet
            }
          }}
          placeholder='{"\n  \"key\": \"value\",\n  \"another_key\": \"another_value\"\n}'
          rows={6}
          className="font-mono text-sm"
        />
        <p className="text-xs text-muted-foreground">
          Shared parameters accessible by all hooks in this template
        </p>
      </div>

      <div className="p-4 bg-muted rounded-lg text-sm">
        <h4 className="font-semibold mb-2">Hook Execution Order</h4>
        <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
          <li>Template Hook (pre-render)</li>
          <li>On Receive Hook (post-input)</li>
          <li>Middleware Hook (interceptor)</li>
          <li>On Generate Hook (pre-send)</li>
          <li>Router Hook (dynamic routing)</li>
        </ol>
      </div>
    </div>
  );
};
