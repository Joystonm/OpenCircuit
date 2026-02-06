import { CircuitState, CircuitSemantics, CircuitComponent, Wire } from '../types/circuit';

interface SimulatorState {
  nodes: Map<string, { voltage: number; current: number }>;
  components: Map<string, CircuitComponent>;
  wires: Wire[];
}

export class CircuitSimulator {
  private state: SimulatorState;
  
  constructor() {
    this.state = {
      nodes: new Map(),
      components: new Map(),
      wires: []
    };
  }

  addComponent(component: CircuitComponent): void {
    this.state.components.set(component.id, component);
    this.updateCircuit();
  }

  connect(nodeA: string, nodeB: string): void {
    this.state.wires.push({ id: `${nodeA}-${nodeB}`, fromNode: nodeA, toNode: nodeB, current: 0, from: nodeA, to: nodeB });
    this.updateCircuit();
  }

  private updateCircuit(): void {
    this.initializeNodes();
    this.calculateVoltages();
    this.calculateCurrents();
    this.updateComponentStates();
    this.checkFailures();
  }

  private initializeNodes(): void {
    this.state.components.forEach(component => {
      component.nodes.forEach(nodeId => {
        if (!this.state.nodes.has(nodeId)) {
          this.state.nodes.set(nodeId, { voltage: 0, current: 0 });
        }
      });
    });
  }

  private calculateVoltages(): void {
    this.state.nodes.forEach(node => node.voltage = 0);
    
    const batteries = Array.from(this.state.components.values())
      .filter(c => c.type === 'battery' && (c.health || 100) > 0);
    
    batteries.forEach(battery => {
      const [pos, neg] = battery.nodes;
      const voltage = battery.properties.voltage || 9;
      
      this.propagateVoltage(pos, voltage);
      this.propagateVoltage(neg, 0);
    });
  }

  private propagateVoltage(nodeId: string, voltage: number): void {
    if (this.state.nodes.has(nodeId)) {
      const node = this.state.nodes.get(nodeId)!;
      node.voltage = voltage;
      
      this.state.wires.forEach(wire => {
        if (wire.from === nodeId && this.state.nodes.get(wire.to!)?.voltage === 0) {
          this.propagateVoltage(wire.to!, voltage);
        } else if (wire.to === nodeId && this.state.nodes.get(wire.from!)?.voltage === 0) {
          this.propagateVoltage(wire.from!, voltage);
        }
      });
    }
  }

  private calculateCurrents(): void {
    this.state.components.forEach(component => {
      const [nodeA, nodeB] = component.nodes;
      const voltageA = this.state.nodes.get(nodeA)?.voltage || 0;
      const voltageB = this.state.nodes.get(nodeB)?.voltage || 0;
      const voltageDiff = Math.abs(voltageA - voltageB);
      
      switch (component.type) {
        case 'resistor':
          component.properties.current = voltageDiff / (component.properties.resistance || 1000);
          break;
        case 'bulb':
          component.properties.current = voltageDiff / (component.properties.resistance || 240);
          component.properties.glowing = component.properties.current > 0.01;
          break;
        case 'led':
          if (voltageDiff >= (component.properties.forwardVoltage || 2.1)) {
            component.properties.current = (voltageDiff - (component.properties.forwardVoltage || 2.1)) / 100;
            component.properties.glowing = true;
          } else {
            component.properties.current = 0;
            component.properties.glowing = false;
          }
          break;
        case 'capacitor':
          component.properties.charging = voltageDiff > 0.1;
          component.properties.voltage = voltageDiff;
          break;
      }
    });
  }

  private updateComponentStates(): void {
    this.state.components.forEach(component => {
      if (component.type === 'switch') {
        component.properties.closed = component.properties.closed !== false;
      }
    });
  }

  private checkFailures(): void {
    this.state.components.forEach(component => {
      const current = component.properties.current || 0;
      const maxCurrent = component.properties.maxCurrent || 0.1;
      
      if (current > maxCurrent) {
        component.health = 0;
      }
    });
  }

  getSemantics(): CircuitSemantics {
    const hasActiveBattery = Array.from(this.state.components.values())
      .some(c => c.type === 'battery' && (c.health || 100) > 0);
    
    const hasClosedPath = this.state.wires.length > 0 && this.state.components.size > 1;
    const hasShortCircuit = Array.from(this.state.components.values())
      .some(c => c.type === 'battery' && (c.properties.current || 0) > 1);

    return {
      powerFlowActive: hasActiveBattery && hasClosedPath && !hasShortCircuit,
      openCircuit: !hasClosedPath,
      shortCircuit: hasShortCircuit,
      reversePolarityDetected: false,
      overcurrentDetected: Array.from(this.state.components.values())
        .some(c => (c.properties.current || 0) > (c.properties.maxCurrent || 0.1)),
      capacitorCharging: Array.from(this.state.components.values())
        .some(c => c.type === 'capacitor' && (c.properties.charging || false)),
      componentFailure: Array.from(this.state.components.values())
        .filter(c => (c.health || 100) <= 0)
        .map(c => c.id),
      safetyRiskLevel: 'none' as const
    };
  }

  getState(): CircuitState {
    return {
      components: Array.from(this.state.components.values()),
      nodes: Array.from(this.state.nodes.entries()).map(([id, data]) => ({
        id,
        x: 0,
        y: 0,
        connections: [],
        voltage: data.voltage
      })),
      wires: this.state.wires,
      semanticState: this.getSemantics()
    };
  }
}
