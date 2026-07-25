'use client';

import { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, ArrowUp, X, Share2, RotateCcw, Video, Download } from 'lucide-react';

export default function Home() {
  const [status, setStatus] = useState('idle'); 
  const [transcript, setTranscript] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  
  const [videoUrl, setVideoUrl] = useState('');
  const [videoStatusTexto, setVideoStatusTexto] = useState('');
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Recarrega o pedido salvo do localStorage se o usuário fechou a página durante a renderização
  useEffect(() => {
    const pedidoSalvo = localStorage.getItem('lumaRequestId');
    const imagemSalva = localStorage.getItem('lumaImageUrl');
    
    if (pedidoSalvo && imagemSalva) {
      setImageUrl(imagemSalva);
      setStatus('done');
      monitorarVideoNaNuvem(pedidoSalvo);
    }
  }, []);

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
      const res = await fetch('/api/transcribe', { method: 'POST', body: fd, cache: 'no-store' });
      const data = await res.json();
      setTranscript(data.text || "Erro ao limpar o texto. Tente novamente.");
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
        cache: 'no-store'
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

  // --- GERAÇÃO E MONITORAMENTO DO VÍDEO 360 ---
  async function iniciarGeracaoVideo360() {
    setVideoStatusTexto("Iniciando motor 3D...");
    
    try {
      const resposta = await fetch('/api/gerar-carro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: "Smooth 360-degree camera orbit pan around the car, photorealistic, keep details exactly as the image",
          imageUrl: imageUrl 
        }),
        cache: 'no-store'
      });
      
      const dados = await resposta.json();
      const requestId = dados.requestId;

      localStorage.setItem('lumaRequestId', requestId);
      localStorage.setItem('lumaImageUrl', imageUrl);

      monitorarVideoNaNuvem(requestId);
      
    } catch (error) {
      setVideoStatusTexto("Erro de conexão com o estúdio 3D.");
    }
  }

  function monitorarVideoNaNuvem(requestId) {
    setVideoStatusTexto("Renderizando vídeo 360º. Você pode fechar a aba se desejar.");

    const intervalo = setInterval(async () => {
      try {
        const checagem = await fetch(`/api/checar-status?requestId=${requestId}`, { cache: 'no-store' });
        const resultadoStatus = await checagem.json();

        if (resultadoStatus.status === "COMPLETED") {
          clearInterval(intervalo);
          setVideoStatusTexto(""); 
          setVideoUrl(resultadoStatus.videoUrl); 
          localStorage.removeItem('lumaRequestId');
          localStorage.removeItem('lumaImageUrl');
        } else if (resultadoStatus.status === "FAILED") {
          clearInterval(intervalo);
          setVideoStatusTexto("Erro no servidor ao gerar o vídeo.");
          localStorage.removeItem('lumaRequestId');
        }
      } catch (err) {
        console.error("Aguardando reconexão...", err);
      }
    }, 5000);
  }

  // --- FUNÇÃO DE DOWNLOAD DIRETO PARA O CELULAR ---
  async function baixarMidia(url, nomeArquivo) {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = nomeArquivo;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (e) {
      window.open(url, '_blank');
    }
  }

  // --- FUNÇÃO PARA COMPARTILHAR O VÍDEO / FOTO NO WHATSAPP ---
  function compartilharWhatsApp() {
    const midiaParaEnviar = videoUrl || imageUrl;
    const tipo = videoUrl ? 'vídeo 360º' : 'projeto 3D';
    const mensagem = `Confira meu ${tipo} do Celta customizado no Auto Vision:\n${midiaParaEnviar}`;
    
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(mensagem)}`, '_blank');
  }

  function resetProject() {
    setStatus('idle'); 
    setImageUrl(''); 
    setTranscript('');
    setVideoUrl('');
    setVideoStatusTexto('');
    localStorage.removeItem('lumaRequestId');
    localStorage.removeItem('lumaImageUrl');
  }

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 font-sans overflow-hidden select-none">
      
      {status !== 'done' && (
        <div className="mb-10 w-full max-w-sm h-40 border border-cyan-500/30 rounded-2xl flex items-center justify-center relative overflow-hidden bg-cyan-950/10">
          <div className="absolute w-full h-px bg-cyan-500/50 animate-[scan_2s_linear_infinite]"></div>
          <span className="text-cyan-500 font-bold tracking-widest uppercase text-xl">Auto Vision</span>
        </div>
      )}

      {status === 'idle' && (
        <button onClick={startRecording} className="w-full max-w-sm h-24 rounded-3xl bg-black border-2 border-cyan-500 text-cyan-400 font-bold text-2xl flex items-center justify-center gap-4 animate-neon-pulse shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:bg-cyan-950/30">
          <Mic className="w-8 h-8" /> Falar Modificação
        </button>
      )}

      {status === 'recording' && (
        <button onClick={stopRecording} className="w-full max-w-sm h-24 rounded-3xl bg-red-900/20 border-2 border-red-500 text-red-400 font-bold text-2xl flex items-center justify-center gap-4 animate-pulse shadow-[0_0_30px_rgba(239,68,68,0.5)]">
          <MicOff className="w-8 h-8" /> Parar Gravação
        </button>
      )}

      {status === 'transcribing' && (
        <div className="text-cyan-400 text-xl font-bold animate-pulse text-center">Limpando áudio...</div>
      )}

      {status === 'review' && (
        <div className="w-full max-w-sm flex flex-col gap-4">
          <p className="text-lg text-center text-zinc-100 font-medium p-6 bg-zinc-900 rounded-2xl border border-white/5">
            "{transcript}"
          </p>
          <div className="flex gap-4">
            <button onClick={sendModification} className="flex-1 h-20 rounded-3xl bg-pink-600/20 border border-pink-500 text-pink-400 font-bold text-lg flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(236,72,153,0.5)] animate-pulse">
              <ArrowUp className="w-6 h-6"/> Enviar
            </button>
            <button onClick={() => setStatus('idle')} className="flex-1 h-20 rounded-3xl bg-orange-600/20 border border-orange-500 text-orange-400 font-bold text-lg flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(249,115,22,0.3)]">
              <X className="w-6 h-6"/> Cancelar
            </button>
          </div>
        </div>
      )}

      {status === 'generating' && (
        <div className="text-cyan-400 text-xl font-bold animate-pulse text-center">Processando Estúdio...</div>
      )}

      {status === 'done' && imageUrl && (
        <div className="w-full flex flex-col items-center gap-6">
          
          {/* Exibição da Imagem (se não houver vídeo) */}
          {!videoUrl && (
            <div className="w-full max-w-2xl relative bg-white rounded-xl shadow-[0_0_30px_rgba(0,255,255,0.15)] p-2">
              <img 
                src={imageUrl} 
                className="w-full h-auto object-cover rounded-lg animate-fade-in" 
                alt="Projeto Finalizado" 
              />
            </div>
          )}

          {/* Exibição do Vídeo 360 */}
          {videoUrl && (
             <div className="w-full max-w-2xl relative bg-white rounded-xl shadow-[0_0_40px_rgba(168,85,247,0.3)] p-2">
                <video 
                  src={videoUrl} 
                  autoPlay 
                  loop 
                  controls 
                  className="w-full h-auto rounded-lg animate-fade-in"
                />
             </div>
          )}

          {videoStatusTexto && (
             <div className="text-purple-400 text-sm font-bold animate-pulse text-center px-4">
               {videoStatusTexto}
             </div>
          )}

          {!videoUrl && !videoStatusTexto && (
             <button onClick={iniciarGeracaoVideo360} className="w-full max-w-sm h-16 rounded-2xl bg-purple-600/20 border border-purple-500 text-purple-400 font-bold text-lg flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:bg-purple-600/30">
               <Video className="w-6 h-6"/> Gerar Visão 360º (Efeito Uau)
             </button>
          )}

          {/* Botão de Download do Vídeo ou da Imagem */}
          <button 
            onClick={() => baixarMidia(videoUrl || imageUrl, videoUrl ? 'celta-360.mp4' : 'celta-customizado.png')} 
            className="w-full max-w-sm h-16 rounded-2xl bg-blue-600/20 border border-blue-500 text-blue-400 font-bold text-lg flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:bg-blue-600/30"
          >
            <Download className="w-5 h-5"/> Baixar {videoUrl ? 'Vídeo 360º' : 'Foto'}
          </button>

          {/* Botão WhatsApp */}
          <button onClick={compartilharWhatsApp} className="w-full max-w-sm h-16 rounded-2xl bg-[#25D366]/20 border border-[#25D366] text-[#25D366] font-bold text-lg flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(37,211,102,0.4)] hover:bg-[#25D366]/30">
            <Share2 className="w-5 h-5"/> Compartilhar no WhatsApp
          </button>
          
          <button onClick={resetProject} className="flex items-center gap-2 text-gray-400 hover:text-white underline mt-2">
            <RotateCcw className="w-4 h-4"/> Criar outro projeto
          </button>
        </div>
      )}

      <style jsx global>{`
        @keyframes neon-pulse { 0%, 100% { box-shadow: 0 0 20px rgba(6,182,212,0.5); } 50% { box-shadow: 0 0 40px rgba(6,182,212,0.8); } }
        .animate-neon-pulse { animation: neon-pulse 1.5s infinite; }
        @keyframes scan { 0% { top: -10%; } 100% { top: 110%; } }
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }
        .animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
      `}</style>
    </main>
  );
}
