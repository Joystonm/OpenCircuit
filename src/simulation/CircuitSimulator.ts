import { CircuitState, CircuitSemantics, CircuitComponent, CircuitNode } from '../types/circuit';

export class CircuitSimulator {
  private state: CircuitState;
  private nodeMap: Map<string, CircuitNode>;
  private componentMap: Map<string, CircuitComponent>;
  
  constructor() {
    this.nodeMap = new Map();
    this.componentMap = new Map();
    this.state = {
      nodes: [],
      components: [],
      wires: [],
      semanticState: {
        powerFlowActive: false,
        openCircuit: false,
        shortCircuit: false,
        reversePolarityDetected: false,
        overcurrentDetected: false,
        capacitorCharging: false,
        componentFailure: [],
        safetyRiskLevel: 'none'
      }
    };
  }

  // Add component to circuit
  addComponent(component: CircuitComponent): void {
    this.componentMap.set(component.id, component);
    this.state.components = Array.from(this.componentMap.values());
    this.updateCircuit();
  }

  // Connect two nodes
  connectNodes(nodeA: string, nodeB: string): void {
    this.state.wires.push({ 
      id: `wire-${Date.now()}`,
      fromNode: nodeA, 
      toNode: nodeB,
      current: 0,
      from: nodeA,
      to: nodeB
    });
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
        if (!this.nodeMap.has(nodeId)) {
          const node: CircuitNode = { 
            id: nodeId, 
            x: 0, 
            y: 0, 
            connections: [], 
            voltage: 0, 
            current: 0 
          };
          this.nodeMap.set(nodeId, node);
        }
      });
    });
    this.state.nodes = Array.from(this.nodeMap.values());
  }

  private calculateVoltages(): void {
    // Reset all voltages
    this.nodeMap.forEach(node => { if (node.voltage !== undefined) node.voltage = 0; });
    
    // Apply battery voltages
    const batteries = this.state.components
      .filter(c => c.type === 'battery' && (!c.health || c.health === 'normal'));
    
    batteries.forEach(battery => {
      const [pos, neg] = battery.nodes;
      const voltage = battery.properties.voltage || 9;
      
      // Propagate voltage through connected components
      this.propagateVoltage(pos, voltage);
      this.propagateVoltage(neg, 0);
    });
  }

  private propagateVoltage(nodeId: string, voltage: number): void {
    const node = this.nodeMap.get(nodeId);
    if (node && node.voltage !== undefined) {
      node.voltage = voltage;
      
      // Propagate through wires
      this.state.wires.forEach(wire => {
        const fromNode = this.nodeMap.get(wire.from || wire.fromNode);
        const toNode = this.nodeMap.get(wire.to || wire.toNode);
        
        if ((wire.from || wire.fromNode) === nodeId && toNode?.voltage === 0) {
          this.propagateVoltage(wire.to || wire.toNode, voltage);
        } else if ((wire.to || wire.toNode) === nodeId && fromNode?.voltage === 0) {
          this.propagateVoltage(wire.from || wire.fromNode, voltage);
        }
      });
    }
  }

  private calculateCurrents(): void {
    this.state.components.forEach(component => {
      const [nodeA, nodeB] = component.nodes;
      const voltageA = this.nodeMap.get(nodeA)?.voltage || 0;
      const voltageB = this.nodeMap.get(nodeB)?.voltage || 0;
      const voltageDiff = Math.abs(voltageA - voltageB);
      
      switch (component.type) {
        case 'resistor':
          const resistance = component.properties.resistance || 1000;
          component.properties.current = voltageDiff / resistance;
          break;
          
        case 'bulb':
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
          
        case 'bulb':
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
          
        case 'inductor':
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
    const hasActiveBattery = this.state.components
      .some(c => c.type === 'battery' && (!c.health || c.health === 'normal'));
    
    const hasClosedPath = this.hasClosedCircuit();
    const hasShortCircuit = this.detectShortCircuit();
    const hasFailedComponents = this.state.components
      .some(c => c.health && c.health !== 'normal');

    return {
      powerFlowActive: hasActiveBattery && hasClosedPath && !hasShortCircuit,
      openCircuit: !hasClosedPath,
      shortCircuit: hasShortCircuit,
      reversePolarityDetected: this.detectReversePolarity(),
      overcurrentDetected: this.detectOvercurrent(),
      capacitorCharging: this.detectCapacitorCharging(),
      componentFailure: hasFailedComponents ? ['component'] : [],
      safetyRiskLevel: hasShortCircuit ? 'high' : hasFailedComponents ? 'medium' : 'none'
    };
  }

  private hasClosedCircuit(): boolean {
    // Simplified path detection
    return this.state.wires.length > 0 && this.componentMap.size > 1;
  }

  private detectShortCircuit(): boolean {
    // Check for direct battery connections without resistance
    return this.state.components
      .some(c => c.type === 'battery' && (c.properties.current || 0) > 1);
  }

  private detectReversePolarity(): boolean {
    return this.state.components
      .some(c => c.type === 'led' && (c.properties.voltage || 0) < 0);
  }

  private detectOvercurrent(): boolean {
    return this.state.components
      .some(c => (c.properties.current || 0) > (c.properties.maxCurrent || 0.1));
  }

  private detectCapacitorCharging(): boolean {
    return this.state.components
      .some(c => c.type === 'capacitor' && (c.properties.charging || false));
  }

  getState(): CircuitState {
    return this.state;
  }
}
