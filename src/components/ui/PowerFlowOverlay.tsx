import React from 'react';

export const PowerFlowOverlay: React.FC = () => {
  return (
    <div className="power-flow-overlay">
      <div className="flow-arrow">→</div>
      <div className="flow-label">Power Flow Active</div>
    </div>
  );
};
