import React, { useState } from 'react';
import './FactorInputForm.css';

const FactorInputForm = ({
  onSubmit,
  onCancel,
  initialValues = {
    name: '',
    description: '',
    scaleDescriptions: Array(5).fill(''),
    scaleExplanations: Array(5).fill('')
  }
}) => {
  const [name, setName] = useState(initialValues.name);
  const [description, setDescription] = useState(initialValues.description);
  const [scaleDescriptions, setScaleDescriptions] = useState(initialValues.scaleDescriptions);
  const [scaleExplanations, setScaleExplanations] = useState(initialValues.scaleExplanations);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate the form data
    if (!name.trim()) {
      setError('Assessment Dimension name is required');
      return;
    }
    
    if (!description.trim()) {
      setError('Assessment Dimension description is required');
      return;
    }
    
    // Check that all scale descriptions are filled
    const emptyDescIndex = scaleDescriptions.findIndex(desc => !desc.trim());
    if (emptyDescIndex !== -1) {
      setError(`Description for scale value ${emptyDescIndex} is required`);
      return;
    }
    
    // Submit the form data
    onSubmit({
      name,
      description,
      scaleDescriptions,
      scaleExplanations
    });
    
    // Clear the error
    setError('');
  };

  const handleScaleDescChange = (index, value) => {
    const newDescs = [...scaleDescriptions];
    newDescs[index] = value;
    setScaleDescriptions(newDescs);
  };

  const handleScaleExpChange = (index, value) => {
    const newExps = [...scaleExplanations];
    newExps[index] = value;
    setScaleExplanations(newExps);
  };

  return (
    <div className="factor-form-container">
      <div className="factor-card">
        <div className="factor-header">
          Add New Assessment Dimension
        </div>
        <div className="factor-grid">
          {error && (
            <div className="error-message" style={{ color: '#dc2626', margin: '0 0 10px 0', textAlign: 'center' }}>
              {error}
            </div>
          )}
          
          <div className="factor-input-group factor-name-group">
            <label className="factor-input-label"><b><u>Assessment Dimension Name</u>:</b></label>
            <input
              type="text"
              className="factor-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter dimension name"
            />
          </div>
          
          <div className="factor-input-group">
            <label className="factor-input-label"><b><u>Assessment Dimension Description</u>:</b></label>
            <textarea
              className="factor-input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter dimension description"
              rows={3}
            />
          </div>
          
          <table className="factor-table">
            <thead className="factor-table-header">
              <tr>
                <th>Score</th>
                <th>Description</th>
                <th>Explanation</th>
              </tr>
            </thead>
            <tbody>
              {[0, 1, 2, 3, 4].map((score) => (
                <tr key={score} className="factor-table-row">
                  <td className="factor-score-cell">{score}</td>
                  <td className="factor-table-cell">
                    <textarea
                      className="factor-table-input"
                      value={scaleDescriptions[score]}
                      onChange={(e) => handleScaleDescChange(score, e.target.value)}
                      placeholder={`Description for score ${score} (Required)`}
                      required
                    />
                  </td>
                  <td className="factor-table-cell">
                    <textarea
                      className="factor-table-input"
                      value={scaleExplanations[score]}
                      onChange={(e) => handleScaleExpChange(score, e.target.value)}
                      placeholder={`Explanation for score ${score} (Optional)`}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <div className="factor-button-group">
            <button 
              className="factor-button factor-cancel-button"
              onClick={onCancel}
            >
              Cancel
            </button>
            <button 
              className="factor-button factor-submit-button"
              onClick={handleSubmit}
            >
              Add Assessment Dimension
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FactorInputForm;