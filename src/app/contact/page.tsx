"use client";

import { motion, useMotionValue, useTransform, useSpring, AnimatePresence } from "framer-motion";
import { useRef, useState, useCallback, type FormEvent } from "react";
import {
  Mail, MessageSquare, User, Send, Atom,
  GitFork, X as XIcon, Link2, CheckCircle2,
  Loader2, MapPin, Clock, ExternalLink,
} from "lucide-react";
import { WaveDivider } from "@/components/ui";

/* ─── Magnetic Button ─────────────────────────────────────────────────────── */
function MagneticButton({
  children,
  onClick,
  disabled,
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 200, damping: 20 });
  const springY = useSpring(y, { stiffness: 200, damping: 20 });

  const onMove = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    if (!ref.current || disabled) return;
    const rect = ref.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    x.set((e.clientX - cx) * 0.35);
    y.set((e.clientY - cy) * 0.35);
  }, [x, y, disabled]);

  const onLeave = useCallback(() => {
    x.set(0);
    y.set(0);
  }, [x, y]);

  return (
    <motion.button
      ref={ref}
      style={{ x: springX, y: springY }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      onClick={onClick}
      disabled={disabled}
      whileTap={{ scale: 0.96 }}
      className={className}
    >
      {children}
    </motion.button>
  );
}

/* ─── Form field ──────────────────────────────────────────────────────────── */
function Field({
  id, label, type = "text", placeholder, value, onChange, required, icon: Icon,
  multiline = false, rows = 4,
}: {
  id: string; label: string; type?: string; placeholder: string;
  value: string; onChange: (v: string) => void; required?: boolean;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  multiline?: boolean; rows?: number;
}) {
  const [focused, setFocused] = useState(false);
  const base = `w-full bg-transparent border rounded-xl py-3 text-sm text-foreground/80 placeholder:text-foreground/25 focus:outline-none transition-all duration-300 resize-none ${Icon ? "pl-10 pr-4" : "px-4"} ${focused ? "border-quantum/50 shadow-[0_0_20px_rgba(0,195,245,0.1)]" : "border-white/10 hover:border-white/20"
    }`;

  return (
    <div className="relative">
      <label htmlFor={id} className="block text-xs font-mono text-foreground/40 tracking-wider uppercase mb-2">
        {label}{required && <span className="text-crimson ml-1">*</span>}
      </label>
      <div className="relative">
        {Icon && (
          <Icon
            size={15}
            className={`absolute left-3 top-3.5 transition-colors duration-300 ${focused ? "text-quantum" : "text-foreground/25"}`}
          />
        )}
        {multiline ? (
          <textarea
            id={id}
            rows={rows}
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            required={required}
            className={`${base} pt-3`}
          />
        ) : (
          <input
            id={id}
            type={type}
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            required={required}
            className={base}
          />
        )}
      </div>
    </div>
  );
}

/* ─── Contact channels ───────────────────────────────────────────────────── */
const CHANNELS = [
  {
    icon: Mail,
    label: "Email",
    value: "xurashad@gmail.com",
    href: "mailto:xurashad@gmail.com",
    desc: "Best for research collaborations and opportunities",
    accent: "quantum" as const,
  },
  {
    icon: GitFork,
    label: "GitHub",
    value: "xurashad",
    href: "https://github.com/xurashad/",
    desc: "Open-source projects and apps",
    accent: "quantum" as const,
  },
  {
    icon: Link2,
    label: "LinkedIn",
    value: "Rashad Hamidi",
    href: "https://www.linkedin.com/in/rashad-hamidi/",
    desc: "Professional connections and academic network",
    accent: "olive" as const,
  },
];

/* ─── Supervisors & Colleagues ──────────────────────────────────────── */
const PEOPLE = [
  {
    name: "Ben Hoare",
    role: "PhD Supervisor",
    href: "https://www.benhoare.info/",
    accent: "quantum" as const,
  },
  {
    name: "Nabil Iqbal",
    role: "MSc Supervisor",
    href: "https://www.nabiliqbal.com/",
    accent: "quantum" as const,
  },
  {
    name: "Muath Hamidi",
    role: "Twin Brother",
    href: "https://muathhamidi.github.io/muath.hamidi/",
    accent: "crimson" as const,
  },
];

