import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { X, Copy, Check, ExternalLink, Smartphone, Share2, Sparkles, QrCode } from 'lucide-react';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  roomName: string;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({
  isOpen,
  onClose,
  roomId,
  roomName,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('room', roomId);
      setShareUrl(url.toString());
    }
  }, [roomId]);

  useEffect(() => {
    if (isOpen && canvasRef.current && shareUrl) {
      QRCode.toCanvas(
        canvasRef.current,
        shareUrl,
        {
          width: 230,
          margin: 1.5,
          color: {
            dark: '#0f172a',
            light: '#ffffff',
          },
        },
        (error) => {
          if (error) console.error('Failed to generate QR code:', error);
        }
      );
    }
  }, [isOpen, shareUrl]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn('Clipboard copy failed:', err);
    }
  };

  const handleOpenSimulatedTab = () => {
    window.open(shareUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white text-base">
                Real-Time Device Sync
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pair mobile, tablet or another browser tab
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col items-center text-center">
          {/* QR Code Canvas container */}
          <div className="p-3 bg-white rounded-2xl shadow-md border border-slate-200 dark:border-slate-700 mb-4 inline-block">
            <canvas ref={canvasRef} className="rounded-xl block" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 text-xs font-medium mb-3">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Active List: <span className="font-semibold text-slate-800 dark:text-slate-200">{roomName}</span>
          </div>

          <p className="text-sm text-slate-600 dark:text-slate-300 mb-5 max-w-xs leading-relaxed">
            Scan with your phone's camera to instantly view and edit this list. All changes update simultaneously on both screens.
          </p>

          {/* Share Link Box */}
          <div className="w-full mb-4">
            <label className="block text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Sync URL / Share Link
            </label>
            <div className="flex items-center gap-2 p-1.5 pl-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 bg-transparent text-xs text-slate-700 dark:text-slate-300 font-mono outline-hidden truncate select-all"
              />
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium shadow-xs transition-colors shrink-0"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-white" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Action Row */}
          <div className="w-full grid grid-cols-2 gap-2.5">
            <button
              onClick={handleOpenSimulatedTab}
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-200 text-xs font-medium transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
              <span>Open in New Tab</span>
            </button>
            <button
              onClick={handleCopy}
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-indigo-600 dark:hover:bg-indigo-500 text-xs font-medium transition-colors shadow-xs"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share Link</span>
            </button>
          </div>
        </div>

        {/* Footer tip */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
          <span>Tip: Check off an item on one screen, and see it check off in real-time on all other devices!</span>
        </div>
      </div>
    </div>
  );
};
