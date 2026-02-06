import React from 'react';

export const SafetyAlert: React.FC = () => {
  return (
    <div className="safety-alert">
      <div className="alert-icon">⚠️</div>
      <div className="alert-message">Circuit Safety Warning</div>
    </div>
  );
};
