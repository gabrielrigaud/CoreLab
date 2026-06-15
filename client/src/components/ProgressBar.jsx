import React from 'react';
import './ProgressBar.css';

const ProgressBar = ({ progress, status }) => {
  let progressColor = 'var(--accent-primary)';

  if (status === 'passed') {
    progressColor = 'var(--success)';
  } else if (status === 'failed') {
    progressColor = 'var(--danger)';
  }

  return (
    <div className="progress-container">
      <div className="progress-header">
        <span className="progress-label">Progression</span>
        <span className="progress-percentage">{progress}%</span>
      </div>
      <div className="progress-track">
        <div 
          className="progress-fill" 
          style={{ 
            width: `${progress}%`,
            backgroundColor: progressColor
          }}
        ></div>
      </div>
    </div>
  );
};

export default ProgressBar;
