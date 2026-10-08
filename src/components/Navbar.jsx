import React, { useState } from 'react'
import { ShoppingBag, Search, User, Heart, Menu, X, Sparkles, ChevronDown } from 'lucide-react'

export default function Navbar({
  cartCount,
  onOpenCart,
  onOpenAuth,
  onOpenAdminDashboard,
  user,
  searchQuery,
  onSearchChange,
  wishlistCount,
  onOpenWishlist,
}) {
  const [showSearch, setShowSearch] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="site-header">
      <div className="header-inner">
        {/* Brand Logo */}
        <a href="#home" className="brand-logo">
          <div className="logo-icon-wrap">
            <span className="logo-leaf">🌿</span>
          </div>
          <div className="logo-text-wrap">
            <span className="brand-name">Juicera</span>
            <span className="brand-badge">Pure Organic</span>
          </div>
        </a>

        {/* Desktop Navigation Links */}
        <nav className="desktop-nav" aria-label="Main Navigation">
          <a href="#home" className="nav-link active">Home</a>
          <div className="nav-dropdown-trigger">
            <a href="#collections" className="nav-link">
              Shop <ChevronDown size={14} className="dropdown-arrow" />
            </a>
            <div className="nav-dropdown-menu">
              <a href="#collections">All Flavors</a>
              <a href="#collections">100% Pure Juice</a>
              <a href="#collections">Sparkling Fruit</a>
              <a href="#collections">Tropical & Exotic</a>
              <a href="#spotlight">Featured Spotlight</a>
            </div>
          </div>
          <a href="#spotlight" className="nav-link">Product</a>
          <a href="#reviews" className="nav-link">Reviews</a>
          <a href="#benefits" className="nav-link">Why Juicera</a>
          <a href="#faq" className="nav-link">FAQ</a>
        </nav>

        {/* Right Action Icons */}
        <div className="header-actions">
          {/* Search Trigger */}
          <div className="search-wrap">
            {showSearch ? (
              <div className="search-input-box animate-fade-in">
                <Search size={16} className="search-box-icon" />
                <input
                  type="text"
                  placeholder="Search flavors, fruits..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  autoFocus
                />
                <button
                  type="button"
                  className="search-close-btn"
                  onClick={() => setShowSearch(false)}
                  aria-label="Close search"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="icon-btn"
                onClick={() => setShowSearch(true)}
                aria-label="Search drinks"
                title="Search"
              >
                <Search size={19} />
              </button>
            )}
          </div>

          {/* Wishlist Button */}
          <button
            type="button"
            className="icon-btn wishlist-btn"
            onClick={onOpenWishlist}
            aria-label="View Wishlist"
            title="Favorites"
          >
            <Heart size={19} className={wishlistCount > 0 ? 'heart-active' : ''} />
            {wishlistCount > 0 && (
              <span className="counter-badge">{wishlistCount}</span>
            )}
          </button>

          {/* Cart Trigger */}
          <button
            type="button"
            className="icon-btn cart-btn"
            onClick={onOpenCart}
            aria-label={`Shopping cart with ${cartCount} items`}
            id="cart-trigger-btn"
          >
            <ShoppingBag size={19} />
            {cartCount > 0 && (
              <span className="counter-badge cart-badge-pulse">{cartCount}</span>
            )}
          </button>

          {/* User / Login / Admin Pill */}
          {user ? (
            <div className="user-action-group">
              {user.role === 'admin' && (
                <button
                  type="button"
                  className="navbar-admin-dash-btn"
                  onClick={onOpenAdminDashboard}
                  title="Open Admin Dashboard"
                >
                  <span className="admin-badge-dot"></span>
                  <span>Admin Panel</span>
                </button>
              )}
              <button
                type="button"
                className={`user-pill-btn ${user.role === 'admin' ? 'is-admin' : ''}`}
                onClick={onOpenAuth}
              >
                <div className={`user-avatar-dot ${user.role === 'admin' ? 'admin-dot' : ''}`}></div>
                <span>{user.name.split(' ')[0]}</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="login-btn-pill"
              onClick={onOpenAuth}
              id="login-btn"
            >
              <User size={15} />
              <span>Login</span>
            </button>
          )}

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            className="icon-btn mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="mobile-nav-panel animate-fade-in">
          <a href="#home" onClick={() => setMobileMenuOpen(false)}>Home</a>
          <a href="#collections" onClick={() => setMobileMenuOpen(false)}>Shop Collections</a>
          <a href="#spotlight" onClick={() => setMobileMenuOpen(false)}>Featured Product</a>
          <a href="#reviews" onClick={() => setMobileMenuOpen(false)}>Customer Reviews</a>
          <a href="#benefits" onClick={() => setMobileMenuOpen(false)}>Why You'll Love It</a>
          <a href="#faq" onClick={() => setMobileMenuOpen(false)}>Frequently Asked Questions</a>
        </div>
      )}
    </header>
  )
}
