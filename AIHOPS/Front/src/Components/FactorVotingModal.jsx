// src/Components/FactorVotingModal.jsx
import React, { useState, useEffect, useRef } from "react";
import "./FactorVotingModal.css";
import AlertPopup from "./AlertPopup";
import { ChevronLeft, ChevronRight } from "lucide-react";

const FactorVotingModal = ({
  project,
  currentFactorIndex,
  factorVotes,
  submittedVotes,
  onClose,
  onFactorVoteChange,
  onNextFactor,
  onPrevFactor,
  onSelectFactor,
  countVotedFactors,
  handleFactorSubmit,
}) => {
  const [errorMessage, setErrorMessage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const tabsContainerRef = useRef(null);
  const selectedTabRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScrollPosition = () => {
    const c = tabsContainerRef.current;
    if (!c) return;
    setCanScrollLeft(c.scrollLeft > 0);
    setCanScrollRight(c.scrollLeft < c.scrollWidth - c.clientWidth - 5);
  };

  const handleScroll = (dir) => {
    const c = tabsContainerRef.current;
    if (!c) return;
    c.scrollBy({ left: dir === "left" ? -200 : 200, behavior: "smooth" });
    setTimeout(checkScrollPosition, 300);
  };

  useEffect(() => {
    const c = tabsContainerRef.current;
    if (!c) return;
    c.addEventListener("scroll", checkScrollPosition);
    checkScrollPosition();
    return () => c.removeEventListener("scroll", checkScrollPosition);
  }, []);

  useEffect(() => {
    if (selectedTabRef.current && tabsContainerRef.current) {
      selectedTabRef.current.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
      checkScrollPosition();
    }
  }, [currentFactorIndex, submittedVotes]);

  const totalFactors = project.factors.length;
  const selectedFactor = project.factors[currentFactorIndex];

  const findNextUnvotedFactorIndex = () => {
    for (let i = currentFactorIndex + 1; i < project.factors.length; i++) {
      if (submittedVotes[project.factors[i].id] === undefined) return i;
    }
    for (let i = 0; i < currentFactorIndex; i++) {
      if (submittedVotes[project.factors[i].id] === undefined) return i;
    }
    return null;
  };

  const hasExplanations =
    selectedFactor?.scales_explanation &&
    Object.values(selectedFactor.scales_explanation).some(
      (ex) => ex && ex.trim() !== ""
    );

  const getValueLabel = (v) => {
    switch (v) {
      case 0:
        return "Not at all";
      case 1:
        return "Slightly";
      case 2:
        return "Moderately";
      case 3:
        return "Very";
      case 4:
        return "Extremely";
      default:
        return "";
    }
  };

  const getOptionClasses = (value, isSelected) =>
    [
      "factor-option",
      `factor-option-${value}`,
      isSelected ? "selected" : "",
    ].join(" ");

  const handleRowClick = async (value) => {
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      const factorId = selectedFactor.id;

      onFactorVoteChange(factorId, value);
      const ok = await handleFactorSubmit(factorId, value);

      if (ok) {
        const nextUnvotedFactorIndex = findNextUnvotedFactorIndex();
        setTimeout(() => {
          if (nextUnvotedFactorIndex !== null) {
            onSelectFactor(nextUnvotedFactorIndex);
          }
        }, 300);
      } else {
        throw new Error("Submission failed");
      }
    } catch (err) {
      console.error("Failed to submit vote:", err);
      setErrorMessage("Vote submission failed. Please try again.");
      setTimeout(() => setErrorMessage(null), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPyramidRows = (factors, maxWidth = 900, itemWidth = 230) => {
    const itemsPerRow = Math.floor(maxWidth / itemWidth);
    const rows = [];

    for (let i = 0; i < factors.length; i += itemsPerRow) {
      rows.push(factors.slice(i, i + itemsPerRow));
    }

    return rows;
  };

  // const getPyramidRows = (factors) => {
  //   const rows = [];
  //   let remaining = [...factors];
  //   let rowLength = Math.ceil(remaining.length / 2); // wider starting row

  //   while (remaining.length > 0) {
  //     const row = remaining.splice(0, rowLength);
  //     rows.push(row);
  //     rowLength = Math.max(1, rowLength - 1); // gentle shrink
  //   }

  //   return rows;
  // };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="close-modal" onClick={onClose}>
          ×
        </button>
        <h2 className="modal-title">Vote on dimensions for {project.name}</h2>

        {/* Pyramid Tabs */}
        <div className="factor-tabs-pyramid">
          {project.factors.map((f) => {
            const hasVote =
              submittedVotes[f.id] !== undefined ||
              factorVotes[f.id] !== undefined;
            const voteVal =
              submittedVotes[f.id] !== undefined
                ? submittedVotes[f.id]
                : factorVotes[f.id];
            const isActive = project.factors.indexOf(f) === currentFactorIndex;

            return (
              <div
                key={f.id}
                className={`factor-tab ${isActive ? "selected" : ""}`}
                onClick={() =>
                  project.factors.indexOf(f) !== currentFactorIndex &&
                  onSelectFactor(project.factors.indexOf(f))
                }
              >
                <span className="factor-name">{f.name}</span>
                {hasVote && (
                  <span
                    className={`vote-indicator vote-indicator-${voteVal}`}
                    style={{
                      backgroundColor: "#9069d8",
                      color: "black",
                    }}
                  >
                    {voteVal}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Progress */}
        <div className="progress-bar-container">
          <div
            className="progress-bar-fill"
            style={{ width: `${(countVotedFactors() / totalFactors) * 100}%` }}
          />
        </div>
        <div className="progress-text">
          Voted on {countVotedFactors()} of {totalFactors} factors (
          {Math.round((countVotedFactors() / totalFactors) * 100)}%)
        </div>

        {/* Factor Table */}
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
                    <th style={{ textAlign: "center", width: "100px" }}>
                      Vote
                    </th>
                    <th style={{ textAlign: "center" }}>Description </th>
                    {hasExplanations && (
                      <th style={{ textAlign: "center" }}>Explanation</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {[0, 1, 2, 3, 4].map((v) => {
                    const isSel = factorVotes[selectedFactor.id] === v;
                    return (
                      <tr
                        key={v}
                        className={`factor-table-row ${
                          isSel ? "selected-row" : ""
                        } ${isSubmitting ? "disabled" : ""}`}
                        onClick={() => !isSubmitting && handleRowClick(v)}
                      >
                        <td className="vote-cell" style={{ maxWidth: "10px" }}>
                          <div className="vote-option-container">
                            <div className={getOptionClasses(v, isSel)}>
                              {v}
                            </div>
                            <div className="vote-label">{getValueLabel(v)}</div>
                          </div>
                        </td>
                        <td className="description-cell">
                          {selectedFactor.scales_desc?.[v] || ""}
                        </td>
                        {hasExplanations && (
                          <td className="explanation-cell">
                            {selectedFactor.scales_explanation?.[v] || ""}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {errorMessage && (
          <AlertPopup
            title="Error"
            message={errorMessage}
            onClose={() => setErrorMessage(null)}
            autoCloseTime={3000}
          />
        )}
      </div>
    </div>
  );
};

export default FactorVotingModal;
