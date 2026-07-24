export default function LamborghiniWireframe({ active }) {
  if (!active) return null;

  return (
    <div className="relative w-full max-w-2xl mx-auto flex justify-center items-center py-10">
      <div className="relative w-full h-auto overflow-hidden">
        
        {/* SVG Simulando as linhas da Lamborghini Temerario */}
        <svg 
          viewBox="0 0 800 250" 
          className="w-full h-full drop-shadow-[0_0_15px_rgba(6,182,212,0.9)]"
        >
          {/* Silhueta Base */}
          <path 
            d="M 100 200 L 120 130 L 250 100 L 400 85 L 550 95 L 680 120 L 720 180 Z" 
            fill="none" 
            stroke="#06b6d4" 
            strokeWidth="3" 
            className="animate-pulse"
          />
          {/* Detalhes de design agressivo (Faróis, Portas, Entradas de ar) */}
          <path d="M 680 120 L 650 140 L 700 150" fill="none" stroke="#06b6d4" strokeWidth="2" />
          <path d="M 120 130 L 150 145 L 110 160" fill="none" stroke="#06b6d4" strokeWidth="2" />
          <path d="M 250 100 L 300 180" fill="none" stroke="#06b6d4" strokeWidth="1.5" strokeDasharray="5,5" />
          <path d="M 550 95 L 500 180" fill="none" stroke="#06b6d4" strokeWidth="1.5" strokeDasharray="5,5" />
          
          {/* Rodas */}
          <circle cx="200" cy="180" r="35" fill="none" stroke="#06b6d4" strokeWidth="3" />
          <circle cx="200" cy="180" r="20" fill="none" stroke="#06b6d4" strokeWidth="1.5" strokeDasharray="4,4" />
          
          <circle cx="600" cy="180" r="35" fill="none" stroke="#06b6d4" strokeWidth="3" />
          <circle cx="600" cy="180" r="20" fill="none" stroke="#06b6d4" strokeWidth="1.5" strokeDasharray="4,4" />
          
          {/* Base/Chão */}
          <line x1="50" y1="215" x2="750" y2="215" stroke="#06b6d4" strokeWidth="1" strokeDasharray="10,10" opacity="0.5" />
        </svg>

        {/* Linha de Scanner Animada (De cima para baixo) */}
        <div className="absolute left-0 w-full h-[2px] bg-cyan-300 shadow-[0_0_20px_4px_#06b6d4] animate-scan z-10 opacity-90"></div>
      </div>

      <style jsx>{`
        @keyframes scan {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        .animate-scan {
          animation: scan 2.5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
      `}</style>
    </div>
  );
}