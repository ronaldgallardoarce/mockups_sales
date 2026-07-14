import { useMemo } from "react";
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Client } from "@/types";
import { CHANNELS } from "@/data/channels";

interface TooltipItem {
  name: string;
  value: number;
  payload: { color: string };
}

function ChartTooltip({ active, payload }: { active?: boolean; payload?: TooltipItem[] }) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-md">
      <div className="flex items-center gap-1.5 font-medium">
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.payload.color }} />
        {item.name}
      </div>
      <p className="mt-0.5 text-muted-foreground">
        <span className="font-semibold text-foreground">{item.value}</span> clientes
      </p>
    </div>
  );
}

export function ClientsByChannelChart({ clients }: { clients: Client[] }) {
  const data = useMemo(
    () =>
      CHANNELS.map((ch) => ({
        name: ch.name,
        color: ch.color,
        value: clients.filter((c) => c.channelId === ch.id).length,
      })),
    [clients],
  );

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="name"
          width={92}
          axisLine={false}
          tickLine={false}
          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
        />
        <Tooltip cursor={{ fill: "hsl(var(--muted))", opacity: 0.4 }} content={<ChartTooltip />} />
        <Bar dataKey="value" radius={[4, 4, 4, 4]} barSize={18}>
          {data.map((entry) => (
            <Cell key={entry.name} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
