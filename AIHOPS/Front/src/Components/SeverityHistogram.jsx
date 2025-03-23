import React from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, Legend, LabelList } from 'recharts';
import './SeverityHistogram.css';

const SeverityHistogram = ({ severityfactors, severityfactorsValues }) => {
  const theme = localStorage.getItem('theme') || 'light';
  const textColor = theme === 'light' ? '#333' : '#fff';
  const backgroundColor = 'transparent';
  const defaultSeverityValues = [0.5, 1, 25, 100, 400];
  const defaultSeverityFactors = {
    level1: 20,
    level2: 20,
    level3: 20,
    level4: 20,
    level5: 20
  };

  const formatData = () => {
    if (!severityfactors || !severityfactorsValues) return [];

    // Use defaults if values are missing
    const factors = severityfactors || defaultSeverityFactors;
    const values = severityfactorsValues || defaultSeverityValues;
    
    // Ensure all 5 levels are represented
    const completeFactors = {
      level1: parseFloat(factors.level1 || 0),
      level2: parseFloat(factors.level2 || 0),
      level3: parseFloat(factors.level3 || 0),
      level4: parseFloat(factors.level4 || 0),
      level5: parseFloat(factors.level5 || 0)
    };
    
    return Object.entries(severityfactors || {}).map(([level, percentage], index) => {
      const levelIndex = parseInt(level.replace('level', '')) - 1;
      let severityValue = values[levelIndex];
      if (severityValue === undefined || severityValue === null || severityValue === 0) {
        severityValue = defaultSeverityValues[levelIndex];
      }
      
      // Calculate weighted value and ensure it's a valid number
      const safePercentage = parseFloat(percentage) || 0;
      const weightedValue = safePercentage * severityValue;
      
      return {
        name: `Level ${levelIndex + 1}`,
        percentage: parseFloat(percentage || 0).toFixed(2),
        severityValue: severityValue,
        weightedValue: parseFloat(weightedValue).toFixed(2),
        fill: getBarColor(levelIndex),
        level: `Level ${levelIndex + 1}`,
        description: getLevelDescription(levelIndex)
      };
    });
  };

  const getBarColor = (level) => {
    const colors = ["#4ade80", "#fbbf24", "#fb923c", "#f87171", "#ef4444"];
    return colors[level] || "#82ca9d";
  };

  const getLevelDescription = (level) => {
    const descriptions = [
      "No noticeable effects on operations. Recovery is either unnecessary or instantaneous without any resource involvement.",
      "Impacts are small, causing slight disruptions that can be resolved with minimal effort or resources.",
      "Impacts are moderate, requiring resources and temporary adjustments to restore normal operations.",
      "Impacts are substantial, disrupting core activities significantly.",
      "Impacts result in extensive disruption, likely overwhelming available resources."
    ];
    return descriptions[level] || "";
  };

  // Prepare the level data with descriptions and values
  const severityLevels = Array.from({ length: 5 }, (_, i) => {
    const values = severityfactorsValues || defaultSeverityValues;
    let value = values[i];
    
    // Ensure we have a valid value (fallback to default if zero or invalid)
    if (value === undefined || value === null || value === 0) {
      value = defaultSeverityValues[i];
    }
    
    return {
      level: i + 1,
      name: ["No to Negligible Damage", "Minor Damage", "Manageable Damage", "Severe Damage", "Catastrophic Damage"][i],
      value: value,
      color: getBarColor(i),
      description: getLevelDescription(i)
    };
  });

  const data = formatData();

  const calculateDScore = () => {
    if (data.length === 0) return 0;
    
    const totalWeightedValue = data.reduce((sum, item) => {
      return sum + parseFloat(item.weightedValue);
    }, 0);
    
    return totalWeightedValue;
  };
  
  const dScore = calculateDScore();

  // Custom tooltip to display all values
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="custom-tooltip" style={{
          backgroundColor: theme === 'light' ? 'white' : '#222',
          padding: '10px',
          border: '1px solid #ccc',
          borderRadius: '5px',
          color: textColor,
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          fontFamily: 'Verdana, sans-serif',
          maxWidth: '250px'
        }}>
          <h4 style={{ margin: '0 0 5px 0', fontWeight: 'bold', padding: '0 0 5px 0', borderBottom: '1px solid #ccc' }}>
            {data.level}
          </h4>
          <p style={{ margin: '4px 0', fontSize: '12px' }}><strong>Voting %:</strong> {data.percentage}%</p>
          <p style={{ margin: '4px 0', fontSize: '12px' }}><strong>Severity Value:</strong> {data.severityValue}</p>
          <p style={{ margin: '4px 0', fontSize: '12px' }}><strong>Weighted Value:</strong> {data.weightedValue}</p>
          <p style={{ margin: '8px 0 0 0', fontSize: '11px', fontStyle: 'italic', borderTop: '1px solid #ccc', paddingTop: '5px' }}>
            {data.description}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ width: '100%', fontFamily: 'Verdana, sans-serif' }}>
      {/* D-Score Display */}
      <div style={{ 
        textAlign: 'center', 
        marginBottom: '20px',
        backgroundColor: 'var(--card-background)',
        padding: '15px', 
        borderRadius: '8px',
        border: '1px solid var(--border-color)',
        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)'
      }}>
        <h3 style={{ marginTop: 0, marginBottom: '5px', fontSize: '18px', fontWeight: 'bold', color: textColor }}>
          d-Score: {dScore.toFixed(3)}
        </h3>
        <p style={{ fontSize: '14px', color: textColor, margin: 0 }}>
          Number of d-score assessors: {data.length > 0 ? '1' : '0'}
        </p>
      </div>
      
      {/* Severity Levels Table */}
      <div className="severity-levels-table" style={{ 
        marginBottom: '20px', 
        backgroundColor: 'var(--card-background)',
        padding: '15px', 
        borderRadius: '8px',
        border: '1px solid var(--border-color)',
        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)'
      }}>
        <h3 style={{ textAlign: 'center', marginBottom: '15px', fontSize: '16px', fontWeight: 'bold', color: textColor }}>
          Severity Levels Summary
        </h3>
        <table style={{ 
          width: '100%', 
          borderCollapse: 'collapse',
          fontFamily: 'Verdana, sans-serif'
        }}>
          <thead>
            <tr>
              <th style={{ padding: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--pop-up-background)', color: textColor }}>Level</th>
              <th style={{ padding: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--pop-up-background)', color: textColor }}>Severity Value</th>
              <th style={{ padding: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--pop-up-background)', color: textColor }}>Voting Percentage</th>
              <th style={{ padding: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--pop-up-background)', color: textColor }}>Weighted Value</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr key={index}>
                <td style={{ 
                  padding: '8px', 
                  border: '1px solid var(--border-color)',
                  backgroundColor: item.fill,
                  color: index > 2 ? 'white' : 'black',
                  fontWeight: 'bold',
                  textAlign: 'center'
                }}>
                  {item.name}
                </td>
                <td style={{ padding: '8px', border: '1px solid var(--border-color)', textAlign: 'center', color: textColor }}>{item.severityValue}</td>
                <td style={{ padding: '8px', border: '1px solid var(--border-color)', textAlign: 'center', color: textColor }}>{item.percentage}%</td>
                <td style={{ padding: '8px', border: '1px solid var(--border-color)', textAlign: 'center', color: textColor }}>{item.weightedValue}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Chart */}
      <div style={{ 
        width: '100%',
        height: '300px',
        margin: '0 auto',
        backgroundColor: backgroundColor,
        marginBottom: '20px'
      }}>
        {data.length > 0 ? (
          <ResponsiveContainer>
            <ComposedChart 
              data={data}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={theme === 'light' ? '#e5e7eb' : '#444'} />
              <XAxis 
                dataKey="name" 
                interval={0}
                tick={{ fill: textColor }}
              />
              <YAxis 
                yAxisId="left"
                orientation="left" 
                domain={[0, 100]}
                label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft', fill: textColor, dy: 40 }} 
                tick={{ fill: textColor }}
              />
              <YAxis 
                yAxisId="right"
                orientation="right" 
                // Ensure we have a reasonable domain even with zero values
                domain={[0, Math.max(...data.map(item => parseFloat(item.weightedValue) || 0)) * 1.1 || 400]}
                label={{ value: 'Weighted Value', angle: 90, position: 'insideRight', fill: textColor, dy: 40 }} 
                tick={{ fill: textColor }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar 
                yAxisId="left"
                dataKey="percentage" 
                name="Voting Percentage"
                barSize={30}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
                <LabelList dataKey="percentage" position="top" formatter={(value) => `${value}%`} />
              </Bar>
              <Bar 
                yAxisId="right"
                dataKey="weightedValue" 
                name="Weighted Value" 
                fill="#8884d8"
                opacity={0.7}
              />
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: textColor }}>
            No data available
          </div>
        )}
      </div>
    </div>
  );
};

export default SeverityHistogram;