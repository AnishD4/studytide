"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import "./Navigation.css";

// Public pages - visible without login
const publicNavItems = [
  { href: "/", label: "Home", icon: "🏠" },
];

// Protected pages - only visible when logged in
const protectedNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/calendar", label: "Calendar", icon: "📅" },
];

// Study dropdown items
const studyItems = [
  { href: "/classes", label: "Classes", icon: "📚" },
  { href: "/assignments", label: "Assignments", icon: "📝" },
  { href: "/study", label: "Study Session", icon: "🎯" },
  { href: "/flashcards", label: "Flashcards", icon: "🃏" },
  { href: "/study-guides", label: "Study Guides", icon: "📖" },
];

// Track dropdown items
const trackItems = [
  { href: "/goals", label: "Goals", icon: "🎯" },
  { href: "/progress", label: "Progress", icon: "📈" },
  { href: "/reflections", label: "Reflections", icon: "💭" },
  { href: "/extracurriculars", label: "Activities", icon: "⚽" },
];

const authItems = [
  { href: "/login", label: "Login", icon: "🔑" },
  { href: "/signup", label: "Sign Up", icon: "✨" },
];

export default function Navigation() {
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const supabase = createClient();

    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isAuthPage = pathname === "/login" || pathname === "/signup";

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const isActiveLink = (href) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const isDropdownActive = (items) => {
    return items.some(item => isActiveLink(item.href));
  };

  const toggleDropdown = (name) => {
    setOpenDropdown(openDropdown === name ? null : name);
  };

  const renderDropdown = (name, label, icon, items) => (
    <div className="nav-dropdown" ref={openDropdown === name ? dropdownRef : null}>
      <button
        className={`nav-link dropdown-trigger ${isDropdownActive(items) ? "active" : ""}`}
        onClick={() => toggleDropdown(name)}
      >
        <span className="nav-icon">{icon}</span>
        <span className="nav-label">{label}</span>
        <svg className={`dropdown-chevron ${openDropdown === name ? "open" : ""}`} width="10" height="6" viewBox="0 0 10 6" fill="none">
          <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {openDropdown === name && (
        <div className="dropdown-menu">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`dropdown-item ${isActiveLink(item.href) ? "active" : ""}`}
              onClick={() => {
                setOpenDropdown(null);
                setMobileMenuOpen(false);
              }}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <nav className="main-nav">
      <div className="nav-container">
        {/* Logo */}
        <Link href="/" className="nav-logo" onClick={() => setMobileMenuOpen(false)}>
          <span className="logo-icon">🌊</span>
          <span className="logo-text">StudyTide</span>
        </Link>

        {/* Navigation Links */}
        <div className={`nav-links ${mobileMenuOpen ? "mobile-open" : ""}`}>
          {/* Public items - always visible */}
          {publicNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-link ${isActiveLink(item.href) ? "active" : ""}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </Link>
          ))}

          {/* Protected items - only when logged in */}
          {user && (
            <>
              {protectedNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`nav-link ${isActiveLink(item.href) ? "active" : ""}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-label">{item.label}</span>
                </Link>
              ))}

              {/* Study Dropdown */}
              {renderDropdown("study", "Study", "📚", studyItems)}

              {/* Track Dropdown */}
              {renderDropdown("track", "Track", "📈", trackItems)}

              {/* Settings */}
              <Link
                href="/settings"
                className={`nav-link ${isActiveLink("/settings") ? "active" : ""}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="nav-icon">⚙️</span>
                <span className="nav-label">Settings</span>
              </Link>
            </>
          )}
        </div>

        {/* Auth Section */}
        <div className="nav-auth">
          {loading ? (
            <div className="nav-loading"></div>
          ) : user ? (
            <button onClick={handleSignOut} className="sign-out-btn">
              <span className="nav-icon">🚪</span>
              <span className="nav-label">Sign Out</span>
            </button>
          ) : (
            !isAuthPage && (
              <div className="auth-buttons">
                <Link href="/login" className="auth-link login-btn">
                  Login
                </Link>
                <Link href="/signup" className="auth-link signup-btn">
                  Sign Up
                </Link>
              </div>
            )
          )}
        </div>

        {/* Mobile menu button */}
        <button
          className={`mobile-menu-btn ${mobileMenuOpen ? "open" : ""}`}
          aria-label="Menu"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="mobile-overlay" onClick={() => setMobileMenuOpen(false)}></div>
      )}
    </nav>
  );
}

