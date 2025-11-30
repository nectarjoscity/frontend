'use client';

import { useRouter } from 'next/navigation';
import { useTheme } from './providers';
import HeaderNav from './components/HeaderNav';
import Link from 'next/link';

export default function NotFound() {
  const { colors, theme, setTheme } = useTheme();
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col" style={{ background: colors.background }}>
      <HeaderNav 
        colors={colors} 
        theme={theme} 
        setTheme={setTheme} 
        mode="shop" 
        setShowCart={() => {}} 
        getTotalItems={() => 0} 
      />
      
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h1 className="text-6xl font-bold mb-4" style={{ color: colors.text }}>
            404
          </h1>
          <h2 className="text-2xl font-semibold mb-4" style={{ color: colors.text }}>
            Page Not Found
          </h2>
          <p className="text-lg mb-8" style={{ color: colors.mutedText }}>
            The page you're looking for doesn't exist or has been moved.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/"
              className="px-6 py-3 rounded-lg font-semibold text-white transition-all hover:scale-105"
              style={{ background: colors.amber500 }}
            >
              Go Home
            </Link>
            <button
              onClick={() => router.back()}
              className="px-6 py-3 rounded-lg font-semibold transition-all hover:scale-105"
              style={{ 
                background: colors.cardBg, 
                border: `1px solid ${colors.cardBorder}`,
                color: colors.text 
              }}
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

