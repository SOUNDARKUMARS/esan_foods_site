import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Sparkles,
  Send,
  X,
  Minimize2,
  Maximize2,
  Trash2,
  ExternalLink,
  ShoppingBag,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Leaf,
  ChevronDown,
  ChevronUp,
  Search,
  Database
} from 'lucide-react';
import { sendChatMessage, streamChatMessage, fetchAgentHistory } from '../services/agentApi';
import './CustomerAgentChat.css';

/**
 * Resolve the real product image directly from the product object in the app/database
 */
function resolveProductImage(product) {
  if (!product) return '';
  if (typeof product.image === 'string' && product.image.trim()) {
    return product.image.trim();
  }
  if (Array.isArray(product.gallery_images) && product.gallery_images.length > 0 && typeof product.gallery_images[0] === 'string') {
    return product.gallery_images[0].trim();
  }
  if (Array.isArray(product.galleryImages) && product.galleryImages.length > 0 && typeof product.galleryImages[0] === 'string') {
    return product.galleryImages[0].trim();
  }
  return '';
}

export default function CustomerAgentChat({
  onNavigateToProduct,
  onAddToCart,
  currentUser = null,
  allProducts = []
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [interimStatus, setInterimStatus] = useState(null);
  const [liveSteps, setLiveSteps] = useState([]);
  const [expandedAudits, setExpandedAudits] = useState({});
  const [lastNavTarget, setLastNavTarget] = useState(null);

  const toggleStepAudit = (msgId) => {
    setExpandedAudits(prev => ({
      ...prev,
      [msgId]: !prev[msgId]
    }));
  };

  const getAuditSummary = (steps) => {
    if (!Array.isArray(steps) || steps.length === 0) return 'Catalog lookup';
    const textAll = steps.map(s => s.text || s.status || '').join(' ').toLowerCase();
    const hasVector = textAll.includes('vector') || textAll.includes('search') || textAll.includes('found');
    const hasStock = textAll.includes('stock') || textAll.includes('inventory');
    const countStep = steps.find(s => s.count !== null && s.count !== undefined && s.count > 0);

    if (hasVector && hasStock) {
      return countStep ? `pgvector (${countStep.count} found) • live stock checked` : 'pgvector search • live stock checked';
    }
    if (hasVector) {
      return countStep ? `pgvector search (${countStep.count} found)` : 'pgvector semantic search';
    }
    if (hasStock) {
      return 'inventory verified';
    }
    return `${steps.length} actions performed`;
  };

  // Generate or retrieve persistent customer session ID
  const [sessionId] = useState(() => {
    try {
      let saved = localStorage.getItem('esan_agent_session_id');
      if (!saved) {
        saved = `esan_cust_${Math.random().toString(36).slice(2, 9)}_${Date.now().toString(36)}`;
        localStorage.setItem('esan_agent_session_id', saved);
      }
      return saved;
    } catch {
      return `esan_cust_${Date.now()}`;
    }
  });

  // Message list state
  const [messages, setMessages] = useState([
    {
      id: 'welcome-1',
      role: 'assistant',
      content: `Vanakkam! 🌿 How can I help you today? Ask me about live stock, ingredients, or any product you're looking for.`,
      system_status: null,
      interim_steps: [],
      recommended_products: [],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom();
      inputRef.current?.focus();
    }
  }, [messages, isOpen, isMinimized, interimStatus, liveSteps]);

  // Load existing conversation messages from backend DB on first mount
  useEffect(() => {
    async function loadPastMessages() {
      try {
        const past = await fetchAgentHistory(sessionId);
        if (past && past.length > 0) {
          const formatted = past.map(m => ({
            id: m.id || `hist_${Math.random()}`,
            role: m.role,
            content: m.content,
            system_status: m.system_status,
            interim_steps: Array.isArray(m.interim_steps) ? m.interim_steps : [],
            recommended_products: m.recommended_products || [],
            navigation: m.navigation || null,
            timestamp: m.created_at
              ? new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : ''
          }));
          setMessages(prev => {
            return formatted;
          });
        }
      } catch (e) {
        // Safe fallback
      }
    }
    loadPastMessages();
  }, [sessionId]);

  // Handle sending a user message
  const handleSendMessage = async (textToSend = null) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isLoading) return;

    setInputMessage('');
    const userMsgId = `usr_${Date.now()}`;
    const userMsg = {
      id: userMsgId,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);
    setInterimStatus('Consulting Esan Foods catalog...');
    setLiveSteps([]);

    const collectedSteps = [];

    try {
      const response = await streamChatMessage({
        prompt: text,
        sessionId,
        userId: currentUser?.id || currentUser?.supabaseId || null,
        customerName: currentUser?.name || 'Store Customer',
        onStatus: (statusPayload) => {
          if (statusPayload?.status) {
            setInterimStatus(statusPayload.status);
            collectedSteps.push(statusPayload);
            setLiveSteps([...collectedSteps]);
          }
        }
      });

      const assistantMsg = {
        id: `ast_${Date.now()}`,
        role: 'assistant',
        content: response.finalAnswer || 'Thank you for asking! Let me know if you would like to explore any more herbal foods or juices.',
        system_status: response.systemicStatus || null,
        interim_steps: (Array.isArray(response.interimSteps) && response.interimSteps.length > 0)
          ? response.interimSteps
          : collectedSteps,
        recommended_products: response.products || [],
        navigation: response.navigation || null,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, assistantMsg]);

      // Handle Automatic Navigation if agent instructed to navigate to a product
      if (response.navigation?.productId && typeof onNavigateToProduct === 'function') {
        const targetId = response.navigation.productId;
        setLastNavTarget({
          productId: targetId,
          productName: response.navigation.productName || targetId
        });
        // Smoothly trigger navigation
        setTimeout(() => {
          onNavigateToProduct(targetId);
        }, 500);
      }
    } catch (err) {
      console.error('[CustomerAgentChat] Error:', err);
      setMessages(prev => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          role: 'assistant',
          content: `I'm having a brief issue connecting with our catalog system: ${err.message}. Please feel free to ask again!`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsLoading(false);
      setInterimStatus(null);
    }
  };

  const handleClearChat = () => {
    const newSession = `esan_cust_${Math.random().toString(36).slice(2, 9)}_${Date.now().toString(36)}`;
    try {
      localStorage.setItem('esan_agent_session_id', newSession);
    } catch (_) {}

    setMessages([
      {
        id: `welcome_${Date.now()}`,
        role: 'assistant',
        content: `Chat cleared! What can I help you find today? 🌿`,
        recommended_products: [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  // Helper to parse and render formatted markdown text, including multiline/inline images, bolding, lists
  const renderFormattedContent = (content) => {
    if (!content) return null;

    // Tokenize markdown images: supports ![alt](url) even if split by newlines between ] and (
    const imgRegex = /!\[([^\]]*)\]\s*\(\s*(https?:\/\/[^\s\)]+)\s*\)/g;
    let lastIdx = 0;
    let match;
    const blocks = [];

    while ((match = imgRegex.exec(content)) !== null) {
      if (match.index > lastIdx) {
        blocks.push({ type: 'text', content: content.slice(lastIdx, match.index) });
      }
      blocks.push({ type: 'image', alt: match[1] || 'Product preview', url: match[2] });
      lastIdx = imgRegex.lastIndex;
    }
    if (lastIdx < content.length) {
      blocks.push({ type: 'text', content: content.slice(lastIdx) });
    }

    return (
      <div className="esan-markdown">
        {blocks.map((block, bIdx) => {
          if (block.type === 'image') {
            return (
              <div key={`img_${bIdx}`} className="esan-chat-inline-img-card">
                <img
                  src={block.url}
                  alt={block.alt}
                  className="esan-chat-inline-img"
                  loading="lazy"
                  onError={(e) => {
                    e.target.style.opacity = '0.5';
                  }}
                />
                {block.alt && <span className="esan-chat-inline-img-caption">{block.alt}</span>}
              </div>
            );
          }

          // Text block: split into lines
          const lines = block.content.split('\n');
          return (
            <React.Fragment key={`txt_${bIdx}`}>
              {lines.map((line, idx) => {
                const trimmed = line.trim();
                if (!trimmed) return <div key={idx} style={{ height: '4px' }} />;

                // Bullet line
                if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                  const rawText = trimmed.slice(2);
                  return (
                    <div key={idx} style={{ display: 'flex', gap: '6px', margin: '3px 0' }}>
                      <span style={{ color: '#059669', fontWeight: 'bold' }}>•</span>
                      <span dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(rawText) }} />
                    </div>
                  );
                }

                // Table row
                if (trimmed.includes('|') && trimmed.startsWith('|')) {
                  const cells = trimmed.split('|').map(c => c.trim()).filter(Boolean);
                  if (cells.length > 0 && !trimmed.includes('---')) {
                    return (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', fontSize: '0.84rem' }}>
                        {cells.map((cell, cIdx) => (
                          <span key={cIdx} style={{ fontWeight: cIdx === 0 ? 600 : 400 }} dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(cell) }} />
                        ))}
                      </div>
                    );
                  }
                  return null;
                }

                return (
                  <p key={idx} dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(trimmed) }} />
                );
              })}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  const formatInlineMarkdown = (text) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code style="background:rgba(0,0,0,0.06);padding:1px 4px;border-radius:4px;">$1</code>');
  };

  // Stock badge styling
  const renderStockBadge = (stockQuantity, stockStatus) => {
    const qty = stockQuantity ?? 100;
    if (qty <= 0 || stockStatus === 'Out of Stock') {
      return <span className="esan-stock-badge out-of-stock"><AlertTriangle size={11} /> Out of Stock</span>;
    }
    if (qty <= 15 || stockStatus === 'Low Stock') {
      return <span className="esan-stock-badge low-stock"><AlertTriangle size={11} /> Only {qty} left!</span>;
    }
    return <span className="esan-stock-badge in-stock"><CheckCircle2 size={11} /> In Stock ({qty})</span>;
  };

  return (
    <>
      {/* 1. Floating Launcher Button */}
      {!isOpen && (
        <button
          className="esan-agent-launcher"
          onClick={() => {
            setIsOpen(true);
            setIsMinimized(false);
          }}
          aria-label="Open Esan Foods Customer AI Concierge"
          id="esan-agent-launcher-btn"
        >
          <div className="esan-launcher-avatar">
            <Bot size={20} />
            <div className="esan-launcher-pulse" />
          </div>
          <div className="esan-launcher-label">
            <span className="esan-launcher-title">
              Ask Esan <Sparkles size={13} style={{ color: '#bef264' }} />
            </span>
            <span className="esan-launcher-sub">Live Stock & Herbal Guide</span>
          </div>
        </button>
      )}

      {/* 2. Chat Window / Drawer */}
      {isOpen && (
        <div className={`esan-agent-window ${isMinimized ? 'minimized' : ''}`} id="esan-agent-chat-modal">
          {/* Header */}
          <div className="esan-agent-header">
            <div className="esan-header-left">
              <div className="esan-header-avatar">
                <Bot size={22} />
                <div className="esan-status-indicator" />
              </div>
              <div className="esan-header-info">
                <h4>Esan Concierge</h4>
                <p>
                  <Leaf size={11} /> 100% Pure Foods & Herbs Advisor
                </p>
              </div>
            </div>

            <div className="esan-header-actions">
              <button
                className="esan-btn-icon"
                onClick={handleClearChat}
                title="Clear conversation"
                aria-label="Clear chat"
              >
                <Trash2 size={15} />
              </button>
              <button
                className="esan-btn-icon"
                onClick={() => setIsMinimized(!isMinimized)}
                title={isMinimized ? 'Expand chat' : 'Minimize chat'}
                aria-label="Toggle minimize"
              >
                {isMinimized ? <Maximize2 size={15} /> : <Minimize2 size={15} />}
              </button>
              <button
                className="esan-btn-icon"
                onClick={() => setIsOpen(false)}
                title="Close chat"
                aria-label="Close chat"
              >
                <X size={17} />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Messages Area */}
              <div className="esan-agent-messages">
                {/* Welcome & Prompt suggestions */}
                <div className="esan-welcome-banner">
                  <div className="esan-welcome-title">
                    <Sparkles size={16} /> Quick Customer Actions
                  </div>
                  <div className="esan-welcome-desc">
                    Tap any prompt below to check live inventory, request product specs, or navigate to items:
                  </div>
                  <div className="esan-quick-pills">
                    <button
                      className="esan-pill"
                      onClick={() => handleSendMessage('Do you have Moringa Powder in stock and what is the quantity?')}
                    >
                      🌿 Check Moringa stock
                    </button>
                    <button
                      className="esan-pill"
                      onClick={() => handleSendMessage('Please show me Guava Juice Drink details and navigate to it')}
                    >
                      🥭 Inspect Guava Juice
                    </button>
                    <button
                      className="esan-pill"
                      onClick={() => handleSendMessage('What are your most popular customer favorites?')}
                    >
                      ⭐ Best sellers
                    </button>
                    <button
                      className="esan-pill"
                      onClick={() => handleSendMessage('Show me all products currently in stock')}
                    >
                      🛒 In-stock catalog
                    </button>
                  </div>
                </div>

                {/* Message Threads */}
                {messages.map((msg) => (
                  <div key={msg.id} className={`esan-msg-row ${msg.role}`}>
                    <div className="esan-msg-bubble">
                      {renderFormattedContent(msg.content)}

                      {/* Attached Product Cards if returned by tools */}
                      {Array.isArray(msg.recommended_products) && msg.recommended_products.length > 0 && (
                        <div className="esan-product-cards-grid">
                          {msg.recommended_products.map((prod) => {
                            const matchedStoreProduct = allProducts.find(p => p.id === prod.id) || prod;
                            const imgSrc = resolveProductImage(matchedStoreProduct) || resolveProductImage(prod);
                            const priceDisplay = prod.price ? `$${Number(prod.price).toFixed(2)}` : '$3.99';

                            return (
                              <div key={prod.id} className="esan-product-card">
                                <div className="esan-card-img-wrap">
                                  {imgSrc ? (
                                    <img
                                      src={imgSrc}
                                      alt={prod.name}
                                      className="esan-card-img"
                                      loading="lazy"
                                      onError={(e) => {
                                        e.target.style.opacity = '0.5';
                                      }}
                                    />
                                  ) : (
                                    <div className="esan-card-img-placeholder">🌿</div>
                                  )}
                                </div>
                                <div className="esan-card-content">
                                  <div className="esan-card-header">
                                    <div>
                                      <div className="esan-card-title">{prod.name}</div>
                                      <div className="esan-card-sub">{prod.subtitle || prod.category || '100% Pure Organic'}</div>
                                    </div>
                                    <div>{renderStockBadge(prod.stockQuantity, prod.stockStatus)}</div>
                                  </div>

                                  <div className="esan-card-footer">
                                    <span className="esan-card-price">{priceDisplay}</span>
                                    <div className="esan-card-actions">
                                      <button
                                        className="esan-btn-view"
                                        onClick={() => {
                                          if (typeof onNavigateToProduct === 'function') {
                                            onNavigateToProduct(prod.id);
                                          }
                                        }}
                                        title="View full product page"
                                      >
                                        <ExternalLink size={12} /> View
                                      </button>
                                      <button
                                        className="esan-btn-add"
                                        onClick={() => {
                                          if (typeof onAddToCart === 'function') {
                                            onAddToCart(matchedStoreProduct, 1);
                                          }
                                        }}
                                        title="Add to shopping box"
                                      >
                                        <ShoppingBag size={12} /> Add
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Navigation confirmation chip */}
                      {msg.navigation && (
                        <div
                          className="esan-nav-notice"
                          onClick={() => {
                            if (typeof onNavigateToProduct === 'function' && msg.navigation.productId) {
                              onNavigateToProduct(msg.navigation.productId);
                            }
                          }}
                        >
                          <span>🚀 Navigated to {msg.navigation.productName || msg.navigation.productId}</span>
                          <ArrowRight size={13} />
                        </div>
                      )}

                      {/* Expandable Step History / Audit Trail */}
                      {Array.isArray(msg.interim_steps) && msg.interim_steps.length > 0 && (
                        <div className="esan-msg-audit">
                          <button
                            type="button"
                            className="esan-msg-audit-toggle"
                            onClick={() => toggleStepAudit(msg.id)}
                            title="View systematic steps taken"
                          >
                            <span className="esan-audit-sparkle">⚡</span>
                            <span className="esan-audit-summary-label">{getAuditSummary(msg.interim_steps)}</span>
                            {expandedAudits[msg.id] ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                          </button>

                          {expandedAudits[msg.id] && (
                            <div className="esan-msg-audit-drawer animate-fade-in">
                              {msg.interim_steps.map((st, stIdx) => {
                                const hasCount = st.count !== null && st.count !== undefined && st.count > 0;
                                return (
                                  <div key={stIdx} className="esan-audit-step-row">
                                    <span className="esan-audit-check">✓</span>
                                    <span className="esan-audit-step-text">{st.text || st.status}</span>
                                    {hasCount && (
                                      <span className="esan-audit-count-badge">{st.count} results</span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    {msg.timestamp && <span className="esan-msg-time">{msg.timestamp}</span>}
                  </div>
                ))}

                {/* Systemic Interim Activity Card */}
                {isLoading && (
                  <div className="esan-interim-card" id="esan-interim-activity-card">
                    <div className="esan-interim-card-header">
                      <div className="esan-interim-pulse-avatar">
                        <Sparkles size={14} className="esan-spin-slow" />
                      </div>
                      <div className="esan-interim-header-info">
                        <span className="esan-interim-active-title">{interimStatus || 'Consulting Esan Foods catalog...'}</span>
                        <span className="esan-interim-sub-badge">Live pgvector search</span>
                      </div>
                    </div>

                    {liveSteps.length > 0 && (
                      <div className="esan-interim-steplist">
                        {liveSteps.map((st, stIdx) => {
                          const hasCount = st.count !== null && st.count !== undefined && st.count > 0;
                          return (
                            <div key={stIdx} className="esan-interim-step-row animate-fade-in">
                              <span className="esan-step-check">✓</span>
                              <span className="esan-step-text">{st.text || st.status}</span>
                              {hasCount && (
                                <span className="esan-step-badge">{st.count} results</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input Bar */}
              <form
                className="esan-agent-input-bar"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
              >
                <input
                  ref={inputRef}
                  type="text"
                  className="esan-agent-input"
                  placeholder="Ask about ingredients, stock, benefits..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  disabled={isLoading}
                  id="esan-agent-chat-input"
                />
                <button
                  type="submit"
                  className="esan-agent-send-btn"
                  disabled={!inputMessage.trim() || isLoading}
                  title="Send message"
                  aria-label="Send message"
                  id="esan-agent-send-btn"
                >
                  <Send size={16} />
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </>
  );
}
