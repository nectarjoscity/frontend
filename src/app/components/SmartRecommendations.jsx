'use client';

import { memo, useState, useEffect, useMemo } from 'react';

// Time-based meal suggestions
const getTimeBasedSuggestions = () => {
    const hour = new Date().getHours();

    if (hour >= 6 && hour < 11) {
        return {
            period: 'morning',
            title: '☀️ Morning Pick-Me-Ups',
            subtitle: 'Start your day with energy',
            tags: ['fresh', 'power'], // emotionalTags to prioritize
            categories: ['smoothies', 'breakfast', 'juice', 'drinks'],
            keywords: ['smoothie', 'juice', 'fresh', 'breakfast', 'morning'],
        };
    } else if (hour >= 11 && hour < 14) {
        return {
            period: 'lunch',
            title: '🍽️ Lunchtime Favorites',
            subtitle: 'Fuel your afternoon',
            tags: ['comfort', 'power'],
            categories: ['main', 'bowls', 'salads', 'lunch'],
            keywords: ['bowl', 'salad', 'rice', 'protein', 'lunch'],
        };
    } else if (hour >= 14 && hour < 17) {
        return {
            period: 'afternoon',
            title: '🌿 Afternoon Refreshers',
            subtitle: 'Beat the afternoon slump',
            tags: ['fresh', 'power'],
            categories: ['snacks', 'drinks', 'smoothies'],
            keywords: ['snack', 'light', 'fresh', 'smoothie', 'drink'],
        };
    } else if (hour >= 17 && hour < 21) {
        return {
            period: 'dinner',
            title: '✨ Evening Indulgence',
            subtitle: 'You deserve something special',
            tags: ['special', 'comfort', 'share'],
            categories: ['main', 'dinner', 'specials'],
            keywords: ['dinner', 'special', 'rice', 'protein', 'comfort'],
        };
    } else {
        return {
            period: 'night',
            title: '🌙 Late Night Cravings',
            subtitle: 'Comfort food for the soul',
            tags: ['comfort'],
            categories: ['comfort', 'snacks', 'main'],
            keywords: ['comfort', 'warm', 'filling', 'snack'],
        };
    }
};

// Weather-based suggestions (will use location API if available)
const getWeatherBasedSuggestions = (weather) => {
    if (!weather) return null;

    const temp = weather.temp; // in Celsius
    const condition = weather.condition?.toLowerCase() || '';

    if (temp < 20 || condition.includes('rain') || condition.includes('cold')) {
        return {
            icon: '🍵',
            title: 'Perfect for this weather',
            subtitle: 'Warm, comforting options',
            keywords: ['warm', 'soup', 'hot', 'comfort', 'rice'],
            tags: ['comfort'],
        };
    } else if (temp > 30 || condition.includes('hot') || condition.includes('sunny')) {
        return {
            icon: '🧊',
            title: 'Cool down with these',
            subtitle: 'Refreshing picks for the heat',
            keywords: ['cold', 'fresh', 'smoothie', 'ice', 'cool', 'salad'],
            tags: ['fresh'],
        };
    }

    return null;
};

