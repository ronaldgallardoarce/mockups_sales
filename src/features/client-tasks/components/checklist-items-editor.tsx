import { GripVertical, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ChecklistItemsEditorProps {
  value: string[];
  onChange: (value: string[]) => void;
}

/** Controlled editor for the checklist entries of a "checklist" task. */
export function ChecklistItemsEditor({ value, onChange }: ChecklistItemsEditorProps) {
  const items = value.length > 0 ? value : [""];

  const update = (index: number, text: string) => {
    const next = [...items];
    next[index] = text;
    onChange(next);
  };

  const add = () => onChange([...items, ""]);

  const remove = (index: number) => {
    const next = items.filter((_, i) => i !== index);
    onChange(next.length > 0 ? next : [""]);
  };

  return (
    <div className="space-y-2">
      <ul className="space-y-1.5">
        {items.map((item, index) => (
          <li key={index} className="flex items-center gap-2">
            <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground/60" />
            <Input
              value={item}
              onChange={(e) => update(index, e.target.value)}
              placeholder={`Ítem ${index + 1}`}
              className="h-8 flex-1 text-sm"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
              onClick={() => remove(index)}
              aria-label={`Quitar ítem ${index + 1}`}
            >
              <X className="h-4 w-4" />
            </Button>
          </li>
        ))}
      </ul>
      <Button type="button" variant="outline" size="sm" onClick={add}>
        <Plus className="h-3.5 w-3.5" /> Agregar ítem
      </Button>
    </div>
  );
}
