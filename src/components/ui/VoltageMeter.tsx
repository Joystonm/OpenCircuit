import React from 'react';

export const VoltageMeter: React.FC = () => {
  return (
    <div className="voltage-meter">
      <div className="meter-display">9.0V</div>
      <div className="meter-label">Voltage</div>
    </div>
  );
};
