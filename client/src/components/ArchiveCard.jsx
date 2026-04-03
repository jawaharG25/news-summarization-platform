import React from 'react';
import Tilt from 'react-parallax-tilt';
import BiasSpectrum from './BiasSpectrum';

export default function ArchiveCard({ article, onClick }) {
  // Determine Sentiment Label & Color
  let sentimentLabel = 'Neutral';
  let sentimentColor = 'bg-slate-400 shadow-slate-400/50'; // Gray glow
  
  if (article.sentiment > 60) {
    sentimentLabel = 'Positive';
    sentimentColor = 'bg-emerald-400 shadow-emerald-400/50'; // Green glow
  } else if (article.sentiment < 40) {
    sentimentLabel = 'Negative';
    sentimentColor = 'bg-red-400 shadow-red-400/50'; // Red glow
  }

  return (
    <Tilt
      tiltMaxAngleX={10}
      tiltMaxAngleY={10}
      scale={1.02}
      transitionSpeed={2500}
      className="cursor-pointer h-full"
    >
      <div 
        onClick={() => onClick(article)}
        className="glass-panel p-6 h-full flex flex-col justify-between hover:border-purple-500/50 transition-colors"
      >
        <div>
          <h3 className="text-xl font-bold text-slate-100 mb-3 truncate hover:text-clip hover:text-wrap line-clamp-2" title={article.title}>
            {article.title}
          </h3>
          
          <div className="flex items-center gap-2 mb-6">
            {/* Colored Glow Dot */}
            <div className={`w-3 h-3 rounded-full shadow-[0_0_8px_currentColor] ${sentimentColor}`}></div>
            <span className="text-sm font-medium text-slate-300">{sentimentLabel} Focus</span>
          </div>
        </div>

        <div>
          <div className="text-xs text-slate-400 mb-2 font-semibold tracking-wider uppercase flex justify-between">
            <span>Bias Spectrum</span>
            <span>{article.biasScore}</span>
          </div>
          {/* Mini Bias Spectrum (hide the label row in Archive view via CSS or prop, but we'll use a wrapper to scale if needed or pass a compact prop) */}
          <div className="pointer-events-none opacity-80">
            <BiasSpectrum score={article.biasScore} compact={true} />
          </div>
        </div>
      </div>
    </Tilt>
  );
}
