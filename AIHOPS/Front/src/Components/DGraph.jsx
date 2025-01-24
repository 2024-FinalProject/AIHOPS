import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
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

  const handlePercentageChange = (index, value) => {
    const newValue = Math.min(100, Math.max(0, Number(value)));
    const newPercentages = [...percentages];
    newPercentages[index] = newValue;
    setPercentages(newPercentages);
  };

  const totalPercentage = percentages.reduce((sum, p) => sum + p, 0);

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

  return (
    <Card className="severity-card">
      <CardHeader>
        <CardTitle>D-Score Voting</CardTitle>
        <CardDescription>
          Allocate probability percentages across severity levels (total must be 100%)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {severityLevels.map((level, index) => (
          <div key={level.level} className="severity-level-container">
            <div className="severity-header">
              <h3>{level.name} (Factor: {level.value})</h3>
              <div className="percentage-input">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={percentages[index]}
                  onChange={(e) => handlePercentageChange(index, e.target.value)}
                />
                <span>%</span>
              </div>
            </div>
            <div className="severity-bar" style={{
              width: `${percentages[index]}%`,
              backgroundColor: level.color
            }} />
            <p className="severity-description">{level.description}</p>
          </div>
        ))}
        
        <div className="total-percentage">
          Total: {totalPercentage}%
          {Math.abs(totalPercentage - 100) > 0.1 && 
            <span className="error">Must equal 100%</span>
          }
        </div>

        <div className="percentage-chart">
          <h4>Severity Level Distribution</h4>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={severityLevels.map((level, index) => ({
              name: `Level ${level.level}`,
              percentage: percentages[index],
              color: level.color
            }))}>
              <XAxis dataKey="name" />
              <YAxis domain={[0, 100]} />
              <Tooltip 
                formatter={(value, name) => [`${value}%`, 'Percentage']}
              />
              <Bar 
                dataKey="percentage"
                fill="#8884d8"
                label={{ position: 'top', formatter: (value) => `${value}%` }}
              >
                {severityLevels.map((level, index) => (
                  <Cell key={`cell-${index}`} fill={level.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

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