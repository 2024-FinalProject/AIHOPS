import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "./ui/card";

interface SeverityLevel {
  level: string;
  shortDesc: string;
  factor: number;
  defaultProb: number;
  desc: string;
  examples: string;
}

interface ChartData {
  name: string;
  probability: number;
  contribution: number;
  factor: number;
  desc: string;
  examples: string;
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: ChartData;
  }>;
}

interface RiskLevel {
  level: string;
  color: string;
}

const RiskAssessmentVisualizer: React.FC = () => {
  const severityLevels: SeverityLevel[] = [
    { 
      level: "Level 1", 
      shortDesc: "No/Negligible Impact", 
      factor: 0.5, 
      defaultProb: 20, 
      desc: "No or negligible impact - The innovation causes minimal disruption to normal operations",
      examples: "Examples: Minor workflow adjustments, brief staff training needed, temporary slight slowdown in processes" 
    },
    { 
      level: "Level 2", 
      shortDesc: "Minor Impact", 
      factor: 1, 
      defaultProb: 20,
      desc: "Minor impact - Small, easily manageable disruptions to operations",
      examples: "Examples: Short-term productivity dips, minor resource reallocation, brief technical issues" 
    },
    { 
      level: "Level 3", 
      shortDesc: "Moderate Impact", 
      factor: 25, 
      defaultProb: 20,
      desc: "Moderate impact - Significant but containable issues that require attention",
      examples: "Examples: Notable workflow disruptions, substantial training requirements, temporary service delays" 
    },
    { 
      level: "Level 4", 
      shortDesc: "Severe Impact", 
      factor: 100, 
      defaultProb: 20,
      desc: "Severe impact - Major disruption that could significantly affect operations",
      examples: "Examples: Major service interruptions, significant compliance issues, substantial financial impact" 
    },
    { 
      level: "Level 5", 
      shortDesc: "Critical Impact", 
      factor: 400, 
      defaultProb: 20,
      desc: "Critical impact - Catastrophic effects that could threaten organizational viability",
      examples: "Examples: Complete system failure, severe regulatory violations, major safety incidents" 
    }
  ];

  const [probabilities, setProbabilities] = useState<number[]>(
    severityLevels.map(level => level.defaultProb)
  );
  
  const [riskScore, setRiskScore] = useState<number>(0);
  const [showWarning, setShowWarning] = useState<boolean>(false);

  const chartData: ChartData[] = severityLevels.map((level, index) => ({
    name: level.shortDesc,
    probability: probabilities[index],
    contribution: (probabilities[index] / 100) * level.factor,
    factor: level.factor,
    desc: level.desc,
    examples: level.examples
  }));

  useEffect(() => {
    const totalPercentage = probabilities.reduce((sum, prob) => sum + prob, 0);
    setShowWarning(Math.abs(totalPercentage - 100) > 0.1);

    const newScore = probabilities.reduce((sum, prob, index) => {
      return sum + ((prob / 100) * severityLevels[index].factor);
    }, 0);
    setRiskScore(newScore);
  }, [probabilities]);

  const handleProbabilityChange = (index: number, newValue: string) => {
    const value = Math.max(0, Math.min(100, parseFloat(newValue) || 0));
    const oldTotal = probabilities.reduce((sum, p) => sum + p, 0);
    const oldValue = probabilities[index];
    const difference = value - oldValue;
    
    const newProbabilities = probabilities.map((prob, i) => {
      if (i === index) return value;
      const otherSum = oldTotal - oldValue;
      const proportion = otherSum === 0 ? 1 / (probabilities.length - 1) : prob / otherSum;
      return Math.max(0, Math.min(100, prob - (difference * proportion)));
    });
    
    setProbabilities(newProbabilities);
  };

  const CustomTooltip: React.FC<TooltipProps> = ({ active, payload }) => {
    if (active && payload && payload.length > 0) {
      const data = payload[0].payload;
      return (
        <Card className="w-80">
          <CardContent className="p-4">
            <h4 className="font-semibold mb-2">{data.name}</h4>
            <p className="text-sm text-gray-600 mb-2">{data.desc}</p>
            <div className="text-sm space-y-1">
              <p><span className="font-medium">Likelihood:</span> {data.probability.toFixed(1)}%</p>
              <p><span className="font-medium">Severity Factor:</span> {data.factor}</p>
              <p><span className="font-medium">Risk Contribution:</span> {data.contribution.toFixed(2)}</p>
            </div>
            <p className="text-sm text-gray-600 mt-2">{data.examples}</p>
          </CardContent>
        </Card>
      );
    }
    return null;
  };

  const getRiskLevel = (score: number): RiskLevel => {
    if (score < 1) return { level: "Very Low", color: "text-green-600" };
    if (score < 10) return { level: "Low", color: "text-emerald-600" };
    if (score < 50) return { level: "Moderate", color: "text-yellow-600" };
    if (score < 100) return { level: "High", color: "text-orange-600" };
    return { level: "Very High", color: "text-red-600" };
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Rest of the JSX remains the same */}
    </div>
  );
};

export default RiskAssessmentVisualizer;