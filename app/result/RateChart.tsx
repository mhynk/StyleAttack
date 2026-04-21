"use client";

import {
  ResponsiveContainer,
  ComposedChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Bar,
  Line,
} from "recharts";

type StyleStat = {
  style: string;
  total: number;
  bypassed: number;
  partial: number;
  blocked: number;
  bypass_rate: number;
  partial_rate: number;
  block_rate: number;
};

export default function RateChart({ data }: { data: StyleStat[] }) {
  if (!data || data.length === 0) return null;

  return (
    <div
      style={{
        width: "100%",
        height: 360,
        background: "#fff",
        borderRadius: 12,
        padding: 20,
        marginTop: 24,
      }}
    >
      <h3 style={{ textAlign: "center", marginBottom: 16 }}>
        Style Attack Rate
      </h3>

      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={data}
          margin={{ top: 20, right: 20, left: 10, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="style" />
          <YAxis yAxisId="left" domain={[0, 100]} />
          <YAxis yAxisId="right" orientation="right" />
          <Tooltip />
          <Legend />

          <Bar
            yAxisId="left"
            dataKey="bypass_rate"
            name="Bypass Rate (%)"
            fill="#4e79ff"
            barSize={28}
            radius={[4, 4, 0, 0]}
          />

          <Line
            yAxisId="right"
            type="monotone"
            dataKey="total"
            name="Total Runs"
            stroke="#f28e2b"
            strokeWidth={3}
            dot={{ r: 4 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}