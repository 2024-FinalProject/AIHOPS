import React from "react";
import { BlockMath } from "react-katex";
import "katex/dist/katex.min.css"; // Import the required CSS for KaTeX

const FormulaDisplay = ({ nominator, denominator, d_score, score }) => {
    const roundToThree = (num) => Number(num).toFixed(3);
    
    const formula = `
        \\left( \\frac{${roundToThree(nominator)}}{${roundToThree(denominator)}} \\right)^{${roundToThree(d_score)}} = ${roundToThree(score)}
    `;

    return (
        <div style={{ fontSize: "20px", textAlign: "left" }}>
            <BlockMath>{formula}</BlockMath>
        </div>
    );
};

export default FormulaDisplay;