function SmartRecommendations({
    menuItems = [],
    colors,
    theme,
    onItemClick,
    addToCart,
    cart = [],
}) {
    const [weather, setWeather] = useState(null);
    const [showSection, setShowSection] = useState(true);

    const timeSuggestions = useMemo(() => getTimeBasedSuggestions(), []);
    const weatherSuggestions = useMemo(() => getWeatherBasedSuggestions(weather), [weather]);

    // Try to get weather data (optional - gracefully degrades)
    useEffect(() => {
        const fetchWeather = async () => {
            try {
                // Check if geolocation is available
                if ('geolocation' in navigator) {
                    navigator.geolocation.getCurrentPosition(
                        async (position) => {
                            // Use a free weather API (OpenWeatherMap free tier)
                            try {
                                const response = await fetch(
                                    `https://api.openweathermap.org/data/2.5/weather?lat=${position.coords.latitude}&lon=${position.coords.longitude}&units=metric&appid=demo`
                                );
                                if (response.ok) {
                                    const data = await response.json();
                                    setWeather({
                                        temp: data.main?.temp,
                                        condition: data.weather?.[0]?.main,
                                    });
                                }
                            } catch {
                                // Weather API failed, continue without it
                            }
                        },
                        () => {
                            // Geolocation denied, continue without weather
                        },
                        { timeout: 5000 }
                    );
                }
            } catch {
                // Continue without weather
            }
        };

        fetchWeather();
    }, []);

    // Filter and score items based on suggestions
    const recommendedItems = useMemo(() => {
        if (!menuItems.length) return [];

        const scoredItems = menuItems.map(item => {
            let score = 0;
            const name = (item.name || '').toLowerCase();
            const description = (item.description || '').toLowerCase();

            // Time-based scoring
            timeSuggestions.keywords.forEach(keyword => {
                if (name.includes(keyword) || description.includes(keyword)) {
                    score += 3;
                }
            });

            // Emotional tag scoring
            if (item.emotionalTag && timeSuggestions.tags.includes(item.emotionalTag)) {
                score += 5;
            }

            // Weather-based scoring (bonus)
            if (weatherSuggestions) {
                weatherSuggestions.keywords.forEach(keyword => {
                    if (name.includes(keyword) || description.includes(keyword)) {
                        score += 2;
                    }
                });
                if (item.emotionalTag && weatherSuggestions.tags.includes(item.emotionalTag)) {
                    score += 4;
                }
            }

            // Availability bonus
            if (item.isAvailable !== false) {
                score += 1;
            }

            return { ...item, score };
        });

        // Sort by score and return top 6
        return scoredItems
            .filter(item => item.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, 6);
    }, [menuItems, timeSuggestions, weatherSuggestions]);

    if (!showSection || recommendedItems.length === 0) return null;

    return (
        <div className="mb-8">
            {/* Section Header */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-xl font-bold flex items-center gap-2" style={{ color: colors.text }}>
                        {weatherSuggestions?.icon || timeSuggestions.title.split(' ')[0]}
                        <span>{weatherSuggestions?.title || timeSuggestions.title.split(' ').slice(1).join(' ')}</span>
                    </h3>
                    <p className="text-sm" style={{ color: colors.mutedText }}>
                        {weatherSuggestions?.subtitle || timeSuggestions.subtitle}
                    </p>
                </div>
                <button
                    onClick={() => setShowSection(false)}
                    className="text-xs px-2 py-1 rounded"
                    style={{ color: colors.mutedText }}
                >
                    Hide
                </button>
            </div>

            {/* Horizontal scroll of recommended items */}
            <div className="flex gap-4 overflow-x-auto pb-4 -mx-3 px-3 snap-x snap-mandatory">
                {recommendedItems.map((item) => {
                    const isInCart = cart.some(ci => ci.name === item.name);

                    return (
                        <div
                            key={item._id}
                            className="flex-shrink-0 w-48 rounded-xl overflow-hidden snap-start transition-all hover:scale-105"
                            style={{
                                background: colors.cardBg,
                                border: `1px solid ${colors.cardBorder}`,
                                boxShadow: theme === 'light' ? '0 2px 8px rgba(0,0,0,0.08)' : '0 2px 8px rgba(0,0,0,0.3)'
                            }}
                        >
                            {/* Item Image */}
                            <div
                                className="h-28 flex items-center justify-center text-4xl relative"
                                style={{
                                    background: item.imageUrl
                                        ? `url(${item.imageUrl}) center/cover`
                                        : (theme === 'light' ? '#f3f4f6' : '#1f2937')
                                }}
                            >
                                {!item.imageUrl && <span>{item.emoji || '🍽️'}</span>}
                                {item.emotionalTag && (
                                    <div
                                        className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-medium"
                                        style={{
                                            background: 'rgba(255,255,255,0.9)',
                                            color: colors.green600
                                        }}
                                    >
                                        {item.emotionalTag === 'comfort' && '🏠'}
                                        {item.emotionalTag === 'special' && '⭐'}
                                        {item.emotionalTag === 'power' && '💪'}
                                        {item.emotionalTag === 'fresh' && '🌿'}
                                        {item.emotionalTag === 'share' && '❤️'}
                                    </div>
                                )}
                            </div>

                            {/* Item Details */}
                            <div className="p-3">
                                <h4 className="font-semibold text-sm mb-1 line-clamp-1" style={{ color: colors.text }}>
                                    {item.name}
                                </h4>
                                <div className="flex items-center justify-between">
                                    <span className="text-green-600 font-bold text-sm">{item.price}</span>
                                    <button
                                        onClick={() => !isInCart && item.isAvailable !== false && addToCart(item)}
                                        disabled={isInCart || item.isAvailable === false}
                                        className={`text-xs px-2 py-1 rounded-lg font-semibold transition-all ${isInCart || item.isAvailable === false
                                                ? 'bg-gray-200 text-gray-500'
                                                : 'bg-green-500 text-white hover:bg-green-600'
                                            }`}
                                    >
                                        {item.isAvailable === false ? 'N/A' : isInCart ? '✓' : '+Add'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default memo(SmartRecommendations);