type FormState = "idle" | "submitting" | "success" | "error";

/* ─── Page ────────────────────────────────────────────────────────────────── */
export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<FormState>("idle");

  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus("submitting");
    setErrorMsg("");

    try {
      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          access_key: "6866e4cf-c0e7-4087-9d27-905a9556667b",
          name,
          email,
          subject: `[Contact Form] ${subject}`,
          message,
          from_name: "Rashad Hamidi Website",
          // Honeypot spam protection
          botcheck: "",
        }),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.message || "Failed to send message.");
      }

      setStatus("success");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong.");
    }
  };

  const resetForm = () => {
    setName(""); setEmail(""); setSubject(""); setMessage("");
    setStatus("idle");
    setErrorMsg("");
  };

  return (
    <div className="min-h-screen keffiyeh-bg">
      {/* Background glows */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-1/4 -left-20 w-96 h-96 rounded-full bg-quantum/4 blur-[100px]" />
        <div className="absolute bottom-1/3 -right-20 w-80 h-80 rounded-full bg-olive/5 blur-[100px]" />
        <div className="absolute top-2/3 left-1/2 -translate-x-1/2 w-[600px] h-60 rounded-full bg-crimson/3 blur-[80px]" />
      </div>

      <div className="section-container py-16 pb-32">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="mb-16"
        >
          <div className="text-xs font-mono text-quantum/55 tracking-widest uppercase mb-3">
            // Quantum Entanglement
          </div>
          <h1 className="text-5xl sm:text-6xl font-serif font-bold mb-4">
            <span className="gradient-text-quantum">Get in Touch</span>
          </h1>
          <p className="text-foreground/50 max-w-xl leading-relaxed">
            I'm always open to discussing new projects, creative ideas, or opportunities to be part of an ambitious vision. Feel free to reach out.
          </p>

          {/* Availability indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex items-center gap-2 mt-5 text-xs font-mono text-foreground/40"
          >
            <span className="relative flex w-2 h-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 animate-ping opacity-60" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            Available for postdoc positions, research collaborations, and job opportunities
          </motion.div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-start">

          {/* ── Contact Form (3/5 cols) ───────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="lg:col-span-3"
          >
            <div className="glass-card border border-white/6 p-8 relative overflow-hidden">

              {/* Card glow */}
              <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-quantum/6 blur-3xl pointer-events-none" />
              <div className="absolute -bottom-12 -left-12 w-32 h-32 rounded-full bg-olive/5 blur-3xl pointer-events-none" />

              <AnimatePresence mode="wait">

                {/* ── Success state ─────────────────────────────────────── */}
                {status === "success" ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ type: "spring", stiffness: 260, damping: 22 }}
                    className="flex flex-col items-center justify-center py-16 text-center"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
                      className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mb-6"
                    >
                      <CheckCircle2 size={32} className="text-emerald-400" />
                    </motion.div>
                    <h3 className="text-2xl font-serif font-bold mb-3">Message Received</h3>
                    <p className="text-foreground/50 leading-relaxed mb-2 max-w-xs">
                      Your message has been entangled across the quantum field.
                      I&apos;ll reply within 48 hours.
                    </p>
                    <p className="text-xs font-mono text-foreground/25 mb-8">
                      State vector: |received⟩ ✓
                    </p>
                    <button
                      onClick={resetForm}
                      className="text-xs font-mono text-quantum/60 hover:text-quantum underline transition-colors"
                    >
                      Send another message
                    </button>
                  </motion.div>
                ) : (

                  /* ── Form ─────────────────────────────────────────────── */
                  <motion.form
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onSubmit={handleSubmit}
                    className="space-y-6"
                  >
                    <div className="text-xs font-mono text-foreground/25 mb-6 tracking-widest">
                      // SEND_MESSAGE.quantum
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <Field
                        id="name"
                        label="Name"
                        placeholder="Your name"
                        value={name}
                        onChange={setName}
                        required
                        icon={User}
                      />
                      <Field
                        id="email"
                        label="Email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={setEmail}
                        required
                        icon={Mail}
                      />
                    </div>

                    <Field
                      id="subject"
                      label="Subject"
                      placeholder="Research collaboration, speaking, general…"
                      value={subject}
                      onChange={setSubject}
                      required
                      icon={MessageSquare}
                    />

                    <Field
                      id="message"
                      label="Message"
                      placeholder="Tell me about your project, question, or collaboration idea…"
                      value={message}
                      onChange={setMessage}
                      required
                      multiline
                      rows={6}
                    />

                    {/* Topic quick-select */}
                    <div>
                      <div className="text-xs font-mono text-foreground/30 uppercase tracking-wider mb-2">
                        I&apos;m reaching out about…
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {["Research collaboration", "Postdoc opportunity", "Speaking / lecture", "Open source", "Palestine initiative", "Just saying hi"].map((topic) => (
                          <button
                            key={topic}
                            type="button"
                            onClick={() => setSubject(topic)}
                            className={`text-xs font-mono px-3 py-1.5 rounded-full border transition-all duration-200 ${subject === topic
                              ? "bg-quantum/15 text-quantum border-quantum/30"
                              : "border-white/8 text-foreground/35 hover:border-white/20 hover:text-foreground/60"
                              }`}
                          >
                            {topic}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Submit */}
                    <div className="flex items-center justify-between pt-2 gap-4">
                      {status === "error" && errorMsg && (
                        <p className="text-xs text-crimson/80 font-mono flex-1">{errorMsg}</p>
                      )}
                      <div className="ml-auto">
                        <MagneticButton
                          disabled={status === "submitting" || !name || !email || !message}
                          className={`flex items-center gap-2.5 px-7 py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${status === "submitting" || !name || !email || !message
                            ? "bg-white/5 text-foreground/30 cursor-not-allowed"
                            : "bg-gradient-to-r from-quantum to-quantum/70 text-white hover:shadow-[0_0_30px_rgba(0,195,245,0.4)] cursor-pointer"
                            }`}
                        >
                          {status === "submitting" ? (
                            <>
                              <Loader2 size={15} className="animate-spin" />
                              Entangling…
                            </>
                          ) : (
                            <>
                              <Send size={15} />
                              Send Message
                            </>
                          )}
                        </MagneticButton>
                      </div>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* ── Right sidebar (2/5 cols) ──────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.25 }}
            className="lg:col-span-2 space-y-5"
          >
            {/* Contact channels */}
            <div>
              <div className="text-xs font-mono text-foreground/30 uppercase tracking-widest mb-4">
                // Direct channels
              </div>
              <div className="space-y-3">
                {CHANNELS.map((ch, i) => {
                  const Icon = ch.icon;
                  return (
                    <motion.a
                      key={ch.label}
                      href={ch.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + i * 0.08 }}
                      whileHover={{ x: 4 }}
                      className={`flex items-center gap-3 p-4 rounded-xl glass border border-white/6 transition-all duration-300 group ${ch.accent === "quantum"
                        ? "hover:border-quantum/35 hover:shadow-[0_0_20px_rgba(0,195,245,0.08)]"
                        : "hover:border-olive/35 hover:shadow-[0_0_20px_rgba(107,143,39,0.08)]"
                        }`}
                    >
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-300 ${ch.accent === "quantum" ? "bg-quantum/12 group-hover:bg-quantum/20" : "bg-olive/12 group-hover:bg-olive/20"
                        }`}>
                        <Icon size={16} className={ch.accent === "quantum" ? "text-quantum" : "text-olive-400"} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-mono text-foreground/35 mb-0.5">{ch.label}</div>
                        <div className="text-sm font-medium text-foreground/70 group-hover:text-foreground/90 transition-colors truncate">{ch.value}</div>
                        <div className="text-xs text-foreground/30 mt-0.5 leading-relaxed">{ch.desc}</div>
                      </div>
                    </motion.a>
                  );
                })}
              </div>
            </div>

            {/* Supervisors & Colleagues */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <div className="text-xs font-mono text-foreground/30 uppercase tracking-widest mb-4">
                // Supervisors &amp; Colleagues
              </div>
              <div className="space-y-2">
                {PEOPLE.map((p, i) => (
                  <motion.a
                    key={p.name}
                    href={p.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + i * 0.07 }}
                    whileHover={{ x: 4 }}
                    className={`flex items-center gap-3 p-3.5 rounded-xl glass border border-white/6 transition-all duration-300 group ${p.accent === "quantum"
                      ? "hover:border-quantum/35 hover:shadow-[0_0_16px_rgba(0,195,245,0.08)]"
                      : p.accent === "crimson"
                        ? "hover:border-crimson/35 hover:shadow-[0_0_16px_rgba(220,20,60,0.08)]"
                        : "hover:border-olive/35"
                      }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold ${p.accent === "quantum" ? "bg-quantum/12 text-quantum" :
                      p.accent === "crimson" ? "bg-crimson/12 text-crimson" :
                        "bg-olive/12   text-olive-400"
                      }`}>
                      {p.name.split(" ").map((w: string) => w[0]).join("")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground/75 group-hover:text-foreground/95 transition-colors">
                        {p.name}
                      </div>
                      <div className="text-xs font-mono text-foreground/35">{p.role}</div>
                    </div>
                    <ExternalLink size={12} className="text-foreground/20 group-hover:text-foreground/50 transition-colors flex-shrink-0" />
                  </motion.a>
                ))}
              </div>
            </motion.div>

            {/* Availability card */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="glass-card border border-quantum/20 p-5"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-quantum/12 flex items-center justify-center flex-shrink-0">
                  <Atom size={15} className="text-quantum" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold mb-1">Currently Available For</h4>
                  <ul className="space-y-1.5 mt-2">
                    {[
                      "Postdoctoral research positions",
                      "Research collaborations",
                      "Conference talks & lectures",
                      "Science communication",
                      "Open source contributions",
                      "Job opportunities",
                    ].map((item) => (
                      <li key={item} className="flex items-center gap-2 text-xs text-foreground/50">
                        <span className="w-1.5 h-1.5 rounded-full bg-quantum/60 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>

            {/* Location / response time */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="flex flex-col gap-3"
            >
              <div className="flex items-center gap-3 text-sm text-foreground/40 glass rounded-xl border border-white/6 p-3">
                <MapPin size={14} className="text-quantum/60 flex-shrink-0" />
                <span>Newcastle upon Tyne, UK · Open to relocate</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-foreground/40 glass rounded-xl border border-white/6 p-3">
                <Clock size={14} className="text-olive/60 flex-shrink-0" />
                <span>Response time: typically within 48 hours</span>
              </div>
            </motion.div>

            {/* Physics easter egg 
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="glass rounded-xl border border-white/4 p-4"
            >
              <p className="text-[11px] font-mono text-foreground/20 leading-relaxed">
                {`// Wave equation of a message:\n`}
                {`∂²M/∂t² = c² ∇²M\n`}
                {`// Your reply propagates at the speed of light.\n`}
                {`// No faster, but never slower.`}
              </p>
            </motion.div>
            */}
          </motion.div>
        </div>

        <WaveDivider variant="quantum" />

        {/* FAQ section 
        <div className="mt-4">
          <div className="text-xs font-mono text-foreground/30 uppercase tracking-widest mb-6">// Common Questions</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[
              {
                q: "Are you open to reviewing papers?",
                a: "Yes, particularly in QFT, lattice QCD, mathematical physics, and physics-meets-culture interdisciplinary work. Please send an abstract first.",
              },
              {
                q: "Can I use your datasets commercially?",
                a: "Most datasets are CC0 or CC-BY 4.0 — check the license on the Datasets page. For commercial use of CC-BY work, attribution is always required.",
              },
              {
                q: "Do you give public lectures?",
                a: "Yes. I enjoy making physics accessible, particularly for audiences who don't traditionally see themselves in science. Reach out with details.",
              },
              {
                q: "How can I support Science for Palestine?",
                a: "We need mentors, funding contacts, and institutions willing to co-sponsor scholarships. Email me with your affiliation and area of expertise.",
              },
            ].map((faq, i) => (
              <motion.div
                key={faq.q}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="glass-card border border-white/5 p-5"
              >
                <h4 className="text-sm font-semibold mb-2">{faq.q}</h4>
                <p className="text-xs text-foreground/45 leading-relaxed">{faq.a}</p>
              </motion.div>
            ))}
          </div>
        </div>
        */}
      </div>
    </div>
  );
}
