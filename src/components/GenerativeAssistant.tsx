import React, { useState } from 'react';

interface GenerativeAssistantProps {
  onComponentAdd: (component: any) => void;
  onComponentConnect: (fromId: string, toId: string, fromTerminal: 'left' | 'right', toTerminal: 'left' | 'right') => void;
  onWireDisconnect?: (fromComponentId: string, fromTerminal: 'left' | 'right', toComponentId: string, toTerminal: 'left' | 'right') => void;
  onComponentUpdate: (componentId: string, property: string, value: any) => void;
  onReset: () => void;
  components: any[];
}

export const GenerativeAssistant: React.FC<GenerativeAssistantProps> = ({
  onComponentAdd,
  onComponentConnect,
  onWireDisconnect,
  onComponentUpdate,
  onReset,
  components
}) => {
  const [input, setInput] = useState('');
  const [result, setResult] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const isCircuitIntent = (instruction: string): boolean => {
    const circuitKeywords = ['battery', 'bulb', 'led', 'resistor', 'switch', 'capacitor', 'ground', 'connect', 'disconnect', 'remove', 'unlink', 'add', 'reset', 'circuit', 'move', 'drag', 'place', 'align', 'wire'];
    return circuitKeywords.some(keyword => instruction.toLowerCase().includes(keyword));
  };

  const parseAction = (instruction: string) => {
    const lower = instruction.toLowerCase();
    const components = [];
    
    if (lower.includes('battery')) components.push('battery');
    if (lower.includes('bulb') || lower.includes('light')) components.push('lightbulb');
    if (lower.includes('led')) components.push('led');
    if (lower.includes('resistor')) components.push('resistor');
    if (lower.includes('switch')) components.push('switch');
    if (lower.includes('capacitor')) components.push('capacitor');
    if (lower.includes('ground')) components.push('ground');
    
    return {
      components,
      shouldConnect: lower.includes('connect') && !lower.includes('disconnect'),
      shouldDisconnect: lower.includes('disconnect') || lower.includes('unlink') || (lower.includes('remove') && lower.includes('wire')),
      shouldReset: lower.includes('reset'),
      shouldMove: lower.includes('move') || lower.includes('drag') || lower.includes('place'),
      moveTarget: components[0], // First component mentioned is the one to move
      position: parsePosition(lower)
    };
  };

  const parsePosition = (instruction: string) => {
    // Default center position
    let x = 400, y = 300;
    
    if (instruction.includes('center')) {
      x = 400; y = 300;
    } else if (instruction.includes('left')) {
      x = 200; y = 300;
    } else if (instruction.includes('right')) {
      x = 600; y = 300;
    } else if (instruction.includes('top') || instruction.includes('above')) {
      x = 400; y = 200;
    } else if (instruction.includes('bottom') || instruction.includes('below')) {
      x = 400; y = 400;
    }
    
    // Snap to grid (40px grid)
    x = Math.round(x / 40) * 40;
    y = Math.round(y / 40) * 40;
    
    return { x, y };
  };

  const getDefaultProperties = (type: string) => {
    switch (type) {
      case 'battery': return { voltage: 9, maxCurrent: 1 };
      case 'resistor': return { resistance: 100 };
      case 'lightbulb': return { power: 60, resistance: 240 };
      case 'switch': return { closed: true };
      case 'led': return { forwardVoltage: 2.1, maxCurrent: 0.02 };
      case 'capacitor': return { capacitance: 0.001 };
      default: return {};
    }
  };

  const executeAction = async (instruction: string) => {
    if (!isCircuitIntent(instruction)) {
      setResult('Please describe a circuit action.');
      return;
    }

    const { components: requestedComponents, shouldConnect, shouldDisconnect, shouldReset, shouldMove, moveTarget, position } = parseAction(instruction);
    
    if (shouldReset) {
      onReset();
      setResult('Circuit reset.');
      return;
    }

    if (shouldDisconnect && onWireDisconnect) {
      // Handle wire disconnection
      const fromType = requestedComponents[0];
      const toType = requestedComponents[1];
      
      if (fromType && toType) {
        const fromComp = components.find(c => c.type === fromType);
        const toComp = components.find(c => c.type === toType);
        
        if (fromComp && toComp) {
          // Find the wire between these components and disconnect it
          onWireDisconnect(fromComp.id, 'right', toComp.id, 'left');
          setResult(`Connection removed between ${fromType} and ${toType}.`);
        } else {
          setResult(`Components not found for disconnection.`);
        }
      } else {
        setResult('Please specify which components to disconnect.');
      }
      return;
    }
    
    if (shouldMove && moveTarget) {
      const targetComponent = components.find(c => c.type === moveTarget);
      if (targetComponent) {
        onComponentUpdate(targetComponent.id, 'position', position);
        setResult(`${moveTarget} moved.`);
      } else {
        setResult(`${moveTarget} not found.`);
      }
      return;
    }
    
    if (requestedComponents.length === 0) {
      setResult('No valid components found.');
      return;
    }
    
    // Find existing components and identify missing ones
    const existingComponents = [];
    const missingComponents = [];
    
    requestedComponents.forEach(compType => {
      const existing = components.find(c => c.type === compType);
      if (existing) {
        existingComponents.push(existing);
      } else {
        missingComponents.push(compType);
      }
    });
    
    // Add only missing components
    const newComponents = [];
    missingComponents.forEach((compType, index) => {
      const component = {
        id: `component-${Date.now()}-${index}`,
        type: compType,
        position: { x: 200 + (index * 120), y: 300 },
        properties: getDefaultProperties(compType),
        nodes: [`node-${Date.now()}-${index}-1`, `node-${Date.now()}-${index}-2`],
        health: 'normal' as any
      };
      onComponentAdd(component);
      newComponents.push(component);
    });

    const allComponents = [...existingComponents, ...newComponents];

    if (shouldConnect && allComponents.length > 1) {
      setTimeout(() => {
        const battery = allComponents.find(c => c.type === 'battery');
        const switchComp = allComponents.find(c => c.type === 'switch');
        const load = allComponents.find(c => ['lightbulb', 'led', 'resistor'].includes(c.type));
        
        if (battery && switchComp && load) {
          onComponentConnect(battery.id, switchComp.id, 'right', 'left');
          onComponentConnect(switchComp.id, load.id, 'right', 'left');
        } else if (battery && load && !switchComp) {
          onComponentConnect(battery.id, load.id, 'right', 'left');
        }
      }, 100);
      
      if (missingComponents.length > 0) {
        setResult(`${missingComponents.join(', ')} added and connected.`);
      } else {
        setResult('Components connected.');
      }
    } else {
      if (missingComponents.length > 0) {
        setResult(`${missingComponents.join(', ')} added.`);
      } else {
        setResult('Components already exist.');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;
    
    setIsProcessing(true);
    await executeAction(input.trim());
    setIsProcessing(false);
    setInput('');
  };

  return (
    <div className="generative-assistant">
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="add battery and bulb"
          disabled={isProcessing}
        />
        <button type="submit" disabled={isProcessing || !input.trim()}>
          →
        </button>
      </form>
      {result && <div className="action-result">{result}</div>}
    </div>
  );
};
