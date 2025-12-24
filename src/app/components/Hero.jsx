'use client';

import { memo, useState, useEffect } from 'react';

// Time-based greeting and headline
const getTimeBasedContent = (userName = null, orderCount = 0) => {
  const hour = new Date().getHours();
  const firstName = userName?.split(' ')[0] || null;

  // Personalized greeting prefix for returning users
  let personalGreeting = '';
  if (firstName && orderCount >= 3) {
    personalGreeting = `Hey ${firstName}! 💚 `;
  } else if (firstName) {
    personalGreeting = `Welcome back, ${firstName}! `;
  }

  if (hour >= 6 && hour < 11) {
    return {
      greeting: personalGreeting || 'Good morning! ☀️',
      headline: ['Start Your Day', 'With Something', 'Amazing'],
      subtext: firstName ? `Ready to fuel your morning, ${firstName}?` : 'Fresh flavors to energize your morning',
      isReturningUser: !!firstName,
    };
  } else if (hour >= 11 && hour < 17) {
    return {
      greeting: personalGreeting || 'Ready for lunch? 🍽️',
      headline: ['Where Every', 'Meal Feels', 'Like Home'],
      subtext: firstName ? `Your favorites are waiting for you` : 'Nourish your soul with something delicious',
      isReturningUser: !!firstName,
    };
  } else if (hour >= 17 && hour < 21) {
    return {
      greeting: personalGreeting || 'Good evening! ✨',
      headline: ['Unwind With', 'Something', 'Special'],
      subtext: firstName ? `Time to treat yourself, ${firstName}` : 'You deserve a delicious end to your day',
      isReturningUser: !!firstName,
    };
  } else {
    return {
      greeting: personalGreeting || 'Late night craving? 🌙',
      headline: ['Comfort Food', 'Whenever You', 'Need It'],
      subtext: firstName ? `We've got your midnight cravings covered` : 'We\'ve got you covered, anytime',
      isReturningUser: !!firstName,
    };
  }
};

function Hero({ colors, theme, mode, setMode }) {
  const [content, setContent] = useState(getTimeBasedContent());
  const [loyaltyBadge, setLoyaltyBadge] = useState(null);

  useEffect(() => {
    // Check for logged-in user
    const loadUserData = () => {
      if (typeof window !== 'undefined') {
        const storedUser = localStorage.getItem('nv_user');
        const orderHistory = localStorage.getItem('nv_order_count');
        const orderCount = parseInt(orderHistory || '0', 10);

        if (storedUser) {
          try {
            const user = JSON.parse(storedUser);
            setContent(getTimeBasedContent(user.name, orderCount));

            // Set loyalty badge for frequent customers
            if (orderCount >= 5) {
              setLoyaltyBadge({ emoji: '👑', text: 'VIP Customer' });
            } else if (orderCount >= 3) {
              setLoyaltyBadge({ emoji: '🌟', text: 'Nectar Family' });
            }
          } catch (e) {
            setContent(getTimeBasedContent());
          }
        } else {
          setContent(getTimeBasedContent());
        }
      }
    };

    loadUserData();

    // Listen for auth changes
    const handleAuthChange = () => loadUserData();
    window.addEventListener('nv_auth_change', handleAuthChange);

    // Update every minute
    const interval = setInterval(loadUserData, 60000);

    return () => {
      clearInterval(interval);
      window.removeEventListener('nv_auth_change', handleAuthChange);
    };
  }, []);

  return (
    <div className="relative overflow-hidden" style={{ background: colors.background }}>
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
        {/* Loyalty badge for VIP customers */}
        {loyaltyBadge && (
          <div
            className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold mb-2 mt-[100px]"
            style={{
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              color: '#fff'
            }}
          >
            <span>{loyaltyBadge.emoji}</span>
            <span>{loyaltyBadge.text}</span>
          </div>
        )}

        {/* Time-based greeting pill */}
        <div
          className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium mb-4 ${!loyaltyBadge ? 'mt-[120px]' : ''}`}
          style={{
            background: content.isReturningUser
              ? (theme === 'light' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.25)')
              : (theme === 'light' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.2)'),
            color: colors.green600 || '#10b981'
          }}
        >
          {content.greeting}
        </div>

        <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-bold mb-4 sm:mb-6 text-center leading-tight" style={{ fontFamily: 'Gebuk, Arial, sans-serif', fontSize: '64px', fontWeight: '700', lineHeight: '64px', color: theme === 'light' ? colors.black : colors.text }}>
          {content.headline.map((line, i) => (
            <span key={i} className="block uppercase text-[36px] leading-[40px] sm:text-[56px] sm:leading-[60px] md:text-[72px] md:leading-[80px] lg:text-[100px] lg:leading-[100px]">
              {line}
            </span>
          ))}
        </h2>
        <p className="mt-3 sm:mt-4 text-xl sm:text-base md:text-lg font-medium px-4 sm:px-0" style={{ color: colors.mutedText || colors.text }}>
          {content.subtext}
        </p>
      </div>
    </div>
  );
}

export default memo(Hero);
