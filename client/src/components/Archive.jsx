import React, { useState, useEffect } from 'react';
import ArchiveCard from './ArchiveCard';

const AnimatedCounter = ({ end, decimals = 0 }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime;
    const duration = 1500; // 1.5 seconds

    const animate = (time) => {
      if (!startTime) startTime = time;
      const progress = (time - startTime) / duration;

      if (progress < 1) {
        setCount(end * progress);
        requestAnimationFrame(animate);
      } else {
        setCount(end);
      }
    };

    requestAnimationFrame(animate);
  }, [end]);

  return <span>{count.toFixed(decimals)}</span>;
};

export default function Archive({ articles, onSelectArticle }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredArticles = articles.filter(a => 
    a.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalScanned = articles.length;
  const avgBias = totalScanned > 0 
    ? articles.reduce((acc, a) => acc + a.biasScore, 0) / totalScanned 
    : 0;

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col gap-8 h-full pb-12 pt-8 z-10 pointer-events-auto">
      
      {/* Search and Analytics Bar */}
      <div className="glass-panel p-6 flex flex-col md:flex-row justify-between items-center gap-6">
        
        {/* Search */}
        <div className="w-full md:w-1/3">
          <input 
            type="text" 
            placeholder="Search archive by title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all placeholder:text-slate-500"
          />
        </div>

        {/* Analytics Summary */}
        <div className="hidden md:flex gap-8">
          <div className="flex flex-col items-center">
            <span className="text-sm text-slate-400 uppercase tracking-wider font-semibold">Total Scanned</span>
            <span className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
              <AnimatedCounter end={totalScanned} />
            </span>
          </div>
          <div className="w-px bg-slate-700"></div>
          <div className="flex flex-col items-center">
            <span className="text-sm text-slate-400 uppercase tracking-wider font-semibold">Average Bias</span>
            <span className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-red-400">
              <AnimatedCounter end={avgBias} decimals={1} />
            </span>
          </div>
        </div>
      </div>

      {/* Grid */}
      {filteredArticles.length === 0 ? (
        <div className="glass-panel p-12 text-center text-slate-400">
          No articles found in the archive.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
          {filteredArticles.map(article => (
            <ArchiveCard 
              key={article._id || article.url} 
              article={article} 
              onClick={onSelectArticle} 
            />
          ))}
        </div>
      )}
    </div>
  );
}
