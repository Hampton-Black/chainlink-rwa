import React, { useContext } from "react";
import { ThemeContext } from "~~/contexts/ThemeContext";

interface StepListProps {
  currentPage: number;
  onStepClick: (stepNumber: number) => void;
}

export const StepList: React.FC<StepListProps> = ({ currentPage, onStepClick }) => {
  const { isDarkTheme } = useContext(ThemeContext);

  return (
    <ul className="steps steps-vertical">
      <li className={currentPage >= 1 ? `step ${isDarkTheme ? "step-accent" : "step-primary"}` : "step"}>
        <button onClick={() => onStepClick(1)}>Choose Asset Type</button>
      </li>
      <li className={currentPage >= 2 ? `step ${isDarkTheme ? "step-accent" : "step-primary"}` : "step"}>
        <button onClick={() => onStepClick(2)}>Required Data</button>
      </li>
      <li className={currentPage >= 3 ? `step ${isDarkTheme ? "step-accent" : "step-primary"}` : "step"}>
        <button onClick={() => onStepClick(3)}>Additional Details</button>
      </li>
      <li className={currentPage >= 4 ? `step ${isDarkTheme ? "step-accent" : "step-primary"}` : "step"}>
        <button onClick={() => onStepClick(4)}>Legal Contract</button>
      </li>
      <li className={currentPage >= 5 ? `step ${isDarkTheme ? "step-accent" : "step-primary"}` : "step"}>
        <button onClick={() => onStepClick(5)}>Review and Submit</button>
      </li>
    </ul>
  );
};
