'use client';

import { useState } from 'react';
import { useTheme } from '../providers';
import HeaderNav from '../components/HeaderNav';
import { useSubmitContactFormMutation } from '../../services/api';
import { IoMailOutline, IoCallOutline, IoLocationOutline, IoTimeOutline, IoSendOutline, IoCheckmarkCircleOutline, IoCloseCircleOutline } from 'react-icons/io5';
import { FaWhatsapp } from 'react-icons/fa';

export default function ContactPage() {
  const { colors, theme, setTheme } = useTheme();
  const [mode, setMode] = useState('shop');
  const [submitContactForm, { isLoading: isSubmitting }] = useSubmitContactFormMutation();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [submitStatus, setSubmitStatus] = useState(null); // 'success' | 'error' | null

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setSubmitStatus(null); // Clear status on input change
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitStatus(null);

    try {
      const result = await submitContactForm(formData).unwrap();
      
      if (result.success) {
        setSubmitStatus('success');
        setFormData({
          name: '',
          email: '',
          phone: '',
          subject: '',
          message: ''
        });
        
        // Clear success message after 5 seconds
        setTimeout(() => setSubmitStatus(null), 5000);
      } else {
        setSubmitStatus('error');
        setTimeout(() => setSubmitStatus(null), 5000);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      setSubmitStatus('error');
      setTimeout(() => setSubmitStatus(null), 5000);
    }
  };

  const getTotalItems = () => 0; // No cart on contact page

  return (
    <div className="min-h-screen flex flex-col" style={{ background: colors.background }}>
      <HeaderNav
        colors={colors}
        theme={theme}
        setTheme={setTheme}
        mode={mode}
        setShowCart={() => {}}
        getTotalItems={getTotalItems}
      />

      {/* Hero Section */}
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
        <div className="max-w-8xl mx-auto px-4 sm:px-6 text-center relative z-10 flex flex-col justify-center items-center py-12 sm:py-16 md:py-20">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 text-center leading-tight" style={{ fontFamily: 'Gebuk, Arial, sans-serif', fontWeight: '700', color: theme === 'light' ? colors.black : colors.text }}>
            <span className="block">Get In Touch</span>
          </h1>
          <p className="mt-3 sm:mt-4 text-lg sm:text-xl md:text-2xl font-medium px-4 sm:px-0 max-w-2xl" style={{ color: colors.mutedText }}>
            We'd love to hear from you. Send us a message and we'll respond as soon as possible.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Contact Information */}
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold mb-6" style={{ color: colors.text }}>
                  Contact Information
                </h2>
                <p className="text-base sm:text-lg mb-8" style={{ color: colors.mutedText }}>
                  Reach out to us through any of these channels. We're here to help!
                </p>
              </div>

              {/* Contact Cards */}
              <div className="space-y-4">
                {/* Email */}
                <div className="rounded-xl p-6 shadow-lg transition-all hover:scale-105" style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}` }}>
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: colors.amber500, color: '#fff' }}>
                      <IoMailOutline className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-1" style={{ color: colors.text }}>Email</h3>
                      <a 
                        href="mailto:nectarjoscity@gmail.com" 
                        className="text-base hover:underline" 
                        style={{ color: colors.amber500 }}
                      >
                        nectarjoscity@gmail.com
                      </a>
                      <p className="text-sm mt-2" style={{ color: colors.mutedText }}>
                        Send us an email anytime
                      </p>
                    </div>
                  </div>
                </div>

                {/* Phone */}
                <div className="rounded-xl p-6 shadow-lg transition-all hover:scale-105" style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}` }}>
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: colors.green500, color: '#fff' }}>
                      <IoCallOutline className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-1" style={{ color: colors.text }}>Phone</h3>
                      <a 
                        href="tel:+2348108613890" 
                        className="text-base hover:underline" 
                        style={{ color: colors.green500 }}
                      >
                        +234 810 861 3890
                      </a>
                      <p className="text-sm mt-2" style={{ color: colors.mutedText }}>
                        Call us during business hours
                      </p>
                    </div>
                  </div>
                </div>

                {/* WhatsApp */}
                <div className="rounded-xl p-6 shadow-lg transition-all hover:scale-105" style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}` }}>
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#25D366', color: '#fff' }}>
                      <FaWhatsapp className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-1" style={{ color: colors.text }}>WhatsApp</h3>
                      <a 
                        href="https://wa.me/2348108613890" 
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-base hover:underline" 
                        style={{ color: '#25D366' }}
                      >
                        +234 810 861 3890
                      </a>
                      <p className="text-sm mt-2" style={{ color: colors.mutedText }}>
                        Chat with us on WhatsApp
                      </p>
                    </div>
                  </div>
                </div>

                {/* Location */}
                <div className="rounded-xl p-6 shadow-lg transition-all hover:scale-105" style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}` }}>
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: colors.blue600, color: '#fff' }}>
                      <IoLocationOutline className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-1" style={{ color: colors.text }}>Location</h3>
                      <p className="text-base" style={{ color: colors.text }}>
                        123 Restaurant Street<br />
                        Lagos, Nigeria
                      </p>
                      <p className="text-sm mt-2" style={{ color: colors.mutedText }}>
                        Visit us at our location
                      </p>
                    </div>
                  </div>
                </div>

                {/* Hours */}
                <div className="rounded-xl p-6 shadow-lg transition-all hover:scale-105" style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}` }}>
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: colors.orange500, color: '#fff' }}>
                      <IoTimeOutline className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-1" style={{ color: colors.text }}>Business Hours</h3>
                      <div className="text-base space-y-1" style={{ color: colors.text }}>
                        <p>Monday - Friday: 9:00 AM - 10:00 PM</p>
                        <p>Saturday - Sunday: 10:00 AM - 11:00 PM</p>
                      </div>
                      <p className="text-sm mt-2" style={{ color: colors.mutedText }}>
                        We're open for dine-in and takeout
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div>
              <div className="rounded-xl p-6 sm:p-8 shadow-lg" style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}` }}>
                <h2 className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: colors.text }}>
                  Send Us a Message
                </h2>
                <p className="text-base mb-6" style={{ color: colors.mutedText }}>
                  Fill out the form below and we'll get back to you as soon as possible.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Name */}
                  <div>
                    <label htmlFor="name" className="block text-base font-medium mb-2" style={{ color: colors.text }}>
                      Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 rounded-lg text-base"
                      style={{ 
                        background: colors.background, 
                        border: `1px solid ${colors.cardBorder}`, 
                        color: colors.text 
                      }}
                      placeholder="Your name"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label htmlFor="email" className="block text-base font-medium mb-2" style={{ color: colors.text }}>
                      Email *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 rounded-lg text-base"
                      style={{ 
                        background: colors.background, 
                        border: `1px solid ${colors.cardBorder}`, 
                        color: colors.text 
                      }}
                      placeholder="your.email@example.com"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label htmlFor="phone" className="block text-base font-medium mb-2" style={{ color: colors.text }}>
                      Phone
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-lg text-base"
                      style={{ 
                        background: colors.background, 
                        border: `1px solid ${colors.cardBorder}`, 
                        color: colors.text 
                      }}
                      placeholder="+234 123 456 7890"
                    />
                  </div>

                  {/* Subject */}
                  <div>
                    <label htmlFor="subject" className="block text-base font-medium mb-2" style={{ color: colors.text }}>
                      Subject *
                    </label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 rounded-lg text-base"
                      style={{ 
                        background: colors.background, 
                        border: `1px solid ${colors.cardBorder}`, 
                        color: colors.text 
                      }}
                      placeholder="What is this regarding?"
                    />
                  </div>

                  {/* Message */}
                  <div>
                    <label htmlFor="message" className="block text-base font-medium mb-2" style={{ color: colors.text }}>
                      Message *
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      required
                      rows={5}
                      className="w-full px-4 py-3 rounded-lg text-base resize-none"
                      style={{ 
                        background: colors.background, 
                        border: `1px solid ${colors.cardBorder}`, 
                        color: colors.text 
                      }}
                      placeholder="Tell us how we can help..."
                    />
                  </div>

                  {/* Submit Status */}
                  {submitStatus === 'success' && (
                    <div className="p-4 rounded-lg flex items-center gap-2" style={{ background: colors.green50, border: `1px solid ${colors.green500}` }}>
                      <IoCheckmarkCircleOutline className="h-5 w-5 flex-shrink-0" style={{ color: colors.green500 }} />
                      <p className="text-base" style={{ color: colors.green700 || colors.green500 }}>
                        Thank you! Your message has been sent successfully. We'll get back to you soon.
                      </p>
                    </div>
                  )}

                  {submitStatus === 'error' && (
                    <div className="p-4 rounded-lg flex items-center gap-2" style={{ background: colors.red50, border: `1px solid ${colors.red700}` }}>
                      <IoCloseCircleOutline className="h-5 w-5 flex-shrink-0" style={{ color: colors.red700 }} />
                      <p className="text-base" style={{ color: colors.red700 }}>
                        Something went wrong. Please try again later.
                      </p>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full px-6 py-4 rounded-lg font-semibold text-white transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    style={{ background: colors.amber500 }}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="animate-spin">⏳</span>
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <IoSendOutline className="h-5 w-5" />
                        <span>Send Message</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

