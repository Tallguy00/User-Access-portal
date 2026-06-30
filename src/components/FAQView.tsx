import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  HelpCircle, 
  User, 
  KeyRound, 
  Bell, 
  CheckSquare, 
  Shield, 
  LifeBuoy, 
  ChevronDown, 
  ChevronUp, 
  X,
  BookOpen,
  Sparkles,
  MessageSquare,
  Send,
  Bot,
  Trash2,
  RefreshCw,
  ArrowRight
} from 'lucide-react';
import HighlightText from './HighlightText';

export type FAQCategory = 
  | 'Account' 
  | 'Access Requests' 
  | 'Notifications' 
  | 'Approvals' 
  | 'Security' 
  | 'Technical Support';

export interface FAQItem {
  id: string;
  category: FAQCategory;
  question: string;
  answer: string;
}

const DEFAULT_FAQS: FAQItem[] = [
  {
    id: 'faq-1',
    category: 'Access Requests',
    question: 'How do I submit a new access request?',
    answer: 'Navigate to New Request, complete the required fields, and submit the form. You can track its progress in My Requests.'
  },
  {
    id: 'faq-2',
    category: 'Access Requests',
    question: 'How can I check the status of my request?',
    answer: 'Open My Requests to view statuses such as Pending, Approved, Rejected, or Completed.'
  },
  {
    id: 'faq-3',
    category: 'Access Requests',
    question: 'Can I edit a request after submitting it?',
    answer: 'Requests can only be edited while they are in the Draft state. Submitted requests cannot be modified unless returned by an approver.'
  },
  {
    id: 'faq-4',
    category: 'Approvals',
    question: 'Why was my request rejected?',
    answer: 'Open the request details to view the rejection reason provided by the approver.'
  },
  {
    id: 'faq-5',
    category: 'Notifications',
    question: 'How will I know when my request is approved?',
    answer: 'You will receive an in-app notification and, if enabled, an email notification.'
  },
  {
    id: 'faq-6',
    category: 'Security',
    question: 'How do I change my password?',
    answer: 'Go to Profile → Security and select Change Password.'
  },
  {
    id: 'faq-7',
    category: 'Account',
    question: 'How do I update my profile information?',
    answer: 'Open Profile Settings, edit your information, and save your changes.'
  },
  {
    id: 'faq-8',
    category: 'Technical Support',
    question: 'Who should I contact if I need help?',
    answer: 'Contact your system administrator or the IT support team using the Support page.'
  }
];

