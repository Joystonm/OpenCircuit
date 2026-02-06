import React, { useState } from 'react';
import { TamboProvider } from '@tambo-ai/react';
import { CircuitCanvas } from './components/CircuitCanvas';
import { Homepage } from './components/Homepage';
import AIPage from './components/AIPage';
import { 
  CurrentMeter, 
  VoltageMeter, 
  SafetyAlert, 
  PowerFlowVisualizer,
  ChargeGraph,
  PolarityIndicator,
  ComponentHealth,
  MagneticField,
  Multimeter,
  CurrentMeterSchema,
  VoltageMeterSchema,
  SafetyAlertSchema,
  PowerFlowSchema,
  ChargeGraphSchema,
  PolarityIndicatorSchema,
  ComponentHealthSchema,
  MagneticFieldSchema,
  MultimeterSchema
} from './components/GeneratedUI';
import { CircuitSimulator } from './simulation/CircuitSimulator';
import { CircuitComponent } from './types/circuit';
import './App.css';

// CRITICAL: All UI decisions go through Tambo - zero hardcoded conditional rendering
const CircuitInterface: React.FC = () => {
  const [simulator] = useState(() => new CircuitSimulator());
  const [components, setComponents] = useState<CircuitComponent[]>([]);
  const [wires, setWires] = useState<{from: string, to: string, fromTerminal: 'left' | 'right', toTerminal: 'left' | 'right'}[]>([]);

  const handleComponentAdd = (component: CircuitComponent) => {
    simulator.addComponent(component);
    setComponents(prev => [...prev, component]);
  };

  const handleComponentRemove = (componentId: string) => {
    setComponents(prev => prev.filter(c => c.id !== componentId));
    setWires(prev => prev.filter(w => w.from !== componentId && w.to !== componentId));
    setTimeout(updateCircuitSimulation, 0);
  };

  const handleComponentUpdate = (componentId: string, property: string, value: any) => {
    setComponents(prev => {
      const updatedComponents = prev.map(comp => 
        comp.id === componentId 
          ? property === 'position' 
            ? { ...comp, position: value }
            : { ...comp, properties: { ...comp.properties, [property]: value } }
          : comp
      );
      
      // Immediately update circuit simulation with new component state
      const battery = updatedComponents.find(c => c.type === 'battery');
      const switches = updatedComponents.filter(c => c.type === 'switch');
      const bulbs = updatedComponents.filter(c => c.type === 'bulb');
      const leds = updatedComponents.filter(c => c.type === 'led');
      const motors = updatedComponents.filter(c => c.type === 'bulb');
      
      // Reset all component states
      bulbs.forEach(bulb => {
        bulb.properties.glowing = false;
        bulb.properties.current = 0;
      });
      leds.forEach(led => {
        led.properties.glowing = false;
        led.properties.current = 0;
      });
      motors.forEach(motor => {
        motor.properties.spinning = false;
      });
      
      if (battery && wires.length >= 1) {
        // Check if all switches are closed
        const allSwitchesClosed = switches.length === 0 || switches.every(s => s.properties.closed === true);
        
        if (allSwitchesClosed) {
          bulbs.forEach(bulb => {
            bulb.properties.glowing = true;
            bulb.properties.current = 0.5;
          });
          leds.forEach(led => {
            led.properties.glowing = true;
            led.properties.current = 0.02;
          });
          motors.forEach(motor => {
            motor.properties.spinning = true;
            motor.properties.current = 0.8;
          });
        }
      }
      
      return updatedComponents;
    });
  };

  const handleComponentConnect = (fromId: string, toId: string, fromTerminal: 'left' | 'right', toTerminal: 'left' | 'right') => {
    simulator.connectNodes(fromId, toId);
    const newWires = [...wires, { from: fromId, to: toId, fromTerminal, toTerminal }];
    setWires(newWires);
    
    // Update circuit simulation with new wires
    setComponents(prev => {
      const updatedComponents = prev.map(comp => ({ ...comp }));
      
      // Reset all component states
      updatedComponents.forEach(comp => {
        if (comp.type === 'bulb') {
          comp.properties.glowing = false;
          comp.properties.current = 0;
        }
        if (comp.type === 'led') {
          comp.properties.glowing = false;
          comp.properties.current = 0;
        }
        if (comp.type === 'bulb') {
          comp.properties.spinning = false;
        }
      });

      // Check if we have a complete circuit
      const battery = updatedComponents.find(c => c.type === 'battery');
      const switches = updatedComponents.filter(c => c.type === 'switch');
      const bulbs = updatedComponents.filter(c => c.type === 'bulb');
      const leds = updatedComponents.filter(c => c.type === 'led');
      const motors = updatedComponents.filter(c => c.type === 'bulb');
      
      if (battery && newWires.length >= 1) {
        // Check if all switches in the circuit are closed
        const allSwitchesClosed = switches.length === 0 || switches.every(s => s.properties.closed === true);
        
        if (allSwitchesClosed) {
          // Make all connected components work
          bulbs.forEach(bulb => {
            bulb.properties.glowing = true;
            bulb.properties.current = 0.5;
          });
          
          leds.forEach(led => {
            led.properties.glowing = true;
            led.properties.current = 0.02;
          });
          
          motors.forEach(motor => {
            motor.properties.spinning = true;
            motor.properties.current = 0.8;
          });
        }
      }
      
      return updatedComponents;
    });
  };

  const handleWireDisconnect = (fromComponentId: string, fromTerminal: 'left' | 'right', toComponentId: string, toTerminal: 'left' | 'right') => {
    setWires(prev => prev.filter(wire => 
      !(wire.from === fromComponentId && wire.fromTerminal === fromTerminal && 
        wire.to === toComponentId && wire.toTerminal === toTerminal) &&
      !(wire.from === toComponentId && wire.fromTerminal === toTerminal && 
        wire.to === fromComponentId && wire.toTerminal === fromTerminal)
    ));
    setTimeout(updateCircuitSimulation, 0);
  };

  const updateCircuitSimulation = () => {
    setComponents(prev => {
      const updatedComponents = prev.map(comp => ({ ...comp }));
      
      // Reset all component states
      updatedComponents.forEach(comp => {
        if (comp.type === 'bulb') {
          comp.properties.glowing = false;
          comp.properties.current = 0;
        }
      });

      // Check if we have a complete circuit with closed switches
      const battery = updatedComponents.find(c => c.type === 'battery');
      const switches = updatedComponents.filter(c => c.type === 'switch');
      const bulbs = updatedComponents.filter(c => c.type === 'bulb');
      
      if (battery && bulbs.length > 0 && wires.length >= 2) {
        // Check if all switches in the circuit are closed
        const allSwitchesClosed = switches.length === 0 || switches.every(s => s.properties.closed === true);
        
        if (allSwitchesClosed) {
          // Simple path checking: if we have battery + bulb + enough wires, circuit is complete
          const hasCompletePath = wires.length >= (updatedComponents.length - 1);
          
          if (hasCompletePath) {
            bulbs.forEach(bulb => {
              bulb.properties.glowing = true;
              bulb.properties.current = 0.5;
            });
          }
        }
      }
      
      return updatedComponents;
    });
  };

  const handleReset = () => {
    setComponents([]);
    setWires([]);
  };

  return (
    <div className="circuit-workspace">
      <CircuitCanvas
        components={components}
        wires={wires}
        onComponentAdd={handleComponentAdd}
        onComponentConnect={handleComponentConnect}
        onWireDisconnect={handleWireDisconnect}
        onComponentRemove={handleComponentRemove}
        onComponentUpdate={handleComponentUpdate}
        onReset={handleReset}
        updateCircuitSimulation={updateCircuitSimulation}
      />
    </div>
  );
};

