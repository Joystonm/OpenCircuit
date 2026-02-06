import { TamboUIComponent, TamboContext } from '../types/tambo';
import { CurrentMeter } from '../components/ui/CurrentMeter';
import { VoltageMeter } from '../components/ui/VoltageMeter';
import { PowerFlowOverlay } from '../components/ui/PowerFlowOverlay';
import { SafetyAlert } from '../components/ui/SafetyAlert';
import { PolarityIndicator } from '../components/ui/PolarityIndicator';
import { ChargeGraph } from '../components/ui/ChargeGraph';

export const uiComponents: TamboUIComponent[] = [
  {
    id: 'safety-alert',
    component: SafetyAlert,
    priority: 100,
    conditions: (ctx: TamboContext) => ctx.safetyRiskLevel !== 'none'
  },
  {
    id: 'power-flow',
    component: PowerFlowOverlay,
    priority: 80,
    conditions: (ctx: TamboContext) => ctx.semanticStates.includes('power_flow_active')
  },
  {
    id: 'current-meter',
    component: CurrentMeter,
    priority: 70,
    conditions: (ctx: TamboContext) => ctx.semanticStates.includes('power_flow_active')
  },
  {
    id: 'voltage-meter',
    component: VoltageMeter,
    priority: 60,
    conditions: (ctx: TamboContext) => ctx.semanticStates.includes('power_flow_active')
  },
  {
    id: 'polarity-indicator',
    component: PolarityIndicator,
    priority: 50,
    conditions: (ctx: TamboContext) => ctx.semanticStates.includes('reverse_polarity')
  },
  {
    id: 'charge-graph',
    component: ChargeGraph,
    priority: 40,
    conditions: (ctx: TamboContext) => ctx.semanticStates.includes('capacitor_charging')
  }
];

export const selectUIComponents = (context: TamboContext): TamboUIComponent[] => {
  return uiComponents
    .filter(component => component.conditions(context))
    .sort((a, b) => b.priority - a.priority);
};