const CATEGORIES: { name: FAQCategory; icon: React.ComponentType<any>; color: string; bg: string }[] = [
  { name: 'Account', icon: User, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/30' },
  { name: 'Access Requests', icon: KeyRound, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
  { name: 'Notifications', icon: Bell, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/30' },
  { name: 'Approvals', icon: CheckSquare, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-950/30' },
  { name: 'Security', icon: Shield, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-950/30' },
  { name: 'Technical Support', icon: LifeBuoy, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-950/30' }
];

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}

export default function FAQView() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<FAQCategory | 'All'>('All');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Ask AI Chat States
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: "Hi! I'm your organization's Access Portal AI. Ask me any question about our access requests, approvals, account guidelines, or security policies, and I will find the answers for you using the system FAQs!",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  const messagesEndRef = React.useRef<HTMLDivElement | null>(null);

  // Auto-scroll to bottom of chat when messages change
  React.useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isGenerating]);

  const toggleExpand = (id: string) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || chatInput).trim();
    if (!query) return;

    if (!textToSend) {
      setChatInput('');
    }

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages(prev => [...prev, userMessage]);
    setIsGenerating(true);
    setChatError(null);

    try {
      const apiHistory = chatMessages
        .filter(m => m.id !== 'welcome')
        .slice(-10)
        .map(m => ({
          role: m.role,
          text: m.text
        }));

      const response = await fetch('/api/ask-ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          question: query,
          history: apiHistory
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error ${response.status}`);
      }

      const data = await response.json();
      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'model',
        text: data.answer || "I apologize, but I could not formulate a response.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setChatMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error("Ask AI Error:", error);
      setChatError(error.message || "Failed to generate answer from Gemini.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Memoized filter logic
  const filteredFaqs = useMemo(() => {
    return DEFAULT_FAQS.filter(faq => {
      const matchesCategory = selectedCategory === 'All' || faq.category === selectedCategory;
      
      const searchLower = searchTerm.toLowerCase().trim();
      const matchesSearch = !searchLower || 
        faq.question.toLowerCase().includes(searchLower) || 
        faq.answer.toLowerCase().includes(searchLower) ||
        faq.category.toLowerCase().includes(searchLower);

      return matchesCategory && matchesSearch;
    });
  }, [searchTerm, selectedCategory]);

  // Count per category (based on current search)
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    DEFAULT_FAQS.forEach(faq => {
      const searchLower = searchTerm.toLowerCase().trim();
      const matchesSearch = !searchLower || 
        faq.question.toLowerCase().includes(searchLower) || 
        faq.answer.toLowerCase().includes(searchLower);

      if (matchesSearch) {
        counts[faq.category] = (counts[faq.category] || 0) + 1;
      }
    });
    return counts;
  }, [searchTerm]);

  const totalResults = filteredFaqs.length;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-800 pb-5">
        <div>
          <h1 className="text-2xl font-black text-gray-950 dark:text-white tracking-tight flex items-center gap-2">
            <HelpCircle className="w-6 h-6 text-blue-600 dark:text-blue-500" />
            <span>Frequently Asked Questions</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Find answers to common questions about accounts, access privileges, security policies, and workflow management.
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-950/30 px-3 py-1.5 rounded-full shrink-0">
          <BookOpen className="w-3.5 h-3.5" />
          <span>{DEFAULT_FAQS.length} Guidelines Available</span>
        </div>
      </div>

      {/* Search and Categories Quick Filter */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 shadow-sm space-y-4">
        
        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-4 top-3.5 w-4 h-4 text-gray-400" />
          <input
            id="faq-search"
            type="text"
            placeholder="Search FAQs by keywords (e.g. 'rejection', 'status', 'password')..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setExpandedId(null); // Collapse when searching to avoid layout jumps
            }}
            className="pl-11 pr-10 py-3 w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 transition-all placeholder-gray-400 dark:placeholder-gray-500"
          />
          {searchTerm && (
            <button
              onClick={() => {
                setSearchTerm('');
                setExpandedId(null);
              }}
              className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Categories Pills */}
        <div className="space-y-2">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider pl-1">
            Filter by Category
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              id="faq-cat-all"
              onClick={() => {
                setSelectedCategory('All');
                setExpandedId(null);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border ${
                selectedCategory === 'All'
                  ? 'bg-blue-600 dark:bg-blue-500 text-white border-blue-600 dark:border-blue-500 shadow-sm'
                  : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-150 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-750'
              }`}
            >
              <span>All</span>
              <span className={`px-1.5 py-0.2 text-[10px] rounded-full ${
                selectedCategory === 'All' ? 'bg-white/20 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
              }`}>
                {DEFAULT_FAQS.length}
              </span>
            </button>

            {CATEGORIES.map(cat => {
              const count = categoryCounts[cat.name] || 0;
              const Icon = cat.icon;
              return (
                <button
                  key={cat.name}
                  id={`faq-cat-${cat.name.replace(/\s+/g, '-').toLowerCase()}`}
                  onClick={() => {
                    setSelectedCategory(cat.name);
                    setExpandedId(null);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border ${
                    selectedCategory === cat.name
                      ? 'bg-blue-600 dark:bg-blue-500 text-white border-blue-600 dark:border-blue-500 shadow-sm'
                      : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-150 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-750'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${selectedCategory === cat.name ? 'text-white' : cat.color}`} />
                  <span>{cat.name}</span>
                  {count > 0 && (
                    <span className={`px-1.5 py-0.2 text-[10px] rounded-full ${
                      selectedCategory === cat.name ? 'bg-white/20 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* FAQ Accordion List */}
      <div className="space-y-3">
        {totalResults === 0 ? (
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-12 text-center space-y-3 shadow-xs">
            <div className="mx-auto w-12 h-12 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-400 dark:text-gray-500">
              <Search className="w-5 h-5" />
            </div>
            <div className="font-bold text-gray-900 dark:text-white">No FAQs found</div>
            <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
              No matching questions found for "{searchTerm}". Try checking your spelling or filtering by a specific category instead.
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('All');
                setExpandedId(null);
              }}
              className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all shadow-sm"
            >
              Clear Search Filters
            </button>
          </div>
        ) : (
          <div className="space-y-3" id="faq-accordion-list">
            <AnimatePresence initial={false}>
              {filteredFaqs.map(faq => {
                const isOpen = expandedId === faq.id;
                const catObj = CATEGORIES.find(c => c.name === faq.category) || CATEGORIES[0];
                const CatIcon = catObj.icon;

                return (
                  <div 
                    key={faq.id}
                    className={`bg-white dark:bg-gray-900 border rounded-2xl transition-all shadow-xs overflow-hidden ${
                      isOpen 
                        ? 'border-blue-200 dark:border-blue-900/60 ring-1 ring-blue-100 dark:ring-blue-950/40' 
                        : 'border-gray-100 dark:border-gray-800/80 hover:border-gray-200 dark:hover:border-gray-700/80'
                    }`}
                  >
                    {/* Header trigger button */}
                    <button
                      id={`faq-trigger-${faq.id}`}
                      onClick={() => toggleExpand(faq.id)}
                      className="w-full text-left p-5 flex items-start justify-between gap-4 focus:outline-none"
                    >
                      <div className="space-y-2">
                        {/* Category tag */}
                        <div className="flex items-center gap-1.5">
                          <span className={`p-1 rounded-md ${catObj.bg} ${catObj.color}`}>
                            <CatIcon className="w-3 h-3" />
                          </span>
                          <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">
                            {faq.category}
                          </span>
                        </div>
                        {/* Question */}
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white tracking-tight leading-snug">
                          <HighlightText text={faq.question} search={searchTerm} />
                        </h3>
                      </div>
                      
                      {/* Accordion toggle indicator */}
                      <span className={`p-1.5 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors mt-1 shrink-0`}>
                        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </span>
                    </button>

                    {/* Accordion content with smooth framer-motion slide-expand */}
                    <motion.div
                      id={`faq-content-${faq.id}`}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ 
                        height: isOpen ? 'auto' : 0, 
                        opacity: isOpen ? 1 : 0 
                      }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 pt-1 border-t border-gray-50 dark:border-gray-800/50">
                        <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed max-w-3xl">
                          <HighlightText text={faq.answer} search={searchTerm} />
                        </p>
                      </div>
                    </motion.div>
                  </div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Suggestion banner or quick tip */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/10 dark:to-indigo-950/10 border border-blue-100/40 dark:border-blue-950/20 rounded-2xl p-5 flex items-start gap-4 mb-20 md:mb-6">
        <div className="p-2.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl shrink-0">
          <Sparkles className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h4 className="text-xs font-bold text-gray-900 dark:text-white">Did not find what you were looking for?</h4>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
            If your specific concern is not covered, you can open a direct request under the <strong className="text-blue-600 dark:text-blue-400 font-bold">New Access Request</strong> option or reach out directly to the support desk.
          </p>
        </div>
      </div>

      {/* Floating Ask AI Button and Chat Interface */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 pointer-events-none">
        
        {/* Chat Box */}
        <AnimatePresence>
          {isChatOpen && (
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.95 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="pointer-events-auto w-[380px] max-w-[calc(100vw-2rem)] h-[520px] bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            >
              {/* Chat Header */}
              <div className="bg-[#0052cc] p-4 flex items-center justify-between text-white">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-white/10 rounded-lg">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black tracking-tight leading-tight">Access Portal AI</h4>
                    <p className="text-[10px] text-blue-200 font-medium">Powered by Gemini 3.5 Flash</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      setChatMessages([
                        {
                          id: 'welcome',
                          role: 'model',
                          text: "Hi! I'm your organization's Access Portal AI. Ask me any question about our access requests, approvals, account guidelines, or security policies, and I will find the answers for you using the system FAQs!",
                          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        }
                      ]);
                      setChatError(null);
                    }}
                    className="p-1.5 hover:bg-white/10 rounded-lg text-white/80 hover:text-white transition-colors"
                    title="Clear conversation"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setIsChatOpen(false)}
                    className="p-1.5 hover:bg-white/10 rounded-lg text-white/80 hover:text-white transition-colors"
                    aria-label="Close chat"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Messages list */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50/50 dark:bg-gray-950/20">
                {chatMessages.map(msg => (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                  >
                    {msg.role === 'model' && (
                      <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-[#0052cc] dark:text-blue-400 flex items-center justify-center font-bold text-xs shrink-0 border border-blue-100 dark:border-blue-950/60">
                        AI
                      </div>
                    )}
                    <div className="space-y-1 max-w-[80%]">
                      <div
                        className={`p-3 rounded-2xl text-xs leading-relaxed ${
                          msg.role === 'user'
                            ? 'bg-[#0052cc] text-white rounded-tr-none'
                            : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-gray-750 rounded-tl-none'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{msg.text}</p>
                      </div>
                      <div className={`text-[9px] text-gray-400 font-medium px-1 ${msg.role === 'user' ? 'text-right' : ''}`}>
                        {msg.timestamp}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Loading status */}
                {isGenerating && (
                  <div className="flex items-start gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-[#0052cc] dark:text-blue-400 flex items-center justify-center font-bold text-xs shrink-0 border border-blue-100 dark:border-blue-950/60 animate-pulse">
                      AI
                    </div>
                    <div className="p-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-750 rounded-2xl rounded-tl-none flex items-center gap-1.5 shrink-0">
                      <span className="w-1.5 h-1.5 bg-[#0052cc] rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                      <span className="w-1.5 h-1.5 bg-[#0052cc] rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                      <span className="w-1.5 h-1.5 bg-[#0052cc] rounded-full animate-bounce"></span>
                    </div>
                  </div>
                )}

                {/* Error banner */}
                {chatError && (
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-950/40 rounded-xl space-y-2">
                    <p className="text-[11px] text-rose-600 dark:text-rose-400 font-medium leading-normal">
                      {chatError}
                    </p>
                    <button
                      onClick={() => handleSendMessage()}
                      className="flex items-center gap-1.5 text-[10px] text-rose-700 dark:text-rose-300 font-bold hover:underline"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Retry Question</span>
                    </button>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Suggestion Quick Chips */}
              {!isGenerating && !chatError && (
                <div className="px-4 py-2 bg-gray-50/50 dark:bg-gray-950/30 border-t border-gray-100 dark:border-gray-800/60 overflow-x-auto whitespace-nowrap scrollbar-none flex gap-2">
                  <button
                    onClick={() => handleSendMessage('How do I submit an access request?')}
                    className="px-2.5 py-1 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-750 border border-gray-150 dark:border-gray-700 text-[10px] font-bold text-gray-600 dark:text-gray-300 rounded-lg shrink-0 transition-colors"
                  >
                    Submit request?
                  </button>
                  <button
                    onClick={() => handleSendMessage('Why was my request rejected?')}
                    className="px-2.5 py-1 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-750 border border-gray-150 dark:border-gray-700 text-[10px] font-bold text-gray-600 dark:text-gray-300 rounded-lg shrink-0 transition-colors"
                  >
                    Why rejected?
                  </button>
                  <button
                    onClick={() => handleSendMessage('How do I change my password?')}
                    className="px-2.5 py-1 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-750 border border-gray-150 dark:border-gray-700 text-[10px] font-bold text-gray-600 dark:text-gray-300 rounded-lg shrink-0 transition-colors"
                  >
                    Change password?
                  </button>
                </div>
              )}

              {/* Input Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="p-3 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 flex gap-2"
              >
                <input
                  type="text"
                  placeholder="Ask AI anything about the portal..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  disabled={isGenerating}
                  className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1.5 focus:ring-[#0052cc] disabled:opacity-60 transition-all"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim() || isGenerating}
                  className="p-2.5 bg-[#0052cc] hover:bg-blue-700 text-white rounded-xl flex items-center justify-center transition-all disabled:opacity-40 disabled:hover:bg-[#0052cc]"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Toggle Button */}
        <button
          onClick={() => setIsChatOpen(!isChatOpen)}
          className="pointer-events-auto h-12 px-4 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs tracking-tight shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2 border border-blue-500/20 group relative overflow-hidden"
          aria-label="Ask Portal AI"
          id="faq-floating-ask-ai"
        >
          <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          {isChatOpen ? (
            <X className="w-4 h-4 shrink-0 transition-transform duration-300" />
          ) : (
            <Sparkles className="w-4 h-4 shrink-0 animate-pulse text-yellow-300" />
          )}
          <span>{isChatOpen ? 'Close Assistant' : 'Ask Portal AI'}</span>
        </button>
      </div>

    </div>
  );
}
