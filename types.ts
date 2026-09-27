export interface LogMessage {
  id: string;
  text: string;
  type: 'info' | 'success' | 'error' | 'command' | 'warning';
  timestamp: number;
}

export interface ExampleProblem {
  id: number;
  title: string;
  prompt: string;
  icon: string;
}

export interface GeoGebraApplet {
  reset: () => void;
  evalCommand: (cmd: string) => boolean;
  setVisible: (obj: string, visible: boolean) => void;
  setColor: (obj: string, r: number, g: number, b: number) => void;
  setLabelVisible: (obj: string, visible: boolean) => void;
  setLabelStyle: (obj: string, style: number) => void; // 0 name, 1 name+val, 2 val, 3 caption
  setCaption: (obj: string, caption: string) => void;
  setPointSize: (obj: string, style: number) => void;
  getAllObjectNames: (type?: string) => string[];
  setGridVisible: (visible: boolean) => void;
  setAxesVisible: (xAxis: boolean, yAxis: boolean) => void;
  setFilling: (obj: string, alpha: number) => void;
  // Add other GGB methods as needed
}

declare global {
  interface Window {
    GGBApplet: any;
    ggbApplet: GeoGebraApplet;
  }
}