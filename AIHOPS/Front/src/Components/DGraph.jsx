import React, { useState, useEffect } from 'react';
import { ComposedChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, Bar, Cell } from 'recharts';
import './DGraph.css';
import { Card, CardHeader, CardTitle, CardDescription, CardContent} from './ui/card';

const DGraph = ({ onVoteComplete }) => {
  const severityLevels = [
    { level: 1, name: "No to Negligible Damage", value: 0.5, color: "#4ade80", 
      description: "No noticeable effects on operations. Recovery is either unnecessary or instantaneous without any resource involvement." },
    { level: 2, name: "Minor Damage", value: 1, color: "#fbbf24",
      description: "Impacts are small, causing slight disruptions that can be resolved with minimal effort or resources." },
    { level: 3, name: "Manageable Damage", value: 25, color: "#fb923c",
      description: "Impacts are moderate, requiring resources and temporary adjustments to restore normal operations." },
    { level: 4, name: "Severe Damage", value: 100, color: "#f87171",
      description: "Impacts are substantial, disrupting core activities significantly." },
    { level: 5, name: "Catastrophic Damage", value: 400, color: "#ef4444",
      description: "Impacts result in extensive disruption, likely overwhelming available resources." }
  ];
  
  const [percentages, setPercentages] = useState(Array(5).fill(0));
  const [weightedValues, setWeightedValues] = useState([]);

  useEffect(() => {
    const newWeightedValues = severityLevels.map((level, index) => ({
      name: `Level ${level.level}`,
      percentage: percentages[index],
      weightedValue: (percentages[index] / 100) * level.value,
      color: level.color,
      level: level.name,
      description: level.description,
      levelIndex: index
    }));
    setWeightedValues(newWeightedValues);
  }, [percentages]);

  const handlePercentageChange = (index, value) => {
    const newValue = Math.min(100, Math.max(0, Number(value) || 0));
    const newPercentages = [...percentages];
    newPercentages[index] = newValue;
    setPercentages(newPercentages);
  };

  const handleSubmit = async () => {
    if (Math.abs(totalPercentage - 100) > 0.1) {
      alert('Percentages must sum to 100%');
      return;
    }
    try {
      await onVoteComplete(percentages);
    } catch (error) {
      alert('Failed to submit votes');
    }
  };

  const totalPercentage = percentages.reduce((sum, p) => sum + p, 0);

  const CustomTooltip = ({ active, payload, coordinate }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="custom-tooltip" style={{
          position: 'absolute',
          left: `${coordinate?.x - 150}px`,
          top: `${coordinate?.y + 50}px`, // Position below the point
          width: '300px'
        }}>
          <h4 className="tooltip-title">{data.level}</h4>
          <div className="tooltip-content">
            <p>Percentage: {data.percentage.toFixed(1)}%</p>
            <p>Weight Factor: {severityLevels[data.levelIndex].value}</p>
            <p>Weighted Value: {data.weightedValue.toFixed(2)}</p>
          </div>
          <p className="tooltip-description">{data.description}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="severity-card">
      <CardHeader>
        <CardTitle>D-Score Voting</CardTitle>
        <CardDescription>
          Allocate probability percentages across severity levels (total must be 100%)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="severity-graph">
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart 
              data={weightedValues} 
              margin={{ top: 20, right: 30, left: 20, bottom: 100 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                interval={0}
                tick={({ x, y, payload }) => (
                  <g transform={`translate(${x},${y})`}>
                    <text x={0} y={0} dy={16} textAnchor="middle" fill="#666">
                      {`Level ${payload.value.split(' ')[1]}`}
                    </text>
                    <text x={0} y={20} dy={16} textAnchor="middle" fill="#666" fontSize="12">
                      {severityLevels[parseInt(payload.value.split(' ')[1]) - 1].name}
                    </text>
                    {/* Add input box below the level name */}
                    <foreignObject 
                      x="-30" 
                      y="50" 
                      width="60" 
                      height="30"
                    >
                      <div className="input-group-chart">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={percentages[parseInt(payload.value.split(' ')[1]) - 1]}
                          onChange={(e) => handlePercentageChange(parseInt(payload.value.split(' ')[1]) - 1, e.target.value)}
                        />
                        <span>%</span>
                      </div>
                    </foreignObject>
                  </g>
                )}
                height={100} // Increased height for input boxes
              />
              <YAxis 
                yAxisId="left"
                orientation="left" 
                domain={[0, 100]}
                label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft' }} 
              />
              <YAxis 
                yAxisId="right"
                orientation="right" 
                domain={[0, 400]}
                label={{ value: 'Weighted Value', angle: 90, position: 'insideRight' }} 
              />
              <Tooltip 
                content={<CustomTooltip />} 
                cursor={{ strokeDasharray: '3 3' }}
                wrapperStyle={{ zIndex: 100 }}
              />
              <Legend />
              <Bar
                yAxisId="right"
                dataKey="weightedValue"
                fill="#82ca9d"
                name="Weighted Value"
              >
                {weightedValues.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={severityLevels[index].color} />
                ))}
              </Bar>
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="percentage" 
                stroke="#2563eb"
                strokeWidth={3}
                name="Percentage"
                dot={{ fill: '#2563eb', strokeWidth: 2 }}
                activeDot={(props) => {
                  const { cx, cy, payload, index } = props;
                  
                  const handleDrag = (e) => {
                    const svg = e.target.ownerSVGElement;
                    const svgRect = svg.getBoundingClientRect();
                    const startY = e.clientY;
                    const startPercentage = percentages[index];
                    
                    const handleMove = (moveEvent) => {
                      const deltaY = startY - moveEvent.clientY;
                      const chartHeight = svgRect.height - 120; // Adjust for margins
                      const percentageDelta = (deltaY / chartHeight) * 100;
                      const newPercentage = Math.min(100, Math.max(0, 
                        Math.round(startPercentage + percentageDelta)
                      ));
                      handlePercentageChange(index, newPercentage);
                    };
                    
                    const handleUp = () => {
                      document.removeEventListener('mousemove', handleMove);
                      document.removeEventListener('mouseup', handleUp);
                    };
                    
                    document.addEventListener('mousemove', handleMove);
                    document.addEventListener('mouseup', handleUp);
                  };

                  return (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={8}
                      fill="#2563eb"
                      style={{ cursor: 'grab' }}
                      onMouseDown={handleDrag}
                    />
                  );
                }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {Math.abs(totalPercentage - 100) > 0.1 && (
          <div className="percentage-alert">
            <div className="alert-content">
              Current total: {totalPercentage}% (Need 100%)
            </div>
            <div className="alert-bar">
              <div 
                className="alert-progress" 
                style={{ 
                  width: `${Math.min(totalPercentage, 100)}%`,
                  backgroundColor: totalPercentage > 100 ? '#ef4444' : '#3b82f6'
                }} 
              />
            </div>
          </div>
        )}

        <button
          className="submit-button"
          disabled={Math.abs(totalPercentage - 100) > 0.1}
          onClick={handleSubmit}
        >
          Submit D-Score Votes
        </button>
      </CardContent>
    </Card>
  );
};

export default DGraph;