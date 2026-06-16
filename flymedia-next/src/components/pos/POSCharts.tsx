import React from 'react';

// Sparkline for stats widgets
export function Sparkline({ points, strokeColor }: { points: number[]; strokeColor: string }) {
  const width = 140;
  const height = 36;
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = max - min || 1;

  const coords = points.map((p, i) => {
    const x = (i / (points.length - 1)) * width;
    const y = height - ((p - min) / range) * (height - 8) - 4;
    return `${x},${y}`;
  });

  const pathData = `M ${coords.join(' L ')}`;

  return (
    <div className="relative h-9 w-36">
      <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
        <path
          d={pathData}
          fill="none"
          stroke={strokeColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

// Daily Sales Trend Chart
interface SalesTrendPoint {
  day: string;
  sales: number;
}

export function DailySalesTrendChart({ data }: { data?: SalesTrendPoint[] }) {
  const defaultData = [
    { day: 'Mon', sales: 140 },
    { day: 'Tue', sales: 240 },
    { day: 'Wed', sales: 160 },
    { day: 'Thu', sales: 420 },
    { day: 'Fri', sales: 220 },
    { day: 'Sat', sales: 360 },
    { day: 'Sun', sales: 450 }
  ];

  const chartData = data && data.length > 0 ? data : defaultData;
  const points = chartData.map(d => d.sales);
  const days = chartData.map(d => d.day);
  const width = 500;
  const height = 140;
  const max = Math.max(...points, 100);
  const min = 0;
  const range = max - min || 1;

  const coords = points.map((p, i) => {
    const x = (i / (points.length - 1)) * (width - 40) + 20;
    const y = height - ((p - min) / range) * (height - 40) - 20;
    return { x, y, val: p };
  });

  const linePath = `M ${coords.map((c) => `${c.x},${c.y}`).join(' L ')}`;
  const areaPath = `${linePath} L ${coords[coords.length - 1].x},${height - 15} L ${coords[0].x},${height - 15} Z`;

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full overflow-visible">
        <defs>
          <linearGradient id="salesAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Horizontal grid lines */}
        {[100, 200, 300, 400].map((level) => {
          const y = height - (level / range) * (height - 40) - 20;
          return (
            <line
              key={level}
              x1="20"
              y1={y}
              x2={width - 20}
              y2={y}
              stroke="#1e293b"
              strokeWidth="0.75"
              strokeDasharray="4 4"
            />
          );
        })}

        {/* Shaded Area */}
        <path d={areaPath} fill="url(#salesAreaGrad)" />

        {/* Glowing Line */}
        <path
          d={linePath}
          fill="none"
          stroke="#f59e0b"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Interaction Points */}
        {coords.map((c, i) => (
          <g key={i} className="group/dot cursor-pointer">
            <circle
              cx={c.x}
              cy={c.y}
              r="4.5"
              fill="#0f172a"
              stroke="#f59e0b"
              strokeWidth="2"
              className="transition duration-150 group-hover/dot:r-6"
            />
            <title>{`${days[i]}: $${c.val.toFixed(2)}`}</title>
          </g>
        ))}

        {/* Day Labels */}
        {coords.map((c, i) => (
          <text
            key={i}
            x={c.x}
            y={height - 2}
            textAnchor="middle"
            fill="#64748b"
            fontSize="9.5"
            fontWeight="600"
          >
            {days[i]}
          </text>
        ))}
      </svg>
    </div>
  );
}

// Category Sales Donut Chart
interface CategorySalesItem {
  name: string;
  percentage: number;
  color: string;
}

export function CategorySalesChart({ data, totalSales }: { data?: CategorySalesItem[]; totalSales?: number }) {
  const defaultCategories = [
    { name: 'Main Course', percentage: 45, color: '#f59e0b' },
    { name: 'Beverages', percentage: 25, color: '#06b6d4' },
    { name: 'Appetizers', percentage: 15, color: '#10b981' },
    { name: 'Desserts', percentage: 10, color: '#a855f7' },
    { name: 'Others', percentage: 5, color: '#64748b' },
  ];

  const categories = data && data.length > 0 ? data : defaultCategories;

  const radius = 34;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  let accumulatedPercentage = 0;

  return (
    <div className="flex items-center justify-between gap-5">
      <div className="relative w-24 h-24 shrink-0">
        <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
          {categories.map((cat, i) => {
            const dashArray = `${(cat.percentage / 100) * circumference} ${circumference}`;
            const strokeOffset = circumference - (accumulatedPercentage / 100) * circumference;
            accumulatedPercentage += cat.percentage;

            return (
              <circle
                key={i}
                cx="40"
                cy="40"
                r={radius}
                fill="transparent"
                stroke={cat.color}
                strokeWidth={strokeWidth}
                strokeDasharray={dashArray}
                strokeDashoffset={strokeOffset}
                strokeLinecap="round"
                className="transition-all duration-350 hover:opacity-80"
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-[9px] text-slate-400 font-semibold tracking-wider uppercase leading-none">Sales</span>
          <span className="text-[10px] font-bold text-white mt-0.5 truncate max-w-[50px]">
            {totalSales !== undefined ? `$${Math.round(totalSales)}` : '$4.8k'}
          </span>
        </div>
      </div>

      {/* Legend list */}
      <div className="flex-1 space-y-1 text-[11px]">
        {categories.map((cat, i) => (
          <div key={i} className="flex items-center justify-between font-semibold">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
              <span className="text-slate-400 truncate max-w-[80px]">{cat.name}</span>
            </div>
            <span className="text-white">{cat.percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

