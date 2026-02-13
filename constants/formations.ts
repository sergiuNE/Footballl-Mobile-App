import { Formation, FieldPosition } from '../types';

// Posities zijn in percentages: x (0-100 links-rechts), y (0-100 top-bottom)
export const FORMATIONS: Record<Formation, FieldPosition[]> = {
  '4-3-3': [
    // Goalkeeper
    { position: 'GK', x: 50, y: 90, label: 'GK' },
    
    // Defense (4)
    { position: 'LB', x: 20, y: 75, label: 'LB' },
    { position: 'CB1', x: 40, y: 78, label: 'CB' },
    { position: 'CB2', x: 60, y: 78, label: 'CB' },
    { position: 'RB', x: 80, y: 75, label: 'RB' },
    
    // Midfield (3)
    { position: 'CM1', x: 30, y: 55, label: 'CM' },
    { position: 'CM2', x: 50, y: 50, label: 'CM' },
    { position: 'CM3', x: 70, y: 55, label: 'CM' },
    
    // Attack (3)
    { position: 'LW', x: 20, y: 25, label: 'LW' },
    { position: 'ST1', x: 50, y: 20, label: 'ST' },
    { position: 'RW', x: 80, y: 25, label: 'RW' },
  ],
  
  '4-4-2': [
    // Goalkeeper
    { position: 'GK', x: 50, y: 90, label: 'GK' },
    
    // Defense (4)
    { position: 'LB', x: 20, y: 75, label: 'LB' },
    { position: 'CB1', x: 40, y: 78, label: 'CB' },
    { position: 'CB2', x: 60, y: 78, label: 'CB' },
    { position: 'RB', x: 80, y: 75, label: 'RB' },
    
    // Midfield (4)
    { position: 'LM', x: 20, y: 50, label: 'LM' },
    { position: 'CM1', x: 40, y: 52, label: 'CM' },
    { position: 'CM2', x: 60, y: 52, label: 'CM' },
    { position: 'RM', x: 80, y: 50, label: 'RM' },
    
    // Attack (2)
    { position: 'ST1', x: 40, y: 20, label: 'ST' },
    { position: 'ST2', x: 60, y: 20, label: 'ST' },
  ],
  
  '3-5-2': [
    // Goalkeeper
    { position: 'GK', x: 50, y: 90, label: 'GK' },
    
    // Defense (3)
    { position: 'CB1', x: 30, y: 75, label: 'CB' },
    { position: 'CB2', x: 50, y: 78, label: 'CB' },
    { position: 'RB', x: 70, y: 75, label: 'CB' },
    
    // Midfield (5)
    { position: 'LM', x: 15, y: 50, label: 'LM' },
    { position: 'CM1', x: 35, y: 52, label: 'CM' },
    { position: 'CM2', x: 50, y: 48, label: 'CM' },
    { position: 'CM3', x: 65, y: 52, label: 'CM' },
    { position: 'RM', x: 85, y: 50, label: 'RM' },
    
    // Attack (2)
    { position: 'ST1', x: 40, y: 20, label: 'ST' },
    { position: 'ST2', x: 60, y: 20, label: 'ST' },
  ],
  
  '4-2-3-1': [
    // Goalkeeper
    { position: 'GK', x: 50, y: 90, label: 'GK' },
    
    // Defense (4)
    { position: 'LB', x: 20, y: 75, label: 'LB' },
    { position: 'CB1', x: 40, y: 78, label: 'CB' },
    { position: 'CB2', x: 60, y: 78, label: 'CB' },
    { position: 'RB', x: 80, y: 75, label: 'RB' },
    
    // Defensive Midfield (2)
    { position: 'CM1', x: 40, y: 58, label: 'CDM' },
    { position: 'CM2', x: 60, y: 58, label: 'CDM' },
    
    // Attacking Midfield (3)
    { position: 'LM', x: 20, y: 38, label: 'LM' },
    { position: 'CM3', x: 50, y: 40, label: 'CAM' },
    { position: 'RM', x: 80, y: 38, label: 'RM' },
    
    // Attack (1)
    { position: 'ST1', x: 50, y: 18, label: 'ST' },
  ],
};