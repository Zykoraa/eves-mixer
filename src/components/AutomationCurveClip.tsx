import React, { useState, useRef } from 'react';
import { AutomationClip, AutomationNode } from '../types/daw';
import { useDawStore } from '../store/useDawStore';
import { TrendingUp, X } from 'lucide-react';

interface AutomationCurveClipProps {
  clip: AutomationClip;
  width: number;
  height: number;
}

export const AutomationCurveClip: React.FC<AutomationCurveClipProps> = ({ clip, width, height }) => {
  const [, store] = useDawStore();
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);

  const nodes = [...(clip.nodes || [])].sort((a, b) => a.bar - b.bar);

  // Coordinate transforms
  const barToX = (bar: number) => {
    const fraction = Math.max(0, Math.min(1, bar / clip.lengthBars));
    return fraction * width;
  };

  const valToY = (val: number) => {
    // 0 = bottom, 1 = top (with padding)
    const pad = 8;
    const innerH = height - pad * 2;
    return height - pad - Math.max(0, Math.min(1, val)) * innerH;
  };

  const xToBar = (x: number) => {
    const frac = Math.max(0, Math.min(1, x / width));
    return frac * clip.lengthBars;
  };

  const yToVal = (y: number) => {
    const pad = 8;
    const innerH = height - pad * 2;
    const frac = (height - pad - y) / innerH;
    return Math.max(0, Math.min(1, frac));
  };

  // Generate SVG path for the curve
  const generatePathData = () => {
    if (nodes.length === 0) return '';
    let d = `M 0 ${valToY(nodes[0].value)}`;

    for (let i = 0; i < nodes.length; i++) {
      const current = nodes[i];
      const next = nodes[i + 1];

      const x1 = barToX(current.bar);
      const y1 = valToY(current.value);

      if (i === 0 && current.bar > 0) {
        d += ` L ${x1} ${y1}`;
      }

      if (!next) {
        d += ` L ${width} ${y1}`;
        break;
      }

      const x2 = barToX(next.bar);
      const y2 = valToY(next.value);
      const tension = current.tension || 0;

      // Draw tension curve using multi-segment interpolation
      const steps = 12;
      for (let s = 1; s <= steps; s++) {
        let t = s / steps;
        if (tension > 0) {
          t = Math.pow(t, 1 + tension * 2.5);
        } else if (tension < 0) {
          t = 1 - Math.pow(1 - t, 1 + Math.abs(tension) * 2.5);
        }
        const interX = x1 + (x2 - x1) * (s / steps);
        const interY = y1 + (y2 - y1) * t;
        d += ` L ${interX.toFixed(1)} ${interY.toFixed(1)}`;
      }
    }

    return d;
  };

  // Handle clicking on SVG background to add a node
  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (draggingNodeId) return;
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;

    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const newBar = Number(xToBar(clickX).toFixed(2));
    const newVal = Number(yToVal(clickY).toFixed(2));

    store.addAutomationNode(clip.id, newBar, newVal, 0);
  };

  // Dragging a node
  const startDragNode = (e: React.MouseEvent, node: AutomationNode) => {
    e.stopPropagation();
    setDraggingNodeId(node.id);

    const onMouseMove = (moveEvent: MouseEvent) => {
      const rect = svgRef.current?.getBoundingClientRect();
      if (!rect) return;
      const curX = moveEvent.clientX - rect.left;
      const curY = moveEvent.clientY - rect.top;

      const newBar = Number(xToBar(curX).toFixed(2));
      const newVal = Number(yToVal(curY).toFixed(2));

      store.updateAutomationNode(clip.id, node.id, {
        bar: newBar,
        value: newVal,
      });
    };

    const onMouseUp = () => {
      setDraggingNodeId(null);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const pathD = generatePathData();
  const areaD = pathD ? `${pathD} L ${width} ${height} L 0 ${height} Z` : '';

  return (
    <div
      className="absolute top-1 bottom-1 rounded-sm border overflow-hidden shadow-md group select-none"
      style={{
        left: `${clip.startBar * 80 + 2}px`,
        width: `${width - 4}px`,
        backgroundColor: '#161922ee',
        borderColor: clip.color,
      }}
    >
      {/* Header bar */}
      <div className="absolute top-0.5 left-1.5 right-1 flex items-center justify-between pointer-events-none z-10 text-[10px] font-mono font-bold">
        <div className="flex items-center gap-1 text-pink-400 truncate">
          <TrendingUp size={11} />
          <span className="truncate">{clip.name}</span>
        </div>
        <div className="flex items-center gap-1 pointer-events-auto">
          <select
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => {
              e.stopPropagation();
              const val = e.target.value as 'sine' | 'triangle' | 'saw' | 'square' | 'sh' | 'pump' | 'riser';
              if (val) {
                store.applyLfoShape(clip.id, val);
              }
            }}
            defaultValue=""
            className="bg-[#12141cee] text-[8px] font-mono text-gray-300 rounded px-1 py-0.2 border border-[#34384c] focus:outline-none cursor-pointer"
            title="Generate LFO Curve Shape"
          >
            <option value="" disabled>LFO</option>
            <option value="pump">Pump</option>
            <option value="riser">Riser</option>
            <option value="sine">Sine</option>
            <option value="triangle">Tri</option>
            <option value="saw">Saw</option>
            <option value="square">Square</option>
            <option value="sh">S&H</option>
          </select>
          <button
            onClick={(e) => {
              e.stopPropagation();
              store.removeAutomationClip(clip.id);
            }}
            className="p-0.5 rounded hover:bg-red-500/20 text-gray-400 hover:text-red-400"
            title="Delete Automation Clip"
          >
            <X size={11} />
          </button>
        </div>
      </div>

      {/* SVG Canvas */}
      <svg
        ref={svgRef}
        width={width}
        height={height}
        onClick={handleSvgClick}
        className="w-full h-full cursor-crosshair"
      >
        {/* Fill underneath curve */}
        {areaD && (
          <path
            d={areaD}
            fill={clip.color}
            fillOpacity={0.18}
          />
        )}

        {/* The curve line */}
        {pathD && (
          <path
            d={pathD}
            fill="none"
            stroke={clip.color}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Nodes */}
        {nodes.map((node) => {
          const cx = barToX(node.bar);
          const cy = valToY(node.value);

          return (
            <g key={node.id}>
              {/* Outer hit ring */}
              <circle
                cx={cx}
                cy={cy}
                r={9}
                fill="transparent"
                className="cursor-grab active:cursor-grabbing"
                onMouseDown={(e) => startDragNode(e, node)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  store.removeAutomationNode(clip.id, node.id);
                }}
              />
              {/* Visible node circle */}
              <circle
                cx={cx}
                cy={cy}
                r={4}
                fill="#ffffff"
                stroke={clip.color}
                strokeWidth={2}
                className="pointer-events-none drop-shadow"
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
};
