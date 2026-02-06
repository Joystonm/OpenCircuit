import React from 'react';

export const CurrentMeter: React.FC = () => {
  return (
    <div className="current-meter">
      <div className="meter-display">2.5A</div>
      <div className="meter-label">Current</div>
    </div>
  );
};
