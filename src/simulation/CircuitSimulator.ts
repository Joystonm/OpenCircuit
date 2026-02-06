import { CircuitState, CircuitSemantics, CircuitComponent } from '../types/circuit';

export class CircuitSimulator {
  private state: CircuitState;
  
  constructor() {
    this.state = {
      nodes: new Map(),
      components: new Map(),
      wires: []
    };
  }

  // Add component to circuit
  addComponent(component: CircuitComponent): void {
    this.state.components.set(component.id, component);
    this.updateCircuit();
  }

  // Connect two nodes
  connect(nodeA: string, nodeB: string): void {
    this.state.wires.push({ from: nodeA, to: nodeB });
    this.updateCircuit();
  }

  // Core simulation - simplified Kirchhoff's laws
  private updateCircuit(): void {
    this.initializeNodes();
    this.calculateVoltages();
    this.calculateCurrents();
    this.updateComponentStates();
    this.checkFailures();
  }

  private initializeNodes(): void {
    // Initialize all nodes from components
    this.state.components.forEach(component => {
      component.nodes.forEach(nodeId => {
        if (!this.state.nodes.has(nodeId)) {
          this.state.nodes.set(nodeId, { voltage: 0, current: 0 });
        }
      });
    });
  }

  private calculateVoltages(): void {
    // Reset all voltages
    this.state.nodes.forEach(node => node.voltage = 0);
    
    // Apply battery voltages
    const batteries = Array.from(this.state.components.values())
      .filter(c => c.type === 'battery' && c.health === 'normal');
    
    batteries.forEach(battery => {
      const [pos, neg] = battery.nodes;
      const voltage = battery.properties.voltage || 9;
      
      // Propagate voltage through connected components
      this.propagateVoltage(pos, voltage);
      this.propagateVoltage(neg, 0);
    });
  }

  private propagateVoltage(nodeId: string, voltage: number): void {
    if (this.state.nodes.has(nodeId)) {
      this.state.nodes.get(nodeId)!.voltage = voltage;
      
      // Propagate through wires
      this.state.wires.forEach(wire => {
        if (wire.from === nodeId && this.state.nodes.get(wire.to)?.voltage === 0) {
          this.propagateVoltage(wire.to, voltage);
        } else if (wire.to === nodeId && this.state.nodes.get(wire.from)?.voltage === 0) {
          this.propagateVoltage(wire.from, voltage);
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
          const resistance = component.properties.resistance || 1000;
          component.properties.current = voltageDiff / resistance;
          break;
          
        case 'lightbulb':
          const bulbResistance = component.properties.resistance || 240;
          component.properties.current = voltageDiff / bulbResistance;
          component.properties.glowing = component.properties.current > 0.01;
          break;
          
        case 'led':
          const forwardVoltage = component.properties.forwardVoltage || 2.1;
          if (voltageDiff >= forwardVoltage) {
            component.properties.current = (voltageDiff - forwardVoltage) / 100;
            component.properties.glowing = true;
          } else {
            component.properties.current = 0;
            component.properties.glowing = false;
          }
          break;
          
        case 'motor':
          const motorResistance = component.properties.resistance || 50;
          component.properties.current = voltageDiff / motorResistance;
          component.properties.spinning = component.properties.current > 0.1;
          break;
          
        case 'capacitor':
          // Simplified capacitor charging
          component.properties.charging = voltageDiff > 0.1;
          component.properties.voltage = voltageDiff;
          break;
      }
    });
  }

  private updateComponentStates(): void {
    this.state.components.forEach(component => {
      switch (component.type) {
        case 'switch':
          // Switch can be toggled (for now always closed)
          component.properties.closed = component.properties.closed !== false;
          break;
          
        case 'fuse':
          const current = component.properties.current || 0;
          const maxCurrent = component.properties.maxCurrent || 1;
          if (current > maxCurrent) {
            component.properties.blown = true;
            component.health = 'blown';
          }
          break;
          
        case 'transformer':
          const primaryVoltage = component.properties.primaryVoltage || 0;
          const ratio = (component.properties.secondaryTurns || 50) / (component.properties.primaryTurns || 100);
          component.properties.secondaryVoltage = primaryVoltage * ratio;
          break;
      }
    });
  }

  private checkFailures(): void {
    this.state.components.forEach(component => {
      const current = component.properties.current || 0;
      const maxCurrent = component.properties.maxCurrent || 0.1;
      
      if (current > maxCurrent) {
        component.health = 'blown';
      }
    });
  }

  // Extract semantic meaning for Tambo
  getSemantics(): CircuitSemantics {
    const hasActiveBattery = Array.from(this.state.components.values())
      .some(c => c.type === 'battery' && c.health === 'normal');
    
    const hasClosedPath = this.hasClosedCircuit();
    const hasShortCircuit = this.detectShortCircuit();
    const hasFailedComponents = Array.from(this.state.components.values())
      .some(c => c.health !== 'normal');

    return {
      power_flow_active: hasActiveBattery && hasClosedPath && !hasShortCircuit,
      open_circuit: !hasClosedPath,
      short_circuit: hasShortCircuit,
      reverse_polarity: this.detectReversePolarity(),
      overcurrent_detected: this.detectOvercurrent(),
      capacitor_charging: this.detectCapacitorCharging(),
      component_failure: hasFailedComponents,
      current_magnitude: this.getTotalCurrent(),
      voltage_levels: this.getVoltageRange()
    };
  }

  private hasClosedCircuit(): boolean {
    // Simplified path detection
    return this.state.wires.length > 0 && this.state.components.size > 1;
  }

  private detectShortCircuit(): boolean {
    // Check for direct battery connections without resistance
    return Array.from(this.state.components.values())
      .some(c => c.type === 'battery' && (c.properties.current || 0) > 1);
  }

  private detectReversePolarity(): boolean {
    return Array.from(this.state.components.values())
      .some(c => c.type === 'led' && (c.properties.voltage || 0) < 0);
  }

  private detectOvercurrent(): boolean {
    return Array.from(this.state.components.values())
      .some(c => (c.properties.current || 0) > (c.properties.maxCurrent || 0.1));
  }

  private detectCapacitorCharging(): boolean {
    return Array.from(this.state.components.values())
      .some(c => c.type === 'capacitor' && (c.properties.charging || false));
  }

  private getTotalCurrent(): number {
    return Array.from(this.state.components.values())
      .reduce((sum, c) => sum + (c.properties.current || 0), 0);
  }

  private getVoltageRange(): number[] {
    const voltages = Array.from(this.state.nodes.values()).map(n => n.voltage);
    return [Math.min(...voltages), Math.max(...voltages)];
  }

  getState(): CircuitState {
    return this.state;
  }
}
