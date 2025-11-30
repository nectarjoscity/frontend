'use client';

import { useState, useRef, useEffect, useTransition, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Script from 'next/script';
import { useRouter, useSearchParams } from 'next/navigation';
import { useGetCategoriesQuery, useLazyGetMenuItemsQuery, useCreateOrderMutation, useCreateVirtualAccountMutation, useVerifyPaymentMutation, useLoginMutation, useRegisterMutation } from '../services/api';
import { interpret, toChatMessageFromResponse } from '../services/nlp';
import { useTheme } from './providers';
import { IoClose, IoSend, IoTrash, IoCashOutline, IoCardOutline, IoCheckmarkCircleOutline } from 'react-icons/io5';
import { HiShoppingCart } from 'react-icons/hi2';
import HeaderNav from './components/HeaderNav';
import Hero from './components/Hero';
import ManualShop from './components/ManualShop';
import CartSidebar from './components/CartSidebar';
import InputArea from './components/InputArea';
import GeofenceGuard from './components/GeofenceGuard';
import { isPreOrderLandingPage } from '../utils/landingPage';

export default function RestaurantChat() {
  const { colors, theme, setTheme } = useTheme();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
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
  const [mode, setMode] = useState('shop'); // 'ai' | 'shop' - default to shop mode
  const searchParams = useSearchParams();

  useEffect(() => {
    const modeParam = searchParams.get('mode');
    if (modeParam === 'ai' || modeParam === 'shop') {
      setMode(modeParam);
    }
  }, [searchParams]);

  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [manualItems, setManualItems] = useState([]);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [isManualCheckout, setIsManualCheckout] = useState(false);
  const [manualStep, setManualStep] = useState(null); // 'dining-preference' | 'delivery-address' | 'contact-info' | 'payment' | 'confirmed'
  const [manualDiningPreference, setManualDiningPreference] = useState(null); // 'takeout' | 'dine-in'
  const [manualDeliveryAddress, setManualDeliveryAddress] = useState('');
  const [manualContact, setManualContact] = useState('');
  const [manualPaymentMethod, setManualPaymentMethod] = useState('cash'); // 'cash' | 'transfer'
  const [manualTransferConfirmed, setManualTransferConfirmed] = useState(false);
  const [detailsItem, setDetailsItem] = useState(null);
  const [tableNumber, setTableNumber] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('nectarv_table_number') || '';
    }
    return '';
  });
  
  // User state for logged-in users
  const [currentUser, setCurrentUser] = useState(null);
  
  // Load user from localStorage on mount and listen for auth changes
  useEffect(() => {
    const loadUser = () => {
      if (typeof window !== 'undefined') {
        const storedUser = localStorage.getItem('nv_user');
        if (storedUser) {
          try {
            setCurrentUser(JSON.parse(storedUser));
          } catch (e) {
            console.error('Failed to parse stored user:', e);
          }
        } else {
          setCurrentUser(null);
        }
      }
    };
    
    loadUser();
    
    // Listen for auth changes
    const handleAuthChange = () => loadUser();
    window.addEventListener('nv_auth_change', handleAuthChange);
    return () => window.removeEventListener('nv_auth_change', handleAuthChange);
  }, []);

  // Check landing page setting and redirect if needed
  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      // Only redirect on the root path, not if user navigated directly to a specific route
      if (window.location.pathname === '/' && isPreOrderLandingPage()) {
        router.replace('/preorder');
      }
    }
  }, [router]);

  // Prevent body scroll when modal is open and keep modal in viewport
  useEffect(() => {
    if (detailsItem) {
      // Save current scroll position
      const scrollY = window.scrollY;
      // Lock body scroll
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';

      return () => {
        // Restore scroll position
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [detailsItem]);
  const [overrideTableNumber, setOverrideTableNumber] = useState('');

  const resetManualCheckout = () => {
    setIsManualCheckout(false);
    setManualStep(null);
    setManualDiningPreference(null);
    setManualDeliveryAddress('');
    setManualContact('');
    setOverrideTableNumber('');
    setManualPaymentMethod('cash');
    setManualTransferConfirmed(false);
    setPaymentDetails(null);
    setPaymentError(null);
  };

  // Load table number from localStorage on mount and listen for changes
  useEffect(() => {
    const loadTableNumber = () => {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('nectarv_table_number') || '';
        setTableNumber(stored);
      }
    };

    loadTableNumber();

    // Listen for storage changes (when table number is updated in settings)
    const handleStorageChange = (e) => {
      if (e.key === 'nectarv_table_number') {
        setTableNumber(e.newValue || '');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

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
  const [createVirtualAccount, { isLoading: isCreatingAccount }] = useCreateVirtualAccountMutation();
  const [verifyPayment, { isLoading: isVerifyingPayment }] = useVerifyPaymentMutation();
  const [login] = useLoginMutation();
  const [register] = useRegisterMutation();
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [paymentError, setPaymentError] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleAuthAction = async (action) => {
    try {
      const { operation, filters } = action;
      const payload = filters?.payload || {};

      let result;
      if (operation === 'login') {
        try {
          result = await login(payload).unwrap();
        } catch (loginErr) {
          // If login fails due to invalid credentials, try to register automatically
          const errorMsg = loginErr?.data?.message || loginErr?.message || '';
          if (errorMsg.toLowerCase().includes('invalid credentials') ||
            errorMsg.toLowerCase().includes('user not found') ||
            errorMsg.toLowerCase().includes('incorrect password')) {

            console.log('[AUTH] Login failed with invalid credentials, attempting auto-registration');

            // Extract name from email if not provided
            const autoName = payload.name || payload.email?.split('@')[0] || 'User';
            const registerPayload = {
              ...payload,
              name: autoName,
              username: payload.username || payload.email?.split('@')[0]
            };

            try {
              result = await register(registerPayload).unwrap();
              if (result && result.token) {
                localStorage.setItem('nv_token', result.token);
                if (result.user) {
                  localStorage.setItem('nv_user', JSON.stringify(result.user));
                }
                window.dispatchEvent(new Event('nv_auth_change'));
                return {
                  success: true,
                  message: `Account created successfully! Welcome, ${result.user?.name || autoName}! 🎉`
                };
              }
            } catch (registerErr) {
              console.error('Auto-registration failed:', registerErr);
              const registerErrMsg = registerErr?.data?.message || registerErr?.message || '';

              // If email already exists, inform user to try logging in with correct password
              if (registerErrMsg.toLowerCase().includes('email already') ||
                registerErrMsg.toLowerCase().includes('already registered')) {
                return {
                  success: false,
                  message: `This email is already registered. Please check your password and try again.`
                };
              }

              return {
                success: false,
                message: `Could not log in or create account: ${registerErrMsg}`
              };
            }
          } else {
            // Other login errors (not invalid credentials)
            throw loginErr;
          }
        }
      } else if (operation === 'register') {
        result = await register(payload).unwrap();
      }

      if (result && result.token) {
        localStorage.setItem('nv_token', result.token);
        if (result.user) {
          localStorage.setItem('nv_user', JSON.stringify(result.user));
        }
        // Dispatch event to notify other components if needed
        window.dispatchEvent(new Event('nv_auth_change'));
        return { success: true, message: `Successfully ${operation === 'login' ? 'logged in' : 'registered'}! Welcome back, ${result.user?.name || 'User'}.` };
      }
    } catch (err) {
      console.error('Auth error:', err);
      return { success: false, message: `Authentication failed: ${err?.data?.message || err?.message || 'Unknown error'}` };
    }
    return { success: false, message: 'Authentication failed' };
  };


  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Reset payment details when payment method changes or checkout is reset
  useEffect(() => {
    if (manualPaymentMethod !== 'transfer' || !isManualCheckout) {
      setPaymentDetails(null);
      setPaymentError(null);
    }
  }, [manualPaymentMethod, isManualCheckout]);

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

  const scrollToBottom = useCallback((force = false) => {
    // Don't auto-scroll in shop mode to prevent glitches
    if (mode === 'shop') return;

    const container = chatScrollRef.current;
    if (!container) return;
    const nearBottom = (container.scrollTop + container.clientHeight) >= (container.scrollHeight - 120);
    if (!nearBottom && !force) return;
    container.scrollTo({ top: container.scrollHeight, behavior: 'auto' });
  }, [mode]);

  useEffect(() => {
    // Only scroll in AI mode
    if (mode === 'ai') {
      scrollToBottom();
    }
  }, [messages, mode, scrollToBottom]);

  // Delight: short speaking animation on initial load
  useEffect(() => {
    setIsSpeaking(true);
    const t = setTimeout(() => setIsSpeaking(false), 1200);
    return () => clearTimeout(t);
  }, []);

  // Default load first category items in Shop mode (oldest first)
  useEffect(() => {
    const preloadFirstCategory = async () => {
      if (mode !== 'shop') return;
      if (!categories || !categories.length) return;
      if (selectedCategoryId) return;
      // Get the last category (oldest) since we'll reverse the array for display
      const reversedCategories = [...categories].reverse();
      const first = reversedCategories[0];
      setSelectedCategoryId(first._id);
      setIsLoadingItems(true);
      try {
        const { data: itemsData } = await triggerGetMenuItems({ category: first._id, active: true });
        const mapped = Array.isArray(itemsData) ? itemsData.map(it => ({
          _id: it._id,
          name: it.name,
          price: `₦${Number(it.price).toFixed(2)}`,
          description: it.description,
          emoji: it.emoji || first.emoji,
          imageUrl: it.imageUrl || null,
          isAvailable: it.isAvailable !== false
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
      handleDeliveryAddress(newMessage.text.trim());
      setIsTyping(false);
      setIsSpeaking(false);
      return;
    } else if (checkoutStep === 'contact-info') {
      handleContactInfo(newMessage.text.trim());
      setIsTyping(false);
      setIsSpeaking(false);
      return;
    } else if (checkoutStep === 'payment') {
      handlePayment(newMessage.text.trim());
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
          ? [...categories].reverse().map(c => ({ name: c.name, description: c.description, emoji: c.emoji }))
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

      // Check if response contains auth token (successful login/registration from NLP flow)
      if (resp && resp.token && resp.success) {
        console.log('[AUTH] Token received from NLP, saving to localStorage');
        localStorage.setItem('nv_token', resp.token);
        if (resp.user) {
          localStorage.setItem('nv_user', JSON.stringify(resp.user));
        }
        window.dispatchEvent(new Event('nv_auth_change'));
        
        const botMessage = {
          id: Date.now(),
          text: resp.message || `Welcome! You're now logged in.`,
          sender: 'bot',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, botMessage]);
        setIsTyping(false);
        setIsSpeaking(false);
        return;
      }

      // Auth actions (fallback for action mode)
      if (resp && resp.mode === 'action' && resp.targetService === 'auth') {
        const authResult = await handleAuthAction(resp);
        const botMessage = {
          id: Date.now(),
          text: authResult.message,
          sender: 'bot',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, botMessage]);
        setIsTyping(false);
        setIsSpeaking(false);
        return;
      }

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
            _id: it._id,
            name: it.name,
            price: typeof it.price === 'number' ? `₦${Number(it.price).toFixed(2)}` : String(it.price || ''),
            description: it.description,
            emoji: it.emoji,
            imageUrl: it.imageUrl || null,
            isAvailable: it.isAvailable !== false
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
          const apiCategories = [...resp.data].reverse().map(c => ({ name: c.name, description: c.description, emoji: c.emoji }));
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
        ? [...categories].reverse().map(c => ({ name: c.name, description: c.description, emoji: c.emoji }))
        : [
          { name: '🥗 Fresh Salads', description: 'Healthy and nutritious salad bowls', emoji: '🥗' },
          { name: '🍲 Hearty Bowls', description: 'Filling and satisfying meal bowls', emoji: '🍲' },
          { name: '🥤 Fresh Beverages', description: 'Refreshing smoothies and drinks', emoji: '🥤' }
        ];
      const categoryResponse = {
        id: messages.length + 2,
        text: 'Welcome to Nectar! Please choose a category to explore:',
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
    console.log('[addToCart] Adding item to cart:', item);
    const existingItem = cart.find(cartItem => cartItem.name === item.name);
    if (existingItem) {
      setCart(cart.map(cartItem =>
        cartItem.name === item.name
          ? { ...cartItem, quantity: cartItem.quantity + 1, _id: item._id || cartItem._id }
          : cartItem
      ));
    } else {
      const cartItem = { ...item, quantity: 1, _id: item._id };
      console.log('[addToCart] New cart item:', cartItem);
      setCart([...cart, cartItem]);
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

  // Create virtual account when transfer payment method is selected
  useEffect(() => {
    if (manualPaymentMethod === 'transfer' && !paymentDetails && !paymentError && !isCreatingAccount && manualStep === 'payment') {
      const createAccount = async () => {
        try {
          setPaymentError(null);
          // Calculate total price directly instead of calling getTotalPrice
          const totalPrice = parseFloat(cart.reduce((total, item) => {
            const price = parseFloat(String(item.price).replace(/[^\d.]/g, ''));
            return total + (price * item.quantity);
          }, 0).toFixed(2));
          if (totalPrice <= 0) {
            setPaymentError('Invalid amount');
            return;
          }
          const result = await createVirtualAccount({ amount: totalPrice }).unwrap();
          setPaymentDetails(result);
        } catch (error) {
          console.error('Error creating virtual account:', error);
          setPaymentError(error?.data?.message || error?.message || 'Failed to create payment account');
        }
      };
      createAccount();
    }
  }, [manualPaymentMethod, paymentDetails, paymentError, isCreatingAccount, manualStep, cart, createVirtualAccount]);

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
      text: `Here's your order summary:\n\n${cart.map(item => `${item.name} x${item.quantity} - ₦${(parseFloat(String(item.price).replace(/[^\d.]/g, '')) * item.quantity).toFixed(2)}`).join('\n')}\n\nSubtotal: ₦${getTotalPrice()}\n\nWould you like this for takeout or to dine in the restaurant?`,
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
      // If user is logged in, use their email and skip to payment
      if (currentUser?.email) {
        setContactInfo(currentUser.email);
        setCheckoutStep('payment');
        setTransferExpiry(900); // 15 minutes countdown
        const finalTotal = getTotalPrice();
        const paymentMessage = {
          id: Date.now(),
          text: `Perfect! We'll notify you at ${currentUser.email} when your order is ready.\n\nTotal: ₦${finalTotal}\n\nPlease make a transfer to the account below to confirm your order.`,
          sender: 'bot',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isPayment: true,
          orderType: 'dine-in'
        };
        setMessages(prev => [...prev, paymentMessage]);
      } else {
        // Not logged in, ask for contact info
        setCheckoutStep('contact-info');
        const contactMessage = {
          id: Date.now(),
          text: "Perfect! Please provide your email or phone number so we can notify you when your order is ready.",
          sender: 'bot',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, contactMessage]);
      }
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
        // For takeout, check if user is logged in
        if (currentUser?.email) {
          // User is logged in, use their email and complete order
          setContactInfo(currentUser.email);
          const successMessage = {
            id: Date.now(),
            text: `Payment successful! 💳✅\n\nWe'll send delivery updates to ${currentUser.email}.`,
            sender: 'bot',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
          setMessages(prev => [...prev, successMessage]);
          completeOrder(currentUser.email);
        } else {
          // Not logged in, ask for contact info
          setCheckoutStep('contact-info');
          const contactMessage = {
            id: Date.now(),
            text: "Payment successful! 💳✅\n\nPlease provide your email or phone number for delivery updates.",
            sender: 'bot',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
          setMessages(prev => [...prev, contactMessage]);
        }
      } else {
        // For dine-in, complete the order (contact already set if logged in)
        completeOrder(currentUser?.email || contactInfo);
      }
    }, 2000);
  };

  const completeOrder = async (contact = contactInfo) => {
    try {
      console.log('[AI Order Creation] Starting order creation...');
      console.log('[AI Order Creation] Cart items:', cart);
      console.log('[AI Order Creation] Contact:', contact);
      console.log('[AI Order Creation] Dining preference:', diningPreference);
      console.log('[AI Order Creation] Delivery address:', deliveryAddress);

      // Validate cart is not empty
      if (!cart || cart.length === 0) {
        console.error('[AI Order Creation] Cart is empty');
        const errorMessage = {
          id: Date.now(),
          text: "❌ Your cart is empty. Please add items before placing an order.",
          sender: 'bot',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, errorMessage]);
        setCheckoutStep(null);
        return;
      }

      // Validate cart items have required fields
      const invalidItems = cart.filter(item => !item._id);
      if (invalidItems.length > 0) {
        console.error('[AI Order Creation] Cart items missing _id:', invalidItems);
        const errorMessage = {
          id: Date.now(),
          text: `❌ Some items in your cart are missing required information. Please refresh and add items again.`,
          sender: 'bot',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, errorMessage]);
        setCheckoutStep(null);
        return;
      }

      // Calculate total
      const finalTotal = diningPreference === 'takeout'
        ? parseFloat(getTotalPrice()) + deliveryFee
        : parseFloat(getTotalPrice());

      // Validate and prepare order items
      const preparedOrderItems = cart.map(item => {
        const menuItemId = item._id;
        if (!menuItemId) {
          throw new Error(`Item "${item.name}" is missing _id. Please refresh and add items again.`);
        }
        return {
          menuItem: menuItemId,
          quantity: item.quantity || 1,
          price: parseFloat(String(item.price).replace(/[^0-9.]/g, '')) || 0
        };
      });

      // Prepare order data
      const orderData = {
        customerName: contact || 'Guest Customer',
        customerEmail: contact.includes('@') ? contact : '',
        customerPhone: !contact.includes('@') ? contact : '',
        totalAmount: finalTotal,
        status: 'pending',
        paymentMethod: 'cash',
        table: diningPreference === 'dine-in'
          ? `Table ${tableNumber || 'N/A'}`
          : (deliveryAddress || 'Delivery'),
        orderItems: preparedOrderItems
      };

      console.log('[AI Order Creation] Prepared order items:', preparedOrderItems);
      console.log('[AI Order Creation] Full order data:', JSON.stringify(orderData, null, 2));

      // Create order in backend
      const result = await createOrder(orderData).unwrap();
      console.log('[AI Order Creation] Order created successfully:', result);

      setCheckoutStep(null);

      const confirmationMessage = {
        id: Date.now(),
        text: `🎉 Order confirmed! Payment successful!\n\n📧 Contact: ${contact}\n🍽️ Service: ${diningPreference === 'takeout' ? 'Takeout' : 'Dine-in'}${diningPreference === 'takeout' ? `\n📍 Delivery to: ${deliveryAddress}` : ''}\n💰 Total: ₦${finalTotal.toFixed(2)}\n\nWe'll ${diningPreference === 'takeout' ? 'deliver your order and ' : ''}notify you when your food is ready. Thank you for choosing Nectar!`,
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
    } catch (error) {
      console.error('[AI Order Creation Error] Full error object:', error);
      console.error('[AI Order Creation Error] Error data:', error?.data);
      console.error('[AI Order Creation Error] Error message:', error?.message);

      setCheckoutStep(null);

      let errorMsg = 'Unknown error occurred';
      if (error?.data?.message) {
        errorMsg = error.data.message;
      } else if (error?.message) {
        errorMsg = error.message;
      } else if (typeof error === 'string') {
        errorMsg = error;
      }

      const errorMessage = {
        id: Date.now(),
        text: `❌ Failed to create order: ${errorMsg}\n\nPlease try again or contact support.`,
        sender: 'bot',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleOutsideGeofence = (location) => {
    console.error('[App] Device outside geofence:', location);
    // Optionally disable ordering functionality
  };

  const restaurantSchema = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    "name": "Nectar Restaurant",
    "image": "/logo_black.svg",
    "description": "Nectar Restaurant - Discover amazing dining experiences. Browse our menu, order your favorites, and enjoy fresh, delicious meals.",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "123 Restaurant Street",
      "addressLocality": "Jos",
      "addressRegion": "Plateau State",
      "addressCountry": "NG"
    },
    "telephone": "+2348108613890",
    "email": "nectarjoscity@gmail.com",
    "servesCuisine": "International",
    "priceRange": "$$",
    "openingHoursSpecification": [
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        "opens": "09:00",
        "closes": "22:00"
      },
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Saturday", "Sunday"],
        "opens": "10:00",
        "closes": "23:00"
      }
    ],
    "menu": "/",
    "acceptsReservations": "True",
    "url": typeof window !== 'undefined' ? window.location.origin : "https://nectarv.com",
    "sameAs": ["https://wa.me/2348108613890"]
  };

  // Don't render if redirecting to preorder page
  if (mounted && typeof window !== 'undefined' && window.location.pathname === '/' && isPreOrderLandingPage()) {
    return null;
  }

  return (
    <GeofenceGuard onOutsideGeofence={handleOutsideGeofence}>
      <Script
        id="restaurant-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(restaurantSchema)
        }}
      />
      <div className="h-screen flex flex-col" style={{ background: colors.background }}>
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
                  <div key={message.id} className={`flex mb-3 sm:mb-4 ${message.sender === 'user' ? 'justify-end' : 'justify-start'
                    }`}>
                    {message.isCategoryMenu ? (
                      <div className="w-full max-w-2xl">
                        <div className="rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-lg" style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}` }}>
                          <div className="flex items-center mb-3 sm:mb-4">
                            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full overflow-hidden mr-2 sm:mr-3">
                              <img src="/images/salad.jpg" alt="category" className="w-full h-full object-cover" />
                            </div>
                            <div>
                              <p className="font-medium text-sm sm:text-base" style={{ color: colors.text }}>{message.text}</p>
                              <div className="text-xs mt-1" style={{ color: colors.mutedText }}>{message.timestamp}</div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {message.categories.map((category, categoryIndex) => (
                              <div
                                key={categoryIndex}
                                className="rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group transform hover:-translate-y-2 flex flex-col h-full"
                                style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}` }}
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
                                        const { data: itemsData } = await triggerGetMenuItems({ category: catId, active: true });
                                        if (Array.isArray(itemsData)) {
                                          items = itemsData.map(it => ({
                                            _id: it._id,
                                            name: it.name,
                                            price: `₦${Number(it.price).toFixed(2)}`,
                                            description: it.description,
                                            emoji: it.emoji || category.emoji,
                                            imageUrl: it.imageUrl || null,
                                            isAvailable: it.isAvailable !== false
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
                                      <span className="text-white text-xs px-2 py-1 rounded-full font-medium" style={{ background: colors.amber500 }}>Popular</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Card Content */}
                                <div className="p-3 flex flex-col grow">
                                  <div className="mb-3">
                                    <h3 className="font-bold group-hover:text-green-700 transition-colors text-lg" style={{ color: colors.text }}>{category.name}</h3>
                                  </div>

                                  <p className="text-sm leading-relaxed mb-4" style={{ color: colors.mutedText, minHeight: '64px' }}>{category.description}</p>

                                  {/* Action Button */}
                                  <button className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-4 rounded-xl transition-colors duration-200 flex items-center justify-center space-x-2 group-hover:bg-green-600 mt-auto">
                                    <img src="/file.svg" alt="shopping bag" className="w-5 h-5 filter brightness-0 invert" />
                                    <span>Browse Category</span>
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="mt-4 sm:mt-6 p-3 sm:p-4 rounded-lg" style={{ background: colors.green50, border: `1px solid ${colors.green500}` }}>
                            <p className="text-xs sm:text-sm text-center font-medium" style={{ color: colors.green700 }}>
                              💡 Click on any category to see the items!
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : message.isItemMenu ? (
                      <div className="w-full max-w-2xl">
                        <div className="rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-lg" style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}` }}>
                          <div className="flex items-center mb-3 sm:mb-4">
                            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full overflow-hidden mr-2 sm:mr-3">
                              <img src="/images/b.jpg" alt="items" className="w-full h-full object-cover" />
                            </div>
                            <div>
                              <p className="font-medium text-sm sm:text-base" style={{ color: colors.text }}>{message.text}</p>
                              <div className="text-xs mt-1" style={{ color: colors.mutedText }}>{message.timestamp}</div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {message.items.map((item, itemIndex) => (
                              <div
                                key={itemIndex}
                                className="rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group transform hover:-translate-y-2 flex flex-col h-full"
                                style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}` }}
                                onClick={() => {
                                  // Blur any focused input on mobile to dismiss keyboard
                                  if (window.innerWidth <= 768 && document.activeElement) {
                                    document.activeElement.blur();
                                  }

                                  // Check if item is available before adding to cart
                                  if (item.isAvailable === false) {
                                    const outOfStockMessage = {
                                      id: Date.now(),
                                      text: `❌ ${item.name} is currently out of stock. Please select another item.`,
                                      sender: 'bot',
                                      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                    };
                                    setMessages(prev => [...prev, outOfStockMessage]);
                                    return;
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
                                <div className="relative text-center overflow-hidden h-48 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)' }}>
                                  {item.imageUrl ? (
                                    <img
                                      src={item.imageUrl}
                                      alt={item.name}
                                      className="w-full h-full object-contain"
                                    />
                                  ) : (
                                    <div className="absolute inset-0 flex items-center justify-center text-7xl">
                                      {item.emoji || '🍽️'}
                                    </div>
                                  )}
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent"></div>


                                </div>

                                {/* Card Content */}
                                <div className="p-3 flex flex-col grow">
                                  <h4 className="font-bold group-hover:text-green-700 transition-colors text-lg mb-1" style={{ color: colors.text }}>{item.name}</h4>
                                  <span className="inline-block text-green-600 font-semibold text-lg sm:text-xl mb-2">{item.price}</span>
                                  <p className="text-sm leading-relaxed mb-4 line-clamp-3" style={{ color: colors.mutedText }}>{item.description}</p>

                                  {/* Action Hint */}
                                  <div className="text-center mt-auto">
                                    <span className={`text-xs ${item.isAvailable === false ? 'text-red-600' : 'text-green-600'}`}>
                                      {item.isAvailable === false ? 'Out of Stock' : 'Click to add to cart'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="mt-4 sm:mt-6 p-3 sm:p-4 rounded-lg" style={{ background: colors.green50, border: `1px solid ${colors.green500}` }}>
                            <p className="text-xs sm:text-sm text-center font-medium" style={{ color: colors.green700 }}>
                              💡 Click on any item to add it to your order!
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : message.isCheckoutBill ? (
                      <div className="w-full max-w-2xl">
                        <div className="rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-lg" style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}` }}>
                          <div className="flex items-center mb-3 sm:mb-4">
                            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full overflow-hidden mr-2 sm:mr-3">
                              <img src="/images/c.jpg" alt="bill" className="w-full h-full object-cover" />
                            </div>
                            <div>
                              <p className="font-medium text-sm sm:text-base whitespace-pre-wrap" style={{ color: colors.text }}>{message.text}</p>
                              <div className="text-xs mt-1" style={{ color: colors.mutedText }}>{message.timestamp}</div>
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
                        <div className="rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-lg" style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}` }}>
                          <div className="flex items-center mb-3 sm:mb-4">
                            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full overflow-hidden mr-2 sm:mr-3">
                              <img src="/images/b.jpg" alt="payment" className="w-full h-full object-cover" />
                            </div>
                            <div>
                              <p className="font-medium text-sm sm:text-base whitespace-pre-wrap" style={{ color: colors.text }}>{message.text}</p>
                              <div className="text-xs mt-1" style={{ color: colors.mutedText }}>{message.timestamp}</div>
                            </div>
                          </div>

                          <div className="space-y-4 mt-4">
                            <div className="rounded-lg p-4" style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}` }}>
                              <h3 className="text-lg font-semibold mb-3 flex items-center" style={{ color: colors.text }}>
                                🏦 Bank Transfer Details
                              </h3>

                              <div className="space-y-3">
                                <div className="flex justify-between items-center p-3 rounded-lg" style={{ background: theme === 'light' ? '#F9FAFB' : '#1F2937' }}>
                                  <span className="text-sm font-medium" style={{ color: colors.mutedText }}>Account Name:</span>
                                  <span className="text-sm font-bold" style={{ color: colors.text }}>Nectar Restaurant Ltd</span>
                                </div>

                                <div className="flex justify-between items-center p-3 rounded-lg" style={{ background: theme === 'light' ? '#F9FAFB' : '#1F2937' }}>
                                  <span className="text-sm font-medium" style={{ color: colors.mutedText }}>Account Number:</span>
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold font-mono" style={{ color: colors.text }}>2087654321</span>
                                    <button
                                      className="text-green-500 hover:text-green-700 text-xs"
                                      onClick={() => navigator.clipboard.writeText('2087654321')}
                                    >
                                      📋 Copy
                                    </button>
                                  </div>
                                </div>

                                <div className="flex justify-between items-center p-3 rounded-lg" style={{ background: theme === 'light' ? '#F9FAFB' : '#1F2937' }}>
                                  <span className="text-sm font-medium" style={{ color: colors.mutedText }}>Bank:</span>
                                  <span className="text-sm font-bold" style={{ color: colors.text }}>First Bank of Nigeria</span>
                                </div>

                                <div className="flex justify-between items-center p-3 rounded-lg" style={{ background: colors.red50, border: `1px solid ${colors.red200}` }}>
                                  <span className="text-sm font-medium" style={{ color: colors.red700 }}>⏰ Expires in:</span>
                                  <span className={`text-sm font-bold ${transferExpiry <= 300 ? 'animate-pulse' : ''}`} style={{ color: colors.red700 }}>
                                    {formatTime(transferExpiry)}
                                  </span>
                                </div>
                              </div>

                              <div className="mt-4 p-3 rounded-lg" style={{ background: colors.blue50, border: `1px solid ${colors.blue100}` }}>
                                <p className="text-xs" style={{ color: colors.blue600 }}>
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
                        <p className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap" style={{ fontFamily: 'Gebuk, Arial, sans-serif' }}>
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
                          <div className="w-2 h-2 rounded-full animate-bounce" style={{ background: colors.mutedText }}></div>
                          <div className="w-2 h-2 rounded-full animate-bounce" style={{ background: colors.mutedText, animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 rounded-full animate-bounce" style={{ background: colors.mutedText, animationDelay: '0.2s' }}></div>
                        </div>
                        <span className="text-sm ml-2" style={{ color: colors.mutedText }}>Thinking...</span>
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
                categories={[...categories].reverse()}
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
              {detailsItem && typeof window !== 'undefined' && createPortal(
                <div
                  className="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto"
                  style={{
                    background: 'rgba(0,0,0,0.8)',
                    backdropFilter: 'blur(4px)',
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '3px',
                    minWidth: '100vw',
                    minHeight: '100vh'
                  }}
                  onClick={() => setDetailsItem(null)}
                >
                  <div
                    className="relative w-full h-full flex flex-col md:h-auto md:my-auto overflow-y-auto"
                    style={{
                      maxWidth: '100%',
                      maxHeight: '100%',
                      minWidth: 'calc(100vw - 6px)',
                      minHeight: 'calc(100vh - 6px)',
                      ...(typeof window !== 'undefined' && window.innerWidth >= 768 && {
                        minWidth: 'auto',
                        minHeight: 'auto',
                        width: 'calc(100vw / 3)',
                        maxWidth: 'calc(100vw / 3)',
                        maxHeight: '90vh'
                      })
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Close Button */}
                    <button
                      className="absolute top-4 right-4 z-10 p-3 rounded-full transition-all hover:scale-110"
                      style={{
                        background: 'rgba(0,0,0,0.6)',
                        color: '#fff',
                        backdropFilter: 'blur(4px)'
                      }}
                      onClick={() => setDetailsItem(null)}
                    >
                      <IoClose className="w-6 h-6" />
                    </button>

                    {/* Image Container */}
                    <div
                      className="flex items-center justify-center"
                      style={{
                        width: '100%',
                        minHeight: '300px',
                        maxHeight: typeof window !== 'undefined' && window.innerWidth >= 768 ? '60vh' : '60vh'
                      }}
                    >
                      {/* Image */}
                      {detailsItem.imageUrl ? (
                        <img
                          src={detailsItem.imageUrl}
                          alt={detailsItem.name}
                          className="w-full h-auto rounded-t-2xl shadow-2xl"
                          style={{
                            objectFit: 'contain',
                            display: 'block',
                            maxWidth: '100%',
                            maxHeight: typeof window !== 'undefined' && window.innerWidth >= 768 ? '60vh' : '60vh'
                          }}
                        />
                      ) : (
                        <div
                          className="w-full rounded-t-2xl shadow-2xl flex items-center justify-center"
                          style={{
                            background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
                            minHeight: '300px'
                          }}
                        >
                          <div className="text-9xl">{detailsItem.emoji || '🍽️'}</div>
                        </div>
                      )}
                    </div>

                    {/* Item Info - Below image on all screen sizes */}
                    <div
                      className="p-6 rounded-b-2xl"
                      style={{
                        background: colors.cardBg,
                        color: colors.text
                      }}
                    >
                      <h3 className="text-2xl font-bold mb-2">{detailsItem.name}</h3>
                      <div className="text-green-400 font-semibold text-xl mb-3">{detailsItem.price}</div>
                      {detailsItem.description && (
                        <p className="text-lg mb-4 leading-relaxed opacity-90">{detailsItem.description}</p>
                      )}

                      {/* Action Button */}
                      <button
                        className={`w-full font-semibold py-3 rounded-lg transition-all hover:scale-105 text-base ${detailsItem.isAvailable === false || cart.some(ci => ci.name === detailsItem.name)
                          ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                          : 'bg-green-500 hover:bg-green-600 text-white'
                          }`}
                        onClick={() => {
                          if (!cart.some(ci => ci.name === detailsItem.name) && detailsItem.isAvailable !== false) {
                            addToCart(detailsItem);
                            setDetailsItem(null);
                          }
                        }}
                        disabled={cart.some(ci => ci.name === detailsItem.name) || detailsItem.isAvailable === false}
                      >
                        {detailsItem.isAvailable === false
                          ? 'Out of Stock'
                          : cart.some(ci => ci.name === detailsItem.name)
                            ? '✓ Added to Cart'
                            : 'Add to Cart'
                        }
                      </button>
                    </div>
                  </div>
                </div>,
                document.body
              )}
            </>
          )}
        </div>

        {/* Cart Sidebar */}
        {showCart && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={() => setShowCart(false)}>
            <div
              className="fixed right-0 top-0 h-full w-full sm:max-w-md shadow-xl transform transition-transform duration-300 ease-in-out overflow-y-auto" style={{ background: colors.background }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-3 sm:p-4" style={{ borderBottom: `1px solid ${colors.cardBorder}` }}>
                <div className="flex items-center justify-between">
                  <h2 className="text-lg sm:text-xl font-bold" style={{ color: colors.text }}>Your Cart</h2>
                  <button
                    onClick={() => setShowCart(false)}
                    className="p-2 rounded-full transition-colors touch-manipulation"
                    style={{ background: theme === 'light' ? '#F3F4F6' : '#374151' }}
                  >
                    <IoClose className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: colors.text }} />
                  </button>
                </div>
              </div>

              <div className="flex-1 p-3 sm:p-4">
                {cart.length === 0 ? (
                  <div className="text-center py-6 sm:py-8">
                    <div className="text-4xl sm:text-6xl mb-3 sm:mb-4">🛒</div>
                    <p className="text-base sm:text-lg" style={{ color: colors.mutedText }}>Your cart is empty</p>
                    <p className="text-xs sm:text-sm mt-2" style={{ color: colors.mutedText, opacity: 0.7 }}>Add some delicious items to get started!</p>
                  </div>
                ) : (
                  <div className="space-y-3 sm:space-y-4">
                    {isManualCheckout && (
                      <div className="rounded-lg p-3 sm:p-4" style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}` }}>
                        {manualStep === 'dining-preference' && (
                          <div className="space-y-3">
                            <p className="font-semibold" style={{ color: colors.text }}>How would you like to get your order?</p>
                            <div className="grid gap-2 sm:gap-3">
                              <button className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2.5 px-4 rounded-lg" onClick={() => { setManualDiningPreference('takeout'); setManualStep('delivery-address'); }}>🥡 Takeout / Delivery</button>
                              <button className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2.5 px-4 rounded-lg" onClick={() => {
                                setManualDiningPreference('dine-in');
                                // If table number is configured, go to contact-info, otherwise ask for table number
                                if (tableNumber) {
                                  setManualStep('contact-info');
                                } else {
                                  setManualStep('table-number');
                                }
                              }}>🍽️ Dine In Restaurant</button>
                            </div>
                          </div>
                        )}

                        {manualStep === 'delivery-address' && (
                          <div className="space-y-3">
                            <p className="font-semibold" style={{ color: colors.text }}>Enter delivery address:</p>
                            <textarea
                              value={manualDeliveryAddress}
                              onChange={(e) => setManualDeliveryAddress(e.target.value)}
                              className="w-full border rounded-lg px-3 py-2"
                              style={{ borderColor: colors.cardBorder, background: colors.cardBg, color: colors.text }}
                              rows={3}
                              placeholder="123 Example Street, City"
                            />
                            <div className="flex gap-2">
                              <button className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg" onClick={() => setManualStep('contact-info')}>Continue</button>
                              <button className="bg-gray-200 hover:bg-gray-300 font-semibold py-2 px-4 rounded-lg" style={{ color: colors.text }} onClick={() => setManualStep('dining-preference')}>Back</button>
                            </div>
                          </div>
                        )}

                        {manualStep === 'table-number' && (
                          <div className="space-y-3">
                            <p className="font-semibold" style={{ color: colors.text }}>What table are you at?</p>
                            {tableNumber && (
                              <div className="p-3 rounded-lg text-sm" style={{ background: colors.amber500 + '20', border: `1px solid ${colors.amber500}40` }}>
                                <p style={{ color: colors.text }}>
                                  💡 This tablet is configured for <strong>Table {tableNumber}</strong>. You can override it below if needed.
                                </p>
                              </div>
                            )}
                            <input
                              type="number"
                              min="1"
                              max="999"
                              value={overrideTableNumber || tableNumber}
                              onChange={(e) => setOverrideTableNumber(e.target.value)}
                              className="w-full border rounded-lg px-3 py-2 text-lg"
                              style={{ borderColor: colors.cardBorder, background: colors.cardBg, color: colors.text }}
                              placeholder="Enter table number (e.g., 5)"
                            />
                            <div className="flex gap-2">
                              <button
                                className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg flex-1"
                                onClick={() => {
                                  const finalTable = overrideTableNumber || tableNumber;
                                  if (finalTable) {
                                    setManualStep('contact-info');
                                  } else {
                                    alert('Please enter a table number');
                                  }
                                }}
                              >
                                Continue
                              </button>
                              <button
                                className="bg-gray-200 hover:bg-gray-300 font-semibold py-2 px-4 rounded-lg"
                                style={{ color: colors.text }}
                                onClick={() => setManualStep('dining-preference')}
                              >
                                Back
                              </button>
                            </div>
                          </div>
                        )}

                        {manualStep === 'contact-info' && (
                          <div className="space-y-3">
                            <p className="font-semibold" style={{ color: colors.text }}>Enter contact (email or phone):</p>
                            {manualDiningPreference === 'dine-in' && (overrideTableNumber || tableNumber) && (
                              <div className="p-2 rounded-lg text-sm" style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}` }}>
                                <p style={{ color: colors.mutedText }}>
                                  🪑 Table: <strong style={{ color: colors.text }}>{overrideTableNumber || tableNumber}</strong>
                                </p>
                              </div>
                            )}
                            <input
                              value={manualContact}
                              onChange={(e) => setManualContact(e.target.value)}
                              className="w-full border rounded-lg px-3 py-2"
                              style={{ borderColor: colors.cardBorder, background: colors.cardBg, color: colors.text }}
                              placeholder="e.g. you@example.com or +234..."
                            />
                            <div className="flex gap-2">
                              <button className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg" onClick={() => setManualStep('payment')}>Continue</button>
                              <button className="bg-gray-200 hover:bg-gray-300 font-semibold py-2 px-4 rounded-lg" style={{ color: colors.text }} onClick={() => {
                                if (manualDiningPreference === 'dine-in' && !tableNumber) {
                                  setManualStep('table-number');
                                } else {
                                  setManualStep(manualDiningPreference === 'takeout' ? 'delivery-address' : 'dining-preference');
                                }
                              }}>Back</button>
                            </div>
                          </div>
                        )}

                        {manualStep === 'payment' && (
                          <div className="space-y-3">
                            <p className="font-semibold" style={{ color: colors.text }}>Select Payment Method</p>

                            {/* Payment Method Selection */}
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                onClick={() => {
                                  console.log('[Payment Method] Setting to cash');
                                  setManualPaymentMethod('cash');
                                }}
                                className={`px-4 py-3 rounded-lg text-base font-semibold transition-all flex items-center justify-center gap-2 ${manualPaymentMethod === 'cash' ? 'text-white' : ''
                                  }`}
                                style={{
                                  background: manualPaymentMethod === 'cash'
                                    ? colors.green500
                                    : theme === 'light' ? '#F3F4F6' : '#1F2937',
                                  color: manualPaymentMethod === 'cash' ? '#fff' : colors.text,
                                  border: manualPaymentMethod === 'cash' ? 'none' : `1px solid ${colors.cardBorder}`
                                }}
                              >
                                <IoCashOutline className="h-5 w-5" />
                                Cash
                              </button>
                              <button
                                onClick={() => setManualPaymentMethod('transfer')}
                                className={`px-4 py-3 rounded-lg text-base font-semibold transition-all flex items-center justify-center gap-2 ${manualPaymentMethod === 'transfer' ? 'text-white' : ''
                                  }`}
                                style={{
                                  background: manualPaymentMethod === 'transfer'
                                    ? colors.blue600 || '#2563EB'
                                    : theme === 'light' ? '#F3F4F6' : '#1F2937',
                                  color: manualPaymentMethod === 'transfer' ? '#fff' : colors.text,
                                  border: manualPaymentMethod === 'transfer' ? 'none' : `1px solid ${colors.cardBorder}`
                                }}
                              >
                                <IoCardOutline className="h-5 w-5" />
                                Transfer
                              </button>
                            </div>

                            {/* Cash Payment Notice - shown when cash is selected */}
                            {manualPaymentMethod === 'cash' && (
                              <div className="rounded-lg p-5 mt-3" style={{ background: theme === 'light' ? '#FEF3C7' : '#3A2F1A', border: `2px solid ${colors.amber500 || '#F59E0B'}` }}>
                                <h4 className="text-lg font-bold mb-3 flex items-center gap-2" style={{ color: colors.amber700 || '#B45309' }}>
                                  Cash Payment Required
                                </h4>
                                <div className="space-y-3">
                                  <p className="text-base leading-relaxed" style={{ color: colors.amber700 || '#B45309' }}>
                                    After placing your order, please proceed to the counter to make your cash payment.
                                  </p>
                                  <p className="text-base leading-relaxed" style={{ color: colors.amber700 || '#B45309' }}>
                                    Your order will be validated and sent to the kitchen once payment is confirmed by our staff.
                                  </p>
                                  <div className="p-3 rounded-lg mt-3" style={{ background: theme === 'light' ? 'rgba(180, 83, 9, 0.1)' : 'rgba(180, 83, 9, 0.2)' }}>
                                    <p className="text-base font-bold flex items-center gap-2" style={{ color: colors.amber700 || '#B45309' }}>
                                      Important: Your order will not be processed until payment is confirmed at the counter.
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Transfer Account Details - shown when transfer is selected */}
                            {manualPaymentMethod === 'transfer' && (
                              <div className="rounded-lg p-3 mt-3" style={{ background: theme === 'light' ? '#F9FAFB' : '#1F2937', border: `1px solid ${colors.cardBorder}` }}>
                                <h4 className="text-base font-semibold mb-3 flex items-center" style={{ color: colors.text }}>
                                  Bank Transfer Details
                                </h4>
                                {isCreatingAccount && !paymentDetails && !paymentError && (
                                  <div className="text-center py-4">
                                    <p className="text-sm" style={{ color: colors.mutedText }}>Creating payment account...</p>
                                  </div>
                                )}
                                {paymentError && (
                                  <div className="rounded-lg p-3 mb-3" style={{ background: '#FEF2F2', border: `1px solid #DC2626` }}>
                                    <p className="text-sm text-red-600">{paymentError}</p>
                                    <button
                                      className="mt-2 text-sm text-red-600 underline"
                                      onClick={() => {
                                        setPaymentError(null);
                                        setPaymentDetails(null);
                                      }}
                                    >
                                      Try again
                                    </button>
                                  </div>
                                )}
                                {paymentDetails && (
                                  <>
                                    <div className="space-y-2">
                                      {paymentDetails.accountName && (
                                        <div className="flex justify-between items-center">
                                          <span className="text-sm font-medium" style={{ color: colors.mutedText }}>Account Name:</span>
                                          <span className="text-sm font-bold text-right" style={{ color: colors.text }}>{paymentDetails.accountName}</span>
                                        </div>
                                      )}
                                      {paymentDetails.accountNumber && (
                                        <div className="flex justify-between items-center">
                                          <span className="text-sm font-medium" style={{ color: colors.mutedText }}>Account Number:</span>
                                          <div className="flex items-center gap-2">
                                            <span className="text-sm font-bold font-mono" style={{ color: colors.text }}>{paymentDetails.accountNumber}</span>
                                            <button
                                              className="text-green-500 hover:text-green-700 text-xs px-2 py-1 rounded transition-colors"
                                              onClick={(e) => {
                                                navigator.clipboard.writeText(paymentDetails.accountNumber);
                                                const btn = e.currentTarget;
                                                const originalText = btn.textContent;
                                                btn.textContent = '✓ Copied';
                                                setTimeout(() => {
                                                  btn.textContent = originalText;
                                                }, 2000);
                                              }}
                                            >
                                              Copy
                                            </button>
                                          </div>
                                        </div>
                                      )}
                                      {paymentDetails.bankName && (
                                        <div className="flex justify-between items-center">
                                          <span className="text-sm font-medium" style={{ color: colors.mutedText }}>Bank:</span>
                                          <span className="text-sm font-bold" style={{ color: colors.text }}>{paymentDetails.bankName}</span>
                                        </div>
                                      )}
                                      {paymentDetails.externalReference && (
                                        <div className="flex justify-between items-center text-xs pt-2 border-t" style={{ borderColor: colors.cardBorder }}>
                                          <span className="font-medium" style={{ color: colors.mutedText }}>Reference:</span>
                                          <span className="font-mono break-all text-right" style={{ color: colors.mutedText }}>{paymentDetails.externalReference}</span>
                                        </div>
                                      )}
                                      {paymentDetails.validFor && (
                                        <div className="mt-2 p-2 rounded text-xs" style={{ background: '#FEF3C7', color: '#92400E' }}>
                                          This account will be active for {Math.floor(paymentDetails.validFor / 60)} minutes
                                        </div>
                                      )}
                                    </div>
                                    <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${colors.cardBorder}` }}>
                                      <p className="text-xs mb-3" style={{ color: colors.mutedText }}>
                                        Transfer the exact amount of <strong style={{ color: colors.green600 }}>₦{getTotalPrice()}</strong> to the account above.
                                      </p>
                                      <button
                                        onClick={() => setManualTransferConfirmed(!manualTransferConfirmed)}
                                        className={`w-full px-4 py-3 rounded-lg text-base font-semibold transition-all flex items-center justify-center gap-2 ${manualTransferConfirmed ? 'text-white' : ''
                                          }`}
                                        style={{
                                          background: manualTransferConfirmed
                                            ? colors.green500
                                            : theme === 'light' ? '#F3F4F6' : '#1F2937',
                                          color: manualTransferConfirmed ? '#fff' : colors.text,
                                          border: manualTransferConfirmed ? 'none' : `1px solid ${colors.cardBorder}`
                                        }}
                                      >
                                        {manualTransferConfirmed ? (
                                          <>
                                            <IoCheckmarkCircleOutline className="h-5 w-5" />
                                            I have made the transfer
                                          </>
                                        ) : (
                                          <>
                                            <IoCheckmarkCircleOutline className="h-5 w-5" />
                                            I have made the transfer
                                          </>
                                        )}
                                      </button>
                                    </div>
                                  </>
                                )}
                              </div>
                            )}

                            {/* Continue Button */}
                            <div className="flex gap-2">
                              <button
                                className={`flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-2.5 rounded-lg ${(manualPaymentMethod === 'transfer' && !manualTransferConfirmed) || !manualPaymentMethod
                                  ? 'opacity-50 cursor-not-allowed'
                                  : ''
                                  }`}
                                disabled={(manualPaymentMethod === 'transfer' && !manualTransferConfirmed) || !manualPaymentMethod || isVerifying || isVerifyingPayment}
                                onClick={async () => {
                                  if (manualPaymentMethod === 'cash') {
                                    // Cash payment - create order directly
                                    try {
                                      console.log('[Order Button Clicked] Cart items:', cart);
                                      console.log('[Order Button Clicked] Cart items with _id check:', cart.map(item => ({ name: item.name, hasId: !!item._id, _id: item._id })));

                                      // Validate cart is not empty
                                      if (!cart || cart.length === 0) {
                                        alert('Your cart is empty. Please add items before placing an order.');
                                        return;
                                      }

                                      // Validate cart items have required fields
                                      const invalidItems = cart.filter(item => !item._id);
                                      if (invalidItems.length > 0) {
                                        console.error('[Order Button] Cart items missing _id:', invalidItems);
                                        alert(`Some items in your cart are missing required information (${invalidItems.length} items).\n\nPlease:\n1. Clear your cart\n2. Refresh the page\n3. Add items again\n\nThis is needed to include the item IDs.`);
                                        return;
                                      }

                                      // Create order in backend
                                      const totalAmount = getTotalPrice();

                                      // Validate and prepare order items
                                      const preparedOrderItems = cart.map(item => {
                                        const menuItemId = item._id;
                                        if (!menuItemId) {
                                          throw new Error(`Item "${item.name}" is missing _id. Please refresh and add items again.`);
                                        }
                                        return {
                                          menuItem: menuItemId,
                                          quantity: item.quantity || 1,
                                          price: parseFloat(String(item.price).replace(/[^0-9.]/g, '')) || 0
                                        };
                                      });

                                      const orderData = {
                                        customerName: manualContact || 'Guest Customer',
                                        customerEmail: manualContact.includes('@') ? manualContact : '',
                                        customerPhone: !manualContact.includes('@') ? manualContact : '',
                                        totalAmount: totalAmount,
                                        status: 'pending',
                                        paymentMethod: 'cash',
                                        paymentConfirmed: false, // Will be confirmed by waiter
                                        table: manualDiningPreference === 'dine-in'
                                          ? `Table ${overrideTableNumber || tableNumber || 'N/A'}`
                                          : (manualDeliveryAddress || 'Delivery'),
                                        orderItems: preparedOrderItems
                                      };

                                      const result = await createOrder(orderData).unwrap();
                                      console.log('[Order Creation] Order created successfully:', result);
                                      setManualStep('confirmed');
                                      setCart([]);
                                    } catch (error) {
                                      console.error('[Order Creation Error]:', error);
                                      alert(`Failed to create order: ${error?.data?.message || error?.message || 'Unknown error'}`);
                                    }
                                  } else if (manualPaymentMethod === 'transfer' && manualTransferConfirmed) {
                                    // Transfer payment - verify payment first
                                    if (!paymentDetails?.externalReference) {
                                      alert('Payment account details are missing. Please refresh and try again.');
                                      return;
                                    }

                                    setIsVerifying(true);
                                    try {
                                      // Verify payment before creating order
                                      const verificationResult = await verifyPayment({
                                        externalReference: paymentDetails.externalReference
                                      }).unwrap();

                                      // Check if payment was successful
                                      if (verificationResult?.status === 'success' || verificationResult?.status === 'completed') {
                                        // Payment confirmed, create order
                                        console.log('[Order Button Clicked] Cart items:', cart);

                                        if (!cart || cart.length === 0) {
                                          alert('Your cart is empty. Please add items before placing an order.');
                                          return;
                                        }

                                        const invalidItems = cart.filter(item => !item._id);
                                        if (invalidItems.length > 0) {
                                          alert(`Some items in your cart are missing required information. Please refresh and add items again.`);
                                          return;
                                        }

                                        const totalAmount = getTotalPrice();

                                        const preparedOrderItems = cart.map(item => {
                                          const menuItemId = item._id;
                                          if (!menuItemId) {
                                            throw new Error(`Item "${item.name}" is missing _id.`);
                                          }
                                          return {
                                            menuItem: menuItemId,
                                            quantity: item.quantity || 1,
                                            price: parseFloat(String(item.price).replace(/[^0-9.]/g, '')) || 0
                                          };
                                        });

                                        const orderData = {
                                          customerName: manualContact || 'Guest Customer',
                                          customerEmail: manualContact.includes('@') ? manualContact : '',
                                          customerPhone: !manualContact.includes('@') ? manualContact : '',
                                          totalAmount: totalAmount,
                                          status: 'pending',
                                          paymentMethod: 'online',
                                          paymentConfirmed: true, // Payment verified
                                          table: manualDiningPreference === 'dine-in'
                                            ? `Table ${overrideTableNumber || tableNumber || 'N/A'}`
                                            : (manualDeliveryAddress || 'Delivery'),
                                          orderItems: preparedOrderItems,
                                          paymentReference: paymentDetails.externalReference || paymentDetails.id,
                                          virtualAccountNumber: paymentDetails.accountNumber,
                                          virtualAccountName: paymentDetails.accountName,
                                          virtualAccountBank: paymentDetails.bankName,
                                        };

                                        const result = await createOrder(orderData).unwrap();
                                        console.log('[Order Creation] Order created successfully:', result);

                                        // Show success message
                                        alert('Payment verified successfully! Your order has been confirmed and will be processed shortly. Thank you for your order!');

                                        setManualStep('confirmed');
                                        setCart([]);
                                      } else {
                                        alert('Payment verification failed. Please ensure you have completed the transfer and try again.');
                                      }
                                    } catch (error) {
                                      console.error('Error verifying payment:', error);
                                      const errorMessage = error?.data?.message || error?.message || 'Failed to verify payment';

                                      if (errorMessage.includes('not found') || errorMessage.includes('pending')) {
                                        const proceed = confirm('Payment verification is pending. Your order will be created but will only be processed after payment is confirmed. Do you want to proceed?');
                                        if (proceed) {
                                          // Create order with paymentConfirmed: false
                                          const totalAmount = getTotalPrice();
                                          const preparedOrderItems = cart.map(item => ({
                                            menuItem: item._id,
                                            quantity: item.quantity || 1,
                                            price: parseFloat(String(item.price).replace(/[^0-9.]/g, '')) || 0
                                          }));

                                          const orderData = {
                                            customerName: manualContact || 'Guest Customer',
                                            customerEmail: manualContact.includes('@') ? manualContact : '',
                                            customerPhone: !manualContact.includes('@') ? manualContact : '',
                                            totalAmount: totalAmount,
                                            status: 'pending',
                                            paymentMethod: 'online',
                                            paymentConfirmed: false,
                                            table: manualDiningPreference === 'dine-in'
                                              ? `Table ${overrideTableNumber || tableNumber || 'N/A'}`
                                              : (manualDeliveryAddress || 'Delivery'),
                                            orderItems: preparedOrderItems,
                                            paymentReference: paymentDetails.externalReference || paymentDetails.id,
                                            virtualAccountNumber: paymentDetails.accountNumber,
                                            virtualAccountName: paymentDetails.accountName,
                                            virtualAccountBank: paymentDetails.bankName,
                                          };

                                          await createOrder(orderData).unwrap();
                                          alert('Your order has been created and is pending payment confirmation. We will process your order once payment is verified. You will receive a confirmation once payment is received.');
                                          setManualStep('confirmed');
                                          setCart([]);
                                        }
                                      } else {
                                        alert(`Payment verification error: ${errorMessage}\n\nPlease ensure you have completed the transfer and try again.`);
                                      }
                                    } finally {
                                      setIsVerifying(false);
                                    }
                                  }
                                }}
                              >
                                {isVerifying || isVerifyingPayment
                                  ? 'Verifying payment...'
                                  : manualPaymentMethod === 'cash'
                                    ? 'Place Order'
                                    : manualPaymentMethod === 'transfer' && manualTransferConfirmed
                                      ? 'Place Order'
                                      : 'Select Payment Method'}
                              </button>
                              <button className="bg-gray-200 hover:bg-gray-300 font-semibold px-4 rounded-lg" style={{ color: colors.text }} onClick={() => setManualStep('contact-info')}>Back</button>
                            </div>
                          </div>
                        )}

                        {manualStep === 'confirmed' && (
                          <div className="space-y-3">
                            {/* Show payment counter message for cash payments */}
                            {manualPaymentMethod === 'cash' && (
                              <div className="space-y-2">
                                <div className="p-3 rounded-lg" style={{ background: theme === 'light' ? '#FEF3C7' : '#3A2F1A', border: `1px solid ${colors.amber500 || '#F59E0B'}` }}>
                                  <p className="text-sm font-semibold mb-2" style={{ color: colors.amber700 || '#B45309' }}>
                                    Payment Required at Counter
                                  </p>
                                  <p className="text-sm" style={{ color: colors.amber700 || '#B45309' }}>
                                    Please proceed to the counter to make your cash payment. Your order will be validated and sent to the kitchen once payment is confirmed.
                                  </p>
                                </div>
                                <p className="text-sm" style={{ color: colors.mutedText }}>
                                  We will {manualDiningPreference === 'takeout' ? `deliver your order to ${manualDeliveryAddress}` : `notify you at ${manualContact}`} when your food is ready.
                                </p>
                              </div>
                            )}
                            {manualPaymentMethod === 'transfer' && (
                              <div className="rounded-lg p-4" style={{ background: theme === 'light' ? '#ECFDF5' : '#052e21', border: `1px solid ${colors.green500 || '#10B981'}` }}>
                                <p className="font-bold text-lg mb-2 flex items-center gap-2" style={{ color: colors.green700 || '#047857' }}>
                                  Payment Verified & Order Confirmed!
                                </p>
                                <p className="text-sm mb-2" style={{ color: colors.green700 || '#047857' }}>
                                  Your payment has been successfully verified and your order has been placed.
                                </p>
                                <p className="text-sm" style={{ color: colors.green700 || '#047857' }}>
                                  We will {manualDiningPreference === 'takeout' ? `deliver your order to ${manualDeliveryAddress}` : `notify you at ${manualContact}`} when your food is ready.
                                </p>
                              </div>
                            )}
                            <button className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2.5 px-4 rounded-lg w-full" onClick={() => { setCart([]); resetManualCheckout(); setShowCart(false); }}>Done</button>
                          </div>
                        )}
                      </div>
                    )}
                    {cart.map((item, index) => (
                      <div key={index} className="rounded-lg p-3 sm:p-4" style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}` }}>
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center mb-1">
                              <span className="text-base sm:text-lg mr-2">{item.emoji}</span>
                              <h3 className="font-semibold text-sm sm:text-base" style={{ color: colors.text }}>{item.name}</h3>
                            </div>
                            <p className="text-xs sm:text-sm mb-2 line-clamp-3" style={{ color: colors.mutedText }}>{item.description}</p>
                            <p className="text-base sm:text-lg font-bold text-green-600">{item.price}</p>
                          </div>
                          <button
                            onClick={() => removeFromCart(item.name)}
                            className="p-2 rounded-full transition-colors text-red-500 touch-manipulation flex-shrink-0"
                            style={{ background: theme === 'light' ? '#FEF2F2' : '#3A2020' }}
                          >
                            <IoTrash className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2 sm:space-x-3">
                            <button
                              onClick={() => updateQuantity(item.name, item.quantity - 1)}
                              className="w-9 h-9 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-colors touch-manipulation"
                              style={{ background: theme === 'light' ? '#E5E7EB' : '#4B5563', color: colors.text }}
                            >
                              <span className="text-lg font-bold">-</span>
                            </button>
                            <span className="font-semibold text-base sm:text-lg px-2 sm:px-3 min-w-[2rem] text-center" style={{ color: colors.text }}>{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.name, item.quantity + 1)}
                              className="w-9 h-9 sm:w-8 sm:h-8 rounded-full bg-green-500 hover:bg-green-600 text-white flex items-center justify-center transition-colors touch-manipulation"
                            >
                              <span className="text-lg font-bold">+</span>
                            </button>
                          </div>
                          <div className="text-right">
                            <p className="text-xs sm:text-sm" style={{ color: colors.mutedText }}>Subtotal</p>
                            <p className="font-bold text-green-600 text-sm sm:text-base">₦{(parseFloat(String(item.price).replace(/[^\d.]/g, '')) * item.quantity).toFixed(2)}</p>
                          </div>
                        </div>
                      </div>
                    ))}

                    <div className="pt-3 sm:pt-4 mt-4 sm:mt-6" style={{ borderTop: `1px solid ${colors.cardBorder}` }}>
                      <div className="flex justify-between items-center mb-3 sm:mb-4">
                        <span className="text-lg sm:text-xl font-bold" style={{ color: colors.text }}>Total:</span>
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
                        style={{ background: theme === 'light' ? '#E5E7EB' : '#4B5563', color: colors.text }}
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
          <div className="px-3 sm:px-6 py-3 sm:py-4 flex-shrink-0" style={{ background: colors.background }}>
            <div className="max-w-4xl mx-auto flex justify-center">
              <div className="rounded-full shadow-md border border-green-100 px-3 sm:px-4 py-2 sm:py-3 flex items-center gap-2 sm:gap-3 w-full max-w-3xl" style={{ background: colors.background }}>
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
    </GeofenceGuard>
  );
}
