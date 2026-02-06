// Test the GenerativeAssistant logic directly
const testChatbot = () => {
  // Mock functions to capture actions
  const mockActions = {
    componentsAdded: [],
    connectionsRequested: false,
    resetRequested: false
  };

  const mockOnComponentAdd = (component) => {
    mockActions.componentsAdded.push(component);
    console.log(`✓ Component added: ${component.type}`);
  };

  const mockOnComponentConnect = () => {
    mockActions.connectionsRequested = true;
    console.log(`✓ Connection requested`);
  };

  const mockOnReset = () => {
    mockActions.resetRequested = true;
    console.log(`✓ Reset requested`);
  };

  // Copy the core logic from GenerativeAssistant
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
    
    if (!isCircuitIntent(instruction)) {
      console.log(`❌ Result: "Please describe a circuit action."`);
      return;
    }

    const { components, shouldConnect, shouldReset } = parseAction(instruction);
    
    if (shouldReset) {
      mockOnReset();
      console.log(`✅ Result: "Circuit reset."`);
      return;
    }
    
    if (components.length === 0) {
      console.log(`❌ Result: "No valid components found."`);
      return;
    }
    
    const addedComponents = [];
    components.forEach((compType, index) => {
      const component = {
        id: `component-${Date.now()}-${index}`,
        type: compType,
        position: { x: 200 + (index * 120), y: 300 },
        properties: getDefaultProperties(compType),
        nodes: [`node-${Date.now()}-${index}-1`, `node-${Date.now()}-${index}-2`],
        health: 'normal'
      };
      mockOnComponentAdd(component);
      addedComponents.push(component);
    });

    if (shouldConnect && addedComponents.length > 1) {
      // Connect in series: battery -> switch -> bulb/led
      const battery = addedComponents.find(c => c.type === 'battery');
      const switches = addedComponents.filter(c => c.type === 'switch');
      const loads = addedComponents.filter(c => ['lightbulb', 'led', 'resistor'].includes(c.type));
      
      if (battery && loads.length > 0) {
        if (switches.length > 0) {
          // Connect: battery -> switch -> load -> back to battery
          console.log(`🔗 Circuit: ${battery.type} -> ${switches[0].type} -> ${loads[0].type} -> back to ${battery.type}`);
          mockOnComponentConnect();
        } else {
          // Direct connection: battery -> load -> back to battery
          console.log(`🔗 Circuit: ${battery.type} -> ${loads[0].type} -> back to ${battery.type}`);
          mockOnComponentConnect();
        }
      }
      console.log(`✅ Result: "${components.join(', ')} connected."`);
    } else {
      console.log(`✅ Result: "${components.join(', ')} added."`);
    }
  };

  // Test cases
  console.log('🧪 FINAL CHATBOT TEST\n');
  
  // Test the exact scenario you mentioned
  executeAction('connect battery to bulb and switch to battery');
  executeAction('add battery and switch and bulb and connect them');
  executeAction('reset circuit');
  
  console.log('\n📊 SUMMARY:');
  console.log(`Components added: ${mockActions.componentsAdded.length}`);
  console.log(`Connections requested: ${mockActions.connectionsRequested}`);
  console.log(`Reset requested: ${mockActions.resetRequested}`);
};

testChatbot();
