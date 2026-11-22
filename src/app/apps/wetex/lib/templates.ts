import type { ProjectFile, TemplateDefinition, WeTeXProject } from "./types";

const COSMOS_SVG_RAW = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 220" width="360" height="220">
  <defs>
    <radialGradient id="coreGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#fff8e7"/>
      <stop offset="22%" stop-color="#fde68a"/>
      <stop offset="50%" stop-color="#38bdf8" stop-opacity="0.7"/>
      <stop offset="82%" stop-color="#7c3aed" stop-opacity="0.25"/>
      <stop offset="100%" stop-color="#050816" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="orbitStroke" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.85"/>
      <stop offset="50%" stop-color="#a855f7" stop-opacity="0.85"/>
      <stop offset="100%" stop-color="#64748b" stop-opacity="0.5"/>
    </linearGradient>
  </defs>
  <rect width="360" height="220" rx="10" fill="#070a18"/>
  <g fill="#e2e8f0" opacity="0.65">
    <circle cx="38" cy="30" r="1.1"/><circle cx="72" cy="184" r="1.2"/>
    <circle cx="318" cy="40" r="1.4"/><circle cx="290" cy="188" r="1"/>
    <circle cx="54" cy="122" r="0.9"/><circle cx="332" cy="134" r="1.1"/>
    <circle cx="112" cy="24" r="1"/><circle cx="246" cy="22" r="1.2"/>
  </g>
  <ellipse cx="180" cy="110" rx="108" ry="68" fill="none" stroke="url(#orbitStroke)" stroke-width="1.3" stroke-dasharray="5 4"/>
  <ellipse cx="180" cy="110" rx="80" ry="48" fill="none" stroke="#94a3b8" stroke-width="0.9" opacity="0.45"/>
  <circle cx="180" cy="110" r="56" fill="url(#coreGlow)"/>
  <g transform="translate(180,110)" fill="none" stroke-linecap="round">
    <path d="M0,0 C14,-10 30,-2 32,14 C34,32 10,44 -14,36 C-42,26 -48,-12 -22,-36 C6,-60 54,-44 64,-6" stroke="#c4b5fd" stroke-width="2.6" opacity="0.72"/>
    <path d="M0,0 C-14,10 -30,2 -32,-14 C-34,-32 -10,-44 14,-36 C42,-26 48,12 22,36 C-6,60 -54,44 -64,6" stroke="#7dd3fc" stroke-width="2.6" opacity="0.72"/>
    <path d="M0,0 C8,10 20,8 22,-4 C24,-20 4,-30 -14,-22" stroke="#fde68a" stroke-width="1.8" opacity="0.85"/>
    <path d="M0,0 C-8,-10 -20,-8 -22,4 C-24,20 -4,30 14,22" stroke="#fde68a" stroke-width="1.8" opacity="0.85"/>
  </g>
  <circle cx="180" cy="110" r="7" fill="#fffbeb"/>
  <circle cx="272" cy="76" r="4.5" fill="#0f172a" stroke="#38bdf8" stroke-width="1.6"/>
  <circle cx="272" cy="76" r="1.6" fill="#38bdf8"/>
  <circle cx="92" cy="146" r="3.5" fill="#a855f7"/>
  <text x="190" y="34" fill="#94a3b8" font-family="serif" font-size="11" font-style="italic">r(phi) = p / (1 + e cos phi)</text>
</svg>`;

export const COSMOS_GALAXY_SVG_DATA_URL = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(COSMOS_SVG_RAW)}`;

