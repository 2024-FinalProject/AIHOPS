import React, { useState, useEffect } from "react";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const dummyProjects = [
  {
    id: 1,
    name: "Project Alpha",
    description: "Description of Project Alpha.",
    founder: "John Doe",
    members: [
      { userId: 1, name: "John Doe", hasVoted: true },
      { userId: 2, name: "Jane Doe", hasVoted: false },
      { userId: 3, name: "Mike Smith", hasVoted: false }
    ],
    factors: [
      { id: 1, name: "Factor 1", description: "Description of Factor 1" },
      { id: 2, name: "Factor 2", description: "Description of Factor 2" }
    ]
  },
  {
    id: 2,
    name: "Project Beta",
    description: "Description of Project Beta.",
    founder: "Jane Doe",
    members: [
      { userId: 1, name: "John Doe", hasVoted: false },
      { userId: 2, name: "Jane Doe", hasVoted: false }
    ],
    factors: [
      { id: 1, name: "Factor A", description: "Description of Factor A" },
      { id: 2, name: "Factor B", description: "Description of Factor B" }
    ]
  }
];

const MyProjectsPage = () => {
  const [projects, setProjects] = useState([]);
  const [userVotes, setUserVotes] = useState([]);
  const [currentProject, setCurrentProject] = useState(null);
  const [voteProgress, setVoteProgress] = useState("");
  const [severityVotes, setSeverityVotes] = useState([0, 0, 0, 0, 0]);
  const [factorVotes, setFactorVotes] = useState({});

  useEffect(() => {
    setProjects(dummyProjects);
  }, []);

  const handleVoteClick = (project) => {
    setCurrentProject(project);
    const votedMembers = project.members.filter(member => member.hasVoted).length;
    setVoteProgress(`${votedMembers} of ${project.members.length} have voted`);
  };

  const handleFactorVoteChange = (factorId, value) => {
    setFactorVotes(prev => ({ ...prev, [factorId]: value }));
  };

  const handleSeverityVoteChange = (level, value) => {
    const updatedSeverityVotes = [...severityVotes];
    updatedSeverityVotes[level - 1] = value;
    setSeverityVotes(updatedSeverityVotes);
  };

  const handleSubmitVote = () => {
    const totalSeverity = severityVotes.reduce((sum, val) => sum + val, 0);
    if (totalSeverity === 100) {
      alert("Vote submitted!");
    } else {
      alert("Severity votes must sum to 100.");
    }
  };

  const handleCheckScore = () => {
    alert("Current score: 0"); // Placeholder for current score
  };

  const severityData = {
    labels: ['1', '2', '3', '4', '5'],
    datasets: [
      {
        label: 'Severity Votes',
        data: severityVotes,
        borderColor: 'rgba(75, 192, 192, 1)',
        tension: 0.1,
      },
    ],
  };

  return (
    <div className="container">
      <h1 className="page-heading">My Projects</h1>
      <div className="projects-list">
        {projects.map(project => (
          <div key={project.id} className="project-card">
            <div className="project-info">
              <h3>{project.name}</h3>
              <p>{project.description}</p>
              <p><strong>Founder: </strong>{project.founder}</p>
            </div>
            <div className="project-actions">
              {project.members.some(member => member.userId === 1) && (
                <button className="vote-btn" onClick={() => handleVoteClick(project)}>
                  Vote
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {currentProject && (
        <div className="popup-overlay">
          <div className="popup-content">
            <span className="close-popup" onClick={() => setCurrentProject(null)}>&times;</span>
            <h2>Vote on {currentProject.name}</h2>
            <p className="progress-text">{voteProgress}</p>

            <h3>Factor Votes</h3>
            {currentProject.factors.map(factor => (
              <div key={factor.id} className="factor-item">
                <div className="factor-name">
                  <span>{factor.name}</span>
                  <span className="factor-description-btn" title={factor.description}>?</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="4"
                  value={factorVotes[factor.id] || 0}
                  onChange={(e) => handleFactorVoteChange(factor.id, e.target.value)}
                />
                <span>{factorVotes[factor.id]}</span>
              </div>
            ))}

            <h3>Severity Votes</h3>
            <div className="severity-graph">
              <Line data={severityData} />
            </div>

            <div className="severity-factors-container">
              {Array.from({ length: 5 }, (_, i) => (
                <div key={i} className={`severity-item ${i < 3 ? 'first-line' : 'second-line'}`}>
                  <span>Level {i + 1}</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={severityVotes[i]}
                    onChange={(e) => handleSeverityVoteChange(i + 1, e.target.value)}
                  />
                  <span>{severityVotes[i]}%</span>
                </div>
              ))}
            </div>

            <div className="actions">
              <button onClick={handleSubmitVote}>Submit Vote</button>
              <button onClick={handleCheckScore}>Check Current Score</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyProjectsPage;
