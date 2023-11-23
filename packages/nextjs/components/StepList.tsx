import React from "react";

interface StepListProps {
  currentPage: number;
  onStepClick: (stepNumber: number) => void;
}

export const StepList: React.FC<StepListProps> = ({ currentPage, onStepClick }) => (
  <ul className="steps steps-vertical">
    <li className={currentPage >= 1 ? "step step-primary" : "step"}>
      <button onClick={() => onStepClick(1)}>Register with PolygonID</button>
    </li>
    <li className={currentPage >= 2 ? "step step-primary" : "step"}>
      <button onClick={() => onStepClick(2)}>Choose Asset Type</button>
    </li>
    <li className={currentPage >= 3 ? "step step-primary" : "step"}>
      <button onClick={() => onStepClick(3)}>Required Data for NFT</button>
    </li>
    <li className={currentPage >= 4 ? "step step-primary" : "step"}>
      <button onClick={() => onStepClick(4)}>Additional Details for Metadata</button>
    </li>
    <li className={currentPage >= 5 ? "step step-primary" : "step"}>
      <button onClick={() => onStepClick(5)}>Legal Contract</button>
    </li>
    <li className={currentPage >= 6 ? "step step-primary" : "step"}>
      <button onClick={() => onStepClick(6)}>Review and Submit</button>
    </li>
  </ul>
);
