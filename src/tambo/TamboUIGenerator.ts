import { CircuitSemantics } from '../types/circuit';

// 100% Tambo-driven context generation - no hardcoded UI decisions
export class TamboContextProvider {
  
  // Convert circuit state to rich natural language for Tambo's AI decision making
  generateContext(semantics: CircuitSemantics): string {
    const contexts: string[] = [];
    
    // Power flow analysis
    if (semantics.powerFlowActive) {
      contexts.push(`Active power flow detected: current flowing through circuit`);
      contexts.push(`Power flow intensity: active`);
    }
    
    // Circuit topology
    if (semantics.openCircuit) {
      contexts.push("Circuit topology: OPEN - no complete path for electron flow");
      contexts.push("Electrical continuity: BROKEN - components not forming closed loop");
    }
    
    // Critical safety conditions
    if (semantics.shortCircuit) {
      contexts.push("CRITICAL SAFETY ALERT: Short circuit condition detected");
      contexts.push("Electrical hazard: Direct path with minimal resistance causing dangerous current levels");
      contexts.push("Immediate action required: Circuit protection needed");
    }
    
    if (semantics.overcurrentDetected) {
      contexts.push("OVERCURRENT WARNING: Components experiencing current beyond safe operating limits");
      contexts.push("Component stress level: HIGH - potential for permanent damage");
    }
    
    // Component-specific behaviors
    if (semantics.reversePolarityDetected) {
      contexts.push("Polarity mismatch detected: LED or diode connected in reverse orientation");
      contexts.push("Current flow: BLOCKED - semiconductor junction preventing electron flow");
    }
    
    if (semantics.capacitorCharging) {
      contexts.push("Capacitor behavior: Active charging phase - voltage building exponentially");
      contexts.push("Energy storage: Accumulating electrical potential energy");
    }
    
    if (semantics.componentFailure.length > 0) {
      contexts.push("Component integrity compromised: One or more parts showing failure indicators");
      contexts.push("System reliability: DEGRADED - failed components affecting circuit operation");
    }
    
    // Circuit complexity assessment
    const complexity = this.assessComplexity(semantics);
    contexts.push(`Circuit complexity level: ${complexity} - UI should match sophistication level`);
    
    return contexts.length > 0 
      ? `CIRCUIT ANALYSIS: ${contexts.join('. ')}.`
      : "IDLE STATE: No active electrical circuit detected - minimal interface appropriate.";
  }
  
  // Generate comprehensive system prompt for Tambo's UI decision engine
  generateSystemPrompt(semantics: CircuitSemantics): string {
    const basePrompt = `You are the AI UI decision engine for OpenCircuit, an electrical playground where students learn by experimentation.

CORE PRINCIPLE: The interface emerges from circuit behavior, not user requests.

CURRENT CIRCUIT STATE: ${this.generateContext(semantics)}

UI COMPONENT DECISION RULES:
1. SAFETY FIRST: Always prioritize SafetyAlert components for dangerous conditions
2. RELEVANCE ONLY: Never show instruments that aren't meaningful for current circuit state
3. PROGRESSIVE COMPLEXITY: Match UI sophistication to circuit complexity
4. EDUCATIONAL VALUE: Show components that help students understand electrical behavior
5. NO REDUNDANCY: Avoid showing multiple components that display the same information

AVAILABLE COMPONENTS AND WHEN TO USE THEM:
- CurrentMeter: Show when current > 0.001A (active power flow)
- VoltageMeter: Show when voltage difference > 0.1V (meaningful potential)
- SafetyAlert: MANDATORY for short circuits, overcurrent, or component failures
- PowerFlowVisualizer: Show for active circuits with visible current flow
- ChargeGraph: Show when capacitors are charging/discharging
- PolarityIndicator: Show when reverse polarity blocks current flow
- ComponentHealth: Show when components are stressed or failing
- MagneticField: Show for inductors or high-current components
- Multimeter: Show for complex circuits where precise measurements matter

POSITIONING STRATEGY:
- Use position props to avoid UI overlaps
- Safety alerts can use takeover mode for critical situations
- Place related instruments near each other
- Keep canvas area clear for circuit building

EDUCATIONAL CONTEXT:
Students are learning electrical engineering through hands-on experimentation. Your UI decisions should:
- Reveal electrical phenomena that aren't visually obvious
- Provide immediate feedback on circuit behavior
- Guide attention to important electrical concepts
- Never overwhelm beginners with too many instruments`;

    // Add specific guidance based on current circuit state
    if (semantics.shortCircuit || semantics.overcurrentDetected) {
      return basePrompt + `\n\nCRITICAL: Circuit is in dangerous state. SafetyAlert with takeover mode is REQUIRED. Suppress other components until safety is restored.`;
    }
    
    if (semantics.openCircuit) {
      return basePrompt + `\n\nCURRENT STATE: Open circuit - no power flow. Show minimal interface. No meters needed until circuit is completed.`;
    }
    
    if (semantics.powerFlowActive) {
      return basePrompt + `\n\nCURRENT STATE: Active circuit with power flow. Show relevant meters and visualizations. This is prime learning opportunity.`;
    }
    
    return basePrompt + `\n\nCURRENT STATE: Circuit in transition. Analyze electrical behavior and show most educationally valuable components.`;
  }
  
  // Assess circuit complexity to guide UI sophistication
  private assessComplexity(semantics: CircuitSemantics): string {
    let complexityScore = 0;
    
    if (semantics.powerFlowActive) complexityScore += 2;
    if (semantics.capacitorCharging) complexityScore += 3;
    if (semantics.reversePolarityDetected) complexityScore += 2;
    if (semantics.componentFailure.length > 0) complexityScore += 1;
    
    if (complexityScore === 0) return "MINIMAL";
    if (complexityScore <= 3) return "BASIC";
    if (complexityScore <= 6) return "INTERMEDIATE";
    return "ADVANCED";
  }
  
  // Generate tool descriptions for Tambo to understand component purposes
  generateToolDescriptions(): Record<string, string> {
    return {
      CurrentMeter: "Digital ammeter showing real-time current flow in amperes. Essential for understanding power consumption and circuit loading.",
      VoltageMeter: "Digital voltmeter displaying potential difference across circuit elements. Critical for analyzing voltage drops and power distribution.",
      SafetyAlert: "Emergency warning system for dangerous electrical conditions. Prevents component damage and teaches safe circuit practices.",
      PowerFlowVisualizer: "Animated display showing direction and intensity of electrical power flow. Helps visualize invisible electrical phenomena.",
      ChargeGraph: "Real-time graph of capacitor charging/discharging curves. Demonstrates exponential behavior and time constants.",
      PolarityIndicator: "Visual indicator for correct component orientation. Essential for diodes, LEDs, and polarized components.",
      ComponentHealth: "Status monitor showing component stress levels and failure indicators. Teaches component limitations and reliability.",
      MagneticField: "Visualization of magnetic fields around inductors and current-carrying conductors. Reveals electromagnetic phenomena.",
      Multimeter: "Professional-grade digital multimeter for precise measurements. Advanced tool for detailed circuit analysis."
    };
  }
}
