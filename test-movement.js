// Test component movement functionality
const testMovement = () => {
  let existingComponents = [
    { id: 'battery-1', type: 'battery', position: { x: 200, y: 300 } },
    { id: 'bulb-1', type: 'lightbulb', position: { x: 400, y: 300 } },
    { id: 'switch-1', type: 'switch', position: { x: 300, y: 300 } }
  ];
  
  const mockOnComponentUpdate = (componentId, property, value) => {
    const component = existingComponents.find(c => c.id === componentId);
    if (component && property === 'position') {
      component.position = value;
      console.log(`✓ Moved ${component.type} to (${value.x}, ${value.y})`);
    }
  };

  // Copy movement logic
  const isCircuitIntent = (instruction) => {
    const circuitKeywords = ['battery', 'bulb', 'led', 'resistor', 'switch', 'capacitor', 'ground', 'connect', 'add', 'remove', 'reset', 'circuit', 'move', 'drag', 'place', 'align'];
    return circuitKeywords.some(keyword => instruction.toLowerCase().includes(keyword));
  };

  const parsePosition = (instruction) => {
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
    
    x = Math.round(x / 40) * 40;
    y = Math.round(y / 40) * 40;
    
    return { x, y };
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
      shouldMove: lower.includes('move') || lower.includes('drag') || lower.includes('place'),
      moveTarget: components[0],
      position: parsePosition(lower)
    };
  };

  const executeAction = (instruction) => {
    console.log(`\n🔍 Testing: "${instruction}"`);
    console.log(`📋 Current positions: ${existingComponents.map(c => `${c.type}(${c.position.x},${c.position.y})`).join(', ')}`);
    
    if (!isCircuitIntent(instruction)) {
      console.log(`❌ Result: "Please describe a circuit action."`);
      return;
    }

    const { shouldMove, moveTarget, position } = parseAction(instruction);
    
    if (shouldMove && moveTarget) {
      const targetComponent = existingComponents.find(c => c.type === moveTarget);
      if (targetComponent) {
        mockOnComponentUpdate(targetComponent.id, 'position', position);
        console.log(`✅ Result: "${moveTarget} moved."`);
      } else {
        console.log(`❌ Result: "${moveTarget} not found."`);
      }
      return;
    }
    
    console.log(`ℹ️  Not a movement command`);
  };

  console.log('🧪 COMPONENT MOVEMENT TEST\n');
  
  executeAction('move the battery to the center');
  executeAction('drag the bulb to the left');
  executeAction('place the switch below');
  executeAction('move the resistor right'); // Should fail - no resistor
  
  console.log('\n📊 FINAL POSITIONS:');
  existingComponents.forEach(c => {
    console.log(`${c.type}: (${c.position.x}, ${c.position.y})`);
  });
};

testMovement();
