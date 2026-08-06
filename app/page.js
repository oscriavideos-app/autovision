'use client';

import { useState, useRef } from 'react';
import { Mic, MicOff, Send, X, Share2, RotateCcw, Video, Gauge } from 'lucide-react';

export default function Home() {
  const [status, setStatus] = useState('idle'); 
  const [transcript, setTranscript] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [videoStatusTexto, setVideoStatusTexto] = useState('');
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      mediaRecorderRef.current.ondataavailable = (e) => audioChunksRef.current.push(e.data);
      mediaRecorderRef.current.onstop = processAudio;
      mediaRecorderRef.current.start();
      setStatus('recording');
    } catch (e) {
      alert("Permissão de microfone negada ou indisponível.");
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
    setStatus('transcribing');
  }

  async function processAudio() {
    const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
    const fd = new FormData();
    fd.append('audio', blob, 'recording.webm');
    
    try {
      const res = await fetch('/api/transcribe', { method: 'POST', body: fd });
      const data = await res.json();
      setTranscript(data.text || "Erro ao capturar o texto. Tente novamente.");
      setStatus('review');
    } catch (e) {
      alert("Erro na transcrição.");
      setStatus('idle');
    }
  }

  async function sendModification() {
    setStatus('generating');
    
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: transcript }),
      });
      
      const data = await res.json();
      
      if (data.images && data.images[0]) {
        setImageUrl(data.images[0]);
        setStatus('done');
      } else {
        throw new Error("Nenhuma imagem retornada");
      }
    } catch (e) {
      alert("Falha ao gerar a foto.");
      setStatus('idle');
    }
  }

  async function aguardarVideo(requestId, tentativas = 0) {
    if (tentativas > 20) {
      throw new Error("Tempo limite excedido.");
    }
    const res = await fetch(`/api/checar-status?requestId=${requestId}`);
    const data = await res.json();

    if (data.status === 'COMPLETED' && data.videoUrl) return data.videoUrl;
    if (data.status === 'FAILED' || data.status === 'ERROR') throw new Error('Falha no processamento do vídeo.');

    await new Promise((r) => setTimeout(r, 5000)); 
    return aguardarVideo(requestId, tentativas + 1);
  }

  async function iniciarGeracaoVideo() {
    try {
      setVideoStatusTexto("Renderizando vídeo 90 graus...");

      const response = await fetch('/api/gerar-carro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: transcript,
          imageUrl: imageUrl,
          tipo: 'externo'
        })
      }).then(res => res.json());

      if (!response.requestId) throw new Error("Falha ao iniciar geração do vídeo.");

      const url = await aguardarVideo(response.requestId);
      setVideoUrl(url);
      setVideoStatusTexto("");
      
    } catch (error) {
      console.error("Erro ao iniciar geração:", error);
      alert(error.message);
      setVideoStatusTexto("");
    }
  }

  function shareToWhatsApp() {
    const text = `Confira meu projeto no AutoVision: https://tuning-chi.vercel.app/`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  }

  function resetProject() {
    setStatus('idle'); 
    setImageUrl(''); 
    setTranscript('');
    setVideoUrl('');
    setVideoStatusTexto('');
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white font-sans p-4 md:p-8 flex flex-col">
      {/* Header AutoVision */}
      <header className="flex items-center gap-2 mb-8">
        <Gauge className="w-6 h-6 text-[#0066FF]" />
        <h1 className="text-xl font-bold tracking-wide">
          <span className="text-white">Auto</span>
          <span className="text-[#0066FF]">Vision</span>
        </h1>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center max-w-4xl mx-auto w-full">
        
        {/* Título de Instrução (aparece apenas no início) */}
        {status === 'idle' && (
          <div className="text-center mb-8">
            <p className="text-sm text-[#0066FF] mb-2 font-medium tracking-widest uppercase">Nova Simulação</p>
            <h2 className="text-3xl font-bold tracking-tight">O que vamos modificar hoje?</h2>
          </div>
        )}

        {/* Área Central (Carro Wireframe / Imagem / Vídeo) */}
        <div className="w-full aspect-video bg-black border border-[#222222] rounded-2xl flex items-center justify-center relative overflow-hidden mb-8 shadow-[0_0_50px_rgba(0,102,255,0.1)]">
          
          {/* Carro Wireframe e Scanner */}
          {status !== 'done' && (
            <div className="absolute inset-0 flex items-center justify-center">
               <img 
                 src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-hY7K5q4q3X92oP3C8v3kU2L4hQ8C8v.png" 
                 alt="Carro Wireframe" 
                 className="w-full h-full object-contain opacity-80"
               />
               <div className="absolute w-full h-px bg-[#0066FF] shadow-[0_0_20px_#0066FF] animate-[scan_3s_ease-in-out_infinite]"></div>
            </div>
          )}

          {/* Feedback de Gravação e Transcrição */}
          {status === 'recording' && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-10">
               <div className="w-20 h-20 rounded-full bg-pink-500/20 flex items-center justify-center animate-pulse mb-4 shadow-[0_0_30px_rgba(236,72,153,0.5)]">
                 <Mic className="w-10 h-10 text-pink-500" />
               </div>
               <p className="text-pink-400 font-medium">Analisando comando vocal...</p>
            </div>
          )}
          {status === 'transcribing' && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-10">
               <div className="w-10 h-10 border-4 border-[#0066FF] border-t-transparent rounded-full animate-spin mb-4"></div>
               <p className="text-[#0066FF] font-medium">Processando áudio...</p>
            </div>
          )}
           {status === 'generating' && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-10">
               <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
               <p className="text-purple-400 font-medium">Renderizando projeto visual...</p>
            </div>
          )}

          {/* Exibição do Resultado */}
          {status === 'done' && (
            <div className="w-full h-full relative">
               {!videoUrl ? (
                 <img src={imageUrl} alt="Projeto Gerado" className="w-full h-full object-cover" />
               ) : (
                 <video src={videoUrl} autoPlay loop muted playsInline className="w-full h-full object-cover" />
               )}
               
               {/* Overlay de Status do Vídeo */}
               {videoStatusTexto && (
                 <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur text-white px-4 py-2 rounded-full text-sm font-medium border border-purple-500/50 flex items-center gap-2 shadow-[0_0_15px_rgba(168,85,247,0.5)]">
                   <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
                   {videoStatusTexto}
                 </div>
               )}
            </div>
          )}
        </div>

        {/* Barra de Controles Inferior */}
        <div className="w-full max-w-2xl bg-[#0F0F0F] border border-[#222222] p-2 rounded-2xl flex flex-col items-center gap-3 shadow-2xl">
          
          {/* Caixa de Texto / Revisão */}
          <div className="w-full bg-[#161616] border border-[#2A2A2A] rounded-xl p-4 min-h-[60px] flex items-center justify-center text-center">
            {status === 'review' ? (
              <p className="text-gray-200 text-sm italic">"{transcript}"</p>
            ) : status === 'done' ? (
               <p className="text-gray-400 text-sm line-clamp-2">{transcript}</p>
            ) : (
              <p className="text-gray-500 text-sm flex items-center justify-center gap-2">
                <span className="text-[#0066FF]">✧</span> Ex: Envelopar Montana 2024 em cinza fosco
              </p>
            )}
          </div>

          {/* Botões de Ação */}
          <div className="w-full flex gap-3">
            {status === 'idle' && (
              <button onClick={startRecording} className="w-full bg-[#0066FF]/20 border border-[#0066FF] hover:bg-[#0066FF]/30 text-[#0066FF] px-6 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all animate-[pulse_2s_infinite] shadow-[0_0_20px_rgba(0,102,255,0.2)]">
                <Mic className="w-6 h-6" /> Falar Modificação
              </button>
            )}

            {status === 'recording' && (
              <button onClick={stopRecording} className="w-full bg-pink-600/20 border border-pink-500 hover:bg-pink-600/30 text-pink-500 px-6 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all animate-[pulse_1.5s_infinite] shadow-[0_0_20px_rgba(236,72,153,0.3)]">
                <MicOff className="w-6 h-6" /> Parar
              </button>
            )}

            {status === 'review' && (
              <>
                <button onClick={() => setStatus('idle')} className="flex-1 bg-red-600/20 border border-red-500 hover:bg-red-600/30 text-red-500 px-4 py-4 rounded-xl font-bold flex items-center justify-center transition-all animate-[pulse_2s_infinite]">
                  <X className="w-6 h-6" /> Cancelar
                </button>
                <button onClick={sendModification} className="flex-[2] bg-green-600/20 border border-green-500 hover:bg-green-600/30 text-green-500 px-6 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all animate-[pulse_2s_infinite]">
                  Enviar <Send className="w-5 h-5" />
                </button>
              </>
            )}

            {status === 'done' && (
              <>
                 {!videoUrl && !videoStatusTexto && (
                   <button onClick={iniciarGeracaoVideo} className="flex-[2] bg-purple-600/20 border border-purple-500 hover:bg-purple-600/30 text-purple-400 px-4 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all animate-[pulse_2s_infinite] shadow-[0_0_15px_rgba(168,85,247,0.2)]">
                     <Video className="w-5 h-5" /> Gerar Vídeo 90º
                   </button>
                 )}
                 <button onClick={shareToWhatsApp} className="flex-1 bg-[#25D366]/20 border border-[#25D366] hover:bg-[#25D366]/30 text-[#25D366] px-4 py-4 rounded-xl font-bold flex items-center justify-center transition-all">
                   <Share2 className="w-5 h-5" />
                 </button>
                 <button onClick={resetProject} className="flex-1 bg-[#222222] hover:bg-[#333333] border border-[#444] text-gray-300 px-4 py-4 rounded-xl font-bold flex items-center justify-center transition-all">
                   <RotateCcw className="w-5 h-5" />
                 </button>
              </>
            )}
          </div>
        </div>

      </main>

      <style jsx global>{`
        @keyframes scan { 
          0% { top: 0%; opacity: 0; } 
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; } 
        }
      `}</style>
    </div>
  );
        }
                
