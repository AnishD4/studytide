"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import "./Navigation.css";

const mainNavItems = [
  { href: "/", label: "Home", icon: "🏠" },
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/assignments", label: "Assignments", icon: "📚" },
  { href: "/study", label: "Test", icon: "🧠" },
  { href: "/flashcards", label: "Flashcards", icon: "🗂️" },
  { href: "/study-guides", label: "Guides", icon: "📖" },
  { href: "/calendar", label: "Calendar", icon: "📅" },
];

const studyNavItems = [
  { href: "/classes", label: "Classes", icon: "📚" },
  { href: "/assignments", label: "Assignments", icon: "📝" },
  { href: "/study", label: "Study", icon: "🎯" },
  { href: "/flashcards", label: "Flashcards", icon: "🃏" },
  { href: "/study-guides", label: "Study Guides", icon: "📖" },
];

const trackingNavItems = [
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
  const [studyDropdownOpen, setStudyDropdownOpen] = useState(false);
  const [trackingDropdownOpen, setTrackingDropdownOpen] = useState(false);

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

  // Don't show nav on auth pages
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

  return (
    <nav className="main-nav">
      <div className="nav-container">
        {/* Logo */}
        <Link href="/" className="nav-logo">
          <span className="logo-icon">🌊</span>
          <span className="logo-text">StudyTide</span>
        </Link>

        {/* Main Navigation Links */}
        <div className={`nav-links ${mobileMenuOpen ? "mobile-open" : ""}`}>
          {/* Main items */}
          {mainNavItems.map((item) => (
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

          {/* Study Dropdown - only show when logged in */}
          {user && (
            <div className="nav-dropdown">
              <button
                className={`nav-link dropdown-trigger ${studyNavItems.some(item => isActiveLink(item.href)) ? "active" : ""}`}
                onClick={() => setStudyDropdownOpen(!studyDropdownOpen)}
              >
                <span className="nav-icon">📚</span>
                <span className="nav-label">Study</span>
                <span className="dropdown-arrow">{studyDropdownOpen ? "▲" : "▼"}</span>
              </button>
              {studyDropdownOpen && (
                <div className="dropdown-menu">
                  {studyNavItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`dropdown-item ${isActiveLink(item.href) ? "active" : ""}`}
                      onClick={() => {
                        setStudyDropdownOpen(false);
                        setMobileMenuOpen(false);
                      }}
                    >
                      <span className="nav-icon">{item.icon}</span>
                      <span className="nav-label">{item.label}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tracking Dropdown - only show when logged in */}
          {user && (
            <div className="nav-dropdown">
              <button
                className={`nav-link dropdown-trigger ${trackingNavItems.some(item => isActiveLink(item.href)) ? "active" : ""}`}
                onClick={() => setTrackingDropdownOpen(!trackingDropdownOpen)}
              >
                <span className="nav-icon">📈</span>
                <span className="nav-label">Track</span>
                <span className="dropdown-arrow">{trackingDropdownOpen ? "▲" : "▼"}</span>
              </button>
              {trackingDropdownOpen && (
                <div className="dropdown-menu">
                  {trackingNavItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`dropdown-item ${isActiveLink(item.href) ? "active" : ""}`}
                      onClick={() => {
                        setTrackingDropdownOpen(false);
                        setMobileMenuOpen(false);
                      }}
                    >
                      <span className="nav-icon">{item.icon}</span>
                      <span className="nav-label">{item.label}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Settings - only show when logged in */}
          {user && (
            <Link
              href="/settings"
              className={`nav-link ${isActiveLink("/settings") ? "active" : ""}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="nav-icon">⚙️</span>
              <span className="nav-label">Settings</span>
            </Link>
          )}
        </div>


        {/* Auth Section */}
        <div className="nav-auth">
          {loading ? (
            <div className="nav-loading"></div>
          ) : user ? (
            <div className="user-menu">
              <span className="user-greeting">👋 {user.user_metadata?.full_name?.split(' ')[0] || 'Student'}</span>
              <button onClick={handleSignOut} className="nav-link auth-link sign-out-btn">
                <span className="nav-icon">🚪</span>
                <span className="nav-label">Sign Out</span>
              </button>
            </div>
          ) : (
            !isAuthPage && (
              <>
                {authItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`nav-link auth-link ${pathname === item.href ? "active" : ""}`}
                  >
                    <span className="nav-icon">{item.icon}</span>
                    <span className="nav-label">{item.label}</span>
                  </Link>
                ))}
              </>
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

