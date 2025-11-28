import React from "react";
import { navLinks } from "../../data/homeData";

export function Navbar({ isScrolled }) {
  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-white/90 text-slate-900 shadow-lg backdrop-blur"
          : "bg-transparent text-slate-50"
      }`}
    >
      <nav
        className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8"
        aria-label="Main navigation"
      >
        {/* Logo */}
        <a href="#top" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white font-semibold shadow-md">
            HG
          </div>
          <span className="text-lg font-semibold tracking-tight">
            <span className="bg-gradient-to-r from-emerald-500 to-teal-400 bg-clip-text text-transparent">
              HubGate
            </span>
            <span className={isScrolled ? "text-slate-500" : "text-slate-300"}>
              .ae
            </span>
          </span>
        </a>

        {/* Links + CTAs */}
        <div className="flex items-center gap-8">
          <ul className="hidden items-center gap-6 text-sm font-medium sm:flex">
            {navLinks.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="hover:text-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent rounded"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-3">
            <a
              href="/login"
              className={`text-sm font-medium rounded-full px-4 py-2 border ${
                isScrolled
                  ? "border-slate-200 text-slate-900 hover:bg-slate-50"
                  : "border-slate-500/60 text-slate-50 hover:bg-slate-900/30"
              } transition-all`}
            >
              Log In
            </a>
            <a
              href="/signup"
              className="hidden sm:inline-flex text-sm font-semibold rounded-full px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md hover:shadow-lg hover:brightness-110 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
            >
              Sign Up
            </a>
          </div>
        </div>
      </nav>
    </header>
  );
}