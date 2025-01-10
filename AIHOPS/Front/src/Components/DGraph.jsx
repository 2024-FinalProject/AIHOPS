import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceDot } from 'recharts';
import { Info } from 'lucide-react';

const SeverityVoting = () => {
  // Severity levels from the AIHOPS document
  const severityLevels = [
    { level: 1, name: "No to Negligible Damage", value: 0.5, color: "#4ade80" },
    { level: 2, name: "Minor Damage", value: 1, color: "#fbbf24" },
    { level: 3, name: "Manageable Damage", value: 25, color: "#fb923c" },
    { level: 4, name: "Severe Damage", value: 100, color: "#f87171" },
    { level: 5, name: "Catastrophic Damage", value: 400, color: "#ef4444" }
  ];

  const [selectedPoint, setSelectedPoint] = useState(null);
  const [votes, setVotes] = useState([]);
  const [showTooltip, setShowTooltip] = useState(false);

  // Generate data points for the chart
  const generatePoints = () => {
    const points = [];
    for (let i = 0; i < 100; i++) {
      points.push({
        x: i,
        y: Math.exp(i * 0.07)
      });
    }
    return points;
  };

  const handleChartClick = (e) => {
    if (e && e.activePayload) {
      const point = {
        x: e.activePayload[0].payload.x,
        y: e.activePayload[0].payload.y
      };
      setSelectedPoint(point);
      setVotes([...votes, point]);
    }
  };

  const getPointColor = (y) => {
    const level = severityLevels.find(level => y <= level.value);
    return level ? level.color : severityLevels[severityLevels.length - 1].color;
  };

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle>Severity Voting</CardTitle>
          <Info 
            className="w-5 h-5 text-gray-500 cursor-pointer hover:text-gray-700"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          />
        </div>
        <CardDescription>
          Click on the graph to vote on severity levels. Your votes will be shown as colored dots.
        </CardDescription>
        {showTooltip && (
          <div className="mt-2 p-4 bg-gray-100 rounded-md">
            <h4 className="font-bold mb-2">Severity Levels:</h4>
            {severityLevels.map((level) => (
              <div key={level.level} className="flex items-center gap-2 mb-1">
                <div 
                  className="w-4 h-4 rounded-full" 
                  style={{ backgroundColor: level.color }}
                />
                <span>{level.name} (Level {level.level})</span>
              </div>
            ))}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={generatePoints()}
              onClick={handleChartClick}
              margin={{ top: 20, right: 30, left: 20, bottom: 30 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="x" 
                label={{ value: 'Risk Level', position: 'bottom' }}
              />
              <YAxis 
                domain={[0, 450]}
                label={{ value: 'Severity Score', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="y" 
                stroke="#8884d8" 
                dot={false}
                activeDot={{ r: 8 }}
              />
              {votes.map((vote, index) => (
                <ReferenceDot
                  key={index}
                  x={vote.x}
                  y={vote.y}
                  r={6}
                  fill={getPointColor(vote.y)}
                  stroke="none"
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        {selectedPoint && (
          <div className="mt-4 p-4 bg-gray-100 rounded-md">
            <h4 className="font-bold mb-2">Last Vote:</h4>
            <p>Risk Level: {Math.round(selectedPoint.x)}</p>
            <p>Severity Score: {Math.round(selectedPoint.y)}</p>
            <p>Category: {
              severityLevels.find(level => selectedPoint.y <= level.value)?.name ||
              severityLevels[severityLevels.length - 1].name
            }</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SeverityVoting;