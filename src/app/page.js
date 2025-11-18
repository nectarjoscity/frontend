'use client';

import { useState, useRef, useEffect, useTransition, useMemo } from 'react';
import { useGetCategoriesQuery, useLazyGetMenuItemsQuery, useCreateOrderMutation } from '../services/api';
import { interpret, toChatMessageFromResponse } from '../services/nlp';
import { useTheme } from './providers';
import { IoClose, IoSend, IoTrash } from 'react-icons/io5';
import { HiShoppingCart } from 'react-icons/hi2';
import HeaderNav from './components/HeaderNav';
import Hero from './components/Hero';
import ManualShop from './components/ManualShop';
import CartSidebar from './components/CartSidebar';
import InputArea from './components/InputArea';

export default function RestaurantChat() {
  const { colors, theme, setTheme } = useTheme();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState(null); // 'bill', 'dining-preference', 'delivery-address', 'contact-info'
  const [diningPreference, setDiningPreference] = useState(null); // 'takeout', 'dine-in'
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [contactInfo, setContactInfo] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [transferExpiry, setTransferExpiry] = useState(null);
  const [mode, setMode] = useState('ai'); // 'ai' | 'shop'
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [manualItems, setManualItems] = useState([]);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [isManualCheckout, setIsManualCheckout] = useState(false);
  const [manualStep, setManualStep] = useState(null); // 'dining-preference' | 'delivery-address' | 'contact-info' | 'payment' | 'confirmed'
  const [manualDiningPreference, setManualDiningPreference] = useState(null); // 'takeout' | 'dine-in'
  const [manualDeliveryAddress, setManualDeliveryAddress] = useState('');
  const [manualContact, setManualContact] = useState('');
  const [detailsItem, setDetailsItem] = useState(null);

  const resetManualCheckout = () => {
    setIsManualCheckout(false);
    setManualStep(null);
    setManualDiningPreference(null);
    setManualDeliveryAddress('');
    setManualContact('');
  };

  useEffect(() => {
    if (!showCart) {
      resetManualCheckout();
    }
  }, [showCart]);

  useEffect(() => {
    if (cart.length === 0) {
      resetManualCheckout();
    }
  }, [cart]);
  const { data: categories = [] } = useGetCategoriesQuery({ active: true });
  const [triggerGetMenuItems] = useLazyGetMenuItemsQuery();
  const [createOrder] = useCreateOrderMutation();


  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Timer for transfer expiry
  useEffect(() => {
    let interval;
    if (transferExpiry && transferExpiry > 0) {
      interval = setInterval(() => {
        setTransferExpiry(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            // Handle expiry
            const expiryMessage = {
              id: Date.now(),
              text: "⏰ Transfer session has expired. Please restart the checkout process to get new account details.",
              sender: 'bot',
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            setMessages(prev => [...prev, expiryMessage]);
            setCheckoutStep('');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [transferExpiry]);

  // Menu data
  // Using API-driven data; static menuData removed
  const messagesEndRef = useRef(null);
  const chatScrollRef = useRef(null);

  const scrollToBottom = (force = false) => {
    // Don't auto-scroll in shop mode to prevent glitches
    if (mode === 'shop') return;
    
    const container = chatScrollRef.current;
    if (!container) return;
    const nearBottom = (container.scrollTop + container.clientHeight) >= (container.scrollHeight - 120);
    if (!nearBottom && !force) return;
    container.scrollTo({ top: container.scrollHeight, behavior: 'auto' });
  };

  useEffect(() => {
    // Only scroll in AI mode
    if (mode === 'ai') {
      scrollToBottom();
    }
  }, [messages, mode]);

  // Delight: short speaking animation on initial load
  useEffect(() => {
    setIsSpeaking(true);
    const t = setTimeout(() => setIsSpeaking(false), 1200);
    return () => clearTimeout(t);
  }, []);

  // Default load first category items in Shop mode
  useEffect(() => {
    const preloadFirstCategory = async () => {
      if (mode !== 'shop') return;
      if (!categories || !categories.length) return;
      if (selectedCategoryId) return;
      const first = categories[0];
      setSelectedCategoryId(first._id);
      setIsLoadingItems(true);
      try {
        const { data: itemsData } = await triggerGetMenuItems({ category: first._id, active: true, available: true });
        const mapped = Array.isArray(itemsData) ? itemsData.map(it => ({
          name: it.name,
          price: `₦${Number(it.price).toFixed(2)}`,
          description: it.description,
          emoji: it.emoji || first.emoji
        })) : [];
        setManualItems(mapped);
      } finally {
        setIsLoadingItems(false);
      }
    };
    preloadFirstCategory();
  }, [mode, categories, selectedCategoryId, triggerGetMenuItems]);

  const handleSendMessage = async () => {
    if (inputMessage.trim() === '') return;

    const newMessage = {
      id: messages.length + 1,
      text: inputMessage,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages([...messages, newMessage]);
    const userInput = inputMessage.trim().toLowerCase();
    setInputMessage('');
    setIsTyping(true);
    setIsSpeaking(true);

    // Handle checkout flow responses
    if (checkoutStep === 'dining-preference') {
      if (userInput.includes('takeout') || userInput.includes('take out') || userInput.includes('delivery')) {
        handleDiningPreference('takeout');
        setIsTyping(false);
        setIsSpeaking(false);
        return;
      } else if (userInput.includes('dine in') || userInput.includes('eat in') || userInput.includes('restaurant')) {
        handleDiningPreference('dine-in');
        setIsTyping(false);
        setIsSpeaking(false);
        return;
      }
    } else if (checkoutStep === 'delivery-address') {
-      handleDeliveryAddress(inputMessage.trim());
+      handleDeliveryAddress(newMessage.text.trim());
       setIsTyping(false);
       setIsSpeaking(false);
       return;
     } else if (checkoutStep === 'contact-info') {
-      handleContactInfo(inputMessage.trim());
+      handleContactInfo(newMessage.text.trim());
       setIsTyping(false);
       setIsSpeaking(false);
       return;
     } else if (checkoutStep === 'payment') {
-      handlePayment(inputMessage.trim());
+      handlePayment(newMessage.text.trim());
       setIsTyping(false);
       setIsSpeaking(false);
       return;
     }

    // Check for checkout triggers
    const checkoutTriggers = [
      "i don't want anything else",
      "i dont want anything else",
      "nothing else",
      "that's all",
      "thats all",
      "i'm done",
      "im done",
      "checkout",
      "check out",
      "ready to order",
      "place order",
      "finish order",
      "ready to checkout",
      "proceed to checkout",
      "ready",
      "done"
    ];

    // Check for continue shopping triggers
    const continueShoppingTriggers = [
      "add more",
      "more items",
      "continue shopping",
      "keep shopping",
      "browse more",
      "see more"
    ];
    const exactContinueTriggers = ["continue", "more"];

    if (checkoutTriggers.some(trigger => userInput.includes(trigger))) {
      setTimeout(() => {
        startCheckout();
        setIsTyping(false);
        setIsSpeaking(false);
      }, 1000);
      return;
    }

    // Check for continue shopping responses
    if (
      continueShoppingTriggers.some(trigger => userInput.includes(trigger)) ||
      exactContinueTriggers.includes(userInput.trim())
    ) {
      setTimeout(() => {
        const apiCategories = (categories && categories.length)
          ? categories.map(c => ({ name: c.name, description: c.description, emoji: c.emoji }))
          : [
              { name: '🥗 Fresh Salads', description: 'Healthy and nutritious salad bowls', emoji: '🥗' },
              { name: '🍲 Hearty Bowls', description: 'Filling and satisfying meal bowls', emoji: '🍲' },
              { name: '🥤 Fresh Beverages', description: 'Refreshing smoothies and drinks', emoji: '🥤' }
            ];
        const continueResponse = {
          id: messages.length + 2,
          text: 'Great! Please choose a category to explore more items:',
          sender: 'bot',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isCategoryMenu: true,
          categories: apiCategories
        };
        setMessages(prev => [...prev, continueResponse]);
        setIsTyping(false);
        setIsSpeaking(false);
      }, 1000);
      return;
    }

    // NEW: Send to backend NLP for waiter chat + actions
    try {
      const convo = [...messages, newMessage].map(m => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text
      }));
      const resp = await interpret(newMessage.text, convo);

      // Chat / Clarify modes
      if (resp && (resp.mode === 'chat' || resp.mode === 'clarify')) {
        const assistant = toChatMessageFromResponse(resp);
        const botMessage = {
          id: Date.now(),
          text: assistant.content,
          sender: 'bot',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, botMessage]);
        setIsTyping(false);
        setIsSpeaking(false);
        return;
      }

      // Action responses (controller JSON)
      if (resp && typeof resp === 'object') {
        const hasDataArray = Array.isArray(resp.data);
        const hasAny = hasDataArray && resp.data.length > 0;
        const looksLikeItem = hasAny && (resp.data[0].price != null);

        let botText = 'Done.';
        if (typeof resp.message === 'string') {
          botText = resp.message;
        } else if (hasDataArray) {
          botText = `Found ${resp.data.length} ${looksLikeItem ? 'menu items' : 'categories'}.`;
        }

        // If zero results, show helpful message (no suggestions)
        if (hasDataArray && resp.data.length === 0) {
          const botMessage = {
            id: Date.now(),
            text: botText,
            sender: 'bot',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
          setMessages(prev => [...prev, botMessage]);
          setIsTyping(false);
          setIsSpeaking(false);
          return;
        }

        // Render item grid when response looks like menu items
        if (hasAny && looksLikeItem) {
          const items = resp.data.map(it => ({
            name: it.name,
            price: typeof it.price === 'number' ? `₦${Number(it.price).toFixed(2)}` : String(it.price || ''),
            description: it.description,
            emoji: it.emoji
          }));

          // If addToCart flag is set, automatically add items to cart
          if (resp.addToCart === true && items.length > 0) {
            // Add all items to cart
            items.forEach(item => {
              addToCart(item);
            });
            
            // Show success message from backend or default message
            const successMessage = {
              id: Date.now(),
              text: resp.message || `✅ Added ${items.length} item${items.length > 1 ? 's' : ''} to your cart!`,
              sender: 'bot',
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            setMessages(prev => [...prev, successMessage]);
            setIsTyping(false);
            setIsSpeaking(false);
            return;
          }

          const itemsResponse = {
            id: Date.now(),
            text: botText || 'Here are some matching items:',
            sender: 'bot',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isItemMenu: true,
            items
          };
          setMessages(prev => [...prev, itemsResponse]);
          setIsTyping(false);
          setIsSpeaking(false);
          return;
        }

        // If it looks like a category list, also render selectable categories
        if (hasAny && !looksLikeItem && resp.data[0].name) {
          const apiCategories = resp.data.map(c => ({ name: c.name, description: c.description, emoji: c.emoji }));
          const botMessage = {
            id: Date.now(),
            text: botText,
            sender: 'bot',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isCategoryMenu: true,
            categories: apiCategories
          };
          setMessages(prev => [...prev, botMessage]);
          setIsTyping(false);
          setIsSpeaking(false);
          return;
        }

        // Fallback: plain text
        const botMessage = {
          id: Date.now(),
          text: botText,
          sender: 'bot',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, botMessage]);
        setIsTyping(false);
        setIsSpeaking(false);
        return;
      }
    } catch (err) {
      const botMessage = {
        id: Date.now(),
        text: err?.message && err.message !== 'Failed to fetch'
          ? err.message
          : 'I had trouble reaching our knowledge base just now. Want me to try a regular menu search instead?',
        sender: 'bot',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
      setIsSpeaking(false);
      return;
    }

    // Default bot response with category selection
    setTimeout(() => {
      const apiCategories = (categories && categories.length)
        ? categories.map(c => ({ name: c.name, description: c.description, emoji: c.emoji }))
        : [
            { name: '🥗 Fresh Salads', description: 'Healthy and nutritious salad bowls', emoji: '🥗' },
            { name: '🍲 Hearty Bowls', description: 'Filling and satisfying meal bowls', emoji: '🍲' },
            { name: '🥤 Fresh Beverages', description: 'Refreshing smoothies and drinks', emoji: '🥤' }
          ];
      const categoryResponse = {
        id: messages.length + 2,
        text: 'Welcome to NectarV! Please choose a category to explore:',
        sender: 'bot',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isCategoryMenu: true,
        categories: apiCategories
      };
      setMessages(prev => [...prev, categoryResponse]);
      setIsTyping(false);
      setIsSpeaking(false);
    }, 1500);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
      // Blur the input on mobile to dismiss keyboard
      if (window.innerWidth <= 768) {
        e.target.blur();
      }
    }
  };


  // Cart functions
  const addToCart = (item) => {
    const existingItem = cart.find(cartItem => cartItem.name === item.name);
    if (existingItem) {
      setCart(cart.map(cartItem => 
        cartItem.name === item.name 
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem
      ));
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
  };

  const removeFromCart = (itemName) => {
    setCart(cart.filter(item => item.name !== itemName));
  };

  const updateQuantity = (itemName, newQuantity) => {
    if (newQuantity === 0) {
      removeFromCart(itemName);
    } else {
      setCart(cart.map(item => 
        item.name === itemName 
          ? { ...item, quantity: newQuantity }
          : item
      ));
    }
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => {
      const price = parseFloat(String(item.price).replace(/[^\d.]/g, ''));
      return total + (price * item.quantity);
    }, 0).toFixed(2);
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  // Format countdown timer
  const formatTime = (seconds) => {
    if (seconds <= 0) return '00:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Checkout functions
  const startCheckout = () => {
    if (cart.length === 0) {
      const emptyCartMessage = {
        id: Date.now(),
        text: "Your cart is empty! Please add some items before checking out.",
        sender: 'bot',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, emptyCartMessage]);
      return;
    }

    setCheckoutStep('dining-preference');
     const billMessage = {
       id: Date.now(),
       text: `Here's your order summary:\n\n${cart.map(item => `${item.name} x${item.quantity} - ₦${(parseFloat(String(item.price).replace(/[^\\d.]/g, '')) * item.quantity).toFixed(2)}`).join('\n')}\n\nSubtotal: ₦${getTotalPrice()}\n\nWould you like this for takeout or to dine in the restaurant?`,
       sender: 'bot',
       timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
       isCheckoutBill: true
     };
     setMessages(prev => [...prev, billMessage]);
  };

  const handleDiningPreference = (preference) => {
    setDiningPreference(preference);
    if (preference === 'takeout') {
      setCheckoutStep('delivery-address');
      const deliveryMessage = {
        id: Date.now(),
        text: "Great! Where would you like your order delivered? Please provide your address.",
        sender: 'bot',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, deliveryMessage]);
    } else {
      setCheckoutStep('contact-info');
      const contactMessage = {
        id: Date.now(),
        text: "Perfect! Please provide your email or phone number so we can notify you when your order is ready.",
        sender: 'bot',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, contactMessage]);
    }
  };

  const handleDeliveryAddress = (address) => {
    setDeliveryAddress(address);
    const fee = 3.99; // Fixed delivery fee
    setDeliveryFee(fee);
    setCheckoutStep('payment');
    setTransferExpiry(900); // 15 minutes countdown
    
    const finalTotal = (parseFloat(getTotalPrice()) + fee).toFixed(2);
    const deliveryConfirmMessage = {
       id: Date.now(),
       text: `Thank you! Your order will be delivered to: ${address}\n\nDelivery fee: ₦${fee.toFixed(2)}\nNew total: ₦${finalTotal}\n\nPlease make a transfer to the account below to confirm your order.`,
       sender: 'bot',
       timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
       isPayment: true,
       orderType: 'takeout'
     };
    setMessages(prev => [...prev, deliveryConfirmMessage]);
  };

  const handleContactInfo = (contact) => {
    setContactInfo(contact);
    
    if (diningPreference === 'takeout') {
      // For takeout, we already collected payment, so complete the order
      completeOrder(contact);
    } else {
      // For dine-in, proceed to payment
      setCheckoutStep('payment');
      setTransferExpiry(900); // 15 minutes countdown
      const finalTotal = getTotalPrice();
      const paymentMessage = {
        id: Date.now(),
        text: `Thank you! We have your contact information: ${contact}\n\nTotal: ₦${finalTotal}\n\nPlease make a transfer to the account below to confirm your order.`,
        sender: 'bot',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isPayment: true,
        orderType: 'dine-in'
      };
      setMessages(prev => [...prev, paymentMessage]);
    }
  };

  const handlePayment = (paymentInfo) => {
    // Simulate payment processing
    const processingMessage = {
      id: Date.now(),
      text: "Processing your payment...",
      sender: 'bot',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, processingMessage]);

    setTimeout(() => {
      if (diningPreference === 'takeout') {
        // For takeout, ask for contact info after payment
        setCheckoutStep('contact-info');
        const contactMessage = {
          id: Date.now(),
          text: "Payment successful! 💳✅\n\nPlease provide your email or phone number for delivery updates.",
          sender: 'bot',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, contactMessage]);
      } else {
        // For dine-in, complete the order
        completeOrder();
      }
    }, 2000);
  };

  const completeOrder = (contact = contactInfo) => {
    setCheckoutStep(null);
    
    const finalTotal = diningPreference === 'takeout' 
      ? (parseFloat(getTotalPrice()) + deliveryFee).toFixed(2)
      : getTotalPrice();
    
    const confirmationMessage = {
       id: Date.now(),
       text: `🎉 Order confirmed! Payment successful!\n\n📧 Contact: ${contact}\n🍽️ Service: ${diningPreference === 'takeout' ? 'Takeout' : 'Dine-in'}${diningPreference === 'takeout' ? `\n📍 Delivery to: ${deliveryAddress}` : ''}\n💰 Total: ₦${finalTotal}\n\nWe'll ${diningPreference === 'takeout' ? 'deliver your order and ' : ''}notify you when your food is ready. Thank you for choosing NectarV!`,
       sender: 'bot',
       timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
     };
    setMessages(prev => [...prev, confirmationMessage]);
    
    // Reset cart and checkout state
    setCart([]);
    setDiningPreference(null);
    setDeliveryAddress('');
    setDeliveryFee(0);
    setContactInfo('');
    setTransferExpiry(null);
  };

  return (
    <div className="h-screen flex flex-col" style={{background: colors.background}}>
      {/* Header */}
      <HeaderNav colors={colors} theme={theme} setTheme={setTheme} mode={mode} setShowCart={setShowCart} getTotalItems={getTotalItems} />

      {/* Scrollable Content Area */}
      <div 
        className="flex-1 overflow-y-auto" 
        style={{
          background: colors.background,
          willChange: mode === 'shop' ? 'contents' : 'auto',
          contain: mode === 'shop' ? 'layout style' : 'none'
        }} 
        ref={chatScrollRef}
      >
        {/* Hero Section */}
        <Hero colors={colors} theme={theme} mode={mode} setMode={setMode} />

        {/* AI Chat Area */}
        {mode === 'ai' && (
        <div className="max-w-4xl mx-auto px-3 sm:px-6 py-4 sm:py-6 pb-20">
          <div className="space-y-3 sm:space-y-6">
            {messages.map((message) => (
              <div key={message.id} className={`flex mb-3 sm:mb-4 ${
                message.sender === 'user' ? 'justify-end' : 'justify-start'
              }`}>
                {message.isCategoryMenu ? (
                  <div className="w-full max-w-2xl">
                    <div className="rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-lg" style={{background: colors.cardBg, border: `1px solid ${colors.cardBorder}`}}>
                      <div className="flex items-center mb-3 sm:mb-4">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full overflow-hidden mr-2 sm:mr-3">
                          <img src="/images/salad.jpg" alt="category" className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <p className="font-medium text-sm sm:text-base" style={{color: colors.text}}>{message.text}</p>
                          <div className="text-xs mt-1" style={{color: colors.mutedText}}>{message.timestamp}</div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {message.categories.map((category, categoryIndex) => (
                          <div 
                              key={categoryIndex} 
                              className="rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group transform hover:-translate-y-2 flex flex-col h-full"
                              style={{background: colors.cardBg, border: `1px solid ${colors.cardBorder}`}}
                            onClick={() => {
                              // Blur any focused input on mobile to dismiss keyboard
                              if (window.innerWidth <= 768 && document.activeElement) {
                                document.activeElement.blur();
                              }
                              const categoryMessage = {
                                id: Date.now(),
                                text: `Show me ${category.name}`,
                                sender: 'user',
                                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                              };
                              setMessages(prev => [...prev, categoryMessage]);
                              
                              (async () => {
                                try {
                                  let items = [];
                                  let catId = null;
                                  const localMatch = (categories || []).find(c => c.name === category.name);
                                  if (localMatch?._id) {
                                    catId = localMatch._id;
                                  } else {
                                    // Fallback: find via categories query data (already loaded)
                                    const match = (categories || []).find(c => c.name === category.name);
                                    if (match?._id) catId = match._id;
                                  }
                                  if (catId) {
                                    const { data: itemsData } = await triggerGetMenuItems({ category: catId, active: true, available: true });
                                    if (Array.isArray(itemsData)) {
                                      items = itemsData.map(it => ({
                                        name: it.name,
                                        price: `₦${Number(it.price).toFixed(2)}`,
                                        description: it.description,
                                        emoji: it.emoji || category.emoji
                                      }));
                                    }
                                  }
                                  const itemsResponse = {
                                    id: Date.now() + 1,
                                    text: `Here are our ${category.name}:`,
                                    sender: 'bot',
                                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                                    isItemMenu: true,
                                    categoryName: category.name,
                                    items
                                  };
                                  setMessages(prev => [...prev, itemsResponse]);
                                } catch (e) {
                                  console.error('Failed to load items', e);
                                }
                              })();
                            }}
                          >
                            {/* Card Header with Badge */}
                            <div className="relative">
                              <div className="p-0 text-center relative overflow-hidden h-48">
                                <img 
                                  src={category.name === '🥗 Fresh Salads' ? '/images/salad.jpg' : 
                                       category.name === '🍲 Hearty Bowls' ? '/images/b.jpg' : 
                                       '/images/c.jpg'}
                                  alt={category.description}
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute top-3 right-3">
                                  <span className="text-white text-xs px-2 py-1 rounded-full font-medium" style={{background: colors.amber500}}>Popular</span>
                                </div>
                              </div>
                            </div>
                            
                            {/* Card Content */}
                            <div className="p-3 flex flex-col grow">
                              <div className="mb-3">
                                <h3 className="font-bold group-hover:text-green-700 transition-colors text-lg" style={{color: colors.text}}>{category.name}</h3>
                              </div>
                              
                              <p className="text-sm leading-relaxed mb-4" style={{color: colors.mutedText, minHeight: '64px'}}>{category.description}</p>
                              
                              {/* Action Button */}
                              <button className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-4 rounded-xl transition-colors duration-200 flex items-center justify-center space-x-2 group-hover:bg-green-600 mt-auto">
                                <img src="/file.svg" alt="shopping bag" className="w-5 h-5 filter brightness-0 invert" />
                                <span>Browse Category</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="mt-4 sm:mt-6 p-3 sm:p-4 rounded-lg" style={{background: colors.green50, border: `1px solid ${colors.green500}`}}>
                          <p className="text-xs sm:text-sm text-center font-medium" style={{color: colors.green700}}>
                          💡 Click on any category to see the items!
                        </p>
                      </div>
                    </div>
                  </div>
                ) : message.isItemMenu ? (
                  <div className="w-full max-w-2xl">
                    <div className="rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-lg" style={{background: colors.cardBg, border: `1px solid ${colors.cardBorder}`}}>
                      <div className="flex items-center mb-3 sm:mb-4">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full overflow-hidden mr-2 sm:mr-3">
                          <img src="/images/b.jpg" alt="items" className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <p className="font-medium text-sm sm:text-base" style={{color: colors.text}}>{message.text}</p>
                          <div className="text-xs mt-1" style={{color: colors.mutedText}}>{message.timestamp}</div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {message.items.map((item, itemIndex) => (
                          <div 
                            key={itemIndex} 
                            className="rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group transform hover:-translate-y-2 flex flex-col h-full"
                            style={{background: colors.cardBg, border: `1px solid ${colors.cardBorder}`}}
                            onClick={() => {
                              // Blur any focused input on mobile to dismiss keyboard
                              if (window.innerWidth <= 768 && document.activeElement) {
                                document.activeElement.blur();
                              }
                              
                              // Add item to cart
                              addToCart(item);
                              
                              const orderMessage = {
                                id: Date.now(),
                                text: `Add ${item.name} to cart (${item.price})`,
                                sender: 'user',
                                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                              };
                              setMessages(prev => [...prev, orderMessage]);
                              
                              setTimeout(() => {
                  const confirmMessage = {
                    id: Date.now() + 1,
                    text: `✅ ${item.name} has been added to your cart! You now have ${getTotalItems() + 1} item(s) in your cart.\n\nWould you like to add more items to your order, or are you ready to checkout?`,
                    sender: 'bot',
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  };
                  setMessages(prev => [...prev, confirmMessage]);
                }, 1000);
                            }}
                          >
                            {/* Card Header */}
                            <div className="relative text-center overflow-hidden h-48">
                              <img
                                src={(item.emoji === '🥗' || item.emoji === '🌱' || item.emoji === '🥬') ? '/images/salad.jpg' :
                                     (item.emoji === '🍲' || item.emoji === '💪' || item.emoji === '🌿') ? '/images/b.jpg' :
                                     '/images/c.jpg'}
                                alt={item.name}
                                className="absolute inset-0 w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent"></div>
                              

                            </div>
                            
                            {/* Card Content */}
                            <div className="p-3 flex flex-col grow">
                              <h4 className="font-bold group-hover:text-green-700 transition-colors text-lg mb-1" style={{color: colors.text}}>{item.name}</h4>
                              <span className="inline-block text-green-600 font-semibold text-lg sm:text-xl mb-2">{item.price}</span>
                              <p className="text-sm leading-relaxed mb-4" style={{color: colors.mutedText, minHeight: '64px'}}>{item.description}</p>
                              
                              {/* Action Hint */}
                              <div className="text-center mt-auto">
                                <span className="text-xs text-green-600">Click to add to cart</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="mt-4 sm:mt-6 p-3 sm:p-4 rounded-lg" style={{background: colors.green50, border: `1px solid ${colors.green500}`}}>
                        <p className="text-xs sm:text-sm text-center font-medium" style={{color: colors.green700}}>
                          💡 Click on any item to add it to your order!
                        </p>
                      </div>
                    </div>
                  </div>
                ) : message.isCheckoutBill ? (
                  <div className="w-full max-w-2xl">
                    <div className="rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-lg" style={{background: colors.cardBg, border: `1px solid ${colors.cardBorder}`}}>
                      <div className="flex items-center mb-3 sm:mb-4">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full overflow-hidden mr-2 sm:mr-3">
                          <img src="/images/c.jpg" alt="bill" className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <p className="font-medium text-sm sm:text-base whitespace-pre-wrap" style={{color: colors.text}}>{message.text}</p>
                          <div className="text-xs mt-1" style={{color: colors.mutedText}}>{message.timestamp}</div>
                        </div>
                      </div>
                      
                      <div className="grid gap-2 sm:gap-3 mt-4">
                        <button 
                          className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 text-sm sm:text-base"
                          onClick={() => {
                            // Blur any focused input on mobile to dismiss keyboard
                            if (window.innerWidth <= 768 && document.activeElement) {
                              document.activeElement.blur();
                            }
                            handleDiningPreference('takeout');
                          }}
                        >
                          🥡 Takeout / Delivery
                        </button>
                        <button 
                          className="bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 text-sm sm:text-base"
                          onClick={() => {
                            // Blur any focused input on mobile to dismiss keyboard
                            if (window.innerWidth <= 768 && document.activeElement) {
                              document.activeElement.blur();
                            }
                            handleDiningPreference('dine-in');
                          }}
                        >
                          🍽️ Dine In Restaurant
                        </button>
                      </div>
                    </div>
                  </div>
                ) : message.isPayment ? (
                  <div className="w-full max-w-2xl">
                    <div className="rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-lg" style={{background: colors.cardBg, border: `1px solid ${colors.cardBorder}`}}>
                      <div className="flex items-center mb-3 sm:mb-4">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full overflow-hidden mr-2 sm:mr-3">
                          <img src="/images/b.jpg" alt="payment" className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <p className="font-medium text-sm sm:text-base whitespace-pre-wrap" style={{color: colors.text}}>{message.text}</p>
                          <div className="text-xs mt-1" style={{color: colors.mutedText}}>{message.timestamp}</div>
                        </div>
                      </div>
                      
                      <div className="space-y-4 mt-4">
                         <div className="rounded-lg p-4" style={{background: colors.cardBg, border: `1px solid ${colors.cardBorder}`}}>
                           <h3 className="text-lg font-semibold mb-3 flex items-center" style={{color: colors.text}}>
                             🏦 Bank Transfer Details
                           </h3>
                           
                           <div className="space-y-3">
                             <div className="flex justify-between items-center p-3 rounded-lg" style={{background: theme === 'light' ? '#F9FAFB' : '#1F2937'}}>
                               <span className="text-sm font-medium" style={{color: colors.mutedText}}>Account Name:</span>
                               <span className="text-sm font-bold" style={{color: colors.text}}>NectarV Restaurant Ltd</span>
                             </div>
                             
                             <div className="flex justify-between items-center p-3 rounded-lg" style={{background: theme === 'light' ? '#F9FAFB' : '#1F2937'}}>
                               <span className="text-sm font-medium" style={{color: colors.mutedText}}>Account Number:</span>
                               <div className="flex items-center gap-2">
                                 <span className="text-sm font-bold font-mono" style={{color: colors.text}}>2087654321</span>
                                 <button 
                                   className="text-green-500 hover:text-green-700 text-xs"
                                   onClick={() => navigator.clipboard.writeText('2087654321')}
                                 >
                                   📋 Copy
                                 </button>
                               </div>
                             </div>
                             
                             <div className="flex justify-between items-center p-3 rounded-lg" style={{background: theme === 'light' ? '#F9FAFB' : '#1F2937'}}>
                               <span className="text-sm font-medium" style={{color: colors.mutedText}}>Bank:</span>
                               <span className="text-sm font-bold" style={{color: colors.text}}>First Bank of Nigeria</span>
                             </div>
                             
                             <div className="flex justify-between items-center p-3 rounded-lg" style={{background: colors.red50, border: `1px solid ${colors.red200}`}}>
                                <span className="text-sm font-medium" style={{color: colors.red700}}>⏰ Expires in:</span>
                            <span className={`text-sm font-bold ${transferExpiry <= 300 ? 'animate-pulse' : ''}`} style={{color: colors.red700}}>
                                  {formatTime(transferExpiry)}
                                </span>
                              </div>
                           </div>
                           
                           <div className="mt-4 p-3 rounded-lg" style={{background: colors.blue50, border: `1px solid ${colors.blue100}`}}>
                            <p className="text-xs" style={{color: colors.blue600}}>
                               💡 <strong>Important:</strong> Transfer the exact amount of <strong>₦{diningPreference === 'takeout' ? (parseFloat(getTotalPrice()) + deliveryFee).toFixed(2) : getTotalPrice()}</strong> to the account above. Your order will be confirmed automatically once payment is received.
                             </p>
                           </div>
                         </div>
                         
                         <button
                           className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 text-sm sm:text-base"
                           onClick={() => {
                             // Blur any focused input on mobile to dismiss keyboard
                             if (window.innerWidth <= 768 && document.activeElement) {
                               document.activeElement.blur();
                             }
                             handlePayment('Transfer completed successfully');
                           }}
                         >
                           ✅ I have completed the transfer
                         </button>
                       </div>
                    </div>
                  </div>
                ) : (
                  <div 
                    className="max-w-[85%] sm:max-w-xs lg:max-w-md px-3 sm:px-4 py-2 rounded-2xl relative"
                    style={{
                      background: message.sender === 'user' ? colors.messageUserBg : colors.messageBotBg,
                      color: message.sender === 'user' ? colors.messageUserText : colors.messageBotText,
                      borderBottomRightRadius: message.sender === 'user' ? '4px' : undefined,
                      borderBottomLeftRadius: message.sender === 'bot' ? '4px' : undefined
                    }}
                  >
                    <p className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap" style={{fontFamily: 'Gebuk, Arial, sans-serif'}}>
                      {message.text}
                    </p>
                    <div 
                      className="text-xs mt-1"
                      style={{
                        color: message.sender === 'user' ? 'rgba(255,255,255,0.7)' : colors.mutedText
                      }}
                    >
                      {message.timestamp}
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            {isTyping && (
              <div className="flex mb-3 sm:mb-4 justify-start">
                <div 
                  className="max-w-[85%] sm:max-w-xs lg:max-w-md px-3 sm:px-4 py-2 rounded-2xl"
                  style={{
                    background: colors.messageBotBg,
                    color: colors.messageBotText,
                    borderBottomLeftRadius: '4px'
                  }}
                >
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 rounded-full animate-bounce" style={{background: colors.mutedText}}></div>
                      <div className="w-2 h-2 rounded-full animate-bounce" style={{background: colors.mutedText, animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 rounded-full animate-bounce" style={{background: colors.mutedText, animationDelay: '0.2s'}}></div>
                    </div>
                    <span className="text-sm ml-2" style={{color: colors.mutedText}}>Thinking...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
        )}

        {/* Manual Shop Area */}
        {mode === 'shop' && (
          <>
            <ManualShop
              colors={colors}
              categories={categories}
              selectedCategoryId={selectedCategoryId}
              setSelectedCategoryId={setSelectedCategoryId}
              isLoadingItems={isLoadingItems}
              triggerGetMenuItems={triggerGetMenuItems}
              setIsLoadingItems={setIsLoadingItems}
              setManualItems={setManualItems}
              manualItems={manualItems}
              setDetailsItem={setDetailsItem}
              cart={cart}
              addToCart={addToCart}
            />
            {detailsItem && (
              <div className="fixed inset-0 z-50 flex items-center justify-center" style={{background: 'rgba(0,0,0,0.5)'}} onClick={() => setDetailsItem(null)}>
                <div className="w-full max-w-md mx-3 rounded-2xl shadow-lg relative" style={{background: colors.cardBg, border: `1px solid ${colors.cardBorder}`}} onClick={(e) => e.stopPropagation()}>
                  <button className="absolute top-2 right-2 p-2 rounded-full" style={{background: 'transparent', color: colors.text}} onClick={() => setDetailsItem(null)}>
                    <IoClose className="w-5 h-5" />
                  </button>
                  <div className="relative h-64 sm:h-72 lg:h-80 rounded-t-2xl overflow-hidden">
                    <img
                      src={(detailsItem.emoji === '🥗' || detailsItem.emoji === '🌱' || detailsItem.emoji === '🥬') ? '/images/salad.jpg' :
                           (detailsItem.emoji === '🍲' || detailsItem.emoji === '💪' || detailsItem.emoji === '🌿') ? '/images/b.jpg' :
                           '/images/c.jpg'}
                      alt={detailsItem.name}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent"></div>
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-bold mb-1" style={{color: colors.text}}>{detailsItem.name}</h3>
                    <div className="text-green-600 font-semibold mb-2">{detailsItem.price}</div>
                    <p className="text-sm" style={{color: colors.mutedText}}>{detailsItem.description}</p>
                    <div className="mt-4 flex gap-2">
                      <button className="w-1/2 font-semibold py-2.5 rounded-lg border" style={{borderColor: colors.cardBorder, background: colors.cardBg, color: colors.text}} onClick={() => setDetailsItem(null)}>Close</button>
                      <button
                        className={`w-1/2 font-semibold py-2.5 rounded-lg transition-colors ${cart.some(ci => ci.name === detailsItem.name) ? 'bg-gray-300 text-gray-600 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600 text-white'}`}
                        onClick={() => { if (!cart.some(ci => ci.name === detailsItem.name)) { addToCart(detailsItem); } }}
                        disabled={cart.some(ci => ci.name === detailsItem.name)}
                      >
                        {cart.some(ci => ci.name === detailsItem.name) ? '✓ Added to Cart' : 'Add to Cart'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Cart Sidebar */}
      {showCart && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={() => setShowCart(false)}>
          <div 
            className="fixed right-0 top-0 h-full w-full sm:max-w-md shadow-xl transform transition-transform duration-300 ease-in-out overflow-y-auto" style={{background: colors.background}}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3 sm:p-4" style={{borderBottom: `1px solid ${colors.cardBorder}`}}>
              <div className="flex items-center justify-between">
                <h2 className="text-lg sm:text-xl font-bold" style={{color: colors.text}}>Your Cart</h2>
                <button 
                  onClick={() => setShowCart(false)}
                  className="p-2 rounded-full transition-colors touch-manipulation"
                  style={{background: theme === 'light' ? '#F3F4F6' : '#374151'}}
                >
                  <IoClose className="w-5 h-5 sm:w-6 sm:h-6" style={{color: colors.text}} />
                </button>
              </div>
            </div>
            
            <div className="flex-1 p-3 sm:p-4">
              {cart.length === 0 ? (
                <div className="text-center py-6 sm:py-8">
                  <div className="text-4xl sm:text-6xl mb-3 sm:mb-4">🛒</div>
                  <p className="text-base sm:text-lg" style={{color: colors.mutedText}}>Your cart is empty</p>
                  <p className="text-xs sm:text-sm mt-2" style={{color: colors.mutedText, opacity: 0.7}}>Add some delicious items to get started!</p>
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {isManualCheckout && (
                    <div className="rounded-lg p-3 sm:p-4" style={{background: colors.cardBg, border: `1px solid ${colors.cardBorder}`}}>
                      {manualStep === 'dining-preference' && (
                        <div className="space-y-3">
                          <p className="font-semibold" style={{color: colors.text}}>How would you like to get your order?</p>
                          <div className="grid gap-2 sm:gap-3">
                            <button className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2.5 px-4 rounded-lg" onClick={() => { setManualDiningPreference('takeout'); setManualStep('delivery-address'); }}>🥡 Takeout / Delivery</button>
                            <button className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2.5 px-4 rounded-lg" onClick={() => { setManualDiningPreference('dine-in'); setManualStep('contact-info'); }}>🍽️ Dine In Restaurant</button>
                          </div>
                        </div>
                      )}

                      {manualStep === 'delivery-address' && (
                        <div className="space-y-3">
                          <p className="font-semibold" style={{color: colors.text}}>Enter delivery address:</p>
                          <textarea
                            value={manualDeliveryAddress}
                            onChange={(e) => setManualDeliveryAddress(e.target.value)}
                            className="w-full border rounded-lg px-3 py-2"
                            style={{borderColor: colors.cardBorder, background: colors.cardBg, color: colors.text}}
                            rows={3}
                            placeholder="123 Example Street, City"
                          />
                          <div className="flex gap-2">
                            <button className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg" onClick={() => setManualStep('contact-info')}>Continue</button>
                            <button className="bg-gray-200 hover:bg-gray-300 font-semibold py-2 px-4 rounded-lg" style={{color: colors.text}} onClick={() => setManualStep('dining-preference')}>Back</button>
                          </div>
                        </div>
                      )}

                      {manualStep === 'contact-info' && (
                        <div className="space-y-3">
                          <p className="font-semibold" style={{color: colors.text}}>Enter contact (email or phone):</p>
                          <input
                            value={manualContact}
                            onChange={(e) => setManualContact(e.target.value)}
                            className="w-full border rounded-lg px-3 py-2"
                            style={{borderColor: colors.cardBorder, background: colors.cardBg, color: colors.text}}
                            placeholder="e.g. you@example.com or +234..."
                          />
                          <div className="flex gap-2">
                            <button className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg" onClick={() => setManualStep('payment')}>Continue</button>
                            <button className="bg-gray-200 hover:bg-gray-300 font-semibold py-2 px-4 rounded-lg" style={{color: colors.text}} onClick={() => setManualStep(manualDiningPreference === 'takeout' ? 'delivery-address' : 'dining-preference')}>Back</button>
                          </div>
                        </div>
                      )}

                      {manualStep === 'payment' && (
                        <div className="space-y-3">
                          <p className="font-semibold" style={{color: colors.text}}>Payment</p>
                          <div className="rounded-lg p-3" style={{background: colors.cardBg, border: `1px solid ${colors.cardBorder}`}}>
                            <p className="text-sm" style={{color: colors.mutedText}}>Transfer the exact amount of <strong className="text-green-600">₦{getTotalPrice()}</strong> to the account shown below to confirm your order.</p>
                            <div className="mt-3 space-y-2">
                              <div className="flex justify-between" style={{color: colors.text}}><span>Account Name</span><strong>NectarV Restaurant Ltd</strong></div>
                              <div className="flex justify-between" style={{color: colors.text}}><span>Account Number</span><strong className="font-mono">2087654321</strong></div>
                              <div className="flex justify-between" style={{color: colors.text}}><span>Bank</span><strong>First Bank of Nigeria</strong></div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold py-2.5 rounded-lg" onClick={async () => { 
                              try {
                                console.log('Cart items:', cart);
                                
                                // Validate cart items have required fields
                                const invalidItems = cart.filter(item => !item._id);
                                if (invalidItems.length > 0) {
                                  console.error('Cart items missing _id:', invalidItems);
                                  alert('Some items in your cart are missing required information.\n\nPlease:\n1. Clear your cart\n2. Refresh the page\n3. Add items again\n\nThis is needed to include the item IDs.');
                                  return;
                                }
                                
                                // Create order in backend
                                const totalAmount = getTotalPrice();
                                const orderData = {
                                  customerName: manualContact || 'Guest Customer',
                                  customerEmail: manualContact.includes('@') ? manualContact : '',
                                  customerPhone: !manualContact.includes('@') ? manualContact : '',
                                  totalAmount: totalAmount,
                                  status: 'pending',
                                  paymentMethod: 'cash',
                                  table: manualDiningPreference === 'dine-in' ? 'Dine-in' : (manualDeliveryAddress || 'Delivery'),
                                  orderItems: cart.map(item => ({
                                    menuItem: item._id,
                                    quantity: item.quantity || 1,
                                    price: parseFloat(item.price.replace(/[^0-9.]/g, '')) || 0
                                  }))
                                };
                                console.log('Creating order with data:', orderData);
                                console.log('Order items:', orderData.orderItems);
                                
                                const result = await createOrder(orderData).unwrap();
                                console.log('Order created successfully:', result);
                                setManualStep('confirmed');
                              } catch (error) {
                                console.error('Failed to create order - Full error:', error);
                                console.error('Error data:', error?.data);
                                console.error('Error message:', error?.message);
                                const errorMsg = error?.data?.message || error?.message || 'Unknown error';
                                alert(`Failed to create order: ${errorMsg}\n\nCheck console for details.`);
                              }
                            }}>✅ I have completed the transfer</button>
                            <button className="bg-gray-200 hover:bg-gray-300 font-semibold px-4 rounded-lg" style={{color: colors.text}} onClick={() => setManualStep('contact-info')}>Back</button>
                          </div>
                        </div>
                      )}

                      {manualStep === 'confirmed' && (
                        <div className="space-y-3">
                          <p className="font-semibold" style={{color: colors.text}}>🎉 Order confirmed!</p>
                          <p className="text-sm" style={{color: colors.mutedText}}>We will {manualDiningPreference === 'takeout' ? 'deliver your order to' : 'notify you at'} {manualDiningPreference === 'takeout' ? manualDeliveryAddress : manualContact} when your food is ready.</p>
                          <button className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2.5 px-4 rounded-lg" onClick={() => { setCart([]); resetManualCheckout(); setShowCart(false); }}>Done</button>
                        </div>
                      )}
                    </div>
                  )}
                  {cart.map((item, index) => (
                    <div key={index} className="rounded-lg p-3 sm:p-4" style={{background: colors.cardBg, border: `1px solid ${colors.cardBorder}`}}>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center mb-1">
                            <span className="text-base sm:text-lg mr-2">{item.emoji}</span>
                            <h3 className="font-semibold text-sm sm:text-base" style={{color: colors.text}}>{item.name}</h3>
                          </div>
                          <p className="text-xs sm:text-sm mb-2" style={{color: colors.mutedText}}>{item.description}</p>
                          <p className="text-base sm:text-lg font-bold text-green-600">{item.price}</p>
                        </div>
                        <button 
                          onClick={() => removeFromCart(item.name)}
                          className="p-2 rounded-full transition-colors text-red-500 touch-manipulation flex-shrink-0"
                          style={{background: theme === 'light' ? '#FEF2F2' : '#3A2020'}}
                        >
                          <IoTrash className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 sm:space-x-3">
                          <button 
                            onClick={() => updateQuantity(item.name, item.quantity - 1)}
                            className="w-9 h-9 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-colors touch-manipulation"
                            style={{background: theme === 'light' ? '#E5E7EB' : '#4B5563', color: colors.text}}
                          >
                            <span className="text-lg font-bold">-</span>
                          </button>
                          <span className="font-semibold text-base sm:text-lg px-2 sm:px-3 min-w-[2rem] text-center" style={{color: colors.text}}>{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.name, item.quantity + 1)}
                            className="w-9 h-9 sm:w-8 sm:h-8 rounded-full bg-green-500 hover:bg-green-600 text-white flex items-center justify-center transition-colors touch-manipulation"
                          >
                            <span className="text-lg font-bold">+</span>
                          </button>
                        </div>
                        <div className="text-right">
                          <p className="text-xs sm:text-sm" style={{color: colors.mutedText}}>Subtotal</p>
                          <p className="font-bold text-green-600 text-sm sm:text-base">₦{(parseFloat(String(item.price).replace(/[^\d.]/g, '')) * item.quantity).toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <div className="pt-3 sm:pt-4 mt-4 sm:mt-6" style={{borderTop: `1px solid ${colors.cardBorder}`}}>
                    <div className="flex justify-between items-center mb-3 sm:mb-4">
                      <span className="text-lg sm:text-xl font-bold" style={{color: colors.text}}>Total:</span>
                      <span className="text-xl sm:text-2xl font-bold text-green-600">₦{getTotalPrice()}</span>
                    </div>
                    
                    {!isManualCheckout && (
                      <button 
                        className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 sm:py-3 px-4 rounded-lg transition-colors touch-manipulation text-sm sm:text-base"
                        onClick={() => {
                          // Manual checkout inside cart (Shop mode)
                          setIsManualCheckout(true);
                          setManualStep('dining-preference');
                        }}
                      >
                        Proceed to Checkout ({getTotalItems()} items)
                      </button>
                    )}
                    
                    <button 
                      onClick={() => setShowCart(false)}
                      className="w-full mt-2 font-medium py-2 sm:py-2 px-4 rounded-lg transition-colors touch-manipulation text-sm sm:text-base"
                      style={{background: theme === 'light' ? '#E5E7EB' : '#4B5563', color: colors.text}}
                    >
                      Continue Shopping
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Input Area (AI mode only) */}
      {mode === 'ai' && (
      <div className="px-3 sm:px-6 py-3 sm:py-4 flex-shrink-0" style={{background: colors.background}}>
        <div className="max-w-4xl mx-auto flex justify-center">
          <div className="rounded-full shadow-md border border-green-100 px-3 sm:px-4 py-2 sm:py-3 flex items-center gap-2 sm:gap-3 w-full max-w-3xl" style={{background: colors.background}}>
            {/* Cart Button */}
            <button
              onClick={() => setShowCart(true)}
              className="flex-shrink-0 p-2 sm:p-2.5 bg-green-500 hover:bg-green-600 text-white rounded-full transition-colors touch-manipulation relative flex items-center justify-center"
              style={{ 
                minWidth: isMobile ? '40px' : '44px',
                minHeight: isMobile ? '40px' : '44px',
                width: isMobile ? '40px' : '44px',
                height: isMobile ? '40px' : '44px'
              }}
            >
              <HiShoppingCart className="w-5 h-5 sm:w-6 sm:h-6" />
              {getTotalItems() > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {getTotalItems()}
                </span>
              )}
            </button>
            
            <div className="flex-1 relative flex items-center">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about our menu, specials, or anything else..."
                className="w-full resize-none border-0 bg-transparent rounded-full px-3 sm:px-4 py-2 pr-12 sm:pr-14 focus:outline-none max-h-24 sm:max-h-32 font-medium text-sm sm:text-base"
                rows={1}
                style={{
                  height: 'auto',
                  minHeight: isMobile ? '40px' : '44px',
                  maxHeight: isMobile ? '96px' : '128px',
                  fontFamily: 'Gebuk, Arial, sans-serif',
                  color: colors.text
                }}
                onInput={(e) => {
                  const maxHeight = isMobile ? 96 : 128;
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, maxHeight) + 'px';
                }}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim()}
                className="absolute right-1 sm:right-2 p-2 sm:p-2.5 bg-green-500 text-white rounded-full hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center touch-manipulation"
                style={{
                  minWidth: isMobile ? '36px' : '40px',
                  minHeight: isMobile ? '36px' : '40px',
                  width: isMobile ? '36px' : '40px',
                  height: isMobile ? '36px' : '40px'
                }}
              >
                <IoSend className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
      )}
      <style jsx>{`
        .talker {
          position: relative;
          width: 140px;
          height: 140px;
          border-radius: 9999px;
          background: radial-gradient(100px 100px at 50% 40%, #e6f0ff, ${'#ffffff'} 60%);
          box-shadow: 0 10px 30px rgba(0,0,0,0.08), inset 0 -10px 20px rgba(0,0,0,0.06);
          transition: transform .25s ease, box-shadow .25s ease;
        }
        .talker:hover { transform: translateY(-2px); box-shadow: 0 16px 40px rgba(0,0,0,0.12), inset 0 -12px 22px rgba(0,0,0,0.06);} 
        .speaking .mouth { animation: speak 0.4s ease-in-out infinite; }


        .eye { position:absolute; top: 44%; width: 14px; height: 14px; background:#111827; border-radius:9999px; }
        .eye.left { left: 38%; }
        .eye.right { right: 38%; }
        .mouth { position:absolute; bottom: 34%; left: 50%; width: 44px; height: 12px; background:#111827; border-radius: 9999px; transform: translateX(-50%); }

        @keyframes speak { 0%,100%{ height: 12px; border-radius: 9999px;} 50%{ height: 4px; border-radius: 9999px; } }


      `}</style>
    </div>
  );
}
