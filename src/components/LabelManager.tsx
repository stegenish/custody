import { useState } from "react";
import type { CustodyLabel } from "@/lib/scheduleTypes";

interface LabelManagerProps {
  labels: CustodyLabel[];
  onAddLabel: (name: string, color: string) => void;
  onUpdateLabel: (id: string, name: string, color: string) => void;
  onDeleteLabel: (id: string) => void;
}

const DEFAULT_COLOR = "#bbf7d0";

export function LabelManager({
  labels,
  onAddLabel,
  onUpdateLabel,
  onDeleteLabel,
}: LabelManagerProps) {
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(DEFAULT_COLOR);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");

  function handleAdd() {
    if (!newName.trim()) return;
    onAddLabel(newName.trim(), newColor);
    setNewName("");
    setNewColor(DEFAULT_COLOR);
  }

  function startEdit(label: CustodyLabel) {
    setEditingId(label.id);
    setEditName(label.name);
    setEditColor(label.color);
  }

  function handleSave() {
    if (!editingId || !editName.trim()) return;
    onUpdateLabel(editingId, editName.trim(), editColor);
    setEditingId(null);
  }

  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold">Labels</h3>

      <ul className="mb-3 space-y-1">
        {labels.map((label) => (
          <li key={label.id} className="flex items-center gap-2 text-sm">
            {editingId === label.id ? (
              <>
                <input
                  type="color"
                  value={editColor}
                  onChange={(e) => setEditColor(e.target.value)}
                  className="h-6 w-6 cursor-pointer border-0 p-0"
                />
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="rounded border px-1 py-0.5 text-sm"
                />
                <button
                  type="button"
                  onClick={handleSave}
                  className="rounded bg-blue-600 px-2 py-0.5 text-xs text-white"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setEditingId(null)}
                  className="text-xs text-gray-500"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <span
                  className="inline-block h-4 w-4 rounded"
                  style={{ backgroundColor: label.color }}
                />
                <span>{label.name}</span>
                <button
                  type="button"
                  onClick={() => startEdit(label)}
                  className="text-xs text-blue-600"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteLabel(label.id)}
                  className="text-xs text-red-600"
                >
                  Delete
                </button>
              </>
            )}
          </li>
        ))}
      </ul>

      <div className="flex items-center gap-2">
        <input
          type="color"
          value={newColor}
          onChange={(e) => setNewColor(e.target.value)}
          className="h-6 w-6 cursor-pointer border-0 p-0"
        />
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Label name"
          className="rounded border px-2 py-1 text-sm"
        />
        <button
          type="button"
          onClick={handleAdd}
          className="rounded bg-green-600 px-3 py-1 text-xs text-white"
        >
          Add Label
        </button>
      </div>
    </div>
  );
}
