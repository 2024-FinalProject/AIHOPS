import React, { useState, useEffect } from "react";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);
import "./MyProjects.css";

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
  },

  {
    id: 3,
    name: "Project Delta",
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
  },

  {
    id: 4,
    name: "Project Gama",
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

const MyProjects = () => {
  const [projects, setProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState(null);
  const [voteProgress, setVoteProgress] = useState("");
  const [severityVotes, setSeverityVotes] = useState([0, 0, 0, 0, 0]);
  const [factorVotes, setFactorVotes] = useState({});
  const [totalSeverity, setTotalSeverity] = useState(0);
  const [factorDescription, setFactorDescription] = useState(null);
  const [currentScore, setCurrentScore] = useState(null);

  useEffect(() => {
    setProjects(dummyProjects);
  }, []);

  useEffect(() => {
    const sum = severityVotes.reduce((acc, curr) => acc + Number(curr), 0);
    setTotalSeverity(sum);
  }, [severityVotes]);

  const handleVoteClick = (project) => {
    setCurrentProject(project);
    const votedMembers = project.members.filter(member => member.hasVoted).length;
    setVoteProgress(`${votedMembers}/${project.members.length} have voted`);
  };

  const handleFactorVoteChange = (factorId, value) => {
    setFactorVotes(prev => ({ ...prev, [factorId]: Number(value) }));
  };

  const handleSeverityVoteChange = (level, value) => {
    setSeverityVotes(prev => {
      const newVotes = [...prev];
      newVotes[level - 1] = Number(value);
      return newVotes;
    });
  };

  const handleSubmitVote = () => {
    if (totalSeverity === 100) {
      console.log("Vote submitted:", { severityVotes, factorVotes });
      alert("Vote submitted successfully!");
      setCurrentProject(null);
    } else {
      alert(`Total severity must equal 100. Current total: ${totalSeverity}`);
    }
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

  const handleFactorDescription = (description) => {
    setFactorDescription(description);
  };

  const handleGetCurrentScore = (score) => {
    //TODO:: Get the current score of the project here (from the backend)
    setCurrentScore(score);
  };

  return (
    <div className="my-projects-container">
      <h1 className="page-heading">My Projects</h1>

      <div className="projects-list">
        {projects.map(project => (
          <div key={project.id} className="project-card" onClick={() => handleVoteClick(project)}>
            <h3 className="text-xl font-semibold">{project.name}:</h3>
            <p>{project.description}</p>
            <p>Founder: {project.founder}</p>
          </div>
        ))}
      </div>

      {currentProject && (
        <div className="popup-overlay">
          <div className="popup-content">
            <button
              className="close-popup"
              onClick={() => setCurrentProject(null)}
            >
              ×
            </button>

            <h2 className="text-2xl font-bold mb-4">Vote on {currentProject.name}</h2>

            <div className="vote-progress-container">
              <div className="progress-bar">
                <div
                  className="progress-bar-fill"
                  style={{
                    width: `${(currentProject.members.filter((m) => m.hasVoted).length / currentProject.members.length) * 100}%`,
                  }}
                ></div>
              </div>
              <p className="vote-progress-text">
                {voteProgress}
              </p>
            </div>

            <h3 className="text-xl font-semibold mb-4">Project's Score:</h3>
            {/*TODO: Check here that the current user is the founder of the project && */<button
                    className="get-score-btn"
                    onClick={() => handleGetCurrentScore(0)}
                  >
                    Get current score
            </button>}

            <h3 className="text-xl font-semibold mb-4">Factor Votes</h3>
            {currentProject.factors.map(factor => (
              <div key={factor.id} className="factor-item">
                <div className="factor-name">
                  <span>{factor.name}</span>
                  <button
                    className="factor-description-btn"
                    onClick={() => handleFactorDescription(factor.description)}
                  >
                    ?
                  </button>
                </div> Factor vote:
                <input
                  type="range"
                  min="0"
                  max="4"
                  value={factorVotes[factor.id] || 0}
                  onChange={(e) => handleFactorVoteChange(factor.id, e.target.value)}
                  className="factor-range"
                />
                <span>{factorVotes[factor.id] || 0}</span>
              </div>
            ))}

            <h3 className="text-xl font-semibold mb-4">Severity Votes (Total: {totalSeverity}%)</h3>
            <div className="severity-graph">
              <Line data={severityData} />
            </div>

            <div className="severity-factors-container">
              {severityVotes.slice(0, 3).map((vote, index) => (
                <div key={index} className="severity-item">
                  <label>Level {index + 1}</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={vote}
                    onChange={(e) => handleSeverityVoteChange(index + 1, e.target.value)}
                    className="severity-range"
                  />
                  <span>{vote}%</span>
                </div>
              ))}
            </div>

            <div className="severity-factors-container">
              {severityVotes.slice(3).map((vote, index) => (
                <div key={index + 3} className="severity-item second-line">
                  <label>Level {index + 4}</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={vote}
                    onChange={(e) => handleSeverityVoteChange(index + 4, e.target.value)}
                    className="severity-range"
                  />
                  <span>{vote}%</span>
                </div>
              ))}
            </div>

            <div className="flex justify-center mt-4">
              <button
                onClick={handleSubmitVote}
                className="submit-vote-btn"
              >
                Submit Vote
              </button>
            </div>
          </div>
        </div>
      )}

      {factorDescription && (
        <div className="description-popup-overlay">
          <div className="description-popup-content">
            <button
              className="close-description-popup"
              onClick={() => setFactorDescription(null)}
            >
              ×
            </button>
            <p>{factorDescription}</p>
          </div>
        </div>
      )}

      {currentScore !== null && (
        <div className="score-popup-overlay">
          <div className="score-popup-content">
            <button
              className="close-score-popup"
              onClick={() => setCurrentScore(null)}
            >
              ×
            </button>
            <p>Current Score: {currentScore}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyProjects;
