export interface TamboContext {
  circuitTopology: string;
  componentHealth: Record<string, 'healthy' | 'damaged' | 'failed'>;
  energyFlowDirection: 'forward' | 'reverse' | 'none';
  safetyRiskLevel: 'none' | 'low' | 'medium' | 'high';
  semanticStates: string[];
}

export interface TamboUIComponent {
  id: string;
  component: React.ComponentType<any>;
  priority: number;
  conditions: (context: TamboContext) => boolean;
}
