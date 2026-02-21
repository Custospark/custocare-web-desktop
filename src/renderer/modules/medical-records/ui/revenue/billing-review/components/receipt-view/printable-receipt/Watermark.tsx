// Watermark.tsx
import React from 'react';
import { cx, getWatermarkFontSize, Z_INDEX, WATERMARK_OPACITY } from './ReceiptTypes';
import type { WatermarkConfig } from './ReceiptTypes';

interface WatermarkProps {
  config: WatermarkConfig;
}

export const Watermark: React.FC<WatermarkProps> = ({ config }) => {
  const words = config.text.split(' ');
  const isMultiWord = words.length > 1;
  
  const getWordFontSize = (index: number): string => {
    if (!isMultiWord) return getWatermarkFontSize(config.text);
    if (index === 0) return 'clamp(1.5rem, 14cqw, 4rem)';
    return 'clamp(1.2rem, 12cqw, 3.5rem)';
  };
  
  return (
    <div
      aria-hidden="true"
      className={cx(
        'pointer-events-none select-none',
        'absolute inset-0',
        'print:block'
      )}
      style={{
        zIndex: Z_INDEX.WATERMARK,
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%) rotate(-35deg)',
          width: '200%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          className={cx(
            'font-black text-center',
            config.colorClass,
            'print:opacity-30'
          )}
          style={{
            letterSpacing: '0.15em',
            opacity: WATERMARK_OPACITY,
            marginInline: 'clamp(1rem, 8cqw, 4rem)',
            textShadow: '0 2px 4px rgba(0,0,0,0.1)',
            textAlign: 'center',
            lineHeight: 1.3,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: isMultiWord ? '0.15em' : 0,
          }}
        >
          {words.map((word, index) => (
            <span 
              key={index} 
              style={{
                whiteSpace: 'nowrap',
                fontSize: getWordFontSize(index),
              }}
            >
              {word}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};