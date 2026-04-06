import React, { useState } from 'react';
import { Share2, Check } from 'lucide-react';

interface ShareButtonProps {
  title: string;
  text: string;
  url?: string;
  className?: string;
}

export default function ShareButton({ title, text, url = window.location.href, className = "" }: ShareButtonProps) {
  const [status, setStatus] = useState<'idle' | 'copied' | 'shared'>('idle');

  const handleShare = async () => {
    const shareData = {
      title,
      text,
      url,
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        setStatus('shared');
        setTimeout(() => setStatus('idle'), 2000);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          copyToClipboard();
        }
      }
    } else {
      copyToClipboard();
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(`${text}\n\nPlay here: ${url}`);
      setStatus('copied');
      setTimeout(() => setStatus('idle'), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <button
      onClick={handleShare}
      className={`flex items-center justify-center space-x-2 transition-all ${className}`}
    >
      {status === 'copied' ? (
        <>
          <Check size={18} />
          <span>Copied to Clipboard!</span>
        </>
      ) : status === 'shared' ? (
        <>
          <Check size={18} />
          <span>Shared Successfully!</span>
        </>
      ) : (
        <>
          <Share2 size={18} />
          <span>Share</span>
        </>
      )}
    </button>
  );
}
