import React, { createContext, useContext, useState, useCallback } from 'react';
import { TamboContext, TamboUIComponent } from '../types/tambo';
import { selectUIComponents } from './registry';
import { buildTamboContext } from './contextBuilder';
import { SemanticState } from '../types/circuit';

interface TamboProviderState {
  activeComponents: TamboUIComponent[];
  updateContext: (semanticState: SemanticState) => void;
}

const TamboContext = createContext<TamboProviderState | null>(null);

export const TamboProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeComponents, setActiveComponents] = useState<TamboUIComponent[]>([]);

  const updateContext = useCallback((semanticState: SemanticState) => {
    const tamboContext = buildTamboContext(semanticState);
    const selectedComponents = selectUIComponents(tamboContext);
    setActiveComponents(selectedComponents);
  }, []);

  return (
    <TamboContext.Provider value={{ activeComponents, updateContext }}>
      {children}
      <div className="tambo-ui-layer">
        {activeComponents.map(({ id, component: Component }) => (
          <Component key={id} />
        ))}
      </div>
    </TamboContext.Provider>
  );
};

export const useTambo = () => {
  const context = useContext(TamboContext);
  if (!context) throw new Error('useTambo must be used within TamboProvider');
  return context;
};