export const WETEX_TEMPLATES: TemplateDefinition[] = [
  {
    id: "cosmic-dynamics",
    name: "Cosmic Dynamics Paper",
    category: "Physics",
    badge: "Featured",
    description:
      "Flagship 7-file modular General Relativity manuscript across sections/ & figures/: Einstein-Hilbert action, Birkhoff's theorem, effective potential curves, dual TikZ figures, vector orbit art, booktabs tables, appendix, and BibTeX.",
    mainFilePath: "main.tex",
    files: [
      {
        path: "main.tex",
        kind: "tex",
        content: `\\documentclass[11pt]{article}
\\usepackage[margin=1in]{geometry}
\\usepackage{amsmath, amssymb, amsthm, graphicx, booktabs, xcolor, tikz, hyperref}

\\definecolor{accentblue}{HTML}{1d4ed8}
\\definecolor{accentviolet}{HTML}{6d28d9}
\\definecolor{accentcyan}{HTML}{0e7490}

\\hypersetup{
  colorlinks=true,
  linkcolor=accentblue,
  citecolor=accentviolet,
  urlcolor=accentcyan
}

\\newtheorem{theorem}{Theorem}[section]
\\newtheorem{proposition}[theorem]{Proposition}
\\newtheorem{definition}[theorem]{Definition}
\\newtheorem{remark}[theorem]{Remark}

\\providecommand{\\dd}{\\mathrm{d}}
\\newcommand{\\Ric}{R_{\\mu\\nu}}
\\newcommand{\\metric}{g_{\\mu\\nu}}
\\newcommand{\\stress}{T_{\\mu\\nu}}
\\newcommand{\\Msun}{M_\\odot}
\\newcommand{\\order}[1]{\\mathcal{O}\\left(#1\\right)}

\\title{\\textbf{Cosmic Dynamics \\& Relativistic Mechanics in Curved Spacetime}}
\\author{Rashad Hamidi \\and A. Vance \\\\ \\small Department of Mathematical Sciences, Durham University}
\\date{November 2026}

\\begin{document}
\\maketitle

\\input{sections/abstract.tex}
\\input{sections/geometry.tex}
\\input{sections/observables.tex}

\\appendix
\\input{sections/appendix.tex}

\\bibliographystyle{plain}
\\bibliography{references}

\\end{document}
`,
      },
      {
        path: "sections/abstract.tex",
        kind: "tex",
        content: `\\begin{abstract}
We present a self-contained analytical study of covariant gravitational dynamics in four-dimensional curved spacetime, bridging the Einstein--Hilbert variational principle with spherically symmetric black hole spacetimes and relativistic orbital mechanics. Starting from the covariant field equations with cosmological curvature $\\Lambda$, we formulate Birkhoff's rigidity theorem, derive the effective radial geodesic potential governing photon spheres and innermost stable circular orbits, evaluate curvature invariants, and summarize characteristic astrophysical scales relevant to strong-field gravitational observations.
\\end{abstract}

\\noindent\\textbf{Keywords:} General Relativity, Schwarzschild geometry, Birkhoff's theorem, geodesic precession, causal structure.
`,
      },
      {
        path: "sections/geometry.tex",
        kind: "tex",
        content: `\\section{Covariant Field Equations}
Classical gravitation arises cleanly from extremizing the Einstein--Hilbert action coupled to matter fields $\\mathcal{L}_m$ on a four-dimensional Lorentzian manifold $(\\mathcal{M}, \\metric)$ of signature $(-,+,+,+)$~\\cite{einstein1915,wald1984}:
\\begin{equation}\\label{eq:eh-action}
  S[\\metric] = \\frac{c^4}{16\\pi G} \\int_{\\mathcal{M}} \\sqrt{-g}\\,\\left(R - 2\\Lambda\\right) \\dd^4 x + \\int_{\\mathcal{M}} \\sqrt{-g}\\,\\mathcal{L}_m\\,\\dd^4 x.
\\end{equation}
Varying Eq.~\\eqref{eq:eh-action} with respect to the inverse metric $g^{\\mu\\nu}$ yields the Einstein field equations~\\cite{mtw1973,weinberg1972}:
\\begin{equation}\\label{eq:einstein}
  G_{\\mu\\nu} + \\Lambda \\metric = \\frac{8\\pi G}{c^4} \\stress, \\qquad G_{\\mu\\nu} = \\Ric - \\frac{1}{2} R\\,\\metric.
\\end{equation}
Taking the covariant divergence of Eq.~\\eqref{eq:einstein} together with the contracted Bianchi identity $\\nabla^\\mu G_{\\mu\\nu} = 0$ and metric compatibility $\\nabla^\\mu \\metric = 0$ enforces local stress--energy conservation and determines the trace scalar:
\\begin{subequations}
\\begin{align}
  \\nabla^\\mu \\stress &= 0, \\label{eq:conservation} \\\\
  R &= -\\frac{8\\pi G}{c^4} T + 4\\Lambda. \\label{eq:trace}
\\end{align}
\\end{subequations}

\\section{Spherically Symmetric Geometry \\& Geodesics}
For a static, asymptotically flat vacuum outside a central mass $M$, the line element reduces to the Schwarzschild metric expressed in Schwarzschild coordinates $(t, r, \\theta, \\phi)$:
\\begin{equation}\\label{eq:schwarzschild}
  \\dd s^2 = -f(r)\\,c^2 \\dd t^2 + \\frac{\\dd r^2}{f(r)} + r^2\\left(\\dd\\theta^2 + \\sin^2\\theta\\,\\dd\\phi^2\\right), \\qquad f(r) = 1 - \\frac{r_s}{r},
\\end{equation}
where $r_s = 2GM/c^2$ denotes the Schwarzschild radius.

\\begin{definition}[Killing Horizon \\& Surface Gravity]\\label{def:horizon}
A null hypersurface $\\mathcal{H}$ on which the stationary Killing vector $K = \\partial_t$ becomes null, $g(K,K)\\big|_{\\mathcal{H}} = 0$, defines a Killing horizon. For the metric~\\eqref{eq:schwarzschild}, $\\mathcal{H}$ lies at $r = r_s$ with constant surface gravity $\\kappa = c^4/(4GM)$~\\cite{wald1984}.
\\end{definition}

\\begin{theorem}[Birkhoff's Theorem]\\label{thm:birkhoff}
Every spherically symmetric vacuum solution of Eq.~\\eqref{eq:einstein} with $\\Lambda = 0$ is locally isometric to a patch of the Schwarzschild spacetime~\\eqref{eq:schwarzschild}, and therefore automatically admits an extra hypersurface-orthogonal Killing vector field.
\\end{theorem}

\\begin{proof}
By spherical symmetry, the metric decomposes globally as a warped product $\\mathcal{M}_2 \\times_r S^2$. Imposing the vacuum conditions $R_{tr} = 0$ and $R_{tt} + f^2 R_{rr} = 0$ forces $g_{rr}$ to be time-independent while reducing $g_{tt}$ to a separable function $e^{2\\Phi(t)}(1 - r_s/r)$. Absorbing $e^{\\Phi(t)}\\,\\dd t$ into a redefined time coordinate $\\tilde{t}$ restores Eq.~\\eqref{eq:schwarzschild} globally across each coordinate patch.
\\end{proof}

Along equatorial timelike geodesics ($\\theta = \\pi/2$, $\\kappa = 1$) or null rays ($\\kappa = 0$), Killing conservation of energy $E$ and angular momentum $L$ collapses radial motion to an effective one-dimensional barrier problem:
\\begin{equation}\\label{eq:veff}
  \\frac{1}{2}\\left(\\frac{\\dd r}{\\dd\\tau}\\right)^2 + V_{\\text{eff}}(r) = \\frac{E^2}{2c^2}, \\qquad V_{\\text{eff}}(r) = \\frac{1}{2}\\left(1 - \\frac{r_s}{r}\\right)\\left(\\kappa + \\frac{L^2}{r^2}\\right).
\\end{equation}
Evaluating perturbations about nearly circular orbits of semi-latus rectum $p$ reproduces the anomalous relativistic perihelion advance per revolution,
\\begin{equation}\\label{eq:precession}
  \\Delta\\phi = \\frac{6\\pi GM}{c^2 p} + \\order{\\left(\\frac{r_s}{p}\\right)^2}.
\\end{equation}
`,
      },
      {
        path: "sections/observables.tex",
        kind: "tex",
        content: `\\section{Causal Structure \\& Astrophysical Observables}
Strong-field orbital precession around a compact core is depicted in Figure~\\ref{fig:cosmos}, while local causal propagation across an event $p$ obeys the null light-cone geometry illustrated in Figure~\\ref{fig:lightcone}.

\\begin{figure}[htbp]
  \\centering
  \\includegraphics[width=0.68\\textwidth]{figures/cosmos.svg}
  \\caption{Relativistic precessing orbit around a massive galactic core.}
  \\label{fig:cosmos}
\\end{figure}

\\begin{figure}[htbp]
  \\centering
  \\begin{tikzpicture}[scale=1.05]
    \\draw[->] (-2.4,0) -- (2.5,0) node[right] {$x$};
    \\draw[->] (0,-1.5) -- (0,2.3) node[above] {$ct$};
    \\draw[cyan, very thick] (-1.6,-1.6) -- (1.7,1.7);
    \\draw[cyan, very thick] (1.6,-1.6) -- (-1.7,1.7);
    \\draw[purple, very thick, dashed] (0,-1.4) .. controls (0.35,-0.3) and (-0.25,0.6) .. (0.2,1.65);
    \\fill[purple] (0,0) circle (2.5pt);
    \\node[above right] at (0.85,1.05) {$\\dd s^2 = 0$};
    \\node[below right] at (0.14,0.22) {$p$};
  \\end{tikzpicture}
  \\caption{Minkowski-tangent causal light cone and timelike worldline through event $p$.}
  \\label{fig:lightcone}
\\end{figure}

The extrema of the effective potential~\\eqref{eq:veff} separate unstable photon trajectories at $r_{\\text{ph}} = 1.5\\,r_s$ from the innermost stable circular orbit at $r_{\\text{ISCO}} = 3\\,r_s$, as sketched in Figure~\\ref{fig:veff} and quantified across stellar and galactic regimes in Table~\\ref{tab:scales}~\\cite{hawking1973,carroll2004}.

\\begin{figure}[htbp]
  \\centering
  \\begin{tikzpicture}[scale=1.05]
    \\draw[->] (-0.2,0) -- (5.4,0) node[right] {$r / r_s$};
    \\draw[->] (0,-1.1) -- (0,2.2) node[above] {$V_{\\text{eff}}(r)$};
    \\draw[dashed, gray] (1.5,-1.0) -- (1.5,1.8);
    \\draw[dashed, gray] (3.0,-1.0) -- (3.0,1.2);
    \\draw[teal, very thick] (0.6,-0.9) .. controls (1.1,1.6) and (1.9,1.6) .. (2.5,0.25);
    \\draw[teal, very thick] (2.5,0.25) .. controls (2.9,-0.55) and (3.5,-0.55) .. (4.9,0.0);
    \\fill[violet] (1.5,1.25) circle (2.5pt);
    \\fill[blue] (3.0,-0.32) circle (2.5pt);
    \\node[above] at (1.5,1.8) {$r_{\\text{ph}}$};
    \\node[below] at (3.0,-1.0) {$r_{\\text{ISCO}}$};
  \\end{tikzpicture}
  \\caption{Qualitative radial effective potential displaying the unstable photon peak and stable ISCO basin.}
  \\label{fig:veff}
\\end{figure}

\\begin{table}[htbp]
  \\centering
  \\caption{Characteristic length, temperature, and horizon scales in relativistic astrophysics~\\cite{hawking1973}.}
  \\label{tab:scales}
  \\begin{tabular}{lll}
    \\toprule
    Physical Quantity & Analytical Expression & Benchmark Value \\\\
    \\midrule
    Schwarzschild radius & $r_s = 2GM/c^2$ & $2.95\\text{ km}\\,(M/\\Msun)$ \\\\
    Photon sphere & $r_{\\text{ph}} = 3GM/c^2$ & $1.5\\,r_s$ \\\\
    ISCO radius (Schwarzschild) & $r_{\\text{ISCO}} = 6GM/c^2$ & $3.0\\,r_s$ \\\\
    Hawking temperature & $T_H = \\hbar c^3 / (8\\pi G M k_B)$ & $6.17 \\times 10^{-8}\\text{ K}\\,(\\Msun/M)$ \\\\
    Cosmological scale & $\\ell_\\Lambda = \\Lambda^{-1/2}$ & $\\sim 10^{26}\\text{ m}$ \\\\
    \\bottomrule
  \\end{tabular}
\\end{table}

\\begin{remark}[Observational Probes]
Event Horizon Telescope shadow imaging resolves the photon ring near $b_c = 3\\sqrt{3}\\,GM/c^2 \\approx 2.60\\,r_s$, whereas compact-binary inspiral waveforms chirp through $r_{\\text{ISCO}}$ shortly prior to merger~\\cite{carroll2004}.
\\end{remark}
`,
      },
      {
        path: "sections/appendix.tex",
        kind: "tex",
        content: `\\section{Curvature Invariants of the Schwarzschild Patch}
For completeness, the diagonal Schwarzschild metric components $f(r) = 1 - r_s/r$ in Eq.~\\eqref{eq:schwarzschild} generate non-vanishing radial Levi-Civita connection coefficients $\\Gamma^r{}_{rr} = -r_s/(2r^2 f)$ and $\\Gamma^t{}_{tr} = r_s/(2r^2 f)$, alongside spherical terms $\\Gamma^r{}_{\\theta\\theta} = -r f(r)$ and $\\Gamma^r{}_{\\phi\\phi} = -r f(r)\\sin^2\\theta$.

Contracting the Riemann curvature tensor removes coordinate artifacts at $r = r_s$ and isolates the true central singularity via the Kretschmann scalar:
\\begin{equation}\\label{eq:kretschmann}
  \\mathcal{K} = R_{\\mu\\nu\\rho\\sigma} R^{\\mu\\nu\\rho\\sigma} = \\frac{48 G^2 M^2}{c^4 r^6} = \\frac{12\\,r_s^2}{r^6}.
\\end{equation}
Because $\\mathcal{K}$ remains finite across $r = r_s$, the horizon behavior in Definition~\\ref{def:horizon} reflects a coordinate boundary rather than a physical curvature divergence.
`,
      },
      {
        path: "references.bib",
        kind: "bib",
        content: `@article{einstein1915,
  author  = {Albert Einstein},
  title   = {Die Feldgleichungen der Gravitation},
  journal = {Sitzungsberichte der K{\\"o}niglich Preu{\\ss}ischen Akademie der Wissenschaften},
  year    = {1915},
  pages   = {844--847}
}

@book{mtw1973,
  author    = {Charles W. Misner and Kip S. Thorne and John Archibald Wheeler},
  title     = {Gravitation},
  publisher = {W. H. Freeman},
  year      = {1973},
  address   = {San Francisco}
}

@book{hawking1973,
  author    = {Stephen W. Hawking and George F. R. Ellis},
  title     = {The Large Scale Structure of Space-Time},
  publisher = {Cambridge University Press},
  year      = {1973}
}

@book{weinberg1972,
  author    = {Steven Weinberg},
  title     = {Gravitation and Cosmology: Principles and Applications of the General Theory of Relativity},
  publisher = {John Wiley \\& Sons},
  year      = {1972}
}

@book{wald1984,
  author    = {Robert M. Wald},
  title     = {General Relativity},
  publisher = {University of Chicago Press},
  year      = {1984},
  address   = {Chicago}
}

@book{carroll2004,
  author    = {Sean M. Carroll},
  title     = {Spacetime and Geometry: An Introduction to General Relativity},
  publisher = {Addison-Wesley},
  year      = {2004}
}
`,
      },
      {
        path: "figures/cosmos.svg",
        kind: "image",
        content: COSMOS_GALAXY_SVG_DATA_URL,
      },
    ],
  },
  {
    id: "ieee-paper",
    name: "IEEE Two-Column Paper",
    category: "Academic",
    badge: "2-Col",
    description:
      "Publication-style two-column IEEEtran manuscript with algorithm pseudocode, code listing, booktabs benchmarks, and IEEEtran citations.",
    mainFilePath: "main.tex",
    files: [
      {
        path: "main.tex",
        kind: "tex",
        content: `\\documentclass[10pt,twocolumn]{IEEEtran}
\\usepackage{amsmath, amssymb, booktabs, algorithm, algorithmic, listings, hyperref}
\\lstset{basicstyle=\\ttfamily\\footnotesize, frame=single, breaklines=true}

\\title{Adaptive Spectral Solvers for Nonlinear Wave Equations}
\\author{Rashad Hamidi \\and Elena Rostova}
\\date{2026}

\\begin{document}
\\maketitle

\\begin{abstract}
We introduce an adaptive pseudo-spectral time integrator for dispersive nonlinear wave equations. By combining symplectic splitting with localized error estimators, our method achieves spectral spatial accuracy with $O(N \\log N)$ per-step complexity.
\\end{abstract}

\\section{Introduction}
High-order numerical integration of partial differential equations plays a central role in nonlinear optics, plasma physics, and fluid dynamics~\\cite{trefethen2000}. Standard explicit Runge--Kutta schemes suffer from strict CFL time-step constraints when stiff dispersive terms $\\partial_x^3 u$ are present.

\\section{Methodology}
Consider the generalized Korteweg--de Vries equation on a periodic domain $x \\in [0, L)$:
\\begin{equation}\\label{eq:kdv}
  \\partial_t u + u\\,\\partial_x u + \\delta^2 \\partial_x^3 u = 0.
\\end{equation}
Transforming to Fourier space $\\hat{u}_k(t) = \\mathcal{F}[u](k,t)$ diagonalizes the linear dispersive operator into $-i k^3 \\delta^2$.

\\begin{algorithm}[htbp]
  \\caption{Adaptive Integrating-Factor Step}
  \\label{alg:ifstep}
  \\begin{algorithmic}
    \\STATE \\textbf{Input:} Field $u^n$, step size $\\Delta t$, tolerance $\\varepsilon$
    \\STATE Compute Fourier modes $\\hat{u}^n \\gets \\mathrm{FFT}(u^n)$
    \\STATE Evaluate nonlinear flux $\\mathcal{N}(u^n) = -\\frac{1}{2} i k \\,\\mathrm{FFT}((u^n)^2)$
    \\IF{relative error $\\eta > \\varepsilon$}
      \\STATE Halve $\\Delta t \\gets \\Delta t / 2$ and recompute
    \\ELSE
      \\STATE Advance $u^{n+1} \\gets \\mathrm{IFFT}(\\hat{u}^{n+1})$
    \\ENDIF
  \\end{algorithmic}
\\end{algorithm}

\\section{Experimental Benchmarks}
Table~\\ref{tab:bench} reports runtime and $L^2$ error on $N=1024$ modes, while Listing~1 shows the core Fourier step.

\\begin{table}[htbp]
  \\centering
  \\caption{Comparison against fixed-step RK4 on $T=10$.}
  \\label{tab:bench}
  \\begin{tabular}{lcc}
    \\toprule
    Solver & $L^2$ Error & Runtime (ms) \\\\
    \\midrule
    Fixed RK4 & $4.8 \\times 10^{-6}$ & 412 \\\\
    Split-Step & $9.2 \\times 10^{-8}$ & 118 \\\\
    \\textbf{Adaptive IF} & $1.1 \\times 10^{-9}$ & \\textbf{84} \\\\
    \\bottomrule
  \\end{tabular}
\\end{table}

\\begin{lstlisting}[caption={Spectral dispersion multiplier}]
def advance_modes(u_hat, k, dt, delta):
    phase = np.exp(1j * (k ** 3) * (delta ** 2) * dt)
    return u_hat * phase
\\end{lstlisting}

\\section{Conclusion}
Integrating-factor adaptation reduces wall-clock runtime by nearly $5\\times$ compared to standard fixed-step methods while preserving machine-precision invariants.

\\bibliographystyle{IEEEtran}
\\bibliography{references}

\\end{document}
`,
      },
      {
        path: "references.bib",
        kind: "bib",
        content: `@book{trefethen2000,
  author    = {Lloyd N. Trefethen},
  title     = {Spectral Methods in MATLAB},
  publisher = {SIAM},
  year      = {2000}
}
`,
      },
    ],
  },
  {
    id: "beamer-deck",
    name: "Beamer Presentation Deck",
    category: "Presentation",
    badge: "Slides",
    description:
      "5-slide widescreen Beamer deck with Madrid theme, theorem/alert/example blocks, two-column layout, and an embedded TikZ figure.",
    mainFilePath: "main.tex",
    files: [
      {
        path: "main.tex",
        kind: "tex",
        content: `\\documentclass[aspectratio=169]{beamer}
\\usetheme{Madrid}
\\usepackage{amsmath, amssymb, tikz}

\\title{Integrable Sigma Models \\& Yang--Baxter Deformations}
\\subtitle{Geometry, Lax Pairs, and Classical Integrability}
\\author{Rashad Hamidi}
\\institute{Department of Mathematical Sciences, Durham University}
\\date{November 2026}

\\begin{document}

\\begin{frame}
  \\maketitle
\\end{frame}

\\begin{frame}{Motivation: Why Integrability Matters}
  \\begin{itemize}
    \\item Most $2$D quantum field theories cannot be solved beyond perturbation theory.
    \\item Integrable models admit an infinite tower of conserved charges in involution.
    \\item Applications span $AdS/CFT$ string worldsheets, spin chains, and condensed matter.
  \\end{itemize}

  \\begin{alertblock}{Core Principle}
    A $2$D field theory is classically integrable if its equations of motion arise as the zero-curvature condition of a spectral-parameter Lax connection $\\mathcal{L}(\\lambda)$.
  \\end{alertblock}
\\end{frame}

\\begin{frame}{Zero-Curvature Representation}
  \\begin{columns}
    \\begin{column}{0.55\\textwidth}
      \\begin{block}{Lax Flatness}
        The equations of motion are equivalent to
        \\begin{equation*}
          \\partial_+ \\mathcal{L}_-(\\lambda) - \\partial_- \\mathcal{L}_+(\\lambda) + [\\mathcal{L}_+(\\lambda), \\mathcal{L}_-(\\lambda)] = 0
        \\end{equation*}
        for all values of the spectral parameter $\\lambda \\in \\mathbb{CP}^1$.
      \\end{block}
      \\begin{exampleblock}{Monodromy Matrix}
        Path-ordering $\\mathcal{L}_1(\\lambda)$ along a spatial loop produces the conserved transfer matrix $T(\\lambda) = \\mathrm{Tr}\\,\\mathcal{P}\\exp\\oint \\mathcal{L}_1(\\lambda)$.
      \\end{exampleblock}
    \\end{column}
    \\begin{column}{0.42\\textwidth}
      \\begin{tikzpicture}[scale=0.95]
        \\draw[->] (-1.6,0) -- (1.8,0) node[right] {$\\mathrm{Re}\\,\\lambda$};
        \\draw[->] (0,-1.3) -- (0,1.6) node[above] {$\\mathrm{Im}\\,\\lambda$};
        \\draw[cyan, thick] (0,0) circle (1.05);
        \\fill[purple] (0.7,0.75) circle (2.5pt);
        \\fill[purple] (-0.7,-0.75) circle (2.5pt);
        \\node[above right] at (0.7,0.75) {$z_+$};
        \\node[below left] at (-0.7,-0.75) {$z_-$};
      \\end{tikzpicture}
    \\end{column}
  \\end{columns}
\\end{frame}

\\begin{frame}{Yang--Baxter \\& $\\lambda$-Deformations}
  \\begin{enumerate}
    \\item Start from the Principal Chiral Model on a Lie group $G$.
    \\item Introduce a skew-symmetric $R$-matrix solving the modified classical Yang--Baxter equation:
    $$[RX, RY] - R([RX, Y] + [X, RY]) = -c^2 [X, Y].$$
    \\item Obtain a continuous family of integrable backgrounds with target-space torsion.
  \\end{enumerate}
\\end{frame}

\\begin{frame}{Summary \\& Outlook}
  \\begin{block}{Key Takeaways}
    \\begin{itemize}
      \\item Affine Gaudin models unify $\\eta$- and $\\lambda$-deformations via twist functions $\\varphi(\\lambda)$.
      \\item Coupled multi-copy deformations preserve classical Poisson commutativity.
    \\end{itemize}
  \\end{block}
  \\begin{center}
    \\textbf{Thank you --- Questions welcome!}
  \\end{center}
\\end{frame}

\\end{document}
`,
      },
    ],
  },
  {
    id: "physics-pset",
    name: "Physics & QFT Problem Set",
    category: "Physics",
    badge: "physics.sty",
    description:
      "Homework / exam worksheet demonstrating physics macros (bra/ket/mel/comm/pdv), exercises, solutions, and a TikZ one-loop diagram.",
    mainFilePath: "main.tex",
    files: [
      {
        path: "main.tex",
        kind: "tex",
        content: `\\documentclass[11pt]{article}
\\usepackage{amsmath, amssymb, amsthm, physics, tikz, enumitem}

\\newtheorem{exercise}{Exercise}
\\newenvironment{solution}{\\begin{proof}[Solution]}{\\end{proof}}

\\title{Quantum Field Theory II --- Problem Set 4}
\\author{Theoretical Physics Module \\quad\\textbullet\\quad Term 2}
\\date{\\today}

\\begin{document}
\\maketitle

\\section{Canonical Quantization \\& Ladder Operators}

\\begin{exercise}[Harmonic Oscillator Coherent States]\\label{ex:coherent}
Let $\\hat{a}$ and $\\hat{a}^\\dagger$ satisfy $\\comm{\\hat{a}}{\\hat{a}^\\dagger} = 1$. A coherent state $\\ket{\\alpha}$ is defined as an eigenstate $\\hat{a}\\ket{\\alpha} = \\alpha\\ket{\\alpha}$ for $\\alpha \\in \\mathbb{C}$.
\\begin{enumerate}
  \\item Expand $\\ket{\\alpha}$ in the normalized Fock basis $\\{\\ket{n}\\}_{n=0}^\\infty$.
  \\item Compute the overlap $\\abs{\\braket{\\beta}{\\alpha}}^2$ and verify non-orthogonality.
  \\item Evaluate the expectation value $\\mel{\\alpha}{\\hat{H}}{\\alpha}$ for $\\hat{H} = \\hbar\\omega\\left(\\hat{a}^\\dagger\\hat{a} + \\frac{1}{2}\\right)$.
\\end{enumerate}
\\end{exercise}

\\begin{solution}
Expanding $\\ket{\\alpha} = \\sum_{n=0}^\\infty c_n \\ket{n}$, the eigenvalue condition gives $\\sqrt{n+1}\\,c_{n+1} = \\alpha c_n$, whence $c_n = c_0 \\alpha^n / \\sqrt{n!}$. Normalization $\\braket{\\alpha}{\\alpha}=1$ fixes $c_0 = e^{-\\abs{\\alpha}^2/2}$:
\\begin{equation}\\label{eq:coherent}
  \\ket{\\alpha} = e^{-\\abs{\\alpha}^2/2} \\sum_{n=0}^{\\infty} \\frac{\\alpha^n}{\\sqrt{n!}} \\ket{n}.
\\end{equation}
From Eq.~\\eqref{eq:coherent}, the overlap reads
$$\\braket{\\beta}{\\alpha} = \\exp\\!\\left(-\\frac{\\abs{\\alpha}^2 + \\abs{\\beta}^2}{2} + \\beta^*\\alpha\\right) \\implies \\abs{\\braket{\\beta}{\\alpha}}^2 = e^{-\\abs{\\alpha - \\beta}^2}.$$
Finally, $\\mel{\\alpha}{\\hat{a}^\\dagger\\hat{a}}{\\alpha} = \\abs{\\alpha}^2$, so $\\ev{\\hat{H}} = \\hbar\\omega\\left(\\abs{\\alpha}^2 + \\frac{1}{2}\\right)$.
\\end{solution}

\\section{One-Loop Scalar Self-Energy}

\\begin{exercise}[Euclidean Propagator Bubble]
Evaluate the momentum-space one-loop diagram in $\\phi^4$ theory in $d = 4 - 2\\epsilon$ dimensions.
\\end{exercise}

\\begin{figure}[htbp]
  \\centering
  \\begin{tikzpicture}[scale=1.1]
    \\draw[thick] (-2.2,0) -- (2.2,0);
    \\draw[cyan, thick] (0,0.65) circle (0.65);
    \\fill[purple] (0,0) circle (2.4pt);
    \\node[left] at (-2.2,0) {$p$};
    \\node[right] at (2.2,0) {$p$};
    \\node[above] at (0,1.35) {$k$};
  \\end{tikzpicture}
  \\caption{One-loop tadpole correction in $\\lambda\\phi^4$ theory.}
\\end{figure}

\\begin{solution}
Using dimensional regularization, the tadpole integral is
$$I(m^2) = \\int \\frac{d^d k_E}{(2\\pi)^d} \\frac{1}{k_E^2 + m^2} = \\frac{m^2}{(4\\pi)^{d/2}} \\Gamma\\!\\left(1 - \\frac{d}{2}\\right) \\left(\\frac{m^2}{\\mu^2}\\right)^{-\\epsilon}.$$
Expanding around $\\epsilon = 0$ isolates the simple pole $\\frac{1}{\\epsilon}$ absorbed by the mass counterterm $\\delta m^2$.
\\end{solution}

\\end{document}
`,
      },
    ],
  },
  {
    id: "academic-cv",
    name: "Academic Curriculum Vitae",
    category: "CV",
    badge: "CV",
    description:
      "Clean, structured academic CV with education, publications, teaching experience, grants, and skills.",
    mainFilePath: "main.tex",
    files: [
      {
        path: "main.tex",
        kind: "tex",
        content: `\\documentclass[11pt]{article}
\\usepackage[margin=0.85in]{geometry}
\\usepackage{amsmath, hyperref, booktabs}

\\title{Rashad Hamidi --- Curriculum Vitae}
\\author{Department of Mathematical Sciences, Durham University \\quad\\textbullet\\quad \\href{mailto:xurashad@gmail.com}{xurashad@gmail.com}}
\\date{Updated November 2026}

\\begin{document}
\\maketitle

\\section*{Research Interests}
Integrable $\\sigma$-models, affine Gaudin models, $2$D conformal field theories, $AdS/CFT$ integrability, and symbolic/numerical methods in mathematical physics.

\\section*{Education}
\\begin{itemize}
  \\item \\textbf{PhD in Mathematical \\& Theoretical Physics} --- Durham University \\hfill \\textit{2022--2026 (Expected)}
  \\item \\textbf{MSc in Particles, Strings \\& Cosmology (Distinction)} --- Durham University \\hfill \\textit{2021--2022}
  \\item \\textbf{BSc in Physics \\& Mathematics (First Class)} --- Birzeit University \\hfill \\textit{2017--2021}
\\end{itemize}

\\section*{Selected Publications}
\\begin{enumerate}
  \\item R.~Hamidi \\& B.~Hoare, \\textit{Twists of Trigonometric Sigma Models}, JHEP (2025).
  \\item R.~Hamidi, \\textit{Defect Sums and Coupled Integrable Deformations}, Preprint (2026).
\\end{enumerate}

\\section*{Teaching Experience}
\\begin{table}[htbp]
  \\centering
  \\begin{tabular}{lll}
    \\toprule
    Module & Role & Period \\\\
    \\midrule
    Quantum Mechanics II & Graduate Teaching Assistant & 2023--2025 \\\\
    General Relativity & Problem Class Tutor & 2024--2025 \\\\
    Complex Analysis & Workshop Demonstrator & 2022--2024 \\\\
    \\bottomrule
  \\end{tabular}
\\end{table}

\\section*{Technical Skills}
\\textbf{Languages \\& Symbolic:} Wolfram Mathematica, Python, TypeScript, C++, \\LaTeX \\\\
\\textbf{Web \\& Numerical:} Next.js, React, WebGL2 / GLSL, WebAssembly, SymPy

\\end{document}
`,
      },
    ],
  },
  {
    id: "thesis-chapter",
    name: "Multi-File Thesis / Report",
    category: "Academic",
    badge: "Multi-file",
    description:
      "Multi-chapter report template with \\tableofcontents, modular \\input chapters, appendix, cross-references, and bibliography.",
    mainFilePath: "main.tex",
    files: [
      {
        path: "main.tex",
        kind: "tex",
        content: `\\documentclass[11pt]{report}
\\usepackage{amsmath, amssymb, amsthm, booktabs, hyperref}

\\title{Spectral Geometry of Deformed Worldsheets}
\\author{Rashad Hamidi}
\\date{2026}

\\begin{document}
\\maketitle
\\tableofcontents

\\input{chapters/ch1.tex}
\\input{chapters/ch2.tex}

\\appendix
\\chapter{Notation \\& Lie Algebra Conventions}
Throughout this thesis, $[T_a, T_b] = f_{ab}{}^c T_c$ denotes the Lie bracket with invariant bilinear form $\\kappa_{ab} = \\mathrm{Tr}(T_a T_b)$.

\\bibliographystyle{alpha}
\\bibliography{references}

\\end{document}
`,
      },
      {
        path: "chapters/ch1.tex",
        kind: "tex",
        content: `\\chapter{Introduction to Twist Functions}
The Hamiltonian formulation of two-dimensional integrable field theories on $\\mathbb{R} \\times S^1$ is governed by a meromorphic twist function $\\varphi(z)$~\\cite{vicedo2019}.

\\section{Maillet Bracket}
The spatial Lax matrix $\\mathcal{L}_1(z)$ satisfies a non-ultralocal Poisson bracket characterized by the $r/s$-matrices:
\\begin{equation}\\label{eq:maillet}
  \\{\\mathcal{L}_1(z_1), \\mathcal{L}_2(z_2)\\} = [r_{12}(z_1,z_2), \\mathcal{L}_1 + \\mathcal{L}_2] - [s_{12}(z_1,z_2), \\mathcal{L}_1 - \\mathcal{L}_2] - 2 s_{12}(z_1,z_2) \\partial_\\sigma \\delta_{\\sigma\\sigma'}.
\\end{equation}
`,
      },
      {
        path: "chapters/ch2.tex",
        kind: "tex",
        content: `\\chapter{Trigonometric Realizations}
Evaluating the residues of $\\varphi(z)$ yields trigonometric solutions of the classical Yang--Baxter equation. As shown in Eq.~\\eqref{eq:maillet}, the pole structure dictates the target-space geometry.

\\section{Metric Reconstruction}
Eliminating auxiliary gauge currents produces a nonlinear $\\sigma$-model action
$$S = \\frac{1}{2} \\int d^2\\sigma \\left(G_{ij}(X) \\eta^{\\alpha\\beta} + B_{ij}(X) \\epsilon^{\\alpha\\beta}\\right) \\partial_\\alpha X^i \\partial_\\beta X^j.$$
`,
      },
      {
        path: "references.bib",
        kind: "bib",
        content: `@article{vicedo2019,
  author  = {Benoit Vicedo},
  title   = {On Integrable Field Theories as Dihedral Affine Gaudin Models},
  journal = {International Mathematics Research Notices},
  year    = {2020},
  volume  = {2020},
  pages   = {4513--4601}
}
`,
      },
    ],
  },
  {
    id: "formal-letter",
    name: "Academic Cover Letter",
    category: "General",
    badge: "Letter",
    description:
      "Formal academic / journal submission cover letter using the standard LaTeX letter class.",
    mainFilePath: "main.tex",
    files: [
      {
        path: "main.tex",
        kind: "tex",
        content: `\\documentclass[11pt]{letter}
\\usepackage[margin=1in]{geometry}

\\signature{Rashad Hamidi \\\\ Department of Mathematical Sciences}
\\address{Department of Mathematical Sciences \\\\ Durham University, DH1 3LE, UK}
\\date{\\today}

\\begin{document}
\\begin{letter}{Editorial Office \\\\ Journal of High Energy Physics}

\\opening{Dear Editors,}

Please find enclosed our manuscript entitled \\textbf{\`\`Cosmic Dynamics \\& Integrable Gravity Models''} for consideration for publication in \\textit{Journal of High Energy Physics}.

In this work, we establish a unified algebraic framework linking spherically symmetric metric deformations to affine Gaudin models, proving classical integrability via an explicit spectral-parameter Lax pair. All analytical derivations have been independently verified symbolically.

We confirm that this manuscript is original, has not been published elsewhere, and is not currently under consideration by another journal.

\\closing{Yours sincerely,}

\\end{letter}
\\end{document}
`,
      },
    ],
  },
  {
    id: "tikz-showcase",
    name: "TikZ & Math Diagrams Gallery",
    category: "Physics",
    badge: "TikZ",
    description:
      "Vector TikZ figures (coordinate axes, Bézier trajectories, phase-space circles, and geometric regions) paired with equations.",
    mainFilePath: "main.tex",
    files: [
      {
        path: "main.tex",
        kind: "tex",
        content: `\\documentclass[11pt]{article}
\\usepackage{amsmath, amssymb, tikz}

\\title{Vector Diagrams with TikZ \\& \\LaTeX}
\\author{WeTeX Graphics Studio}
\\date{\\today}

\\begin{document}
\\maketitle

\\section{Phase Portrait \\& Complex Contour}
Figure~\\ref{fig:contour} illustrates a closed Hankel contour encircling a branch cut on the negative real axis.

\\begin{figure}[htbp]
  \\centering
  \\begin{tikzpicture}[scale=1.15]
    \\draw[->, thick] (-2.6,0) -- (2.6,0) node[right] {$\\mathrm{Re}(z)$};
    \\draw[->, thick] (0,-2.0) -- (0,2.2) node[above] {$\\mathrm{Im}(z)$};
    \\draw[cyan, very thick] (0,0) circle (1.35);
    \\draw[purple, thick, ->] (-2.2,0.28) -- (-0.4,0.28);
    \\draw[purple, thick, ->] (-0.4,-0.28) -- (-2.2,-0.28);
    \\fill[purple] (0,0) circle (2.5pt);
    \\node[above right] at (0.95,1.0) {$|z|=R$};
    \\node[below right] at (0.08,-0.08) {$0$};
  \\end{tikzpicture}
  \\caption{Complex integration contour and pole at the origin.}
  \\label{fig:contour}
\\end{figure}

\\section{Commutative Geometry Grid}
\\begin{figure}[htbp]
  \\centering
  \\begin{tikzpicture}[scale=1.0]
    \\draw[gray, dashed] (-2,-1) grid (2,2);
    \\draw[blue, very thick, ->] (-1.5,0) -- (1.5,1.5) node[above right] {$\\mathbf{v}$};
    \\draw[teal, thick, ->] (-1.5,0) -- (1.5,0) node[below right] {$\\mathbf{u}$};
    \\draw[orange, thick, dashed] (1.5,0) -- (1.5,1.5);
  \\end{tikzpicture}
  \\caption{Orthogonal projection onto a subspace.}
\\end{figure}

\\end{document}
`,
      },
    ],
  },
  {
    id: "minimal-blank",
    name: "Minimal Blank Article",
    category: "General",
    badge: "Starter",
    description:
      "Clean, structured article starter with standard math, graphics, booktabs tables, and hyperref pre-configured for instant compilation.",
    mainFilePath: "main.tex",
    files: [
      {
        path: "main.tex",
        kind: "tex",
        content: `\\documentclass[11pt]{article}
\\usepackage[margin=1in]{geometry}
\\usepackage{amsmath, amssymb, amsthm, graphicx, booktabs, hyperref}

\\newtheorem{theorem}{Theorem}[section]

\\title{Untitled Document}
\\author{Author Name}
\\date{\\today}

\\begin{document}
\\maketitle

\\begin{abstract}
Brief summary of the document's scope, methods, and main findings.
\\end{abstract}

\\section{Introduction}
Start writing your \\LaTeX{} manuscript here. Inline math like $E = mc^2$ and numbered display equations render live in both Offline Preview and Real TeX Live 2026 PDF mode:
\\begin{equation}\\label{eq:gaussian}
  \\int_{-\\infty}^{\\infty} e^{-x^2}\\,\\mathrm{d}x = \\sqrt{\\pi}.
\\end{equation}
Reference Eq.~\\eqref{eq:gaussian} anywhere in your prose.

\\end{document}
`,
      },
    ],
  },
];

export function createProjectFromTemplate(
  templateId: string,
  customName?: string,
): WeTeXProject {
  const tpl =
    WETEX_TEMPLATES.find((t) => t.id === templateId) ?? WETEX_TEMPLATES[0];
  const now = Date.now();
  const files: ProjectFile[] = tpl.files.map((f, idx) => ({
    id: `file-${now}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
    path: f.path,
    kind: f.kind,
    content: f.content,
    updatedAt: now,
  }));

  return {
    id: `proj-${now}-${Math.random().toString(36).slice(2, 6)}`,
    name: customName?.trim() || tpl.name,
    templateId: tpl.id,
    mainFilePath: tpl.mainFilePath,
    files,
    snapshots: [],
    createdAt: now,
    updatedAt: now,
  };
}
