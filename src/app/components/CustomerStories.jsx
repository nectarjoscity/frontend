'use client';

import { memo, useState, useEffect } from 'react';

// Customer testimonials/stories (can be made dynamic later from backend)
const customerStories = [
    {
        id: 1,
        name: 'Sarah M.',
        avatar: '👩🏾',
        orderCount: 12,
        story: "Nectar feels like home. Every meal brings me back to my grandmother's kitchen.",
        favoriteItem: 'Jollof Rice',
        badge: 'VIP Customer',
    },
    {
        id: 2,
        name: 'Tunde O.',
        avatar: '👨🏿',
        orderCount: 8,
        story: "The smoothies are my morning ritual. Perfect way to start every day!",
        favoriteItem: 'Green Detox',
        badge: 'Nectar Family',
    },
    {
        id: 3,
        name: 'Amara C.',
        avatar: '👩🏽',
        orderCount: 15,
        story: "Best delivery service in Lagos. Fresh, fast, and always delicious.",
        favoriteItem: 'Pepper Soup',
        badge: 'VIP Customer',
    },
    {
        id: 4,
        name: 'Emeka N.',
        avatar: '👨🏾',
        orderCount: 6,
        story: "My whole family orders from Nectar. The kids love it!",
        favoriteItem: 'Chicken Suya',
        badge: 'Nectar Family',
    },
];

function CustomerStories({ colors, theme }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isVisible, setIsVisible] = useState(true);

    // Auto-rotate testimonials
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % customerStories.length);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    if (!isVisible) return null;

    const currentStory = customerStories[currentIndex];

    return (
        <div className="py-10 px-4">
            <div className="max-w-5xl mx-auto">
                {/* Section Header */}
                <div className="text-center mb-8">
                    <h2 className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: colors.text }}>
                        💚 From the Nectar Family
                    </h2>
                    <p className="text-base" style={{ color: colors.mutedText }}>
                        Stories from customers who made Nectar their home
                    </p>
                </div>

                {/* Testimonial Card */}
                <div
                    className="relative rounded-2xl p-6 sm:p-8 text-center transition-all duration-500"
                    style={{
                        background: theme === 'light'
                            ? 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)'
                            : 'linear-gradient(135deg, #052e21 0%, #064e3b 100%)',
                        border: `1px solid ${colors.cardBorder}`,
                        boxShadow: theme === 'light' ? '0 4px 20px rgba(16, 185, 129, 0.1)' : '0 4px 20px rgba(0,0,0,0.3)'
                    }}
                >
                    {/* Avatar */}
                    <div
                        className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mx-auto mb-4"
                        style={{
                            background: theme === 'light' ? '#fff' : '#1f2937',
                            border: `2px solid ${colors.green500}`
                        }}
                    >
                        {currentStory.avatar}
                    </div>

                    {/* Badge */}
                    <div
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold mb-4"
                        style={{
                            background: currentStory.badge === 'VIP Customer'
                                ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                                : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            color: '#fff'
                        }}
                    >
                        {currentStory.badge === 'VIP Customer' ? '👑' : '🌟'} {currentStory.badge}
                    </div>

                    {/* Quote */}
                    <blockquote
                        className="text-lg sm:text-xl font-medium mb-4 italic"
                        style={{ color: colors.text }}
                    >
                        "{currentStory.story}"
                    </blockquote>

                    {/* Customer Info */}
                    <div className="flex items-center justify-center gap-4 text-sm" style={{ color: colors.mutedText }}>
                        <span className="font-semibold" style={{ color: colors.text }}>{currentStory.name}</span>
                        <span>•</span>
                        <span>Loves: {currentStory.favoriteItem}</span>
                        <span>•</span>
                        <span>{currentStory.orderCount}+ orders</span>
                    </div>

                    {/* Dots Navigation */}
                    <div className="flex items-center justify-center gap-2 mt-6">
                        {customerStories.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentIndex(index)}
                                className={`w-2 h-2 rounded-full transition-all ${index === currentIndex ? 'w-6' : ''}`}
                                style={{
                                    background: index === currentIndex ? colors.green500 : colors.cardBorder
                                }}
                            />
                        ))}
                    </div>
                </div>

                {/* Quote decoration */}
                <div
                    className="text-6xl text-center mt-4 opacity-20"
                    style={{ color: colors.green500 }}
                >
                    "
                </div>
            </div>
        </div>
    );
}

export default memo(CustomerStories);
