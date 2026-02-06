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
        return {
          nodes: state.nodes,
          components: state.components,
          wires: state.wires,
          semanticState: state.semanticState,
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
          resolve(data);
        }
      };

      this.worker.postMessage({
        type: 'SIMULATE',
        data: state
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
