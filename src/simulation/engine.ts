import { CircuitState, SemanticState } from '../types/circuit';

export class SimulationEngine {
  private state: CircuitState;

  constructor() {
    this.state = {
      components: [],
      nodes: [],
      wires: [],
      semanticState: this.getInitialSemanticState()
    };
  }

  private getInitialSemanticState(): SemanticState {
    return {
      powerFlowActive: false,
      openCircuit: true,
      shortCircuit: false,
      reversePolarityDetected: false,
      overcurrentDetected: false,
      capacitorCharging: false,
      componentFailure: [],
      safetyRiskLevel: 'none'
    };
  }

  updateCircuit(state: CircuitState): SemanticState {
    this.state = state;
    return this.analyzeCircuit();
  }

  private analyzeCircuit(): SemanticState {
    const hasClosedPath = this.detectClosedPath();
    const shortCircuit = this.detectShortCircuit();
    const powerFlow = hasClosedPath && !shortCircuit;
    
    return {
      powerFlowActive: powerFlow,
      openCircuit: !hasClosedPath,
      shortCircuit,
      reversePolarityDetected: this.detectReversePolarity(),
      overcurrentDetected: this.detectOvercurrent(),
      capacitorCharging: this.detectCapacitorCharging(),
      componentFailure: this.detectComponentFailures(),
      safetyRiskLevel: this.calculateSafetyRisk()
    };
  }

  private detectClosedPath(): boolean {
    return this.state.components.some(c => c.type === 'battery') && 
           this.state.wires.length > 0;
  }

  private detectShortCircuit(): boolean {
    return this.state.wires.some(w => w.current > 10); // Simplified
  }

  private detectReversePolarity(): boolean {
    return this.state.components.some(c => 
      c.type === 'led' && this.state.wires.some(w => w.current < 0)
    );
  }

  private detectOvercurrent(): boolean {
    return this.state.wires.some(w => Math.abs(w.current) > 5);
  }

  private detectCapacitorCharging(): boolean {
    return this.state.components.some(c => c.type === 'capacitor');
  }

  private detectComponentFailures(): string[] {
    return this.state.components
      .filter(c => this.state.wires.some(w => Math.abs(w.current) > 8))
      .map(c => c.id);
  }

  private calculateSafetyRisk(): 'none' | 'low' | 'medium' | 'high' {
    if (this.state.semanticState?.shortCircuit) return 'high';
    if (this.state.semanticState?.overcurrentDetected) return 'medium';
    if (this.state.semanticState?.reversePolarityDetected) return 'low';
    return 'none';
  }
}
