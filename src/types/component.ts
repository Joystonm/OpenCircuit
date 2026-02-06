export type ComponentType = 
  | 'battery' 
  | 'resistor' 
  | 'bulb' 
  | 'led' 
  | 'switch' 
  | 'capacitor' 
  | 'ground'
  | 'inductor'
  | 'diode'
  | 'potentiometer'
  | 'fuse';

export interface ComponentProps {
  id: string;
  position: { x: number; y: number };
  rotation: number;
  onConnect: (nodeId: string) => void;
  onDisconnect: (nodeId: string) => void;
}
