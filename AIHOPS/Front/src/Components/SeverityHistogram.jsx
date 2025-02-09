import React from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import './SeverityHistogram.css';

const SeverityHistogram = ({ severityfactors, severityfactorsValues }) => {
  const severityLevels = [
    { level: 1, name: "No to Negligible Damage", value: severityfactorsValues[0], color: "#4ade80", 
      description: "No noticeable effects on operations. Recovery is either unnecessary or instantaneous without any resource involvement." },
    { level: 2, name: "Minor Damage", value: severityfactorsValues[1], color: "#fbbf24",
      description: "Impacts are small, causing slight disruptions that can be resolved with minimal effort or resources." },
    { level: 3, name: "Manageable Damage", value: severityfactorsValues[2], color: "#fb923c",
      description: "Impacts are moderate, requiring resources and temporary adjustments to restore normal operations." },
    { level: 4, name: "Severe Damage", value: severityfactorsValues[3], color: "#f87171",
      description: "Impacts are substantial, disrupting core activities significantly." },
    { level: 5, name: "Catastrophic Damage", value: severityfactorsValues[4], color: "#ef4444",
      description: "Impacts result in extensive disruption, likely overwhelming available resources." }
  ];

  const data = (severityfactors?.avg || []).map((value, index) => ({
    name: `Level ${index + 1}`,
    average: value,
    level: severityLevels[index].name,
    weightFactor: severityLevels[index].value,
    description: severityLevels[index].description,
    color: severityLevels[index].color
  }));

  const CustomTooltip = ({ active, payload, coordinate }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="custom-tooltip" style={{
          padding: '10px',
          borderRadius: '6px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          position: 'absolute',
          left: `${coordinate?.x - 120}px`,
          top: `${coordinate?.y + 40}px`,
          width: '240px',
          zIndex: 1000
        }}>
          <h4 className="default-text" style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: 'bold' }}>
            {data.level}
          </h4>
          <hr style={{ margin: '6px 0', borderTop: '1px solid #e2e8f0' }} />
          <div style={{ margin: '6px 0' }}>
            <p className="default-text" style={{ margin: '2px 0', fontSize: '12px' }}><u>Average Score</u>: {data.average.toFixed(3)}</p>
            <p className="default-text" style={{ margin: '2px 0', fontSize: '12px' }}><u>Weight Factor</u>: {data.weightFactor}</p>
            <p className="default-text" style={{ margin: '2px 0', fontSize: '12px' }}><u>Weighted Value</u>: {(data.average * data.weightFactor).toFixed(2)}</p>
          </div>
          <hr style={{ margin: '6px 0', borderTop: '1px solid #e2e8f0' }} />
          <p style={{ 
            margin: '4px 0 0 0',
            fontSize: '12px',
          }}>
            {data.description}
          </p>
        </div>
      );
    }
    return null;
  };

  const maxValue = Math.max(...data.map(item => item.average)) * 1.2;
  const yAxisTicks = [0, maxValue * 0.25, maxValue * 0.5, maxValue * 0.75, maxValue];

  return (
    <div style={{ 
      width: '80%',
      height: '345px',
      margin: '0 auto',
      fontFamily: 'Verdana, sans-serif',
    }}>
      <ResponsiveContainer>
        <ComposedChart 
          data={data}
          margin={{ top: 20, right: 30, left: 40, bottom: 30 }}
          barSize={30}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="name" 
            height={100}
            interval={0}
            tick={({ x, y, payload }) => (
              <g transform={`translate(${x},${y})`}>
                <text className="default-text" x={0} y={0} dy={16} textAnchor="middle" fill="#666">
                  {payload.value}
                </text>
                <text className="default-text" x={0} y={20} dy={16} textAnchor="middle" fill="#666" fontSize="12">
                  {severityLevels[parseInt(payload.value.split(' ')[1]) - 1].name}
                </text>
              </g>
            )}
            label={{
                value: 'Severity Levels',
                position: 'insideBottom',
                offset: 0,
                fontSize: 14,
                fill: '#666',
                fontWeight: 'bold',
            }}
          />
          <YAxis
            domain={[0, maxValue]}
            ticks={yAxisTicks}
            tickFormatter={(value) => value.toFixed(2)}
            axisLine={{ stroke: '#e5e7eb' }}
            tick={{ fill: '#6b7280', fontSize: 11 }}
            label={{
                value: 'Average Score',
                angle: -90,
                position: 'outsideLeft',
                fontSize: 14,
                fill: '#666',
                dx: -20,  // Adjust this value to push the label further left or right
                fontWeight: 'bold',
            }}
          />
          <Tooltip 
            content={<CustomTooltip />}
            cursor={{ strokeDasharray: '3 3' }}
          />
          <Bar
            dataKey="average"
            name="Average Score"
            radius={[2, 2, 0, 0]}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
          <Line
            type="monotone"
            dataKey="average"
            stroke="#2563eb"
            strokeWidth={2}
            dot={{ fill: '#2563eb', r: 3 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SeverityHistogram;
