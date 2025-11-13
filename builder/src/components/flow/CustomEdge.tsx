import { 
  BaseEdge, 
  EdgeLabelRenderer, 
  EdgeProps, 
  getSmoothStepPath,
  getStraightPath,
  getBezierPath,
} from 'reactflow';
import { Code2 } from 'lucide-react';

export const CustomEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  label,
  data,
}: EdgeProps) => {
  let edgePath: string;
  let labelX: number;
  let labelY: number;

  const edgeType = data?.edgeType || 'default';

  if (edgeType === 'straight') {
    [edgePath, labelX, labelY] = getStraightPath({
      sourceX,
      sourceY,
      targetX,
      targetY,
    });
  } else if (edgeType === 'step' || edgeType === 'smoothstep') {
    [edgePath, labelX, labelY] = getSmoothStepPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
    });
  } else {
    [edgePath, labelX, labelY] = getBezierPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
    });
  }

  const isRegex = data?.isRegex;

  return (
    <>
      <BaseEdge id={id} path={edgePath} />
      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: 'all',
            }}
            className="nodrag nopan bg-background border border-border rounded px-2 py-1 text-xs font-mono flex items-center gap-1 shadow-sm"
          >
            {isRegex && label !== 'any' && (
              <Code2 className="h-3 w-3 text-purple-500" />
            )}
            <span>{label}</span>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};
