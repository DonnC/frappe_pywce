import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { 
  MessageSquare, Menu, List, Workflow, Image, ShoppingCart, 
  MapPin, Link2, Sparkles, FileCode, Navigation, Package, Flag, Play
} from 'lucide-react';
import { ChatbotTemplate, TemplateType } from '@/types/chatbot';
import { cn } from '@/lib/utils';

const templateIcons: Record<TemplateType, any> = {
  text: MessageSquare,
  button: Menu,
  list: List,
  flow: Workflow,
  media: Image,
  catalog: ShoppingCart,
  product: Package,
  'multi-product': ShoppingCart,
  location: MapPin,
  'request-location': Navigation,
  cta: Link2,
  dynamic: Sparkles,
  template: FileCode,
};

const templateColors: Record<TemplateType, string> = {
  text: 'bg-blue-50 border-blue-300 hover:border-blue-400',
  button: 'bg-green-50 border-green-300 hover:border-green-400',
  list: 'bg-purple-50 border-purple-300 hover:border-purple-400',
  flow: 'bg-cyan-50 border-cyan-300 hover:border-cyan-400',
  media: 'bg-pink-50 border-pink-300 hover:border-pink-400',
  catalog: 'bg-orange-50 border-orange-300 hover:border-orange-400',
  product: 'bg-amber-50 border-amber-300 hover:border-amber-400',
  'multi-product': 'bg-amber-50 border-amber-300 hover:border-amber-400',
  location: 'bg-red-50 border-red-300 hover:border-red-400',
  'request-location': 'bg-orange-50 border-orange-300 hover:border-orange-400',
  cta: 'bg-teal-50 border-teal-300 hover:border-teal-400',
  dynamic: 'bg-violet-50 border-violet-300 hover:border-violet-400',
  template: 'bg-yellow-50 border-yellow-300 hover:border-yellow-400',
};

export const TemplateNode = memo(({ data, selected }: NodeProps<ChatbotTemplate>) => {
  const Icon = templateIcons[data.type];
  const colorClass = templateColors[data.type];
  const routeCount = data.routes?.length || 0;
  const orientation = data.handleOrientation || 'vertical';

  return (
    <div
      className={cn(
        'relative min-w-[200px] rounded-lg border-2 bg-card shadow-md transition-all',
        colorClass,
        selected && 'ring-2 ring-primary ring-offset-2'
      )}
    >
      {/* Target handles based on orientation */}
      {orientation === 'vertical' ? (
        <Handle type="target" position={Position.Top} className="!bg-primary" />
      ) : (
        <Handle type="target" position={Position.Left} className="!bg-primary" />
      )}
      {/* Badges for start/report */}
      {(data.settings?.isStart || data.settings?.isReport) && (
        <div className="absolute top-2 right-2 flex items-center gap-1">
          {data.settings?.isStart && (
            <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] bg-primary/10 text-primary border border-primary/20">
              <Play className="h-3 w-3" /> Start
            </span>
          )}
          {data.settings?.isReport && (
            <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] bg-accent/10 text-accent-foreground border border-border/30">
              <Flag className="h-3 w-3" /> Report
            </span>
          )}
        </div>
      )}
      
      <div className="p-3">
        <div className="flex items-center gap-2 mb-2">
          <Icon className="h-4 w-4 flex-shrink-0" />
          <span className="font-medium text-xs uppercase tracking-wide opacity-70">
            {data.type}
          </span>
        </div>
        
        <div className="font-semibold text-sm mb-1">{data.name || data.id}</div>
        
        <div className="text-xs text-muted-foreground">
          {routeCount} route{routeCount !== 1 ? 's' : ''}
        </div>
        
        {data.settings?.authenticated && (
          <div className="mt-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
            🔒 Auth Required
          </div>
        )}
      </div>
      
      {/* Dynamic source handles based on routes and handle orientation */}
      {data.routes && data.routes.length > 0 ? (
        data.routes.map((route, index) => {
          const position = orientation === 'vertical' ? Position.Bottom : Position.Right;
          const total = data.routes?.length || 1;
          const spacing = 100 / (total + 1);
          const offset = spacing * (index + 1);
          
          const style = orientation === 'vertical' 
            ? { left: `${offset}%`, transform: 'translateX(-50%)' }
            : { top: `${offset}%`, transform: 'translateY(-50%)' };
          
          return (
            <Handle
              key={route.id}
              type="source"
              position={position}
              id={route.id}
              className="!bg-primary !w-3 !h-3"
              style={style}
            />
          );
        })
      ) : (
        <Handle 
          type="source" 
          position={orientation === 'vertical' ? Position.Bottom : Position.Right}
          id="default"
          className="!bg-primary !w-3 !h-3"
        />
      )}
    </div>
  );
});

TemplateNode.displayName = 'TemplateNode';
