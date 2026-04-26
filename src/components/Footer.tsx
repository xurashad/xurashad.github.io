"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { GitFork, X as XIcon, Link2, Mail } from "lucide-react";

const FOOTER_LINKS = [
  { href: "/", label: "Home" },
  { href: "/apps", label: "Apps" },
  { href: "/datasets", label: "Datasets" },
  // { href: "/blog", label: "Blog" },
  { href: "/documents", label: "Documents" },
  { href: "/cv", label: "CV" },
  // { href: "/palestine", label: "Palestine" },
  { href: "/contact", label: "Contact" },
];

const SOCIALS = [
  { href: "https://github.com/xurashad/", icon: GitFork, label: "GitHub" },
  //{ href: "https://twitter.com", icon: XIcon, label: "X (Twitter)" },
  { href: "https://www.linkedin.com/in/rashad-hamidi/", icon: Link2, label: "LinkedIn" },
  { href: "mailto:xurashad@gmail.com", icon: Mail, label: "Email" },
];

export function Footer() {
  return (
    <footer className="relative border-t border-white/5 dark:border-white/5">
      {/* Keffiyeh pattern strip */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-quantum/40 to-transparent" />

      <div className="keffiyeh-bg">
        <div className="section-container py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">

            {/* Brand */}
            <div className="space-y-4">
              <Link href="/" className="flex items-center gap-2 w-fit group">
                <motion.div
                  className="w-8 h-8 rounded-lg overflow-hidden"
                  whileHover={{ scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20 }}
                >
                  <Image src="/favicon.ico" alt="Logo" width={32} height={32} className="object-contain" />
                </motion.div>
                <span className="font-serif font-bold gradient-text-quantum">Rashad Hamidi</span>
              </Link>
              <p className="text-sm text-foreground/50 leading-relaxed max-w-xs">
                Exploring the relams of science, logic, and thoughts.
              </p>
              {/* Palestinian flag colors */}
              <div className="flex gap-1 items-center">
                <div className="w-4 h-4 rounded-sm bg-black" />
                <div className="w-4 h-4 rounded-sm bg-photon-dim" />
                <div className="w-4 h-4 rounded-sm bg-olive" />
                <div className="w-4 h-4 rounded-sm bg-crimson" />
                {/*<span className="text-xs text-foreground/40 ml-1 font-mono">🇵🇸</span>*/}
              </div>
            </div>

            {/* Navigation */}
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-widest text-foreground/40 mb-4 pb-3 border-b border-white/10">
                Navigation
              </h4>
              <ul className="space-y-2">
                {FOOTER_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-foreground/60 hover:text-quantum transition-colors duration-200"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Socials */}
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-widest text-foreground/40 mb-4 pb-3 border-b border-white/10">
                Connect
              </h4>
              <div className="flex flex-col gap-3">
                {SOCIALS.map(({ href, icon: Icon, label }) => (
                  <a
                    key={href}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-sm text-foreground/60 hover:text-quantum transition-all duration-200 group"
                  >
                    <span className="w-8 h-8 rounded-lg glass flex items-center justify-center group-hover:border-quantum/40 transition-all">
                      <Icon size={14} />
                    </span>
                    {label}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-12 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-foreground/30 font-mono">
              © {new Date().getFullYear()} Rashad Hamidi. Built with ⚛️ & 🌿
            </p>
            <p className="text-xs text-foreground/30 font-mono">
              <span className="text-crimson">Theoretical</span>
              {" · "}
              <span className="text-olive-400">Physics</span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
