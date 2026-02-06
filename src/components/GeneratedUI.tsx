import React from 'react';
import { z } from 'zod';

// All UI components MUST be registered with Tambo - no hardcoded UI logic

export const CircuitCanvasSchema = z.object({
  width: z.number().default(800),
  height: z.number().default(600),
  showGrid: z.boolean().default(false),
  highlightNodes: z.array(z.string()).optional()
});

export const CurrentMeterSchema = z.object({
  value: z.number(),
  unit: z.string().default('A'),
  max: z.number().optional(),
  position: z.enum(['top-right', 'top-left', 'bottom-right', 'bottom-left']).default('top-right')
});

export const VoltageMeterSchema = z.object({
  value: z.number(),
  unit: z.string().default('V'),
  range: z.array(z.number()).optional(),
  position: z.enum(['top-right', 'top-left', 'bottom-right', 'bottom-left']).default('top-right')
});

export const SafetyAlertSchema = z.object({
  type: z.enum(['short_circuit', 'overcurrent', 'reverse_polarity', 'component_failure']),
  severity: z.enum(['warning', 'critical']),
  message: z.string().optional(),
  takeover: z.boolean().default(false) // Full screen takeover for critical alerts
});

export const PowerFlowSchema = z.object({
  intensity: z.number().min(0).max(1),
  direction: z.enum(['forward', 'reverse']).default('forward'),
  paths: z.array(z.object({
    from: z.string(),
    to: z.string(),
    current: z.number()
  })).optional()
});

export const ChargeGraphSchema = z.object({
  charging: z.boolean(),
  voltage: z.number(),
  timeConstant: z.number().optional(),
  showEquation: z.boolean().default(false)
});

export const PolarityIndicatorSchema = z.object({
  componentId: z.string(),
  reversed: z.boolean(),
  showCorrection: z.boolean().default(true)
});

export const ComponentHealthSchema = z.object({
  components: z.array(z.object({
    id: z.string(),
    health: z.enum(['normal', 'stressed', 'damaged', 'blown']),
    temperature: z.number().optional()
  }))
});

export const MagneticFieldSchema = z.object({
  strength: z.number(),
  componentId: z.string(),
  showFieldLines: z.boolean().default(true)
});

export const MultimeterSchema = z.object({
  mode: z.enum(['voltage', 'current', 'resistance']),
  probeA: z.string().optional(),
  probeB: z.string().optional(),
  reading: z.number().optional()
});

// Tambo-only UI components - no conditional rendering allowed
export const CurrentMeter: React.FC<z.infer<typeof CurrentMeterSchema>> = ({ 
  value, unit, max, position 
}) => (
  <div className={`current-meter ${position}`}>
    <div className="meter-display">
      <span className="value">{value.toFixed(3)}</span>
      <span className="unit">{unit}</span>
    </div>
    <div className="meter-label">Current</div>
    {max && (
      <div className="meter-bar">
        <div 
          className="meter-fill" 
          style={{ width: `${Math.min(100, (value / max) * 100)}%` }}
        />
      </div>
    )}
  </div>
);

export const VoltageMeter: React.FC<z.infer<typeof VoltageMeterSchema>> = ({ 
  value, unit, range, position 
}) => (
  <div className={`voltage-meter ${position}`}>
    <div className="meter-display">
      <span className="value">{value.toFixed(1)}</span>
      <span className="unit">{unit}</span>
    </div>
    <div className="meter-label">Voltage</div>
    {range && (
      <div className="meter-range">
        Range: {range[0]}V - {range[1]}V
      </div>
    )}
  </div>
);

