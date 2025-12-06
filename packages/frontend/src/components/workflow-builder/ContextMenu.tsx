import { Trash2 } from "lucide-react";

interface ContextMenuProps {
  id: string;
  top?: number;
  left?: number;
  right?: number;
  bottom?: number;
  onClick: (event: React.MouseEvent<Element, MouseEvent>) => void;
  onNodeDelete: (nodeId: string) => void;
}

export default function ContextMenu({ id, top, left, right, bottom, onNodeDelete, ...props }: ContextMenuProps) {
  return (
    <div
      style={{ top, left, right, bottom }}
      className="absolute z-50 bg-white rounded-lg shadow-lg border border-slate-200 py-1 min-w-40"
      {...props}
    >
      <button
        onClick={() => onNodeDelete(id)}
        className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors cursor-pointer"
      >
        <Trash2 size={14} className="text-red-500" />
        Delete
      </button>
    </div>
  );
}
