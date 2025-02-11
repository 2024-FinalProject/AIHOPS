import React, { useState } from 'react';
import { Card, CardContent } from "../Components/ui/card";
import './FactorInputForm.css';

const FactorInputForm = ({ 
    onSubmit, 
    onCancel, 
    scaleDescriptions,
    setScaleDescriptions,
    scaleExplanations,
    setScaleExplanations 
}) => {
    const [newFactorName, setNewFactorName] = useState("");
    const [newFactorDescription, setNewFactorDescription] = useState("");
  
    const handleSubmit = () => {
        if (!newFactorName || !newFactorDescription) {
            alert("Please enter a factor name and description.");
            return;
        }
        
        if (scaleDescriptions.some(desc => !desc) || scaleExplanations.some(exp => !exp)) {
            alert("Please fill in all scale descriptions and explanations.");
            return;
        }
        
        onSubmit({
            name: newFactorName,
            description: newFactorDescription,
            scaleDescriptions: scaleDescriptions.slice().reverse(),
            scaleExplanations: scaleExplanations.slice().reverse()
        });
    };      
    
    return (
      <div className="factor-form-container">
        <Card className="factor-card">
          <div className="factor-header">
            <u>Add New Content Factor</u>:
          </div>
          
          <CardContent className="p-2">
            <div className="factor-grid">
              <div className="factor-input-group factor-name-group">
                <label className="factor-input-label"><b><u>Factor Name</u>:</b></label>
                <input
                  type="text"
                  value={newFactorName}
                  onChange={(e) => setNewFactorName(e.target.value)}
                  className="factor-input"
                  placeholder="Enter factor name"
                />
              </div>
              
              <div className="factor-input-group">
                <label className="factor-input-label"><b><u>Factor Description</u>:</b></label>
                <input
                  type="text"
                  value={newFactorDescription}
                  onChange={(e) => setNewFactorDescription(e.target.value)}
                  className="factor-input"
                  placeholder="Enter factor description"
                />
              </div>
            </div>
            <div style={{paddingLeft: '10px'}}>
                <table className="factor-table">
                <thead className="factor-table-header">
                    <tr>
                    <th>Score</th>
                    <th>Description</th>
                    <th>Explanation</th>
                    </tr>
                </thead>
                <tbody>
                    {[4, 3, 2, 1, 0].map((score, idx) => (
                    <tr key={score} className="factor-table-row">
                        <td className="factor-score-cell">
                        {score}
                        </td>
                        <td className="factor-table-cell">
                        <textarea
                            value={scaleDescriptions[4 - score]}
                            onChange={(e) => {
                            const newDescs = [...scaleDescriptions];
                            newDescs[4 - score] = e.target.value;
                            setScaleDescriptions(newDescs);
                            }}
                            className="factor-table-input"
                            placeholder="Enter description"
                            rows="2"
                        />
                        </td>
                        <td className="factor-table-cell">
                        <textarea
                            value={scaleExplanations[4 - score]}
                            onChange={(e) => {
                            const newExps = [...scaleExplanations];
                            newExps[4 - score] = e.target.value;
                            setScaleExplanations(newExps);
                            }}
                            className="factor-table-input"
                            placeholder="Enter explanation"
                            rows="2"
                        />
                        </td>
                    </tr>
                    ))}
                </tbody>
                </table>
            </div>

            <div className="factor-button-group">
              <button
                onClick={onCancel}
                className="factor-button factor-cancel-button"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="factor-button factor-submit-button"
              >
                Add Factor
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
};

export default FactorInputForm;