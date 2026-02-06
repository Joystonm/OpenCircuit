export type ComponentType = 'battery' | 'bulb' | 'led' | 'resistor' | 'switch' | 'capacitor' | 'wire' | 'lightbulb' | 'motor' | 'ground' | 'inductor' | 'diode' | 'potentiometer' | 'fuse' | 'transistor' | 'transformer' | 'relay' | 'speaker' | 'microphone' | 'antenna' | 'crystal' | 'opamp' | 'disconnect' | 'move';

export interface CircuitNode {
  id: string;
  x: number;
  y: number;
  connections: string[];
  voltage?: number;
}

export interface CircuitComponent {
  id: string;
  type: ComponentType;
  position: { x: number; y: number };
  rotation: number;
  nodes: string[];
  properties: Record<string, any>;
  health?: number;
}

export interface CircuitState {
  components: CircuitComponent[];
  nodes: CircuitNode[];
  wires: Wire[];
  semanticState: SemanticState;
}

export interface SemanticState {
  powerFlowActive: boolean;
  openCircuit: boolean;
  shortCircuit: boolean;
  reversePolarityDetected: boolean;
  overcurrentDetected: boolean;
  capacitorCharging: boolean;
  componentFailure: string[];
  safetyRiskLevel: 'none' | 'low' | 'medium' | 'high';
}

export interface Wire {
  id: string;
  fromNode: string;
  toNode: string;
  current: number;
  from?: string;
  to?: string;
}

export type CircuitSemantics = SemanticState;
