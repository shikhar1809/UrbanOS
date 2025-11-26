'use client';

export default function ParallaxBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Blue OS background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a1929] via-[#0d47a1] to-[#01579b]" />

      {/* Abstract geometric shapes - OS style */}
      <div className="absolute top-[-10%] right-[-5%] w-[800px] h-[800px] rounded-full bg-gradient-to-br from-cyan-400/20 to-blue-600/20 blur-3xl" />
      <div className="absolute bottom-[-15%] left-[-10%] w-[900px] h-[900px] rounded-full bg-gradient-to-tr from-blue-500/15 to-indigo-600/15 blur-3xl" />
      <div className="absolute top-[30%] left-[20%] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-sky-400/10 to-blue-700/10 blur-3xl" />

      {/* Subtle grid pattern */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(0deg, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
          backgroundSize: '100px 100px'
        }}
      />

      {/* Floating glass-morphic cards */}
      <div className="absolute top-[15%] right-[10%] w-64 h-40 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl transform rotate-6" />
      <div className="absolute top-[45%] left-[8%] w-72 h-48 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl transform -rotate-3" />
      <div className="absolute bottom-[20%] right-[15%] w-56 h-36 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl transform rotate-12" />
      <div className="absolute top-[60%] right-[30%] w-60 h-44 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl transform -rotate-6" />

      {/* Accent lines - geometric pattern */}
      <div className="absolute top-[20%] left-[15%] w-96 h-1 bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />
      <div className="absolute top-[60%] right-[10%] w-80 h-1 bg-gradient-to-r from-transparent via-blue-400/40 to-transparent transform rotate-45" />
      <div className="absolute bottom-[30%] left-[25%] w-72 h-1 bg-gradient-to-r from-transparent via-indigo-400/40 to-transparent transform -rotate-12" />

      {/* Subtle dots pattern */}
      <div className="absolute inset-0" style={{
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)',
        backgroundSize: '50px 50px'
      }} />

      {/* Light rays from top - subtle */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full opacity-20">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-full bg-gradient-to-b from-white/20 via-transparent to-transparent transform -rotate-12" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-full bg-gradient-to-b from-white/15 via-transparent to-transparent" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-full bg-gradient-to-b from-white/20 via-transparent to-transparent transform rotate-12" />
      </div>

      {/* Corner accent glow */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-radial from-cyan-400/10 to-transparent rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-radial from-blue-500/10 to-transparent rounded-full blur-3xl" />
    </div>
  );
}
