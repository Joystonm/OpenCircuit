import { CircuitState } from '../types/circuit';

// Web Worker for circuit simulation to keep UI responsive
export class CircuitWorker {
  private worker: Worker | null = null;

  constructor() {
    // Create worker from inline code for simplicity
    const workerCode = `
      self.onmessage = function(e) {
        const { type, data } = e.data;
        
        if (type === 'SIMULATE') {
          const result = simulateCircuit(data);
          self.postMessage({ type: 'SIMULATION_RESULT', data: result });
        }
      };
      
      function simulateCircuit(state) {
        // Simplified circuit simulation in worker
        const nodes = new Map(state.nodes);
        const components = new Map(state.components);
        
        // Calculate voltages and currents
        components.forEach((component, id) => {
          if (component.type === 'battery') {
            const [pos, neg] = component.nodes;
            if (nodes.has(pos)) nodes.get(pos).voltage = component.properties.voltage || 9;
            if (nodes.has(neg)) nodes.get(neg).voltage = 0;
          }
        });
        
        return {
          nodes: Array.from(nodes.entries()),
          components: Array.from(components.entries()),
          timestamp: Date.now()
        };
      }
    `;

    const blob = new Blob([workerCode], { type: 'application/javascript' });
    this.worker = new Worker(URL.createObjectURL(blob));
  }

  simulate(state: CircuitState): Promise<CircuitState> {
    return new Promise((resolve) => {
      if (!this.worker) {
        resolve(state);
        return;
      }

      this.worker.onmessage = (e) => {
        const { type, data } = e.data;
        if (type === 'SIMULATION_RESULT') {
          resolve({
            nodes: data.nodes,
            components: data.components,
            wires: state.wires,
            semanticState: state.semanticState
          });
        }
      };

      this.worker.postMessage({
        type: 'SIMULATE',
        data: {
          nodes: Array.from(state.nodes.entries()),
          components: Array.from(state.components.entries()),
          wires: state.wires
        }
      });
    });
  }

  terminate() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }
}
