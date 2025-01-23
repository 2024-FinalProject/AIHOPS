import React from "react";
import { MathComponent } from "react-mathjax2";

const FormulaDisplay = ({ nominator, denominator, d_score, score }) => {
    const formula = `
        \\left( \\frac{${nominator}}{${denominator}} \\right)^{${d_score}} = ${score}
    `;

    return (
        <div style={{ fontSize: "20px", textAlign: "center" }}>
            <MathComponent tex={formula} />
        </div>
    );
};

export default FormulaDisplay;
