import React, { useState } from 'react';
import { Stage, Layer, Circle, Line, Text, Rect } from 'react-konva';
import { CircuitComponent, ComponentType } from '../types/circuit';
import { GenerativeAssistant } from './GenerativeAssistant';

interface CircuitCanvasProps {
  components: CircuitComponent[];
  wires: {from: string, to: string, fromTerminal: 'left' | 'right', toTerminal: 'left' | 'right'}[];
  onComponentAdd: (component: CircuitComponent) => void;
  onComponentConnect: (fromId: string, toId: string, fromTerminal: 'left' | 'right', toTerminal: 'left' | 'right') => void;
  onWireDisconnect: (fromComponentId: string, fromTerminal: 'left' | 'right', toComponentId: string, toTerminal: 'left' | 'right') => void;
  onComponentRemove: (componentId: string) => void;
  onComponentUpdate: (componentId: string, property: string, value: any) => void;
  onReset: () => void;
  updateCircuitSimulation: () => void;
}

type ToolType = ComponentType | 'wire' | 'disconnect' | 'move';

const componentLabels: Record<string, {emoji: string, label: string}> = {
  wire: {emoji: '🔌', label: 'Wire'},
  battery: {emoji: '🔋', label: 'Battery'},
  resistor: {emoji: '⚡', label: 'Resistor'},
  bulb: {emoji: '💡', label: 'Light Bulb'},
  switch: {emoji: '🔘', label: 'Switch'},
  led: {emoji: '🔴', label: 'LED'},
  capacitor: {emoji: '⚡', label: 'Capacitor'},
  ground: {emoji: '⏚', label: 'Ground'},
  inductor: {emoji: '🧲', label: 'Inductor'},
  diode: {emoji: '🔌', label: 'Diode'},
  potentiometer: {emoji: '🎚️', label: 'Potentiometer'},
  fuse: {emoji: '⚠️', label: 'Fuse'},
  disconnect: {emoji: '✂️', label: 'Disconnect'},
  move: {emoji: '↔️', label: 'Move'}
};

