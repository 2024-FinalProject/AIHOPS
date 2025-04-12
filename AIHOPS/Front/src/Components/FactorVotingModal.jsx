// src/Components/FactorVotingModal.jsx
import React, { useState, useEffect, useRef } from "react";
import "./FactorVotingModal.css";
import ConfirmationPopup from "./ConfirmationPopup";
import { ChevronLeft, ChevronRight } from "lucide-react";

const FactorVotingModal = ({
  project,
  currentFactorIndex,
  factorVotes,           // from MyProjects state
  submittedVotes,        // from MyProjects state
  onClose,               // closes the modal
  onFactorVoteChange,    // (factorId, value) => void
  onNextFactor,          // () => void
  onPrevFactor,          // () => void
  onSelectFactor,
  countVotedFactors,     // () => number
  handleFactorSubmit     // async () => boolean
}) => {
  // confirmation popup state
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [lastVotedFactor, setLastVotedFactor] = useState(null);

  // scrolling refs & state
  const tabsContainerRef = useRef(null);
  const selectedTabRef = useRef(null);
  const [canScrollLeft,  setCanScrollLeft]  = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Helpers for scroll‐buttons
  const checkScrollPosition = () => {
    const c = tabsContainerRef.current;
    if (!c) return;
    setCanScrollLeft (c.scrollLeft > 0);
    setCanScrollRight(c.scrollLeft < c.scrollWidth - c.clientWidth - 5);
  };
  const handleScroll = (dir) => {
    const c = tabsContainerRef.current;
    if (!c) return;
    c.scrollBy({ left: dir === 'left' ? -200 : 200, behavior: 'smooth' });
    setTimeout(checkScrollPosition, 300);
  };
  useEffect(() => {
    const c = tabsContainerRef.current;
    if (!c) return;
    c.addEventListener('scroll', checkScrollPosition);
    checkScrollPosition();
    return () => c.removeEventListener('scroll', checkScrollPosition);
  }, []);

  // whenever you move factors or new votes come in, scroll the selected tab into view
  useEffect(() => {
    if (selectedTabRef.current && tabsContainerRef.current) {
      selectedTabRef.current.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest"
      });
      checkScrollPosition();
    }
  }, [currentFactorIndex, submittedVotes]);

  // derive some handy bits
  const totalFactors    = project.factors.length;
  const votedFactors    = countVotedFactors();
  const remaining       = totalFactors - votedFactors;
  const progressPercent = totalFactors > 0 ? (votedFactors/totalFactors)*100 : 0;

  const canGoPrev = currentFactorIndex > 0;
  const canGoNext = currentFactorIndex < totalFactors - 1;

  const selectedFactor = project.factors[currentFactorIndex];

  const getValueLabel = (v) => {
    switch(v) {
      case 0: return "Not at all";
      case 1: return "Slightly";
      case 2: return "Moderately";
      case 3: return "Very";
      case 4: return "Extremely";
      default: return "";
    }
  };
  const getOptionClasses = (value, isSelected) => {
    return [
      "factor-option",
      `factor-option-${value}`,
      isSelected ? "selected" : ""
    ].join(" ");
  };

  // Submit button handler
  const onSubmitClick = async () => {
    const value = factorVotes[selectedFactor.id];
    if (value === undefined) {
      alert("Please select a value before submitting your vote.");
      return;
    }
    const ok = await handleFactorSubmit();
    if (ok) {
      setLastVotedFactor({ name: selectedFactor.name, value });
      setShowConfirmation(true);
      // auto‐dismiss popup
      setTimeout(() => setShowConfirmation(false), 2000);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="close-modal" onClick={onClose}>×</button>
        <h2 className="modal-title">Vote on factors for {project.name}</h2>

        {/* ─── TABS ─────────────────────────────────────────── */}
        <div className="factor-tabs-wrapper">
          <button
            className={`tabs-nav-button ${canScrollLeft ? 'active' : 'disabled'}`}
            onClick={() => handleScroll('left')}
            disabled={!canScrollLeft}
          ><ChevronLeft size={20}/></button>

          <div className="factor-tabs-scroll-container">
            <div
              ref={tabsContainerRef}
              className="factor-tabs-container"
            >
              {project.factors.map((f, idx) => {
                const hasVote  = submittedVotes[f.id] !== undefined;
                const voteVal  = submittedVotes[f.id];
                const isActive = idx === currentFactorIndex;

                return (
                  <div
                    key={f.id}
                    ref={isActive ? selectedTabRef : null}
                    className={`factor-tab ${isActive ? "selected" : ""}`}
                    onClick={() => idx !== currentFactorIndex && onSelectFactor(idx)}
                  >
                    <span>{f.name}</span>
                    {hasVote && (
                      <span className={`vote-indicator vote-indicator-${voteVal}`}>
                        {voteVal}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <button
            className={`tabs-nav-button ${canScrollRight ? 'active' : 'disabled'}`}
            onClick={() => handleScroll('right')}
            disabled={!canScrollRight}
          ><ChevronRight size={20}/></button>
        </div>

        {/* ─── PROGRESS ─────────────────────────────────────── */}
        <div className="progress-bar-container">
          <div
            className="progress-bar-fill"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="progress-text">
          Voted on {votedFactors} of {totalFactors} factors ({Math.round(progressPercent)}%)
        </div>

        {/* ─── SELECTED FACTOR ───────────────────────────────── */}
        {selectedFactor && (
          <div className="factor-content">
            <div className="factor-header">
              <h3 className="factor-title">{selectedFactor.name}</h3>
              <p className="factor-description">{selectedFactor.description}</p>
            </div>

            <div className="factor-table-container">
              <table className="factor-table">
                <thead>
                  <tr>
                    <th style= {{textAlign: "center"}}>Vote</th>
                    <th>Description</th>
                    <th>Explanation</th>
                  </tr>
                </thead>
                <tbody>
                  {[0,1,2,3,4].map((v) => {
                    const isSel = factorVotes[selectedFactor.id] === v;
                    return (
                      <tr
                        key={v}
                        className={`factor-table-row ${isSel ? "selected-row" : ""}`}
                        onClick={() => onFactorVoteChange(selectedFactor.id, v)}
                      >
                        <td className="vote-cell" style={{maxwidth:"10px"}}>
                          <div className="vote-option-container">
                            <div className={getOptionClasses(v, isSel)}>{v}</div>
                            <div className="vote-label">{getValueLabel(v)}</div>
                          </div>
                        </td>
                        <td className="description-cell">
                          {selectedFactor.scales_desc?.[v] || ''}
                        </td>
                        <td className="explanation-cell">
                          {selectedFactor.scales_explanation?.[v] || ''}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* ─── NAV BUTTONS ───────────────────────────────── */}
            <div className="navigation-buttons">
              <button
                className={`nav-button prev-button ${!canGoPrev ? 'disabled' : ''}`}
                onClick={onPrevFactor}
                disabled={!canGoPrev}
              >
                <ChevronLeft size={16}/> Previous
              </button>

              <button
                className="vote-factor-button"
                onClick={onSubmitClick}
                disabled={factorVotes[selectedFactor.id] === undefined}
              >
                Submit Vote
              </button>

              <button
                className={`nav-button next-button ${!canGoNext ? 'disabled' : ''}`}
                onClick={onNextFactor}
                disabled={!canGoNext}
              >
                Next <ChevronRight size={16}/>
              </button>
            </div>
          </div>
        )}

        {/* ─── CONFIRMATION ────────────────────────────────── */}
        {showConfirmation && lastVotedFactor && (
          <ConfirmationPopup
            title="Vote Submitted!"
            message={
              `You rated "${lastVotedFactor.name}" as ${getValueLabel(lastVotedFactor.value)} (${lastVotedFactor.value}). ` +
              (remaining > 0
                ? `You have ${remaining} more factor${remaining !== 1 ? 's' : ''} to vote on.`
                : 'You have completed voting on all factors!')
            }
            onClose={() => setShowConfirmation(false)}
            autoCloseTime={2000}
          />
        )}
      </div>
    </div>
  );
};

export default FactorVotingModal;
