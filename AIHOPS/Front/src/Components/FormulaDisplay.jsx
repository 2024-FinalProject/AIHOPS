import React from "react";
import { BlockMath } from "react-katex";
import "katex/dist/katex.min.css"; // Import the required CSS for KaTeX

const FormulaDisplay = ({ nominator, denominator, d_score, score }) => {
    const formula = `
        \\left( \\frac{${nominator}}{${denominator}} \\right)^{${d_score}} = ${score}
    `;

    return (
        <div style={{ fontSize: "20px", textAlign: "center" }}>
            <BlockMath>{formula}</BlockMath>
        </div>
    );
};

export default FormulaDisplay;