export const CircuitCanvas: React.FC<CircuitCanvasProps> = ({
  components,
  wires,
  onComponentAdd,
  onComponentConnect,
  onWireDisconnect,
  onComponentRemove,
  onComponentUpdate,
  onReset,
  updateCircuitSimulation
}) => {
  const [selectedType, setSelectedType] = useState<ToolType>('wire');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTerminal, setActiveTerminal] = useState<{componentId: string, terminal: 'left' | 'right'} | null>(null);
  const [selectedWire, setSelectedWire] = useState<{from: string, to: string, fromTerminal: 'left' | 'right', toTerminal: 'left' | 'right'} | null>(null);
  const [contextMenu, setContextMenu] = useState<{x: number, y: number, wire: any} | null>(null);
  const [disabledAutoConnections, setDisabledAutoConnections] = useState<Set<string>>(new Set());
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['Connection', 'Power Sources', 'Passive Components', 'Active Components']));
  const [mobileLeftOpen] = useState(false);
  const [mobileRightOpen] = useState(false);
  const [moveMode, setMoveMode] = useState(false);
  const [draggedComponent, setDraggedComponent] = useState<string | null>(null);

  // Component sections for better organization
  const componentSections = [
    {
      title: "Connection",
      components: [
        { type: 'wire', label: 'Wire', emoji: '🔌' },
        { type: 'disconnect', label: 'Disconnect', emoji: '✂️' },
        { type: 'move', label: 'Move', emoji: '✋' }
      ]
    },
    {
      title: "Power Sources", 
      components: [
        { type: 'battery', label: 'Battery', emoji: '🔋' },
        { type: 'ground', label: 'Ground', emoji: '⏚' }
      ]
    },
    {
      title: "Passive Components",
      components: [
        { type: 'resistor', label: 'Resistor', emoji: '⚡' },
        { type: 'capacitor', label: 'Capacitor', emoji: '⚡' },
        { type: 'inductor', label: 'Inductor', emoji: '🧲' },
        { type: 'potentiometer', label: 'Potentiometer', emoji: '🎚️' }
      ]
    },
    {
      title: "Active Components",
      components: [
        { type: 'led', label: 'LED', emoji: '🔴' },
        { type: 'bulb', label: 'Light Bulb', emoji: '💡' },
        { type: 'switch', label: 'Switch', emoji: '🔘' },
        { type: 'diode', label: 'Diode', emoji: '🔌' },
        { type: 'resistor', label: 'Transistor', emoji: '🔺' }
      ]
    },
    {
      title: "Other Components",
      components: [
        { type: 'fuse', label: 'Fuse', emoji: '⚠️' },
        { type: 'inductor', label: 'Transformer', emoji: '🔄' },
        { type: 'switch', label: 'Relay', emoji: '🔀' },
        { type: 'bulb', label: 'Motor', emoji: '⚙️' },
        { type: 'resistor', label: 'Speaker', emoji: '🔊' },
        { type: 'resistor', label: 'Microphone', emoji: '🎤' },
        { type: 'resistor', label: 'Antenna', emoji: '📡' },
        { type: 'capacitor', label: 'Crystal', emoji: '💎' },
        { type: 'resistor', label: 'Op-Amp', emoji: '🔼' }
      ]
    }
  ];

  const toggleSection = (sectionTitle: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionTitle)) {
        newSet.delete(sectionTitle);
      } else {
        newSet.add(sectionTitle);
      }
      return newSet;
    });
  };

  const filteredSections = componentSections.map(section => ({
    ...section,
    components: section.components.filter(({ label }) =>
      label.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(section => section.components.length > 0);

  const isWireMode = (selectedType as string) === 'wire';
  const isDisconnectMode = (selectedType as string) === 'disconnect';

  const handleCanvasClick = (e: any) => {
    const stage = e.target.getStage();
    const pos = stage?.getPointerPosition();
    if (!pos) return;
    
    // Clear context menu and selected wire when clicking elsewhere
    setContextMenu(null);
    if (!isWireMode && !isDisconnectMode) {
      setSelectedWire(null);
    }
    
    if (isDisconnectMode) {
      // In disconnect mode, clicking a wire disconnects it
      return; // Wire click handling is done in the wire's onClick
    } else if (isWireMode) {
      // Check if clicking on a terminal (green dot)
      let clickedTerminal: {componentId: string, terminal: 'left' | 'right'} | null = null;
      
      for (const comp of components) {
        const leftTerminal = { x: comp.position.x - 25, y: comp.position.y };
        const rightTerminal = { x: comp.position.x + 25, y: comp.position.y };
        
        const leftDist = Math.sqrt((leftTerminal.x - pos.x) ** 2 + (leftTerminal.y - pos.y) ** 2);
        const rightDist = Math.sqrt((rightTerminal.x - pos.x) ** 2 + (rightTerminal.y - pos.y) ** 2);
        
        if (leftDist < 15) {
          clickedTerminal = { componentId: comp.id, terminal: 'left' };
          break;
        } else if (rightDist < 15) {
          clickedTerminal = { componentId: comp.id, terminal: 'right' };
          break;
        }
      }

      if (clickedTerminal) {
        if (activeTerminal) {
          // Second terminal clicked - create connection if different component
          if (activeTerminal.componentId !== clickedTerminal.componentId) {
            onComponentConnect(
              activeTerminal.componentId, 
              clickedTerminal.componentId,
              activeTerminal.terminal,
              clickedTerminal.terminal
            );
          }
          setActiveTerminal(null);
        } else {
          // First terminal clicked - set as active
          setActiveTerminal(clickedTerminal);
        }
        return;
      } else {
        // Clicked outside terminals - cancel active terminal
        setActiveTerminal(null);
      }
    } else if (!moveMode && (selectedType as string) !== 'move' && (selectedType as string) !== 'wire' && (selectedType as string) !== 'disconnect') {
      // Add new component if not wire mode and not move mode
      const newComponent: CircuitComponent = {
        id: `component-${Date.now()}`,
        type: selectedType as ComponentType,
        position: { x: pos.x, y: pos.y },
        rotation: 0,
        properties: getDefaultProperties(selectedType),
        nodes: [`node-${Date.now()}-1`, `node-${Date.now()}-2`],
        health: 'normal'
      };
      
      onComponentAdd(newComponent);
    }
  };

  const handleReset = () => {
    onReset();
    setDisabledAutoConnections(new Set());
  };

  // Handle keyboard events for wire disconnection
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedWire) {
          onWireDisconnect(selectedWire.from, selectedWire.fromTerminal, selectedWire.to, selectedWire.toTerminal);
          setSelectedWire(null);
        }
      }
      if (e.key === 'Escape') {
        setSelectedWire(null);
        setContextMenu(null);
        setActiveTerminal(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedWire, onWireDisconnect]);

  const getDefaultProperties = (type: ToolType) => {
    switch (type) {
      case 'wire': return {};
      case 'disconnect': return {};
      case 'move': return {};
      case 'battery': return { voltage: 9, maxCurrent: 1 };
      case 'resistor': return { resistance: 100 };
      case 'bulb': return { power: 60, resistance: 240 };
      case 'switch': return { closed: true };
      case 'led': return { forwardVoltage: 2.1, maxCurrent: 0.02 };
      case 'capacitor': return { capacitance: 0.001 };
      case 'ground': return {};
      case 'inductor': return { inductance: 0.01 };
      case 'diode': return { forwardVoltage: 0.7 };
      case 'potentiometer': return { resistance: 1000, position: 0.5 };
      case 'fuse': return { maxCurrent: 1, blown: false };
      default: return {};
    }
  };

  const renderComponent = (component: CircuitComponent) => {
    const { position, type, properties } = component;
    const health = component.health || 'normal';
    const color = health === 'normal' ? '#333' : 'red';
    const isSelected = activeTerminal?.componentId === component.id;
    const highlightColor = isSelected ? '#00ff00' : color;
    const x = position.x;
    const y = position.y;
    
    switch (type) {
      case 'battery':
        const batteryColor = (properties.current || 0) > 0 ? '#0066cc' : highlightColor;
        return (
          <React.Fragment key={component.id}>
            <Line points={[x - 25, y, x - 8, y]} stroke={batteryColor} strokeWidth={2} />
            <Line points={[x - 8, y - 20, x - 8, y + 20]} stroke={batteryColor} strokeWidth={4} />
            <Line points={[x + 8, y - 15, x + 8, y + 15]} stroke={batteryColor} strokeWidth={2} />
            <Line points={[x + 8, y, x + 25, y]} stroke={batteryColor} strokeWidth={2} />
            <Text x={x - 5} y={y - 35} text="+" fontSize={14} fill={batteryColor} />
            <Text x={x + 12} y={y - 35} text="-" fontSize={14} fill={batteryColor} />
            {isSelected && <Circle x={x} y={y} radius={35} stroke="#00ff00" strokeWidth={3} />}
          </React.Fragment>
        );
      
      case 'resistor':
        const resistorColor = (properties.current || 0) > 0.01 ? '#ff6600' : color;
        return (
          <React.Fragment key={component.id}>
            <Line points={[x - 30, y, x - 15, y]} stroke={resistorColor} strokeWidth={2} />
            <Rect x={x - 15} y={y - 6} width={30} height={12} stroke={resistorColor} strokeWidth={2} fill="white" />
            <Line points={[x + 15, y, x + 30, y]} stroke={resistorColor} strokeWidth={2} />
            <Text x={x - 8} y={y + 3} text="R" fontSize={10} fill={resistorColor} />
          </React.Fragment>
        );
      
      case 'bulb':
        const isGlowing = properties.glowing;
        const bulbFill = isGlowing ? '#ffff66' : 'white';
        const bulbStroke = isGlowing ? '#ffcc00' : color;
        return (
          <React.Fragment key={component.id}>
            <Line points={[x - 25, y, x - 15, y]} stroke={bulbStroke} strokeWidth={2} />
            <Circle x={x} y={y} radius={15} stroke={bulbStroke} strokeWidth={2} fill={bulbFill} />
            <Line points={[x - 8, y - 8, x + 8, y + 8]} stroke={bulbStroke} strokeWidth={1} />
            <Line points={[x - 8, y + 8, x + 8, y - 8]} stroke={bulbStroke} strokeWidth={1} />
            <Line points={[x + 15, y, x + 25, y]} stroke={bulbStroke} strokeWidth={2} />
            {isGlowing && (
              <Circle x={x} y={y} radius={20} stroke="#ffff66" strokeWidth={1} opacity={0.3} />
            )}
          </React.Fragment>
        );
      
      case 'switch':
        const isClosed = properties.closed !== false;
        const switchAngle = isClosed ? 0 : -15;
        return (
          <React.Fragment key={component.id}>
            <Line points={[x - 25, y, x - 10, y]} stroke={color} strokeWidth={2} />
            <Circle x={x - 10} y={y} radius={2} fill={color} />
            <Line 
              points={[x - 10, y, x + 8, y + switchAngle]} 
              stroke={isClosed ? '#00cc00' : '#cc0000'} 
              strokeWidth={2} 
            />
            <Circle x={x + 10} y={y} radius={2} fill={color} />
            <Line points={[x + 10, y, x + 25, y]} stroke={color} strokeWidth={2} />
          </React.Fragment>
        );
      
      case 'led':
        const ledGlowing = properties.glowing;
        const ledColor = ledGlowing ? '#ff0000' : '#660000';
        return (
          <React.Fragment key={component.id}>
            <Line points={[x - 25, y, x - 10, y]} stroke={color} strokeWidth={2} />
            <Line points={[x - 10, y - 8, x + 10, y, x - 10, y + 8, x - 10, y - 8]} stroke={color} strokeWidth={2} fill="white" />
            <Line points={[x + 10, y - 8, x + 10, y + 8]} stroke={color} strokeWidth={2} />
            <Line points={[x + 10, y, x + 25, y]} stroke={color} strokeWidth={2} />
            <Circle x={x} y={y} radius={3} fill={ledColor} />
            {ledGlowing && (
              <>
                <Line points={[x + 5, y - 15, x + 12, y - 22]} stroke="red" strokeWidth={2} />
                <Line points={[x + 12, y - 22, x + 10, y - 20]} stroke="red" strokeWidth={2} />
                <Line points={[x + 12, y - 22, x + 14, y - 20]} stroke="red" strokeWidth={2} />
                <Circle x={x} y={y} radius={12} stroke="#ff6666" strokeWidth={1} opacity={0.4} />
              </>
            )}
          </React.Fragment>
        );
      
      case 'capacitor':
        const isCharging = properties.charging;
        const capColor = isCharging ? '#0066ff' : color;
        return (
          <React.Fragment key={component.id}>
            <Line points={[x - 25, y, x - 5, y]} stroke={capColor} strokeWidth={2} />
            <Line points={[x - 5, y - 15, x - 5, y + 15]} stroke={capColor} strokeWidth={3} />
            <Line points={[x + 5, y - 15, x + 5, y + 15]} stroke={capColor} strokeWidth={3} />
            <Line points={[x + 5, y, x + 25, y]} stroke={capColor} strokeWidth={2} />
            {isCharging && (
              <Text x={x - 8} y={y - 25} text="⚡" fontSize={12} fill="#0066ff" />
            )}
          </React.Fragment>
        );
      
      case 'ground':
        return (
          <React.Fragment key={component.id}>
            <Line points={[x, y - 20, x, y]} stroke={color} strokeWidth={2} />
            <Line points={[x - 15, y, x + 15, y]} stroke={color} strokeWidth={3} />
            <Line points={[x - 10, y + 5, x + 10, y + 5]} stroke={color} strokeWidth={2} />
            <Line points={[x - 5, y + 10, x + 5, y + 10]} stroke={color} strokeWidth={1} />
          </React.Fragment>
        );
      
      case 'inductor':
        return (
          <React.Fragment key={component.id}>
            <Line points={[x - 25, y, x - 15, y]} stroke={color} strokeWidth={2} />
            {[0, 1, 2].map(i => (
              <Circle key={i} x={x - 10 + i * 7} y={y - 4} radius={4} stroke={color} strokeWidth={2} fill="none" />
            ))}
            <Line points={[x + 11, y, x + 25, y]} stroke={color} strokeWidth={2} />
          </React.Fragment>
        );
      
      case 'diode':
        return (
          <React.Fragment key={component.id}>
            <Line points={[x - 25, y, x - 10, y]} stroke={color} strokeWidth={2} />
            <Line points={[x - 10, y - 8, x + 10, y, x - 10, y + 8, x - 10, y - 8]} stroke={color} strokeWidth={2} fill="white" />
            <Line points={[x + 10, y - 8, x + 10, y + 8]} stroke={color} strokeWidth={3} />
            <Line points={[x + 10, y, x + 25, y]} stroke={color} strokeWidth={2} />
          </React.Fragment>
        );
      
      case 'potentiometer':
        return (
          <React.Fragment key={component.id}>
            <Line points={[x - 30, y, x - 15, y]} stroke={color} strokeWidth={2} />
            <Rect x={x - 15} y={y - 6} width={30} height={12} stroke={color} strokeWidth={2} fill="white" />
            <Line points={[x + 15, y, x + 30, y]} stroke={color} strokeWidth={2} />
            <Line points={[x, y - 15, x, y - 6]} stroke={color} strokeWidth={2} />
            <Line points={[x - 3, y - 18, x + 3, y - 12]} stroke={color} strokeWidth={2} />
            <Text x={x - 8} y={y + 3} text="POT" fontSize={8} fill={color} />
          </React.Fragment>
        );
      
      case 'fuse':
        const isBlown = properties.blown;
        const fuseColor = isBlown ? 'red' : color;
        const fuseText = isBlown ? 'X' : 'F';
        return (
          <React.Fragment key={component.id}>
            <Line points={[x - 25, y, x - 15, y]} stroke={fuseColor} strokeWidth={2} />
            <Rect x={x - 15} y={y - 5} width={30} height={10} stroke={fuseColor} strokeWidth={2} fill="white" />
            <Line points={[x + 15, y, x + 25, y]} stroke={fuseColor} strokeWidth={2} />
            {!isBlown && <Line points={[x - 10, y, x + 10, y]} stroke={fuseColor} strokeWidth={1} />}
            <Text x={x - 6} y={y + 3} text={fuseText} fontSize={8} fill={fuseColor} />
          </React.Fragment>
        );

      case 'resistor':
        return (
          <React.Fragment key={component.id}>
            <Line points={[x - 25, y, x - 10, y]} stroke={color} strokeWidth={2} />
            <Line points={[x - 10, y - 15, x - 10, y + 15]} stroke={color} strokeWidth={3} />
            <Line points={[x - 10, y - 8, x + 15, y - 15]} stroke={color} strokeWidth={2} />
            <Line points={[x - 10, y + 8, x + 15, y + 15]} stroke={color} strokeWidth={2} />
            <Line points={[x + 15, y - 15, x + 15, y - 25]} stroke={color} strokeWidth={2} />
            <Line points={[x + 15, y + 15, x + 15, y + 25]} stroke={color} strokeWidth={2} />
            <Line points={[x + 12, y + 12, x + 18, y + 18]} stroke={color} strokeWidth={2} />
            <Line points={[x + 15, y + 15, x + 12, y + 12]} stroke={color} strokeWidth={2} />
          </React.Fragment>
        );

      case 'inductor':
        return (
          <React.Fragment key={component.id}>
            <Line points={[x - 25, y, x - 15, y]} stroke={color} strokeWidth={2} />
            {[0, 1, 2].map(i => (
              <Circle key={i} x={x - 10 + i * 3} y={y - 4} radius={3} stroke={color} strokeWidth={2} fill="none" />
            ))}
            <Line points={[x - 2, y - 15, x - 2, y + 15]} stroke={color} strokeWidth={2} />
            <Line points={[x + 2, y - 15, x + 2, y + 15]} stroke={color} strokeWidth={2} />
            {[0, 1, 2].map(i => (
              <Circle key={i + 3} x={x + 6 + i * 3} y={y - 4} radius={3} stroke={color} strokeWidth={2} fill="none" />
            ))}
            <Line points={[x + 15, y, x + 25, y]} stroke={color} strokeWidth={2} />
          </React.Fragment>
        );
      
      default:
        return (
          <Circle key={component.id} x={x} y={y} radius={8} fill="gray" stroke={color} />
        );
    }
  };

  return (
    <div className="circuit-workspace">
      {/* Left Panel — Components Library */}
      <div className={`component-sidebar ${mobileLeftOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <h2 className="sidebar-title">Components</h2>
          <input
            type="text"
            placeholder="Search components..."
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {(isWireMode || isDisconnectMode || activeTerminal || moveMode) && (
            <div className="selected-info">
              {isWireMode 
                ? activeTerminal 
                  ? 'Click another component terminal to connect'
                  : 'Click component terminals to connect them'
                : isDisconnectMode
                  ? 'Click any wire to disconnect it'
                : moveMode
                  ? 'Move Mode: Click and drag components to reposition them'
                : `Selected: ${componentLabels[selectedType]?.emoji} ${componentLabels[selectedType]?.label}`
              }
            </div>
          )}
          
          {selectedWire && (
            <div className="selected-wire-info">
              Wire selected - Press Delete to disconnect or right-click for options
            </div>
          )}
        </div>
        
        <div className="component-sections">
          {filteredSections.map(section => (
            <div key={section.title} className="component-section">
              <div 
                className="section-header"
                onClick={() => toggleSection(section.title)}
              >
                <h3 className="section-title">{section.title}</h3>
                <div className={`section-toggle ${expandedSections.has(section.title) ? 'expanded' : ''}`}>
                  ▶
                </div>
              </div>
              <div className={`component-list ${!expandedSections.has(section.title) ? 'collapsed' : ''}`}>
                {section.components.map(({ type, label, emoji }) => (
                  <button
                    key={type}
                    onClick={() => {
                      if (type === 'move') {
                        setMoveMode(!moveMode);
                        setSelectedType('move');
                      } else {
                        setSelectedType(type as ToolType);
                        setMoveMode(false);
                      }
                      setActiveTerminal(null); // Clear active terminal when switching tools
                    }}
                    className={`component-item ${selectedType === type ? 'selected' : ''} ${type === 'move' && moveMode ? 'move-active' : ''}`}
                  >
                    <span className="component-icon">{emoji}</span>
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Center Panel — Circuit Board */}
      <div className="canvas-area">
        <div className="canvas-container">
          {components.length === 0 && (
            <div className="empty-canvas-message">
              <div className="message-content">
                <h3>Start Building Your Circuit</h3>
                <p>Select a component from the left panel, then click on the board to place it</p>
                <div className="message-hint">
                  <span className="hint-icon">👈</span>
                  <span>Choose components</span>
                  <span className="hint-arrow">→</span>
                  <span className="hint-icon">🖱️</span>
                  <span>Click to place</span>
                </div>
              </div>
            </div>
          )}
          
          <Stage 
            width={520} 
            height={600} 
            onClick={handleCanvasClick}
            onMouseDown={(e) => {
              if (moveMode) {
                const stage = e.target.getStage();
                const pos = stage?.getPointerPosition();
                if (!pos) return;
                const clickedComponent = components.find(comp => {
                  const distance = Math.sqrt((comp.position.x - pos.x) ** 2 + (comp.position.y - pos.y) ** 2);
                  return distance < 50; // Increased radius to 50px
                });
                
                if (clickedComponent) {
                  setDraggedComponent(clickedComponent.id);
                  console.log('Selected component:', clickedComponent.type); // Debug log
                  e.evt.preventDefault(); // Prevent default behavior
                }
              }
            }}
            onMouseMove={(e) => {
              if (moveMode && draggedComponent) {
                const stage = e.target.getStage();
                const pos = stage?.getPointerPosition();
                if (pos) {
                  // Update component position directly
                  onComponentUpdate(draggedComponent, 'position', pos);
                  e.evt.preventDefault();
                }
              }
            }}
            onMouseUp={(e) => {
              if (moveMode && draggedComponent) {
                setDraggedComponent(null);
                console.log('Released component'); // Debug log
                e.evt.preventDefault();
              }
            }}
            style={{ display: 'block', margin: '0 auto', cursor: moveMode ? 'move' : 'default' }}
          >
            <Layer>
              {/* Show small green circles at component terminals when wire is selected */}
              {isWireMode && components.map(comp => (
                <React.Fragment key={`terminals-${comp.id}`}>
                  <Circle
                    x={comp.position.x - 25}
                    y={comp.position.y}
                    radius={6}
                    fill={activeTerminal?.componentId === comp.id && activeTerminal?.terminal === 'left' ? "#EF4444" : "#10B981"}
                    stroke={activeTerminal?.componentId === comp.id && activeTerminal?.terminal === 'left' ? "#DC2626" : "#059669"}
                    strokeWidth={activeTerminal?.componentId === comp.id && activeTerminal?.terminal === 'left' ? 2 : 1}
                  />
                  <Circle
                    x={comp.position.x + 25}
                    y={comp.position.y}
                    radius={6}
                    fill={activeTerminal?.componentId === comp.id && activeTerminal?.terminal === 'right' ? "#EF4444" : "#10B981"}
                    stroke={activeTerminal?.componentId === comp.id && activeTerminal?.terminal === 'right' ? "#DC2626" : "#059669"}
                    strokeWidth={activeTerminal?.componentId === comp.id && activeTerminal?.terminal === 'right' ? 2 : 1}
                  />
                </React.Fragment>
              ))}
              
              {/* Render user-created wire connections */}
              {wires.map((wire, index) => {
                const fromComp = components.find(c => c.id === wire.from);
                const toComp = components.find(c => c.id === wire.to);
                if (!fromComp || !toComp) return null;
                
                // Get exact terminal positions
                const fromX = wire.fromTerminal === 'left' ? fromComp.position.x - 25 : fromComp.position.x + 25;
                const toX = wire.toTerminal === 'left' ? toComp.position.x - 25 : toComp.position.x + 25;
                
                return (
                  <Line
                    key={`user-wire-${index}`}
                    points={[fromX, fromComp.position.y, toX, toComp.position.y]}
                    stroke={selectedWire === wire ? "#DC2626" : "#6366F1"}
                    strokeWidth={selectedWire === wire ? 4 : 3}
                    hitStrokeWidth={10}
                    onClick={(e) => {
                      e.cancelBubble = true;
                      if (isDisconnectMode) {
                        onWireDisconnect(wire.from, wire.fromTerminal, wire.to, wire.toTerminal);
                      } else {
                        setSelectedWire(wire);
                      }
                    }}
                    onContextMenu={(e) => {
                      e.evt.preventDefault();
                      const stage = e.target.getStage();
                      const pos = stage?.getPointerPosition();
                      if (pos) {
                        setContextMenu({ x: pos.x, y: pos.y, wire });
                      }
                    }}
                  />
                );
              })}
              
              {/* Render auto-connections between adjacent components */}
              {components.map((comp, index) => {
                if (index === 0) return null;
                const prevComp = components[index - 1];
                const connectionId = `${prevComp.id}-${comp.id}`;
                
                if (disabledAutoConnections.has(connectionId)) return null;
                
                return (
                  <Line
                    key={`auto-wire-${comp.id}`}
                    points={[prevComp.position.x + 25, prevComp.position.y, comp.position.x - 25, comp.position.y]}
                    stroke="#9CA3AF"
                    strokeWidth={2}
                    dash={[5, 5]}
                    hitStrokeWidth={10}
                    onClick={(e) => {
                      e.cancelBubble = true;
                      if (isDisconnectMode) {
                        setDisabledAutoConnections(prev => new Set([...prev, connectionId]));
                        setTimeout(updateCircuitSimulation, 0);
                      }
                    }}
                    onContextMenu={(e) => {
                      e.evt.preventDefault();
                      const stage = e.target.getStage();
                      const pos = stage?.getPointerPosition();
                      if (pos) {
                        setContextMenu({ 
                          x: pos.x, 
                          y: pos.y, 
                          wire: { type: 'auto', connectionId }
                        });
                      }
                    }}
                  />
                );
              })}
              
              {components.map(renderComponent)}
              
              {/* Show selection highlight for dragged component in move mode */}
              {moveMode && draggedComponent && (() => {
                const comp = components.find(c => c.id === draggedComponent);
                return comp ? (
                  <Circle
                    key={`move-highlight-${draggedComponent}`}
                    x={comp.position.x}
                    y={comp.position.y}
                    radius={40}
                    stroke="#ff6600"
                    strokeWidth={3}
                    dash={[5, 5]}
                  />
                ) : null;
              })()}
            </Layer>
          </Stage>
        </div>
      </div>

      {/* Right Panel — Active Components */}
      <div className={`controls-sidebar ${mobileRightOpen ? 'mobile-open' : ''}`}>
        <div className="controls-header">
          <h2 className="controls-title">Active Components</h2>
          <p className="controls-subtitle">Components on the board</p>
        </div>
        
        <div className="stats-section">
          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-number">{components.length}</span>
              <span className="stat-label">Parts</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">{wires.length}</span>
              <span className="stat-label">Wires</span>
            </div>
          </div>
        </div>

        <div className="components-section">
          {components.filter(c => (c.type as string) !== 'wire').map(component => (
            <div key={component.id} className="board-component">
              <div className="component-header">
                <div className="component-info">
                  <span className="component-emoji">
                    {componentLabels[component.type]?.emoji}
                  </span>
                  <span className="component-name">
                    {componentLabels[component.type]?.label}
                  </span>
                </div>
                <button 
                  className="remove-btn"
                  onClick={() => onComponentRemove(component.id)}
                  title="Remove component"
                >
                  ✕
                </button>
              </div>
              
              <div className="component-controls">
                {component.type === 'battery' && (
                  <div className="control-group">
                    <span className="control-label">
                      Voltage: <span className="control-value">{component.properties.voltage}V</span>
                    </span>
                    <input
                      type="range"
                      min="1"
                      max="24"
                      value={component.properties.voltage || 9}
                      onChange={(e) => onComponentUpdate(component.id, 'voltage', parseInt(e.target.value))}
                      className="control-slider"
                    />
                  </div>
                )}
                
                {component.type === 'resistor' && (
                  <div className="control-group">
                    <span className="control-label">
                      Resistance: <span className="control-value">{component.properties.resistance}Ω</span>
                    </span>
                    <input
                      type="range"
                      min="10"
                      max="1000"
                      step="10"
                      value={component.properties.resistance || 100}
                      onChange={(e) => onComponentUpdate(component.id, 'resistance', parseInt(e.target.value))}
                      className="control-slider"
                    />
                  </div>
                )}
                
                {component.type === 'led' && (
                  <div className="control-group">
                    <span className="control-label">Status:</span>
                    <div className="status-indicator">
                      <div className={`status-dot ${component.properties.glowing ? 'on' : 'off'}`}></div>
                      <span>{component.properties.glowing ? 'ON' : 'OFF'}</span>
                    </div>
                  </div>
                )}
                
                {component.type === 'bulb' && (
                  <div className="control-group">
                    <span className="control-label">Status:</span>
                    <div className="status-indicator">
                      <div className={`status-dot ${component.properties.spinning ? 'on' : 'off'}`}></div>
                      <span>{component.properties.spinning ? 'SPINNING' : 'STOPPED'}</span>
                    </div>
                  </div>
                )}
                
                {component.type === 'bulb' && (
                  <div className="control-group">
                    <span className="control-label">Status:</span>
                    <div className="status-indicator">
                      <div className={`status-dot ${component.properties.glowing ? 'on' : 'off'}`}></div>
                      <span>{component.properties.glowing ? 'ON' : 'OFF'}</span>
                    </div>
                  </div>
                )}
                
                {component.type === 'switch' && (
                  <div className="control-group">
                    <span className="control-label">Switch:</span>
                    <button
                      onClick={() => onComponentUpdate(component.id, 'closed', !component.properties.closed)}
                      className={`switch-btn ${component.properties.closed ? 'closed' : 'open'}`}
                    >
                      {component.properties.closed ? 'CLOSED' : 'OPEN'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Generative Assistant Panel */}
      <GenerativeAssistant
        onComponentAdd={onComponentAdd}
        onComponentConnect={onComponentConnect}
        onWireDisconnect={onWireDisconnect}
        onComponentUpdate={onComponentUpdate}
        onReset={handleReset}
        components={components}
      />

      {/* Context Menu for Wire Disconnection */}
      {contextMenu && (
        <div 
          className="wire-context-menu"
          style={{
            position: 'absolute',
            left: contextMenu.x,
            top: contextMenu.y,
            background: 'white',
            border: '1px solid #ccc',
            borderRadius: '4px',
            padding: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            zIndex: 1000
          }}
        >
          <button
            onClick={() => {
              if (contextMenu.wire.type === 'auto') {
                setDisabledAutoConnections(prev => new Set([...prev, contextMenu.wire.connectionId]));
                setTimeout(updateCircuitSimulation, 0);
              } else {
                onWireDisconnect(
                  contextMenu.wire.from,
                  contextMenu.wire.fromTerminal,
                  contextMenu.wire.to,
                  contextMenu.wire.toTerminal
                );
              }
              setContextMenu(null);
              setSelectedWire(null);
            }}
            style={{
              background: '#dc2626',
              color: 'white',
              border: 'none',
              padding: '6px 12px',
              borderRadius: '3px',
              cursor: 'pointer'
            }}
          >
            Disconnect Wire
          </button>
        </div>
      )}
    </div>
  );
};
