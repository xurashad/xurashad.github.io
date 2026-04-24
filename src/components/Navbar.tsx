"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { Menu, X } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

const NAV_LINKS = [
  { href: "/", label: "Home", emoji: "⚛️" },
  { href: "/apps", label: "Apps", emoji: "🚀" },
  { href: "/datasets", label: "Datasets", emoji: "📡" },
  //  { href: "/blog", label: "Blog", emoji: "🌊" },
  { href: "/documents", label: "Documents", emoji: "📁" },
  { href: "/cv", label: "CV", emoji: "🛸" },
  { href: "/palestine", label: "Palestine", emoji: "🌿" },
  { href: "/contact", label: "Contact", emoji: "✉️" },
];

const menuVariants: Variants = {
  hidden: {
    opacity: 0,
    height: 0,
    transition: { duration: 0.3, ease: "easeInOut" as const },
  },
  visible: {
    opacity: 1,
    height: "auto",
    transition: {
      duration: 0.4,
      ease: "easeOut" as const,
      staggerChildren: 0.05,
      when: "beforeChildren",
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
};

export function Navbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
      className={`
        fixed top-0 left-0 right-0 z-50 transition-all duration-500
        ${scrolled ? "glass-nav shadow-card-dark py-2" : "bg-transparent py-4"}
      `}
    >
      <div className="section-container">
        <div className="flex items-center justify-between">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <motion.div
              className="relative w-9 h-9 rounded-lg overflow-hidden"
              whileHover={{ scale: 1.1 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
            >
              <Image src="/favicon.ico" alt="Logo" width={36} height={36} className="object-contain" />
              <span className="absolute inset-0 rounded-lg bg-gradient-to-br from-quantum to-olive opacity-0 group-hover:opacity-20 blur-md transition-opacity duration-300" />
            </motion.div>
            <div className="flex flex-col leading-none">
              <span className="font-serif font-bold text-base bg-gradient-to-r from-quantum to-olive bg-clip-text text-transparent">
                Rashad Hamidi
              </span>
              <span className="font-serif font-bold text-base bg-gradient-to-r from-quantum to-olive bg-clip-text text-transparent"
                style={{
                  fontFamily: '"DecoTypeThuluth", serif',
                  lineHeight: 1.6,
                  textAlign: "center",
                  direction: "rtl",
                }}
              >
                رشاد حميدي
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {NAV_LINKS.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`
                    nav-link relative px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                    ${isActive
                      ? "text-quantum bg-quantum/10"
                      : "text-foreground/70 hover:text-foreground hover:bg-white/5 dark:hover:bg-white/5"
                    }
                    ${link.href === "/palestine" ? "text-olive-400 hover:text-olive-300" : ""}
                  `}
                >
                  <span className={isActive ? "" : "hidden sm:hidden"}>{link.emoji}</span>
                  {link.label}
                  {isActive && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-gradient-to-r from-quantum to-olive rounded-full"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Right side controls */}
          <div className="flex items-center gap-3">
            <ThemeToggle />

            {/* Mobile hamburger */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsOpen((v) => !v)}
              className="lg:hidden w-10 h-10 rounded-lg glass flex items-center justify-center text-foreground/80 hover:text-foreground transition-colors"
              aria-label="Toggle menu"
            >
              <AnimatePresence mode="wait">
                {isOpen ? (
                  <motion.div
                    key="close"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <X size={20} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="menu"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Menu size={20} />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              variants={menuVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="lg:hidden overflow-hidden"
            >
              <div className="pt-4 pb-2 space-y-1">
                {NAV_LINKS.map((link) => {
                  const isActive = pathname === link.href;
                  return (
                    <motion.div key={link.href} variants={itemVariants}>
                      <Link
                        href={link.href}
                        className={`
                          flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
                          ${isActive
                            ? "bg-quantum/10 text-quantum border border-quantum/20"
                            : "text-foreground/70 hover:text-foreground hover:bg-white/5 dark:hover:bg-white/5"
                          }
                          ${link.href === "/palestine" ? "hover:border-l-2 hover:border-olive-500" : ""}
                        `}
                      >
                        <span className="text-lg w-7 text-center">{link.emoji}</span>
                        <span>{link.label}</span>
                        {isActive && (
                          <motion.div
                            layoutId="mobile-indicator"
                            className="ml-auto w-1.5 h-1.5 rounded-full bg-quantum"
                          />
                        )}
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
              {/* Palestinian colors strip */}
              <div className="flex h-0.5 mt-2 rounded-full overflow-hidden mx-4">
                <div className="flex-1 bg-black dark:bg-white" />
                <div className="flex-1 bg-flag-white dark:bg-photon-muted" />
                <div className="flex-1 bg-flag-green" />
                <div className="flex-1 bg-flag-red" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
}
