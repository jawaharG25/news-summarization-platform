import React, { useState, useEffect } from 'react';
import ArchiveCard from './ArchiveCard';

export default function RecommendationList({ currentArticleId, onSelectArticle }) {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!currentArticleId) return;

    setLoading(true);
    fetch(`https://newslens-core-api.azurewebsites.net/api/recommendations/${currentArticleId}`)
      .then(res => res.json())
      .then(data => {
        if (data && data.data) {
          setRecommendations(data.data);
        }
      })
      .catch(err => {
        console.error('Error fetching recommendations:', err);
        setError('Failed to load related articles.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [currentArticleId]);

  if (loading) {
    return (
      <div className="mt-12 w-full max-w-4xl opacity-70 animate-pulse">
        <h3 className="text-xl font-bold text-slate-200 mb-6 border-b border-slate-700 pb-2">Finding Related Perspectives...</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-40 bg-slate-800/50 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error || recommendations.length === 0) {
    return null; // Silently fail or return nothing if no recommendations
  }

  return (
    <div className="mt-12 w-full max-w-4xl animate-in slide-in-from-bottom-8 duration-700">
      <h3 className="text-xl font-bold text-slate-200 mb-6 border-b border-slate-700 pb-2 flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-400">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="16" x2="12" y2="12"></line>
          <line x1="12" y1="8" x2="12.01" y2="8"></line>
        </svg>
        Related Perspectives
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {recommendations.slice(0, 3).map((article) => ( // Show top 3 optimally
          <ArchiveCard 
            key={article._id} 
            article={article} 
            onClick={onSelectArticle} 
          />
        ))}
      </div>
    </div>
  );
}
