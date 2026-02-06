import { TamboContext } from '../types/tambo';
import { SemanticState } from '../types/circuit';

export const buildTamboContext = (semanticState: SemanticState): TamboContext => {
  const states = [];
  
  if (semanticState.powerFlowActive) states.push('power_flow_active');
  if (semanticState.openCircuit) states.push('open_circuit');
  if (semanticState.shortCircuit) states.push('short_circuit');
  if (semanticState.reversePolarityDetected) states.push('reverse_polarity');
  if (semanticState.overcurrentDetected) states.push('overcurrent_detected');
  if (semanticState.capacitorCharging) states.push('capacitor_charging');

  return {
    circuitTopology: determineTopology(semanticState),
    componentHealth: buildComponentHealth(semanticState),
    energyFlowDirection: determineEnergyFlow(semanticState),
    safetyRiskLevel: semanticState.safetyRiskLevel,
    semanticStates: states
  };
};

const determineTopology = (state: SemanticState): string => {
  if (state.openCircuit) return 'open';
  if (state.shortCircuit) return 'short';
  return 'closed';
};

const buildComponentHealth = (state: SemanticState): Record<string, 'healthy' | 'damaged' | 'failed'> => {
  const health: Record<string, 'healthy' | 'damaged' | 'failed'> = {};
  
  state.componentFailure.forEach(id => {
    health[id] = 'failed';
  });
  
  return health;
};

const determineEnergyFlow = (state: SemanticState): 'forward' | 'reverse' | 'none' => {
  if (!state.powerFlowActive) return 'none';
  if (state.reversePolarityDetected) return 'reverse';
  return 'forward';
};