const App: React.FC = () => {
  const apiKey = import.meta.env.VITE_TAMBO_API_KEY;
  const [showPlayground, setShowPlayground] = useState(false);
  const [showAI, setShowAI] = useState(false);
  
  if (!apiKey) {
    return (
      <div className="app">
        <div className="error">
          <h2>Tambo API Key Required</h2>
          <p>Set VITE_TAMBO_API_KEY in your .env file</p>
          <p>This project is 100% dependent on Tambo's Generative UI.</p>
        </div>
      </div>
    );
  }

  if (!showPlayground && !showAI) {
    return <Homepage 
      onLaunchPlayground={() => setShowPlayground(true)} 
      onLaunchAI={() => setShowAI(true)}
    />;
  }

  if (showAI) {
    return <AIPage 
      onBack={() => setShowAI(false)} 
      onGoToPlayground={() => { setShowAI(false); setShowPlayground(true); }}
    />;
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <div className="logo">
            <div className="logo-icon">⚡</div>
            <span>OpenCircuit</span>
          </div>
        </div>
        
        <div className="header-center">
          <a 
            href="#home" 
            className="nav-link"
            onClick={(e) => { e.preventDefault(); setShowPlayground(false); setShowAI(false); }}
          >
            Home
          </a>
          <a 
            href="#playground" 
            className="nav-link active"
          >
            Playground
          </a>
          <a 
            href="#ai" 
            className="nav-link"
            onClick={(e) => { e.preventDefault(); setShowPlayground(false); setShowAI(true); }}
          >
            AI
          </a>
        </div>
        
        <div className="header-right">
        </div>
      </header>
      
      <main className="app-main">
        <TamboProvider 
          apiKey={apiKey}
          components={[
            {
              name: "CurrentMeter",
              description: "Displays current flow measurements in the circuit",
              component: CurrentMeter,
              propsSchema: CurrentMeterSchema
            },
            {
              name: "VoltageMeter", 
              description: "Shows voltage measurements across circuit components",
              component: VoltageMeter,
              propsSchema: VoltageMeterSchema
            },
            {
              name: "SafetyAlert",
              description: "Critical safety warnings for dangerous circuit conditions", 
              component: SafetyAlert,
              propsSchema: SafetyAlertSchema
            },
            {
              name: "PowerFlowVisualizer",
              description: "Visual representation of power flow through the circuit",
              component: PowerFlowVisualizer, 
              propsSchema: PowerFlowSchema
            },
            {
              name: "ChargeGraph",
              description: "Graph showing charge accumulation over time",
              component: ChargeGraph,
              propsSchema: ChargeGraphSchema
            },
            {
              name: "PolarityIndicator", 
              description: "Shows positive and negative terminals",
              component: PolarityIndicator,
              propsSchema: PolarityIndicatorSchema
            },
            {
              name: "ComponentHealth",
              description: "Health status of circuit components",
              component: ComponentHealth,
              propsSchema: ComponentHealthSchema
            },
            {
              name: "MagneticField",
              description: "Visualization of magnetic fields around components", 
              component: MagneticField,
              propsSchema: MagneticFieldSchema
            },
            {
              name: "Multimeter",
              description: "Digital multimeter for comprehensive measurements",
              component: Multimeter,
              propsSchema: MultimeterSchema
            }
          ]}
        >
          <CircuitInterface />
        </TamboProvider>
      </main>
    </div>
  );
};

export default App;
