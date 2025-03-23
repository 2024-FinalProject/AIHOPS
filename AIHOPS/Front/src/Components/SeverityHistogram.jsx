import React from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, LabelList  } from 'recharts';
import './SeverityHistogram.css';

const SeverityHistogram = ({ severityfactors, severityfactorsValues }) => {
  const theme = localStorage.getItem('theme') || 'light';
  const textColor = theme === 'light' ? '#333' : '#fff';
  const backgroundColor = 'transparent';

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
    color: severityLevels[index].color,
    weightedScore: (value * severityLevels[index].value).toFixed(2)
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
          zIndex: 1000,
          backgroundColor: theme === 'light' ? '#fff' : '#222',
          color: textColor,
        }}>
          <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: 'bold', color: textColor }}>
            {data.level}
          </h4>
          <hr style={{ margin: '6px 0', borderTop: `1px solid ${theme === 'light' ? '#e2e8f0' : '#444'}` }} />
          <p style={{ margin: '4px 0', fontSize: '12px', color: textColor }}>{data.description}</p>
          <hr style={{ margin: '6px 0', borderTop: `1px solid ${theme === 'light' ? '#e2e8f0' : '#444'}` }} />
          <p style={{ margin: '4px 0', fontSize: '12px', color: textColor }}>
            <b>Average Score:</b> {data.average.toFixed(2)}
          </p>
          <p style={{ margin: '4px 0', fontSize: '12px', color: textColor }}>
            <b>Weight Factor:</b> {data.weightFactor}
          </p>
          <p style={{ margin: '4px 0', fontSize: '12px', color: textColor }}>
            <b>Calculation:</b> {data.average.toFixed(2)} × {data.weightFactor} = {data.weightedScore}
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
      backgroundColor: backgroundColor,
      marginBottom: '20px'
    }}>
      <ResponsiveContainer>
        <ComposedChart 
          data={data}
          margin={{ top: 20, right: 30, left: 40, bottom: 30 }}
          barSize={30}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={theme === 'light' ? '#e5e7eb' : '#444'} />
          <XAxis 
            dataKey="name" 
            height={100}
            interval={0}
            tick={{ fill: textColor }}
            label={{
                value: 'Severity Levels',
                position: 'insideBottom',
                offset: 0,
                fontSize: 15,
                fill: textColor,
                fontWeight: 'bold',
                dy: -40,
            }}
          />
          <YAxis
            domain={[0, maxValue]}
            ticks={yAxisTicks}
            tickFormatter={(value) => value.toFixed(2)}
            tick={{ fill: textColor, fontSize: 11 }}
            label={{
                value: 'Average Score',
                angle: -90,
                position: 'outsideLeft',
                fontSize: 15,
                fill: textColor,
                fontWeight: 'bold',
                dx: -30,  // Adjust this value to push the label further left or right
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