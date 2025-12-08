'use client';

import { useState, useEffect, useRef } from 'react';
import { useGetRecommendationsMutation } from '../../services/api';
import { IoAddCircle, IoSparkles, IoClose, IoChevronForward, IoCheckmarkCircle, IoChevronDown, IoRefresh } from 'react-icons/io5';

// Preference options for meal customization
const PREFERENCE_OPTIONS = {
    mealGoal: {
        label: "What's your goal?",
        options: [
            { id: 'full', label: 'Full Meal', emoji: '🍽️' },
            { id: 'light', label: 'Light Bite', emoji: '🥗' },
            { id: 'protein', label: 'High Protein', emoji: '💪' },
            { id: 'comfort', label: 'Comfort Food', emoji: '🤗' },
        ]
    },
    dietary: {
        label: 'Any preferences?',
        options: [
            { id: 'none', label: 'No Preference', emoji: '👍' },
            { id: 'spicy', label: 'Spicy', emoji: '🌶️' },
            { id: 'mild', label: 'Mild', emoji: '😌' },
            { id: 'sweet', label: 'Sweet', emoji: '🍬' },
        ]
    },
    budget: {
        label: 'Budget?',
        options: [
            { id: 'any', label: 'Any', emoji: '💰' },
            { id: 'budget', label: 'Budget', emoji: '💵' },
            { id: 'premium', label: 'Premium', emoji: '💎' },
        ]
    }
};

/**
 * AI Meal Recommendation Component
 * Shows complementary items based on user's cart selection
 */