export const SafetyAlert: React.FC<z.infer<typeof SafetyAlertSchema>> = ({ 
  type, severity, message, takeover 
}) => (
  <div className={`safety-alert ${severity} ${takeover ? 'takeover' : ''}`}>
    <div className="alert-icon">⚠️</div>
    <div className="alert-message">
      {message || (type === 'short_circuit' ? 'SHORT CIRCUIT DETECTED!' : 
                   type === 'overcurrent' ? 'OVERCURRENT CONDITION!' : 
                   type === 'reverse_polarity' ? 'REVERSE POLARITY!' :
                   'COMPONENT FAILURE!')}
    </div>
    {takeover && (
      <div className="alert-actions">
        <button className="reset-btn">Reset Circuit</button>
        <button className="replace-btn">Replace Components</button>
      </div>
    )}
  </div>
);

export const PowerFlowVisualizer: React.FC<z.infer<typeof PowerFlowSchema>> = ({ 
  intensity, direction, paths 
}) => (
  <div className="power-flow-viz">
    <div 
      className="flow-indicator" 
      style={{ 
        opacity: intensity,
        animation: `pulse ${2 - intensity}s infinite`
      }}
    >
      {direction === 'forward' ? '⚡' : '🔄'} Power Flowing ({(intensity * 100).toFixed(0)}%)
    </div>
    {paths && (
      <div className="flow-paths">
        {paths.map((path, i) => (
          <div key={i} className="path-info">
            {path.from} → {path.to}: {path.current.toFixed(3)}A
          </div>
        ))}
      </div>
    )}
  </div>
);

export const ChargeGraph: React.FC<z.infer<typeof ChargeGraphSchema>> = ({ 
  charging, voltage, timeConstant, showEquation 
}) => (
  <div className="charge-graph">
    <div className="graph-title">Capacitor</div>
    <div className="charge-status">
      {charging ? '📈 Charging' : '📉 Discharging'} ({voltage.toFixed(2)}V)
    </div>
    {timeConstant && (
      <div className="time-constant">τ = {timeConstant.toFixed(2)}s</div>
    )}
    {showEquation && (
      <div className="equation">
        V(t) = V₀(1 - e^(-t/τ))
      </div>
    )}
  </div>
);

export const PolarityIndicator: React.FC<z.infer<typeof PolarityIndicatorSchema>> = ({ 
  componentId, reversed, showCorrection 
}) => (
  <div className="polarity-indicator">
    <div className="polarity-warning">
      🔄 Component {componentId}: {reversed ? 'Reverse' : 'Correct'} Polarity
    </div>
    {reversed && showCorrection && (
      <div className="correction-hint">
        💡 Flip component to allow current flow
      </div>
    )}
  </div>
);

export const ComponentHealth: React.FC<z.infer<typeof ComponentHealthSchema>> = ({ 
  components 
}) => (
  <div className="component-health">
    <div className="health-title">Component Status</div>
    {components.map(comp => (
      <div key={comp.id} className={`health-item ${comp.health}`}>
        <span className="component-id">{comp.id}</span>
        <span className="health-status">{comp.health}</span>
        {comp.temperature && (
          <span className="temperature">{comp.temperature}°C</span>
        )}
      </div>
    ))}
  </div>
);

export const MagneticField: React.FC<z.infer<typeof MagneticFieldSchema>> = ({ 
  strength, componentId, showFieldLines 
}) => (
  <div className="magnetic-field">
    <div className="field-title">Magnetic Field</div>
    <div className="field-strength">
      Component {componentId}: {strength.toFixed(2)} Tesla
    </div>
    {showFieldLines && (
      <div className="field-visualization">
        🧲 Field lines visible
      </div>
    )}
  </div>
);

export const Multimeter: React.FC<z.infer<typeof MultimeterSchema>> = ({ 
  mode, probeA, probeB, reading 
}) => (
  <div className="multimeter">
    <div className="meter-title">Digital Multimeter</div>
    <div className="meter-mode">Mode: {mode.toUpperCase()}</div>
    <div className="probe-status">
      Probe A: {probeA || 'Not connected'}
      <br />
      Probe B: {probeB || 'Not connected'}
    </div>
    {reading !== undefined && (
      <div className="meter-reading">
        {reading.toFixed(3)} {mode === 'voltage' ? 'V' : mode === 'current' ? 'A' : 'Ω'}
      </div>
    )}
  </div>
);
