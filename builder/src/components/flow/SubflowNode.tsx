import { memo } from 'react';
import { NodeProps } from 'reactflow';
import { Folder } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SubflowData {
  id: string;
  name: string;
  childCount: number;
}

export const SubflowNode = memo(({ data, selected }: NodeProps<SubflowData>) => {
  return (
    <div
      className={cn(
        'min-w-[300px] min-h-[200px] rounded-lg border-2 border-dashed bg-muted/50 shadow-md transition-all p-4',
        'border-slate-300 hover:border-slate-400',
        selected && 'ring-2 ring-primary ring-offset-2'
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        <Folder className="h-5 w-5 text-muted-foreground" />
        <span className="font-semibold text-sm">{data.name || data.id}</span>
      </div>
      
      <div className="text-xs text-muted-foreground">
        {data.childCount} node{data.childCount !== 1 ? 's' : ''}
      </div>
      
      <div className="mt-2 text-xs text-muted-foreground italic">
        Drag nodes here to group them
      </div>
    </div>
  );
});

SubflowNode.displayName = 'SubflowNode';
