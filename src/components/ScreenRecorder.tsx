import React, { useState, useRef, useEffect } from 'react';
import { Video, VideoOff, Download, Circle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function ScreenRecorder({ isDarkMode }: { isDarkMode: boolean }) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [error, setError] = useState<string | null>(null);

  const startRecording = async () => {
    setError(null);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
      setError("Screen recording is not supported in this context. Try opening in a new tab.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: { ideal: 30 } },
        audio: true
      });

      streamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9,opus'
      });

      mediaRecorderRef.current = mediaRecorder;
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        setVideoUrl(url);
        setRecordedChunks(chunks);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setVideoUrl(null);
      setRecordedChunks([]);

      // Handle user stopping via browser UI
      stream.getVideoTracks()[0].onended = () => {
        stopRecording();
      };

    } catch (err) {
      console.error("Error starting screen capture:", err);
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          setError("Permission denied. Please allow screen capture in your browser.");
        } else if (err.message.includes('permissions policy')) {
          setError("Screen capture is blocked by security policy. Try opening the app in a new tab.");
        } else {
          setError(`Error: ${err.message}`);
        }
      } else {
        setError("An unknown error occurred while starting screen capture.");
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const downloadVideo = () => {
    if (videoUrl) {
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = videoUrl;
      a.download = `WIP-gameplay-${new Date().getTime()}.webm`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(videoUrl);
      setVideoUrl(null);
    }
  };

  return (
    <div className="flex items-center space-x-2 relative">
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute top-full mt-2 right-0 w-48 p-2 rounded-lg bg-rose-500 text-white text-[10px] font-bold z-50 shadow-xl"
          >
            {error}
            <button onClick={() => setError(null)} className="ml-2 underline">Dismiss</button>
          </motion.div>
        )}
        {videoUrl && !isRecording && (
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            onClick={downloadVideo}
            className={`p-2 rounded-full transition-colors flex items-center space-x-2 px-3 ${
              isDarkMode 
                ? 'bg-green-900/30 text-green-400 hover:bg-green-900/50 border border-green-500/20' 
                : 'bg-green-50 text-green-600 hover:bg-green-100 border border-green-200'
            }`}
            title="Download Recording"
          >
            <Download size={18} />
            <span className="text-xs font-bold">Save</span>
          </motion.button>
        )}
      </AnimatePresence>

      <button
        onClick={isRecording ? stopRecording : startRecording}
        className={`p-2 rounded-full transition-all flex items-center space-x-2 px-3 ${
          isRecording 
            ? 'bg-rose-500 text-white animate-pulse' 
            : isDarkMode 
              ? 'text-slate-400 hover:text-indigo-400 hover:bg-slate-800' 
              : 'text-slate-500 hover:text-indigo-600 hover:bg-slate-100'
        }`}
        title={isRecording ? "Stop Recording" : "Record Gameplay"}
      >
        {isRecording ? (
          <>
            <Circle size={18} fill="currentColor" className="text-white" />
            <span className="text-xs font-bold">REC</span>
          </>
        ) : (
          <>
            <Video size={18} />
            <span className="text-xs font-bold">Record</span>
          </>
        )}
      </button>
    </div>
  );
}
