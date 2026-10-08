import React, { useState } from 'react'
import { ShoppingBag, Search, User, Heart, Menu, X, Sparkles, ChevronDown, Shield } from 'lucide-react'
import esanLogo from '../assets/esan_foods_logo.png'

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
  onGoHome,
}) {
  const [showSearch, setShowSearch] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleHomeClick = (e) => {
    if (onGoHome) onGoHome()
  }

  return (
    <header className="site-header">
      <div className="header-inner">
        {/* Brand Logo */}
        <a
          href="#home"
          className="brand-logo"
          aria-label="Esan Foods Homepage"
          onClick={handleHomeClick}
        >
          <img src={esanLogo} alt="Esan Foods Logo" className="brand-logo-img" />
          <div className="logo-text-wrap">
            <span className="brand-name">Esan Foods</span>
            <span className="brand-badge">100% Natural & Healthy</span>
          </div>
        </a>

        {/* Desktop Navigation Links */}
        <nav className="desktop-nav" aria-label="Main Navigation">
          <a href="#home" className="nav-link active" onClick={handleHomeClick}>
            Home
          </a>
          <div className="nav-dropdown-trigger">
            <a href="#collections" className="nav-link">
              Shop <ChevronDown size={14} className="dropdown-arrow" />
            </a>
            <div className="nav-dropdown-menu">
              <a href="#collections">All Products</a>
              <a href="#collections">Herbal Powders</a>
              <a href="#collections">Natural Boosters</a>
              <a href="#spotlight">Featured Spotlight</a>
            </div>
          </div>
          <a href="#spotlight" className="nav-link">Product</a>
          <a href="#reviews" className="nav-link">Reviews</a>
          <a href="#benefits" className="nav-link">Why Esan Foods</a>
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
                <span className="user-pill-name">{user.name.split(' ')[0]}</span>
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
          {user?.role === 'admin' && (
            <button
              type="button"
              className="mobile-admin-badge-btn"
              onClick={() => {
                onOpenAdminDashboard()
                setMobileMenuOpen(false)
              }}
            >
              <Shield size={16} className="text-emerald-400" />
              <span>Launch Admin Console</span>
            </button>
          )}
          <a
            href="#home"
            onClick={() => {
              if (onGoHome) onGoHome()
              setMobileMenuOpen(false)
            }}
          >
            Home
          </a>
          <a
            href="#collections"
            onClick={() => {
              if (onGoHome) onGoHome()
              setMobileMenuOpen(false)
            }}
          >
            Shop Collections
          </a>
          <a href="#spotlight" onClick={() => setMobileMenuOpen(false)}>Featured Product</a>
          <a href="#reviews" onClick={() => setMobileMenuOpen(false)}>Customer Reviews</a>
          <a href="#benefits" onClick={() => setMobileMenuOpen(false)}>Why You'll Love It</a>
          <a href="#faq" onClick={() => setMobileMenuOpen(false)}>Frequently Asked Questions</a>

          <div className="mobile-drawer-footer">
            {user ? (
              <button
                type="button"
                className="mobile-drawer-user-btn"
                onClick={() => {
                  onOpenAuth()
                  setMobileMenuOpen(false)
                }}
              >
                <User size={15} />
                <span>Account ({user.name.split(' ')[0]})</span>
              </button>
            ) : (
              <button
                type="button"
                className="btn-pill-primary w-full flex-center-gap"
                onClick={() => {
                  onOpenAuth()
                  setMobileMenuOpen(false)
                }}
              >
                <User size={15} />
                <span>Sign In / Register</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