export default function RecommendationList({
    selectedItems = [],
    onAddToCart,
    onClose,
    colors = {},
    theme = 'light'
}) {
    const [getRecommendations, { isLoading, error }] = useGetRecommendationsMutation();
    const [recommendations, setRecommendations] = useState(null);
    const [addedItems, setAddedItems] = useState(new Set());
    const [expandedCategories, setExpandedCategories] = useState({});
    const [loadingMore, setLoadingMore] = useState({});
    const [preferences, setPreferences] = useState({
        mealGoal: null,
        dietary: null,
        budget: null
    });
    const [showPreferences, setShowPreferences] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const hasFetched = useRef(false);
    const initialItems = useRef(selectedItems);
    const contentRef = useRef(null);

    // Fetch recommendations when preferences change
    const fetchRecommendations = async (prefs = preferences) => {
        const result = await getRecommendations({
            selectedItems: initialItems.current,
            preferences: prefs
        });
        if (result.data) {
            setRecommendations(result.data);
        }
    };

    // Fetch recommendations ONLY once on mount (without preferences initially)
    useEffect(() => {
        if (!hasFetched.current && initialItems.current.length > 0) {
            hasFetched.current = true;
            fetchRecommendations({});
        }
    }, [getRecommendations]);

    const handlePreferenceSelect = (category, optionId) => {
        const newPrefs = {
            ...preferences,
            [category]: preferences[category] === optionId ? null : optionId
        };
        setPreferences(newPrefs);
    };

    const applyPreferences = () => {
        setShowPreferences(false);
        setRecommendations(null);
        fetchRecommendations(preferences);
    };

    const handleAddToCart = (item) => {
        if (onAddToCart) {
            onAddToCart(item);
            setAddedItems(prev => new Set([...prev, item._id || item.id]));
        }
    };

    const handleLoadMore = async (categoryName) => {
        setLoadingMore(prev => ({ ...prev, [categoryName]: true }));

        // Get current cart including items added from this modal
        const currentCart = [...initialItems.current];
        addedItems.forEach(id => {
            // Find the item in recommendations and add to context
            recommendations?.recommendations?.forEach(cat => {
                const item = cat.items?.find(i => (i._id || i.id) === id);
                if (item && !currentCart.some(ci => (ci._id || ci.id) === id)) {
                    currentCart.push(item);
                }
            });
        });

        // Collect IDs of already-shown items in this category to exclude
        const existingCategory = recommendations?.recommendations?.find(
            cat => cat.category.toLowerCase() === categoryName.toLowerCase()
        );
        const excludeItemIds = existingCategory?.items?.map(i => i._id || i.id) || [];

        try {
            const result = await getRecommendations({
                selectedItems: currentCart,
                excludeItemIds: excludeItemIds,
                targetCategory: categoryName,
                preferences: preferences
            });
            if (result.data?.recommendations) {
                // Merge new items with existing, avoiding duplicates
                setRecommendations(prev => {
                    if (!prev) return result.data;

                    const updatedRecs = prev.recommendations.map(existingCat => {
                        const newCat = result.data.recommendations.find(
                            nc => nc.category.toLowerCase() === existingCat.category.toLowerCase()
                        );

                        if (newCat && existingCat.category.toLowerCase() === categoryName.toLowerCase()) {
                            // Merge items, avoiding duplicates
                            const existingIds = new Set(existingCat.items.map(i => i._id || i.id));
                            const newItems = newCat.items.filter(i => !existingIds.has(i._id || i.id));
                            return {
                                ...existingCat,
                                items: [...existingCat.items, ...newItems]
                            };
                        }
                        return existingCat;
                    });

                    // Add any completely new categories
                    result.data.recommendations.forEach(newCat => {
                        if (!updatedRecs.some(ec => ec.category.toLowerCase() === newCat.category.toLowerCase())) {
                            updatedRecs.push(newCat);
                        }
                    });

                    return {
                        ...prev,
                        recommendations: updatedRecs,
                        suggestion: result.data.suggestion || prev.suggestion,
                        mealComplete: result.data.mealComplete
                    };
                });
            }
        } catch (err) {
            console.error('Error loading more:', err);
        } finally {
            setLoadingMore(prev => ({ ...prev, [categoryName]: false }));
        }
    };

    const isItemAdded = (item) => addedItems.has(item._id || item.id);

    // Default colors if not provided
    const defaultColors = {
        background: theme === 'light' ? '#FFFFFF' : '#1F2937',
        cardBg: theme === 'light' ? '#F9FAFB' : '#111827',
        cardBorder: theme === 'light' ? '#E5E7EB' : '#374151',
        text: theme === 'light' ? '#111827' : '#F9FAFB',
        mutedText: theme === 'light' ? '#6B7280' : '#9CA3AF',
        amber500: '#F59E0B',
        amber600: '#D97706',
        green500: '#10B981',
        green600: '#059669',
    };

    const c = { ...defaultColors, ...colors };

    if (!initialItems.current.length) {
        return null;
    }

    // Minimized AI bubble - floating button to reopen
    if (isMinimized) {
        return (
            <button
                onClick={() => setIsMinimized(false)}
                className="fixed bottom-24 right-4 z-50 p-4 rounded-full shadow-lg transition-all hover:scale-110 active:scale-95"
                style={{
                    background: `linear-gradient(135deg, ${c.amber500}, ${c.amber600})`,
                    color: '#fff',
                    boxShadow: '0 4px 20px rgba(245, 158, 11, 0.4)',
                    animation: 'pulse 2s infinite'
                }}
                title="Get AI meal recommendations"
            >
                <IoSparkles className="h-6 w-6" />
            </button>
        );
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.5)' }}
            onClick={(e) => e.target === e.currentTarget && onClose?.()}
        >
            <div
                className="w-full sm:max-w-lg max-h-[85vh] rounded-t-3xl sm:rounded-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom"
                style={{
                    background: c.background,
                    boxShadow: '0 -4px 20px rgba(0,0,0,0.15)'
                }}
            >
                {/* Header */}
                <div
                    className="flex items-center justify-between p-4 border-b"
                    style={{ borderColor: c.cardBorder }}
                >
                    <div className="flex items-center gap-2">
                        <div
                            className="p-2 rounded-xl"
                            style={{ background: `${c.amber500}20` }}
                        >
                            <IoSparkles className="h-5 w-5" style={{ color: c.amber500 }} />
                        </div>
                        <div>
                            <h2 className="font-bold text-lg" style={{ color: c.text }}>
                                Complete Your Meal
                            </h2>
                            <p className="text-sm" style={{ color: c.mutedText }}>
                                AI-powered suggestions {addedItems.size > 0 && `• ${addedItems.size} added`}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                        <IoClose className="h-6 w-6" style={{ color: c.mutedText }} />
                    </button>
                </div>

                {/* Content */}
                <div ref={contentRef} className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* Preference Tabs - Only shown when user clicks "Not what you're looking for?" */}
                    {showPreferences && (
                        <div className="space-y-4 p-4 rounded-xl" style={{ background: theme === 'light' ? '#FFF7ED' : '#3A2A1A', border: `1px solid ${c.amber500}30` }}>
                            <p className="text-center font-medium" style={{ color: c.text }}>
                                Tell us what you prefer 👇
                            </p>

                            {Object.entries(PREFERENCE_OPTIONS).map(([category, { label, options }]) => (
                                <div key={category} className="space-y-2">
                                    <p className="text-sm font-medium" style={{ color: c.mutedText }}>
                                        {label}
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {options.map((opt) => (
                                            <button
                                                key={opt.id}
                                                onClick={() => handlePreferenceSelect(category, opt.id)}
                                                className="px-3 py-2 rounded-xl text-sm font-medium transition-all active:scale-95"
                                                style={{
                                                    background: preferences[category] === opt.id
                                                        ? c.amber500
                                                        : (theme === 'light' ? '#F3F4F6' : '#374151'),
                                                    color: preferences[category] === opt.id
                                                        ? '#fff'
                                                        : c.text,
                                                    border: preferences[category] === opt.id
                                                        ? 'none'
                                                        : `1px solid ${c.cardBorder}`
                                                }}
                                            >
                                                {opt.emoji} {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}

                            <div className="flex gap-2 pt-2">
                                <button
                                    onClick={() => {
                                        setShowPreferences(false);
                                    }}
                                    className="flex-1 py-3 px-4 rounded-xl font-medium text-sm"
                                    style={{
                                        background: theme === 'light' ? '#F3F4F6' : '#374151',
                                        color: c.mutedText
                                    }}
                                >
                                    Go Back
                                </button>
                                <button
                                    onClick={applyPreferences}
                                    className="flex-1 py-3 px-4 rounded-xl font-semibold text-sm"
                                    style={{
                                        background: c.amber500,
                                        color: '#fff'
                                    }}
                                >
                                    Show New Recommendations ✨
                                </button>
                            </div>
                        </div>
                    )}


                    {isLoading && !recommendations && (
                        <div className="flex flex-col items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200"
                                style={{ borderTopColor: c.amber500 }} />
                            <p className="mt-4 text-sm" style={{ color: c.mutedText }}>
                                Finding perfect pairings...
                            </p>
                        </div>
                    )}

                    {error && !recommendations && (
                        <div
                            className="p-4 rounded-xl text-center"
                            style={{ background: '#FEF2F2', color: '#DC2626' }}
                        >
                            <p className="font-medium">Couldn't load recommendations</p>
                            <p className="text-sm mt-1">Please try again later</p>
                        </div>
                    )}

                    {recommendations?.success && (
                        <>
                            {/* AI Suggestion Message */}
                            {recommendations.suggestion && (
                                <div
                                    className="p-3 rounded-xl flex items-start gap-2"
                                    style={{
                                        background: theme === 'light' ? '#FFF7ED' : '#3A2A1A',
                                        border: `1px solid ${c.amber500}30`
                                    }}
                                >
                                    <IoSparkles className="h-5 w-5 mt-0.5 flex-shrink-0" style={{ color: c.amber500 }} />
                                    <p className="text-sm" style={{ color: c.text }}>
                                        {recommendations.suggestion}
                                    </p>
                                </div>
                            )}

                            {/* Meal Complete Indicator */}
                            {recommendations.mealComplete && (
                                <div
                                    className="p-4 rounded-xl flex items-center gap-3"
                                    style={{
                                        background: theme === 'light' ? '#ECFDF5' : '#052E21',
                                        border: `1px solid ${c.green500}30`
                                    }}
                                >
                                    <IoCheckmarkCircle className="h-6 w-6" style={{ color: c.green500 }} />
                                    <div>
                                        <p className="font-semibold" style={{ color: c.green600 }}>
                                            Your meal is complete! 🎉
                                        </p>
                                        <p className="text-sm" style={{ color: c.mutedText }}>
                                            You've selected a balanced meal
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Recommendation Categories */}
                            {recommendations.recommendations?.map((category, idx) => (
                                <div key={idx} className="space-y-2">
                                    <h3
                                        className="font-semibold text-sm uppercase tracking-wide flex items-center gap-2"
                                        style={{ color: c.mutedText }}
                                    >
                                        <IoChevronForward className="h-4 w-4" />
                                        {category.category}
                                    </h3>

                                    <div className="grid gap-2">
                                        {category.items?.map((item) => (
                                            <div
                                                key={item._id || item.id}
                                                className="flex items-center gap-3 p-3 rounded-xl transition-all hover:scale-[1.01] overflow-hidden"
                                                style={{
                                                    background: c.cardBg,
                                                    border: `1px solid ${isItemAdded(item) ? c.green500 : c.cardBorder}`
                                                }}
                                            >
                                                {/* Item Image/Emoji */}
                                                <div
                                                    className="h-14 w-14 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden"
                                                    style={{ background: theme === 'light' ? '#F3F4F6' : '#374151' }}
                                                >
                                                    {item.imageUrl ? (
                                                        <img
                                                            src={item.imageUrl}
                                                            alt={item.name}
                                                            className="h-full w-full object-cover"
                                                        />
                                                    ) : (
                                                        <span className="text-2xl">{item.emoji || '🍽️'}</span>
                                                    )}
                                                </div>

                                                {/* Item Details */}
                                                <div className="flex-1 min-w-0 overflow-hidden">
                                                    <h4 className="font-semibold text-base sm:text-lg truncate" style={{ color: c.text }}>
                                                        {item.name}
                                                    </h4>
                                                    <p
                                                        className="text-sm sm:text-base line-clamp-2"
                                                        style={{ color: c.mutedText }}
                                                    >
                                                        {item.reason}
                                                    </p>
                                                    <p className="text-base sm:text-lg font-bold mt-1" style={{ color: c.amber600 }}>
                                                        ₦{Number(item.price).toLocaleString()}
                                                    </p>
                                                </div>

                                                {/* Add Button */}
                                                <button
                                                    onClick={() => handleAddToCart(item)}
                                                    disabled={isItemAdded(item)}
                                                    className="flex-shrink-0 p-2 rounded-xl transition-all active:scale-95"
                                                    style={{
                                                        background: isItemAdded(item) ? c.green500 : c.amber500,
                                                        color: '#fff'
                                                    }}
                                                >
                                                    {isItemAdded(item) ? (
                                                        <IoCheckmarkCircle className="h-6 w-6" />
                                                    ) : (
                                                        <IoAddCircle className="h-6 w-6" />
                                                    )}
                                                </button>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Load More Button */}
                                    <button
                                        onClick={() => handleLoadMore(category.category)}
                                        disabled={loadingMore[category.category]}
                                        className="w-full py-2 px-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-95"
                                        style={{
                                            background: theme === 'light' ? '#F3F4F6' : '#374151',
                                            color: c.mutedText,
                                            border: `1px dashed ${c.cardBorder}`
                                        }}
                                    >
                                        {loadingMore[category.category] ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300"
                                                    style={{ borderTopColor: c.amber500 }} />
                                                Loading...
                                            </>
                                        ) : (
                                            <>
                                                <IoChevronDown className="h-4 w-4" />
                                                Load more {category.category.toLowerCase()}
                                            </>
                                        )}
                                    </button>
                                </div>
                            ))}

                            {/* No Recommendations */}
                            {recommendations.recommendations?.length === 0 && !recommendations.mealComplete && (
                                <div className="text-center py-8">
                                    <span className="text-4xl">🍽️</span>
                                    <p className="mt-2 font-medium" style={{ color: c.text }}>
                                        No additional recommendations
                                    </p>
                                    <p className="text-sm" style={{ color: c.mutedText }}>
                                        Your selection looks great!
                                    </p>
                                </div>
                            )}

                            {/* "Not what you're looking for?" button - shows preference tabs */}
                            {!showPreferences && (
                                <button
                                    onClick={() => {
                                        setShowPreferences(true);
                                        // Scroll to top of modal content
                                        setTimeout(() => {
                                            contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
                                        }, 100);
                                    }}
                                    className="w-full py-3 px-4 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-95 mt-4"
                                    style={{
                                        background: 'transparent',
                                        color: c.amber600,
                                        border: `1px dashed ${c.amber500}`
                                    }}
                                >
                                    🤔 Not what you're looking for?
                                </button>
                            )}
                        </>
                    )}
                </div>

                {/* Footer */}
                <div
                    className="p-4 border-t flex gap-2"
                    style={{ borderColor: c.cardBorder }}
                >
                    <button
                        onClick={() => setIsMinimized(true)}
                        className="py-3 px-4 rounded-xl font-medium text-sm transition-all active:scale-98"
                        style={{
                            background: 'transparent',
                            color: c.mutedText,
                            border: `1px solid ${c.cardBorder}`
                        }}
                        title="Hide AI recommendations"
                    >
                        🙈 Hide
                    </button>
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 px-4 rounded-xl font-semibold transition-all active:scale-98"
                        style={{
                            background: theme === 'light' ? '#F3F4F6' : '#374151',
                            color: c.text
                        }}
                    >
                        Skip
                    </button>
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 px-4 rounded-xl font-semibold transition-all active:scale-98"
                        style={{
                            background: c.green500,
                            color: '#fff'
                        }}
                    >
                        Done {addedItems.size > 0 && `(+${addedItems.size})`}
                    </button>
                </div>
            </div>
        </div>
    );
}
