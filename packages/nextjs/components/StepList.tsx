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
      <button onClick={() => onStepClick(3)}>Provide Additional Details</button>
    </li>
    <li className={currentPage >= 4 ? "step step-primary" : "step"}>
      <button onClick={() => onStepClick(4)}>Review and Submit</button>
    </li>
  </ul>
);
