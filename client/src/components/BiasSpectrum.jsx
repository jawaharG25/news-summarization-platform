import React from 'react';
import { motion } from 'framer-motion';

export default function BiasSpectrum({ score, compact = false }) {
  // score is 0 to 100. 0 = Left (Blue), 50 = Center (Purple), 100 = Right (Red)
  
  return (
    <div className={`w-full mx-auto relative ${compact ? 'mt-4' : 'max-w-md mt-8'}`}>
      {!compact && (
        <div className="flex justify-between text-xs text-slate-400 mb-2 font-mono uppercase">
          <span>Left</span>
          <span>Center</span>
          <span>Right</span>
        </div>
      )}
      
      {/* Background Gradient Bar */}
      <div className={`${compact ? 'h-2' : 'h-4'} w-full rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-red-500 relative shadow-inner overflow-visible`}>
        
        {/* Floating 3D Glass Marble using Framer Motion */}
        <motion.div
          className={`absolute top-1/2 -mt-4 -ml-4 w-8 h-8 rounded-full shadow-[0_0_15px_rgba(255,255,255,0.4)] border border-white/40 ${compact ? 'scale-75' : ''}`}
          style={{
            background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.8), rgba(255,255,255,0.1) 60%, rgba(0,0,0,0.4))',
            backdropFilter: 'blur(4px)',
          }}
          initial={false} // Prevents snapping to 50% on re-render if score is already available
          animate={{ left: `${score}%` }}
          transition={{ type: 'spring', stiffness: 60, damping: 15 }}
        />
      </div>
      
      {!compact && (
        <div className="mt-4 text-center text-sm font-semibold text-slate-200">
          Bias Score: {score}
        </div>
      )}
    </div>
  );
}
