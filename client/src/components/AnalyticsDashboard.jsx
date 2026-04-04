import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  PieChart, Pie, Cell, Tooltip as PieTooltip, Legend, 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as AreaTooltip, ResponsiveContainer 
} from 'recharts';

export default function AnalyticsDashboard() {
  const [data, setData] = useState({ biasData: [], sentimentData: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    fetch('http://localhost:5000/api/analytics')
      .then(res => res.json())
      .then(result => {
        if (result.data) {
          setData({
            biasData: result.data.biasData || [],
            sentimentData: result.data.sentimentData || []
          });
        }
      })
      .catch(err => {
        console.error('Failed to load analytics:', err);
        setError('Could not load analytics. Make sure the backend is running.');
      })
      .finally(() => setLoading(false));
  }, []);

  // Framer Motion Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  if (loading) {
    return (
      <div className="z-10 w-full max-w-5xl mt-12 flex flex-col items-center pointer-events-auto">
        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400 mb-8">
          Loading Analytics...
        </h2>
        <div className="flex gap-2 items-center">
          <div className="w-8 h-8 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="z-10 w-full max-w-5xl mt-12 flex flex-col items-center pointer-events-auto">
        <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-6 py-4 rounded-xl mb-8 w-full max-w-2xl text-center">
          {error}
        </div>
      </div>
    );
  }

  // Custom tooltips to match dark modern theme
  const CustomPieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/90 border border-slate-700 p-3 rounded-lg shadow-xl backdrop-blur-md">
          <p className="text-slate-100 font-semibold">{`${payload[0].name} Bias`}</p>
          <p className="text-slate-300 text-sm">{`${payload[0].value} Articles`}</p>
        </div>
      );
    }
    return null;
  };

  const CustomAreaTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const sentimentScore = payload[0].value;
      const title = payload[0].payload.title; // From our mapped data
      let labelText = sentimentScore > 60 ? 'Positive' : sentimentScore < 40 ? 'Negative' : 'Neutral';
      
      return (
        <div className="bg-slate-900/90 border border-slate-700 p-4 rounded-lg shadow-xl backdrop-blur-md max-w-[250px]">
          <p className="text-slate-400 text-xs mb-1">Article: {label}</p>
          <p className="text-slate-100 font-bold text-sm mb-2 truncate" title={title}>{title}</p>
          <p className="text-white font-semibold">
            Score: <span className="text-purple-400">{sentimentScore}</span> ({labelText})
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div 
      className="z-10 w-full max-w-5xl mt-12 flex flex-col items-center pointer-events-auto px-4"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <motion.h1 variants={itemVariants} className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-red-400 mb-4 text-center dropshadow-xl">
        Platform Intelligence
      </motion.h1>
      <motion.p variants={itemVariants} className="text-lg text-slate-400 mb-10 text-center max-w-2xl">
        A deep-dive visualization of global sentiment trends and bias distribution across all scanned publications.
      </motion.p>

      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        {/* Bias Distribution Chart */}
        <motion.div variants={itemVariants} className="glass-panel p-6 h-[400px] flex flex-col items-center justify-center">
          <h2 className="text-xl font-semibold text-slate-200 mb-4 tracking-wide w-full text-left border-b border-slate-700/50 pb-2">
            Bias Distribution
          </h2>
          <div className="w-full h-full flex-1 min-h-[250px]">
            {data.biasData.every(d => d.value === 0) ? (
               <div className="w-full h-full flex items-center justify-center text-slate-500">No data available</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.biasData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {data.biasData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <PieTooltip content={<CustomPieTooltip />} />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>

        {/* Sentiment Trends Area Chart */}
        <motion.div variants={itemVariants} className="glass-panel p-6 h-[400px] flex flex-col items-center justify-center">
          <h2 className="text-xl font-semibold text-slate-200 mb-4 tracking-wide w-full text-left border-b border-slate-700/50 pb-2">
            Recent Sentiment Trends
          </h2>
          <div className="w-full h-full flex-1 min-h-[250px]">
             {data.sentimentData.length === 0 ? (
               <div className="w-full h-full flex items-center justify-center text-slate-500">No data available</div>
             ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={data.sentimentData}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorSentiment" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" stroke="#64748b" tick={{ fill: '#94a3b8' }} />
                    <YAxis domain={[0, 100]} stroke="#64748b" tick={{ fill: '#94a3b8' }} />
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                    <AreaTooltip content={<CustomAreaTooltip />} />
                    <Area 
                      type="monotone" 
                      dataKey="sentiment" 
                      stroke="#8b5cf6" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorSentiment)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
             )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
