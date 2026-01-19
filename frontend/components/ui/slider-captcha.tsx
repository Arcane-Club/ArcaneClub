'use client';

import { useState, useEffect, useRef } from 'react';
import api from '@/lib/axios';
import { toast } from 'sonner';
import { ArrowRight, Check, RotateCcw } from 'lucide-react';

interface SliderCaptchaProps {
  onSuccess: (token: string) => void;
}

export function SliderCaptcha({ onSuccess }: SliderCaptchaProps) {
  const [captchaData, setCaptchaData] = useState<{ id: string; background: string; slider: string; y: number } | null>(null);
  const [sliderPosition, setSliderPosition] = useState(0);
  const sliderPositionRef = useRef(0);
  const [isDragging, setIsDragging] = useState(false);
  const [verified, setVerified] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);

  const fetchCaptcha = async () => {
    try {
      setVerified(false);
      setSliderPosition(0);
      sliderPositionRef.current = 0;
      const res = await api.get('/auth/captcha/slider');
      if (res.data.success) {
        setCaptchaData(res.data.data);
      }
    } catch (error) {
      console.error('Failed to load captcha', error);
      toast.error('验证码加载失败');
    }
  };

  useEffect(() => {
    fetchCaptcha();
  }, []);

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (verified || !captchaData) return;
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    startXRef.current = clientX - sliderPositionRef.current;
  };

  const handleMouseMove = (e: MouseEvent | TouchEvent) => {
    if (!isDragging || !containerRef.current) return;
    
    // Prevent default scrolling on touch devices
    if ('touches' in e) {
      // e.preventDefault(); // Can't prevent default in passive listener easily in React 18+ unless attached via ref
    }

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const containerWidth = containerRef.current.offsetWidth;
    const pieceWidth = containerWidth * (45 / 320);
    const maxSlide = containerWidth - pieceWidth;
    let newPos = clientX - startXRef.current;
    
    if (newPos < 0) newPos = 0;
    if (newPos > maxSlide) newPos = maxSlide;
    
    setSliderPosition(newPos);
    sliderPositionRef.current = newPos;
  };

  const handleMouseUp = async () => {
    if (!isDragging || !captchaData || !containerRef.current) return;
    setIsDragging(false);

    const containerWidth = containerRef.current.offsetWidth;
    if (containerWidth === 0) return; // Should not happen if visible

    const scale = 320 / containerWidth;
    const actualX = sliderPositionRef.current * scale;

    try {
      const res = await api.post('/auth/captcha/slider/verify', {
        id: captchaData.id,
        x: actualX
      });

      if (res.data.success) {
        setVerified(true);
        onSuccess(res.data.token);
        // toast.success('验证通过');
      } else {
        toast.error(res.data.message || '验证失败');
        setTimeout(fetchCaptcha, 500);
      }
    } catch (error: any) {
      // In case of network error or 500
      const msg = error.response?.data?.message || '验证失败';
      toast.error(msg);
      setTimeout(fetchCaptcha, 500);
    }
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleMouseMove);
      window.addEventListener('touchend', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleMouseMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, captchaData]);

  if (!captchaData) return <div className="text-center text-sm text-gray-500 py-4">加载验证码...</div>;

  return (
    <div className="w-full max-w-[320px] mx-auto select-none" ref={containerRef}>
      <div className="relative w-full h-[160px] bg-gray-100 rounded-md overflow-hidden border border-gray-200">
        <img 
          src={captchaData.background} 
          alt="Captcha Background" 
          className="w-full h-full object-fill pointer-events-none block" 
        />
        <img 
          src={captchaData.slider} 
          alt="Puzzle Piece" 
          className="absolute left-0 pointer-events-none shadow-[0_0_10px_rgba(0,0,0,0.5)] z-10 block"
          style={{ 
            top: `${(captchaData.y / 160) * 100}%`, 
            width: `${(45 / 320) * 100}%`,
            transform: `translateX(${sliderPosition}px)` 
          }} 
        />
        <button 
            type="button"
            onClick={fetchCaptcha}
            className="absolute top-2 right-2 p-1 bg-white/80 rounded hover:bg-white text-gray-600 z-20"
            title="刷新验证码"
        >
            <RotateCcw className="w-4 h-4" />
        </button>
      </div>
      <div className="relative mt-3 h-10 bg-gray-100 rounded-full border border-gray-200 flex items-center px-1 shadow-inner">
        <div className="absolute w-full text-center text-xs text-gray-400 pointer-events-none font-medium">
          {verified ? '验证通过' : '向右滑动完成拼图'}
        </div>
        <div 
          className={`h-8 w-8 rounded-full shadow-sm flex items-center justify-center cursor-pointer transition-colors z-10 border ${
            verified 
                ? 'bg-green-500 border-green-600 text-white' 
                : isDragging 
                    ? 'bg-blue-600 border-blue-700 text-white' 
                    : 'bg-white border-gray-300 hover:bg-gray-50 text-gray-600'
          }`}
          style={{ transform: `translateX(${sliderPosition}px)` }}
          onMouseDown={handleMouseDown}
          onTouchStart={handleMouseDown}
        >
           {verified ? <Check className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
        </div>
      </div>
    </div>
  );
}
