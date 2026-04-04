import { useState, useEffect, Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { Environment, Float } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import DataSphere from './components/3d/DataSphere'
import BiasSpectrum from './components/BiasSpectrum'
import Archive from './components/Archive'
import AnalyticsDashboard from './components/AnalyticsDashboard'
import RecommendationList from './components/RecommendationList'

function App() {
  const [currentView, setCurrentView] = useState('scan') // 'scan' | 'archive' | 'analytics'
  const [url, setUrl] = useState('')
  const [isScanning, setIsScanning] = useState(false)

  const [scanResult, setScanResult] = useState(null)
  const [error, setError] = useState('')
  
  const [archivedArticles, setArchivedArticles] = useState([])

  // Fetch archive data when switching to archive view
  useEffect(() => {
    if (currentView === 'archive') {
      fetch('http://localhost:5000/api/archive')
        .then(res => res.json())
        .then(data => {
          if (data && data.data) {
            setArchivedArticles(data.data);
          }
        })
        .catch(err => console.error("Error fetching archive:", err))
    }
  }, [currentView])

  const handleScan = async (e) => {
    e.preventDefault()
    setIsScanning(true)
    setError('')
    try {
      const response = await fetch('http://localhost:5000/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to scan article');
      setScanResult(data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsScanning(false)
    }
  }

  const handleSelectArchivedArticle = (article) => {
    // Treat an offline selected article like a scan result but don't re-fetch
    setScanResult(article);
    setCurrentView('scan');
  }

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center pt-20 pb-10 px-4">
      
      {/* 3D Background / Hero Visual */}
      <div className="absolute inset-0 z-0 pointer-events-none fixed">
        <Canvas camera={{ position: [0, 0, 8], fov: 45 }}>
          <color attach="background" args={['#020617']} />
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          <Environment preset="night" />
          
          <Suspense fallback={null}>
            <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
              <DataSphere />
            </Float>
            
            <EffectComposer>
              <Bloom luminanceThreshold={0.5} luminanceSmoothing={0.9} height={300} />
            </EffectComposer>
          </Suspense>
        </Canvas>
      </div>

      {/* Navigation Header */}
      <div className="fixed top-0 left-0 w-full z-50 glass-panel !rounded-none !border-x-0 !border-t-0 p-4 flex justify-between items-center px-8">
        <div className="font-bold text-xl text-white tracking-widest uppercase">
          News<span className="text-purple-400">Lens</span>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => setCurrentView('scan')}
            className={`font-semibold transition-colors ${currentView === 'scan' ? 'text-white' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Scanner
          </button>
          <button 
            onClick={() => setCurrentView('archive')}
            className={`font-semibold transition-colors ${currentView === 'archive' ? 'text-white' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Archive
          </button>
          <button 
            onClick={() => setCurrentView('analytics')}
            className={`font-semibold transition-colors ${currentView === 'analytics' ? 'text-white' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Analytics
          </button>
        </div>
      </div>

      {/* Foreground UI Components */}
      {currentView === 'scan' ? (
        <div className="z-10 w-full max-w-4xl flex flex-col items-center pointer-events-auto mt-12 animate-in fade-in zoom-in duration-500">
          <h1 className="text-5xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-red-400 mb-6 text-center dropshadow-xl">
            Truth in the Noise
          </h1>
          <p className="text-xl text-slate-300 mb-12 text-center max-w-2xl text-shadow-sm">
            Advanced AI-driven news summarization and bias detection. Scan any article to reveal the underlying perspective.
          </p>

          {/* Glassmorphic Input Card */}
          <div className="glass-panel p-8 w-full max-w-2xl mb-12">
            <form onSubmit={handleScan} className="flex flex-col md:flex-row gap-4">
              <input 
                type="url" 
                placeholder="Paste article URL here..." 
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="flex-1 bg-slate-900/50 border border-slate-700 rounded-xl px-6 py-4 text-slate-200 outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all placeholder:text-slate-500"
              />
              <button 
                type="submit"
                disabled={isScanning}
                className="bg-gradient-to-r relative overflow-hidden from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-semibold py-4 px-8 rounded-xl shadow-lg shadow-purple-500/25 transition-all outline-none focus:ring-2 focus:ring-purple-400 disabled:opacity-70 flex items-center justify-center min-w-[160px] cursor-pointer group"
              >
                {isScanning ? (
                  <div className="flex gap-2 items-center">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Analyzing...</span>
                  </div>
                ) : (
                  'Scan Source'
                )}
                {/* Subtle pulse loading effect via CSS */}
                {isScanning && (
                  <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                )}
              </button>
            </form>
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-6 py-4 rounded-xl mb-8 w-full max-w-2xl text-center">
              {error}
            </div>
          )}

          {scanResult ? (
            <div className="glass-panel p-8 w-full max-w-2xl animate-in slide-in-from-bottom-8 duration-700">
              <h2 className="text-2xl font-semibold text-slate-100 mb-2 text-center">{scanResult.title}</h2>
              <div className="flex flex-col gap-6 mt-6 text-left text-slate-300">
                <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-700">
                  <h3 className="font-bold text-white mb-4">AI Summary</h3>
                  <ul className="list-disc pl-5 space-y-2">
                    {scanResult.summary.map((point, i) => (
                      <li key={i}>{point}</li>
                    ))}
                  </ul>
                </div>
                <div className="mt-4">
                  <h3 className="font-bold text-white mb-4 text-center">Bias Analysis</h3>
                  <BiasSpectrum score={scanResult.biasScore} />
                </div>
              </div>
              <RecommendationList currentArticleId={scanResult._id} onSelectArticle={handleSelectArchivedArticle} />
            </div>
          ) : (
            <div className="glass-panel p-8 w-full max-w-2xl opacity-50">
              <h2 className="text-2xl font-semibold text-slate-100 mb-6 text-center">Bias Analysis Preview</h2>
              <BiasSpectrum score={75} />
            </div>
          )}
        </div>
      ) : currentView === 'archive' ? (
        <Archive articles={archivedArticles} onSelectArticle={handleSelectArchivedArticle} />
      ) : (
        <AnalyticsDashboard />
      )}
    </div>
  )
}

export default App
