// Test state-aware circuit assistant
const testStateAware = () => {
  let existingComponents = [];
  
  const mockOnComponentAdd = (component) => {
    existingComponents.push(component);
    console.log(`✓ Added: ${component.type} (${component.id})`);
  };

  const mockOnComponentConnect = (fromId, toId) => {
    console.log(`🔗 Connected: ${fromId} -> ${toId}`);
  };

  const mockOnReset = () => {
    existingComponents = [];
    console.log(`🔄 Circuit reset`);
  };

  // Copy the logic from GenerativeAssistant
  const isCircuitIntent = (instruction) => {
    const circuitKeywords = ['battery', 'bulb', 'led', 'resistor', 'switch', 'capacitor', 'ground', 'connect', 'add', 'remove', 'reset', 'circuit'];
    return circuitKeywords.some(keyword => instruction.toLowerCase().includes(keyword));
  };

  const parseAction = (instruction) => {
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
      shouldConnect: lower.includes('connect'),
      shouldReset: lower.includes('reset')
    };
  };

  const getDefaultProperties = (type) => {
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

  const executeAction = (instruction) => {
    console.log(`\n🔍 Testing: "${instruction}"`);
    console.log(`📋 Current components: ${existingComponents.map(c => c.type).join(', ') || 'none'}`);
    
    if (!isCircuitIntent(instruction)) {
      console.log(`❌ Result: "Please describe a circuit action."`);
      return;
    }

    const { components: requestedComponents, shouldConnect, shouldReset } = parseAction(instruction);
    
    if (shouldReset) {
      mockOnReset();
      console.log(`✅ Result: "Circuit reset."`);
      return;
    }
    
    if (requestedComponents.length === 0) {
      console.log(`❌ Result: "No valid components found."`);
      return;
    }
    
    // Find existing components and identify missing ones
    const existingMatches = [];
    const missingComponents = [];
    
    requestedComponents.forEach(compType => {
      const existing = existingComponents.find(c => c.type === compType);
      if (existing) {
        existingMatches.push(existing);
        console.log(`♻️  Reusing existing: ${compType}`);
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
        health: 'normal'
      };
      mockOnComponentAdd(component);
      newComponents.push(component);
    });

    const allComponents = [...existingMatches, ...newComponents];

    if (shouldConnect && allComponents.length > 1) {
      const battery = allComponents.find(c => c.type === 'battery');
      const switchComp = allComponents.find(c => c.type === 'switch');
      const load = allComponents.find(c => ['lightbulb', 'led', 'resistor'].includes(c.type));
      
      if (battery && switchComp && load) {
        mockOnComponentConnect(battery.id, switchComp.id);
        mockOnComponentConnect(switchComp.id, load.id);
      } else if (battery && load && !switchComp) {
        mockOnComponentConnect(battery.id, load.id);
      }
      
      if (missingComponents.length > 0) {
        console.log(`✅ Result: "${missingComponents.join(', ')} added and connected."`);
      } else {
        console.log(`✅ Result: "Components connected."`);
      }
    } else {
      if (missingComponents.length > 0) {
        console.log(`✅ Result: "${missingComponents.join(', ')} added."`);
      } else {
        console.log(`✅ Result: "Components already exist."`);
      }
    }
  };

  console.log('🧪 STATE-AWARE CIRCUIT ASSISTANT TEST\n');
  
  // Test scenario: reuse existing components
  executeAction('add battery and bulb');
  executeAction('connect switch to battery'); // Should reuse battery, add switch
  executeAction('connect battery and bulb'); // Should reuse both, just connect
  executeAction('add another battery'); // Should add second battery
  executeAction('reset circuit');
};

testStateAware();
