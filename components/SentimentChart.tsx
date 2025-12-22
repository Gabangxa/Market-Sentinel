import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { AnalysisResult } from '../types';

interface SentimentChartProps {
  data: AnalysisResult[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-900 border border-gray-700 p-3 rounded shadow-xl">
        <p className="text-gray-400 text-xs mb-1">{label}</p>
        <p className="text-emerald-400 font-mono font-bold">
          Score: {payload[0].value.toFixed(2)}
        </p>
      </div>
    );
  }
  return null;
};

export const SentimentChart: React.FC<SentimentChartProps> = ({ data }) => {
  const chartData = data.map(d => ({
    time: d.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    score: d.sentimentScore,
  })).slice(-10); // Show last 10 points

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
          <XAxis 
            dataKey="time" 
            stroke="#9ca3af" 
            tick={{ fontSize: 12 }} 
            axisLine={false}
            tickLine={false}
          />
          <YAxis 
            domain={[-1, 1]} 
            stroke="#9ca3af" 
            tick={{ fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={0} stroke="#4b5563" strokeDasharray="3 3" />
          <Line 
            type="monotone" 
            dataKey="score" 
            stroke="#10b981" 
            strokeWidth={2} 
            dot={{ r: 4, fill: '#064e3b', strokeWidth: 2, stroke: '#10b981' }}
            activeDot={{ r: 6, fill: '#10b981' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};