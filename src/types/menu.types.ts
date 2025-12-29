// ============================================
// Menu Types für Prüfstand HMI
// ============================================

// ============================================
// Menu Types
// ============================================

export type MenuPanel = 
  | 'none' 
  | 'gear' 
  | 'program' 
  | 'sensors' 
  | 'regelung' 
  | 'config' 
  | 'dsg';

export interface MenuItem {
  id: MenuPanel;
  label: string;
  icon: string;
  subtitle?: string;
}

// ============================================
// Program Types
// ============================================

export type ProgramStatus = 'ready' | 'running' | 'paused' | 'completed' | 'error';

export interface TestProgram {
  id: string;
  name: string;
  icon: string;
  status: ProgramStatus;
  progress?: number;
  description?: string;
}


