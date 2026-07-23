import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ChecklistItemsEditorProps {
  value: string[];
  onChange: (value: string[]) => void;
}

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
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <span className="w-5 shrink-0 text-center text-xs tabular-nums text-muted-foreground">
            {index + 1}.
          </span>
          <Input
            value={item}
            onChange={(e) => update(index, e.target.value)}
            placeholder="Descripción del ítem"
            className="h-8"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
            onClick={() => remove(index)}
            aria-label="Quitar ítem"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={add}>
        <Plus className="h-3.5 w-3.5" /> Agregar ítem
      </Button>
    </div>
  );
}
