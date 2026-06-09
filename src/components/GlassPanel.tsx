import React from 'react';

interface GlassPanelProps {
  children: React.ReactNode;
  className?: string;
  noBlur?: boolean;
}

export function GlassPanel({
  children,
  className = '',
  noBlur = false
}: GlassPanelProps) {
  return (
    <div
      className={`glass-panel relative overflow-hidden group ${className}`}
      style={{
        background: 'rgba(5, 5, 5, 0.75)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: '20px',
        boxShadow: '0 12px 40px rgba(0, 0, 0, 0.5)',
        pointerEvents: 'auto',
        isolation: 'isolate',
        backdropFilter: noBlur ? 'none' : 'blur(20px)',
        WebkitBackdropFilter: noBlur ? 'none' : 'blur(20px)',
      }}
    >
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/[0.2] to-transparent pointer-events-none" />

      <div className="relative z-10 w-full h-full flex flex-col">
        {children}
      </div>
    </div>
  );
}