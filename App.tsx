import React, { useState, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import GeoGebraBoard from './components/GeoGebraBoard';
import { generateGeoGebraCommands } from './services/geminiService';
import { LogMessage } from './types';

function App() {
  const [logs, setLogs] = useState<LogMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGgbReady, setIsGgbReady] = useState(false);

  const addLog = useCallback((text: string, type: LogMessage['type'] = 'info') => {
    setLogs(prev => [...prev, {
      id: Math.random().toString(36).substr(2, 9),
      text,
      type,
      timestamp: Date.now()
    }]);
  }, []);

  const handleClear = () => {
    if (window.ggbApplet) {
      window.ggbApplet.reset();
      addLog('Canvas cleared', 'info');
    }
  };

  const executeCommand = (originalCmd: string): boolean => {
    if (!window.ggbApplet) return false;

    // 0. Pre-process/Sanitize common AI hallucinations
    let cmd = originalCmd.trim();

    // Fix: Point(0, 0) -> (0, 0)
    cmd = cmd.replace(/=\s*Point\(\s*(-?\d+(\.\d+)?)\s*,\s*(-?\d+(\.\d+)?)\s*\)/g, '= ($1, $3)');
    
    // Fix: Reflection -> Reflect
    cmd = cmd.replace(/^Reflection\(/, 'Reflect(');
    cmd = cmd.replace(/= Reflection\(/, '= Reflect(');

    // 1. Handle Styling Commands via JS API (Preferred for speed/reliability)
    
    // SetPointSize(Obj, Size)
    const matchPointSize = cmd.match(/^SetPointSize\((.+?),\s*(\d+)\)$/);
    if (matchPointSize) {
      const [, obj, size] = matchPointSize;
      try {
        window.ggbApplet.setPointSize(obj.trim(), parseInt(size));
        return true;
      } catch (e) { /* Fallthrough to evalCommand */ }
    }

    // SetColor(Obj, R, G, B)
    const matchColor = cmd.match(/^SetColor\((.+?),\s*(\d+),\s*(\d+),\s*(\d+)\)$/);
    if (matchColor) {
      const [, obj, r, g, b] = matchColor;
      try {
        window.ggbApplet.setColor(obj.trim(), parseInt(r), parseInt(g), parseInt(b));
        return true;
      } catch (e) { /* Fallthrough to evalCommand */ }
    }

    // SetLabelMode(Obj, Mode)
    const matchLabelMode = cmd.match(/^SetLabelMode\((.+?),\s*(\d+)\)$/);
    if (matchLabelMode) {
      const [, obj, mode] = matchLabelMode;
      try {
        window.ggbApplet.setLabelStyle(obj.trim(), parseInt(mode));
        return true;
      } catch (e) { /* Fallthrough to evalCommand */ }
    }

    // SetCaption(Obj, "Text")
    const matchCaption = cmd.match(/^SetCaption\((.+?),\s*"(.*)"\)$/);
    if (matchCaption) {
      const [, obj, caption] = matchCaption;
      try {
        window.ggbApplet.setCaption(obj.trim(), caption);
        return true;
      } catch (e) { /* Fallthrough to evalCommand */ }
    }

    // SetFilling(Obj, Alpha)
    const matchFilling = cmd.match(/^SetFilling\((.+?),\s*([0-9.]+)\)$/);
    if (matchFilling) {
      const [, obj, alpha] = matchFilling;
      try {
        window.ggbApplet.setFilling(obj.trim(), parseFloat(alpha));
        return true;
      } catch (e) { /* Fallthrough to evalCommand */ }
    }

    // SetVisible(Obj, Boolean)
    // Matches SetVisible(Obj, true/false) case insensitive
    const matchVisible = cmd.match(/^SetVisible\((.+?),\s*(true|false)\)$/i);
    if (matchVisible) {
      const [, obj, visibleStr] = matchVisible;
      try {
        window.ggbApplet.setVisible(obj.trim(), visibleStr.toLowerCase() === 'true');
        return true;
      } catch (e) { /* Fallthrough to evalCommand */ }
    }

    // 2. Default: Eval Command via GGB Script
    // Try original command first
    let success = window.ggbApplet.evalCommand(cmd);

    // If failed and looks like a function call (e.g. SetColor(A,0,0,0)), try converting () to []
    if (!success && cmd.includes('(') && cmd.includes(')')) {
        // Simple heuristic: if it starts with a command word
        if (/^[a-zA-Z]+\(/.test(cmd)) {
            const altCmd = cmd.replace('(', '[').replace(/\)$/, ']');
            success = window.ggbApplet.evalCommand(altCmd);
        }
    }

    return success;
  };

  const handleGenerate = async (prompt: string) => {
    if (!isGgbReady) {
      addLog('GeoGebra is not ready yet.', 'error');
      return;
    }

    setIsLoading(true);
    addLog(`Analyzing: "${prompt.substring(0, 40)}..."`, 'info');

    try {
      const commands = await generateGeoGebraCommands(prompt);
      
      addLog(`Generated ${commands.length} commands`, 'success');
      
      // Reset before drawing new shape
      window.ggbApplet.reset();
      
      // Execute commands with a small delay for visual effect
      for (const cmd of commands) {
        // Log the original command
        addLog(`> ${cmd}`, 'command');
        try {
          const success = executeCommand(cmd);
          
          if (success === false) { 
             addLog(`Failed to execute: ${cmd}`, 'warning');
          }
        } catch (e: any) {
          console.error(e);
          addLog(`Error executing: ${cmd}`, 'error');
        }
        // Small delay to prevent freezing UI on large batches
        await new Promise(r => setTimeout(r, 50));
      }

    } catch (error: any) {
      addLog(error.message || 'An error occurred', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen w-screen overflow-hidden font-sans">
      <Sidebar 
        onGenerate={handleGenerate} 
        onClear={handleClear}
        logs={logs}
        isLoading={isLoading}
      />
      <div className="flex-1 relative h-full">
        {!isGgbReady && (
          <div className="absolute inset-0 bg-white/80 z-50 flex flex-col items-center justify-center text-teal-600 backdrop-blur-sm">
            <div className="animate-spin w-10 h-10 border-4 border-teal-200 border-t-teal-600 rounded-full mb-4"></div>
            <p className="font-medium animate-pulse">Initializing Geometry Engine...</p>
          </div>
        )}
        <GeoGebraBoard onReady={() => {
          setIsGgbReady(true);
          addLog('GeoGebra Engine Ready', 'success');
        }} />
      </div>
    </div>
  );
}

export default App;