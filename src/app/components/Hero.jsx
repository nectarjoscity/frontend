'use client';

import { memo } from 'react';

function Hero({ colors, theme, mode, setMode }) {
  return (
    <div className="relative overflow-hidden" style={{background: colors.background}}>
      <div className="absolute top-4 left-4 text-green-400 opacity-30">
        <img src="/file.svg" alt="decorative" width="24" height="24" className="text-green-400" />
      </div>
      <div className="absolute top-8 right-8 text-emerald-400 opacity-25">
        <img src="/globe.svg" alt="decorative" width="32" height="32" className="text-emerald-400" />
      </div>
      <div className="absolute bottom-4 left-8 text-green-300 opacity-20">
        <img src="/window.svg" alt="decorative" width="28" height="28" className="text-green-300" />
      </div>
      <div className="max-w-8xl mx-auto px-4 sm:px-6 text-center relative z-10 flex flex-col justify-center items-center h-viewpoint">
        <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-bold mb-4 sm:mb-6 text-center leading-tight mt-[150px]" style={{fontFamily: 'Gebuk, Arial, sans-serif', fontSize: '64px', fontWeight: '700', lineHeight: '64px', color: theme === 'light' ? colors.black : colors.text}}>
          <span className="block uppercase text-[36px] leading-[40px] sm:text-[56px] sm:leading-[60px] md:text-[72px] md:leading-[80px] lg:text-[100px] lg:leading-[100px]">Discover</span>
          <span className="block uppercase text-[36px] leading-[40px] sm:text-[56px] sm:leading-[60px] md:text-[72px] md:leading-[80px] lg:text-[100px] lg:leading-[100px]">amazing dining</span>
          <span className="block uppercase text-[36px] leading-[40px] sm:text-[56px] sm:leading-[60px] md:text-[72px] md:leading-[80px] lg:text-[100px] lg:leading-[100px]">experiences</span>
        </h2>
        <p className="mt-3 sm:mt-4 text-xl sm:text-base md:text-lg font-medium px-4 sm:px-0" style={{color: colors.text}}>Chat with me about your food preferences, allergies, or what you're craving today!</p>
        <div className="mt-6 flex items-center gap-3 bg-transparent">
          <div className="inline-flex p-1 rounded-full border" style={{borderColor: colors.cardBorder, background: colors.cardBg}}>
            <button
              onClick={() => setMode('ai')}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${mode === 'ai' ? 'text-white' : ''}`}
              style={{ background: mode === 'ai' ? colors.green500 : 'transparent', color: mode === 'ai' ? '#FFFFFF' : colors.text }}
            >
              🤖 AI Chat
            </button>
            <button
              onClick={() => setMode('shop')}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${mode === 'shop' ? 'text-white' : ''}`}
              style={{ background: mode === 'shop' ? colors.green500 : 'transparent', color: mode === 'shop' ? '#FFFFFF' : colors.text }}
            >
              🛍️ Shop Manually
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(Hero);
