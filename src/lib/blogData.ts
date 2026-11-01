export interface BlogImage {
  src: string;
  alt: string;
  caption?: string;
}

export interface BlogCallout {
  title: string;
  text: string;
  tag?: string;
}

export interface BlogTable {
  headers: string[];
  rows: string[][];
  caption?: string;
  title?: string;
}

export interface BlogSection {
  heading: string;
  body: string[];
  quote?: string;
  image?: BlogImage;
  callout?: BlogCallout;
  table?: BlogTable;
  characterCount?: number;
  readTime?: number;
}

export interface Post {
  id: string;
  title: string;
  excerpt: string;
  tags: string[];
  date: string;
  readTime: number;
  characterCount: number;
  accent: "quantum" | "olive" | "crimson";
  featured?: boolean;
  category: string;
  coverImage?: BlogImage;
  sections?: BlogSection[];
}

export type RawPost = Omit<Post, "readTime" | "characterCount"> & {
  readTime?: number;
  characterCount?: number;
};

/**
 * Average adult silent reading speed in characters per minute.
 * Standard adult reading speed for English non-fiction/technical text is ~200 words per minute,
 * which corresponds to ~1,000 characters per minute (approx. 5 characters per word).
 */
export const CHARACTERS_PER_MINUTE = 1000;

/**
 * Calculates the total number of characters in a single blog section,
 * counting heading, body paragraphs, quotes, callouts, captions, and tables.
 */
export function calculateSectionCharacters(section: BlogSection): number {
  let count = 0;
  if (section.heading) {
    count += section.heading.trim().length;
  }
  if (section.body && Array.isArray(section.body)) {
    for (const paragraph of section.body) {
      count += paragraph.trim().length;
    }
  }
  if (section.quote) {
    count += section.quote.trim().length;
  }
  if (section.callout) {
    if (section.callout.title) count += section.callout.title.trim().length;
    if (section.callout.text) count += section.callout.text.trim().length;
    if (section.callout.tag) count += section.callout.tag.trim().length;
  }
  if (section.image?.caption) {
    count += section.image.caption.trim().length;
  }
  if (section.table) {
    if (section.table.title) count += section.table.title.trim().length;
    if (section.table.caption) count += section.table.caption.trim().length;
    if (section.table.headers && Array.isArray(section.table.headers)) {
      for (const h of section.table.headers) count += h.trim().length;
    }
    if (section.table.rows && Array.isArray(section.table.rows)) {
      for (const row of section.table.rows) {
        for (const cell of row) count += cell.trim().length;
      }
    }
  }
  return count;
}

/**
 * Calculates the estimated reading time of a single section in minutes.
 */
export function calculateSectionReadTime(
  section: BlogSection,
  cpm: number = CHARACTERS_PER_MINUTE
): number {
  const chars = calculateSectionCharacters(section);
  if (chars === 0) return 1;
  return Math.max(1, Math.ceil(chars / cpm));
}

/**
 * Calculates the total number of characters across all sections of an article.
 */
export function calculateArticleCharacters(sections?: BlogSection[]): number {
  if (!sections || !Array.isArray(sections)) return 0;
  return sections.reduce((sum, sec) => sum + calculateSectionCharacters(sec), 0);
}

/**
 * Estimates reading time of an article in minutes based directly on the character count of its sections.
 */
export function calculateReadTime(
  sections?: BlogSection[],
  cpm: number = CHARACTERS_PER_MINUTE
): number {
  const totalChars = calculateArticleCharacters(sections);
  if (totalChars === 0) return 1;
  return Math.max(1, Math.ceil(totalChars / cpm));
}

export const RAW_POSTS: RawPost[] = [
  {
    id: "recommended-physics-reading-list",
    title: "The Theoretical Physicist's Roadmap: Recommended Books & Papers Across Different Domains",
    excerpt:
      "Navigating the labyrinth of theoretical physics literature can be daunting. From Conformal Field Theory and Integrability to General Relativity, Supersymmetry, and Quantum Gravity, here is a curated pedagogical guide and annotated bibliography across different disciplines.",
    tags: [
      "Reading Guide",
      "Theoretical Physics",
      "Mathematics",
      "Learning Guide"
    ],
    date: "2026-11-01",
    accent: "quantum",
    featured: true,
    category: "Reading Guides",
    coverImage: {
      src: "/images/blog/books/physics-library-cover.jpg",
      alt: "A classical and modern theoretical physics library with chalkboard calculations and quantum monitors",
      caption: "The Theoretical Physicist's Library: Navigating different pillars of modern mathematical and theoretical physics from spacetime geometry to quantum field theory.",
    },
    sections: [
      {
        heading: "Navigating the Theoretical Landscape: A Methodological Compass",
        body: [
          "Self-study in advanced theoretical physics often stalls due to 'textbook paralysis': dozens of monumental tomes with conflicting metric signatures, disparate notations, and vastly different prerequisite assumptions. Without a clear compass, months can be lost wading through the wrong resource at the wrong stage.",
          "A successful trajectory relies on a three-tier method: first, an intuitive scout for conceptual clarity; second, a computational workhorse for explicit pen-and-paper derivations; and third, an axiomatic treatise as a permanent desk reference. Below is a streamlined roadmap across different disciplines.",
        ],
        callout: {
          tag: "Methodology",
          title: "The Three-Tier Reading Strategy",
          text: "1. The Conceptual Scout for geometric and physical intuition. 2. The Computational Workhorse for explicit calculations. 3. The Grand Treatise for axiomatic rigor and lifelong reference.",
        },
        quote: "Theoretical physics is not a catalog of disconnected facts; it is an interlocking cathedral where spacetime geometry, internal symmetries, and quantum probability converse in the dialect of mathematics.",
      },
      {
        heading: "1. Conformal Field Theory (CFT)",
        body: [
          "1. **Blumenhagen, R., & Plauschinn, E.** (2009). *Introduction to Conformal Field Theory: With Applications to String Theory*. Lecture Notes in Physics, Vol. 779. Springer-Verlag Berlin Heidelberg.",
          "2. **Di Francesco, P., Mathieu, P., & Sénéchal, D.** (1997). *Conformal Field Theory*. Graduate Texts in Contemporary Physics. Springer-Verlag New York.",
          "3. **Ginsparg, P.** (1988). *Applied Conformal Field Theory*. In E. Brézin & J. Zinn-Justin (Eds.), *Fields, Strings and Critical Phenomena* (Les Houches, Session XLIX). arXiv:hep-th/9108028.",
          "4. **Rychkov, S.** (2016). *EPFL Lectures on Conformal Field Theory in D ≥ 3 Dimensions*. SpringerBriefs in Physics. Springer International Publishing. arXiv:1601.05000."
        ]
      },
      {
        heading: "2. General Relativity (GR)",
        body: [
          "1. **Carroll, S. M.** (2004). *Spacetime and Geometry: An Introduction to General Relativity*. Addison-Wesley (Pearson / Cambridge University Press).",
          "2. **Hartle, J. B.** (2003). *Gravity: An Introduction to Einstein's General Relativity*. Addison-Wesley.",
          "3. **Hawking, S. W., & Ellis, G. F. R.** (2023). *The Large Scale Structure of Space-Time* (50th Anniversary ed.). Cambridge Monographs on Mathematical Physics. Cambridge University Press.",
          "4. **Misner, C. W., Thorne, K. S., & Wheeler, J. A.** (1973). *Gravitation*. W. H. Freeman and Company.",
          "5. **Schutz, B. F.** (2022). *A First Course in General Relativity* (3rd ed.). Cambridge University Press.",
          "6. **Songsheng, Y.-Y.** (2020). *Solution Manual for Gravitation (Misner, Thorne, Wheeler)*. Institute of High Energy Physics, Chinese Academy of Sciences.",
          "7. **Wald, R. M.** (1984). *General Relativity*. The University of Chicago Press.",
          "8. **Weinberg, S.** (1972). *Gravitation and Cosmology: Principles and Applications of the General Theory of Relativity*. John Wiley & Sons.",
          "9. **Zee, A.** (2013). *Einstein Gravity in a Nutshell*. Princeton University Press."
        ]
      },
      {
        heading: "3. Integrability",
        body: [
          "1. **Arnold, V. I.** (1989). *Mathematical Methods of Classical Mechanics* (2nd ed.). Graduate Texts in Mathematics, Vol. 60. Springer-Verlag New York.",
          "2. **Arutyunov, G.** (2019). *Elements of Classical and Quantum Integrable Systems*. UNITEXT for Physics. Springer Nature Switzerland AG.",
          "3. **Babelon, O., Bernard, D., & Talon, M.** (2003). *Introduction to Classical Integrable Systems*. Cambridge Monographs on Mathematical Physics. Cambridge University Press.",
          "4. **Baxter, R. J.** (1982). *Exactly Solved Models in Statistical Mechanics*. Academic Press.",
          "5. **Beisert, N., Ahn, C., Alday, L. F., Bajnok, Z., Drummond, J. M., Freyhult, L., Gromov, N., Janik, R. A., Kazakov, V., Klose, T., Korchemsky, G. P., Kristjansen, C., et al.** (2012). *Review of AdS/CFT Integrability: An Overview*. Letters in Mathematical Physics, 99(1–3), 3–32. arXiv:1012.3982 [hep-th].",
          "6. **Doikou, A., Evangelisti, S., Feverati, G., & Karaiskos, N.** (2010). *Introduction to Quantum Integrability*. International Journal of Modern Physics A, 25(17), 3307–3398. arXiv:0912.3350 [math-ph].",
          "7. **Faddeev, L. D.** (1996). *How Algebraic Bethe Ansatz Works for Integrable Model*. In A. Connes, K. Gawedzki, & J. Zinn-Justin (Eds.), *Quantum Symmetries / Symétries Quantiques* (Les Houches, Session LXIV). arXiv:hep-th/9605187.",
          "8. **Faddeev, L. D., & Takhtajan, L. A.** (1987). *Hamiltonian Methods in the Theory of Solitons*. Springer Series in Soviet Mathematics. Springer-Verlag Berlin Heidelberg.",
          "9. **Gaudin, M.** (2014). *The Bethe Wavefunction* (J.-S. Caux, Trans.). Cambridge University Press. (Original work published in French as *La fonction d’onde de Bethe*, 1983, Masson).",
          "10. **Karbach, M., & Müller, G.** (1997). *Introduction to the Bethe Ansatz I & II*. Computers in Physics, 11(1), 36–43 & 12(6), 565–573. arXiv:cond-mat/9809162.",
          "11. **Korepin, V. E., Bogoliubov, N. M., & Izergin, A. G.** (1993). *Quantum Inverse Scattering Method and Correlation Functions*. Cambridge Monographs on Mathematical Physics. Cambridge University Press.",
          "12. **Retore, A. L.** (2022). *Introduction to Classical and Quantum Integrability*. Lecture Notes. arXiv:2109.14280 [hep-th]."
        ]
      },
      {
        heading: "4. Lie Algebra and Lie Groups",
        body: [
          "1. **Fuchs, J., & Schweigert, C.** (1997). *Symmetries, Lie Algebras and Representations: A Graduate Course for Physicists*. Cambridge Monographs on Mathematical Physics. Cambridge University Press.",
          "2. **Fulton, W., & Harris, J.** (1991). *Representation Theory: A First Course*. Graduate Texts in Mathematics, Vol. 129. Springer-Verlag New York.",
          "3. **Georgi, H.** (1999). *Lie Algebras in Particle Physics: From Isospin to Unified Theories* (2nd ed.). Frontiers in Physics, Vol. 54. Westview Press / CRC Press.",
          "4. **Hall, B. C.** (2015). *Lie Groups, Lie Algebras, and Representations: An Elementary Introduction* (2nd ed.). Graduate Texts in Mathematics, Vol. 222. Springer International Publishing.",
          "5. **Humphreys, J. E.** (1972). *Introduction to Lie Algebras and Representation Theory*. Graduate Texts in Mathematics, Vol. 9. Springer-Verlag New York.",
          "6. **Isaev, A. P., & Rubakov, V. A.** (2021). *Theory of Groups and Symmetries: Representations of Groups and Lie Algebras, Applications*. World Scientific Publishing Co.",
          "7. **Kirillov, A., Jr.** (2008). *An Introduction to Lie Groups and Lie Algebras*. Cambridge Studies in Advanced Mathematics, Vol. 113. Cambridge University Press.",
          "8. **Knapp, A. W.** (2002). *Lie Groups Beyond an Introduction* (2nd ed.). Progress in Mathematics, Vol. 140. Birkhäuser Boston.",
          "9. **Stillwell, J.** (2008). *Naive Lie Theory*. Undergraduate Texts in Mathematics. Springer Science+Business Media.",
          "10. **Zee, A.** (2016). *Group Theory in a Nutshell for Physicists*. Princeton University Press."
        ]
      },
      {
        heading: "5. Quantum Computation",
        body: [
          "1. **Bouwmeester, D., Ekert, A., & Zeilinger, A. (Eds.).** (2000). *The Physics of Quantum Information: Quantum Cryptography, Quantum Teleportation, Quantum Computation*. Springer-Verlag Berlin Heidelberg.",
          "2. **Heiss, D. (Ed.).** (2002). *Fundamentals of Quantum Information: Quantum Computation, Communication, Decoherence and All That*. Lecture Notes in Physics, Vol. 587. Springer-Verlag Berlin Heidelberg.",
          "3. **Hidary, J. D.** (2021). *Quantum Computing: An Applied Approach* (2nd ed.). Springer International Publishing.",
          "4. **Landsberg, J. M.** (2024). *Quantum Computation and Quantum Information: A Mathematical Perspective*. Graduate Studies in Mathematics, Vol. 243. American Mathematical Society.",
          "5. **Mermin, N. D.** (2007). *Quantum Computer Science: An Introduction*. Cambridge University Press.",
          "6. **Nielsen, M. A., & Chuang, I. L.** (2010). *Quantum Computation and Quantum Information* (10th Anniversary ed.). Cambridge University Press."
        ]
      },
      {
        heading: "6. Quantum Field Theory (QFT)",
        body: [
          "1. **Coleman, S.** (2018). *Lectures of Sidney Coleman on Quantum Field Theory* (B. G.-g. Chen, D. Derbes, D. Griffiths, B. Hill, R. Sohn, & Y.-S. Ting, Eds.). World Scientific Publishing Co.",
          "2. **Peskin, M. E., & Schroeder, D. V.** (1995). *An Introduction to Quantum Field Theory*. Westview Press / Addison-Wesley Publishing Company.",
          "3. **Schwartz, M. D.** (2014). *Quantum Field Theory and the Standard Model*. Cambridge University Press.",
          "4. **Srednicki, M.** (2007). *Quantum Field Theory*. Cambridge University Press.",
          "5. **Srednicki, M.** (2008). *Quantum Field Theory: Problem Solutions*. Department of Physics, University of California, Santa Barbara.",
          "6. **Weinberg, S.** (1995). *The Quantum Theory of Fields, Volume 1: Foundations*. Cambridge University Press.",
          "7. **Weinberg, S.** (1996). *The Quantum Theory of Fields, Volume 2: Modern Applications*. Cambridge University Press.",
          "8. **Weinberg, S.** (2000). *The Quantum Theory of Fields, Volume 3: Supersymmetry*. Cambridge University Press.",
          "9. **Zee, A.** (2010). *Quantum Field Theory in a Nutshell* (2nd ed.). Princeton University Press."
        ]
      },
      {
        heading: "7. Quantum Gravity",
        body: [
          "1. **Birrell, N. D., & Davies, P. C. W.** (1982). *Quantum Fields in Curved Space*. Cambridge Monographs on Mathematical Physics. Cambridge University Press.",
          "2. **Finster, F., Müller, O., Nardmann, M., Tolksdorf, J., & Zeidler, E. (Eds.).** (2012). *Quantum Field Theory and Gravity: Conceptual and Mathematical Advances in the Search for a Unified Framework*. Birkhäuser Basel.",
          "3. **Gambini, R., & Pullin, J.** (2011). *A First Course in Loop Quantum Gravity*. Oxford University Press.",
          "4. **Kiefer, C.** (2007). *Quantum Gravity* (2nd ed.). International Series of Monographs on Physics, Vol. 136. Oxford University Press.",
          "5. **Rovelli, C.** (2004). *Quantum Gravity*. Cambridge Monographs on Mathematical Physics. Cambridge University Press.",
          "6. **Rovelli, C., & Vidotto, F.** (2015). *Covariant Loop Quantum Gravity: An Elementary Introduction to Quantum Gravity and Spinfoam Theory*. Cambridge University Press.",
          "7. **Thiemann, T.** (2007). *Modern Canonical Quantum General Relativity*. Cambridge Monographs on Mathematical Physics. Cambridge University Press.",
          "8. **Wald, R. M.** (1994). *Quantum Field Theory in Curved Spacetime and Black Hole Thermodynamics*. Chicago Lectures in Physics. The University of Chicago Press."
        ]
      },
      {
        heading: "8. String Theory",
        body: [
          "1. **Becker, K., Becker, M., & Schwarz, J. H.** (2007). *String Theory and M-Theory: A Modern Introduction*. Cambridge University Press.",
          "2. **Green, M. B., Schwarz, J. H., & Witten, E.** (2012). *Superstring Theory, Volume 1: Introduction* (25th Anniversary ed.). Cambridge Monographs on Mathematical Physics. Cambridge University Press.",
          "3. **Green, M. B., Schwarz, J. H., & Witten, E.** (2012). *Superstring Theory, Volume 2: Loop Amplitudes, Anomalies, and Phenomenology* (25th Anniversary ed.). Cambridge Monographs on Mathematical Physics. Cambridge University Press.",
          "4. **Polchinski, J.** (1998). *String Theory, Volume 1: An Introduction to the Bosonic String*. Cambridge Monographs on Mathematical Physics. Cambridge University Press.",
          "5. **Polchinski, J.** (1998). *String Theory, Volume 2: Superstring Theory and Beyond*. Cambridge Monographs on Mathematical Physics. Cambridge University Press.",
          "6. **Zwiebach, B.** (2009). *A First Course in String Theory* (2nd ed.). Cambridge University Press."
        ]
      },
      {
        heading: "9. Supersymmetry",
        body: [
          "1. **Nath, P.** (2017). *Supersymmetry, Supergravity, and Unification*. Cambridge Monographs on Mathematical Physics. Cambridge University Press.",
          "2. **Terning, J.** (2006). *Modern Supersymmetry: Dynamics and Duality*. International Series of Monographs on Physics, Vol. 132. Oxford University Press.",
          "3. **Weinberg, S.** (2000). *The Quantum Theory of Fields, Volume 3: Supersymmetry*. Cambridge University Press.",
          "4. **Wess, J., & Bagger, J.** (1992). *Supersymmetry and Supergravity* (2nd ed., rev. and exp.). Princeton Series in Physics. Princeton University Press."
        ]
      },
      {
        heading: "10. The Art of Pen-and-Paper Physics: Active Derivation & Longevity",
        body: [
          "Advanced theoretical physics cannot be absorbed passively. Reading equations without deriving them breeds the 'illusion of competence'—the steps appear obvious until you close the book and attempt to reproduce them on a blank page. True mastery demands an active derivation notebook beside every text, verifying every index contraction, factor of 2, and boundary term."
        ],
        callout: {
          tag: "Actionable Advice",
          title: "The Notebook Rule",
          text: "If you cannot derive a result on a blank sheet of paper at an empty desk, you do not yet own it. Treat every problem, index contraction, and exercise as an invitation to verify the universe yourself.",
        },
        quote: "What I cannot create, I do not understand. — Richard Feynman",
      },
    ],
  },
  {
    id: "scale-of-the-universe",
    title: "From Planck to the Cosmic Web",
    excerpt:
      "At 10⁻³⁵ meters, spacetime dissolves into quantum jitter. At 93 billion light-years, billions of galaxies weave into a glowing, web-like tapestry. Between these two extremes lies a 62-order-of-magnitude chasm—and suspended halfway across it is the human observer. From Planck to the Cosmic Web maps the architecture of physical universe, exploring how matter organises at every frontier of scale and hypothesises that lie beyond our universe.",
    tags: ["Cosmology", "Popular Science", "Scale of the Universe"],
    date: "2026-11-01",
    accent: "quantum",
    featured: true,
    category: "Cosmology",
    coverImage: {
      src: "/images/blog/scale/quantum-to-galaxy.jpg",
      alt: "Quantum atomic orbitals transitioning into a spiral galaxy",
      caption: "The spectrum of reality: 62 powers of ten separate the subatomic quantum realm from the cosmic web.",
    },
    sections: [
      {
        heading: "1. The Subatomic Basement: Welcome to the Void (10⁻³⁵ to 10⁻¹⁰ m)",
        image: {
          src: "/images/blog/scale/atom-quantum-void.jpg",
          alt: "Quantum spacetime foam and subatomic vacuum wave fluctuations",
          caption: "Quantum spacetime foam: Probabilistic wave fluctuations and topological ripples in the subatomic vacuum.",
        },
        body: [
          "At the absolute bedrock of the universe sits the Planck length (1.6 × 10⁻³⁵ m). If an atom were magnified to the size of our entire observable universe, the Planck length on that cosmic scale would still only be about the height of an average oak tree. It is the fundamental 'pixel size' of spacetime — zoom in any further, and quantum uncertainty concentrates so much energy that space collapses into microscopic black holes.",
          "Climbing twenty steps up, we meet atoms (10⁻¹⁰ m). Here is the fun part: atoms are 99.9999999% empty space. If an atom were enlarged into a soaring Gothic cathedral, the nucleus would be a solitary housefly buzzing in the nave, and the electrons would be faint ghosts haunting the outer stained glass. You never actually 'touch' anything — your electrons and the floor's electrons are just experiencing fierce electromagnetic repulsion, frantically screaming at each other to back off.",
        ],
        callout: {
          tag: "Mental Model 01",
          title: "The Cathedral & The Fly",
          text: "Nucleus = A fly in the center of a cathedral. Outer Electrons = Dust on the cathedral walls. Matter is virtually 100% empty space held together by electrostatic force fields.",
        },
        quote: "You are not solid matter; you are an electromagnetic phantom whistling through a hollow cathedral of void.",
      },
      {
        heading: "2. The Biological Sweet Spot: The Cosmic Center (10⁻⁹ to 10⁰ m)",
        image: {
          src: "/images/blog/scale/dna-cosmic-midpoint.jpg",
          alt: "Bioluminescent cellular structures and molecular helices in starlight",
          caption: "The architecture of life: Bioluminescent molecular helices and cellular dust suspended in the cosmic void.",
        },
        body: [
          "Between the atom and the stars lies the sweet spot of biochemistry. A single strand of human DNA is just 2 nanometers wide and stretches to approximately 2 meters long. Yet if you unraveled all the DNA packed inside your cells and tied it end-to-end, the filament would stretch past Pluto and back twice.",
          "Now pick up a single grain of beach sand (1 mm). Here is a comparison that borders on the surreal: there are vastly more Planck lengths packed inside one grain of sand than there are grains of sand across every beach, ocean floor, and desert on Earth combined.",
          "And right at 1.7 meters sits the human being. Many people feel crushed by the sheer size of the cosmos, but mathematically, you shouldn't. On a logarithmic scale of the universe from 10⁻³⁵ m to 10²⁷ m, the geometric halfway point is roughly 10⁻⁴ meters — about the thickness of a human hair. You are not at the bottom of creation. You are comfortably seated around the middle.",
        ],
        callout: {
          tag: "Mental Model 02",
          title: "You Are the Cosmic Midpoint",
          text: "Planck length (10⁻³⁵ m) ─── [Human Hair / Paramecium (10⁻⁴ m)] ─── Observable Universe (10²⁷ m). On a logarithmic scale, humans sit right at the center of reality's scales.",
        },
        quote: "On a logarithmic scale, humanity does not reside in the basement. We occupy the penthouse of complexity right in the center of the spectrum.",
      },
      {
        heading: "3. The Planetary Yard: Space is Mostly Empty Space (10⁷ to 10¹³ m)",
        image: {
          src: "/images/blog/scale/solar-system-scale.jpg",
          alt: "The Sun and pale blue Earth in vast dark cosmic space",
          caption: "Planetary solitude: you could fit all seven other planets side-by-side between Earth and the Moon.",
        },
        body: [
          "Leave Earth (12,742 km) behind, and the universe rapidly runs out of matter to fill the void. The Moon is 384,400 km away — so surprisingly far that you could fit all seven other planets in our solar system side-by-side in the gap between Earth and the Moon with room to spare.",
          "The Sun (1.39 × 10⁹ m) could swallow 1.3 million Earths, but our solar system is overwhelmingly empty space. To see what it really looks like, shrink the Sun down to the size of a single human red blood cell (8 μm). On this desk-sized scale: Earth is a virus-sized speck orbiting 85 cm away. Jupiter is a pollen speck 4.4 meters away. Neptune drifts 26 meters down the hallway in the dark.",
          "And where is Proxima Centauri, our closest star neighbor? It isn't in your room or down the street. It is another single blood cell floating 230 kilometers away in a different city. Between them? Absolutely nothing.",
        ],
        callout: {
          tag: "Mental Model 03",
          title: "The Red Blood Cell Solar System",
          text: "Sun = Red blood cell (8 μm) | Earth = Virus (85 cm away) | Neptune = Pollen (26 m down the hall) | Nearest Star = Blood cell 230 km away in another city.",
        },
        quote: "Space is called space for a reason: it is almost entirely, mercilessly empty.",
      },
      {
        heading: "4. The Galactic Highway: Cosmic Monsters (10¹⁶ to 10²¹ m)",
        image: {
          src: "/images/blog/scale/milky-way-monsters.jpg",
          alt: "Supermassive black hole accretion disk warping spacetime alongside a galaxy",
          caption: "Galactic monsters: Relativistic accretion disk and gravitational lensing of an ultra-massive black hole warping the galactic field.",
        },
        body: [
          "At stellar distances, meters surrender. We switch currencies to the light-year: the distance light travels in one year at 300,000 km/s (roughly 9.46 trillion kilometers).",
          "The Milky Way spans 100,000 light-years across (10²¹ m) and contains between 100 and 400 billion stars. If our solar system out to Neptune were shrunk down to the size of a coin, the Milky Way would span the entire continent of North America.",
          "And the universe builds staggering monsters: the red supergiant Stephenson 2-18 is so large that if placed in our solar system, its fiery surface would engulf Mercury, Venus, Earth, Mars, Jupiter, and touch Saturn. Meanwhile, the black hole TON 618 holds 66 billion solar masses; its event horizon could swallow our entire planetary system dozens of times over.",
        ],
        callout: {
          tag: "Mental Model 04",
          title: "The Coin & The Continent",
          text: "Shrink the solar system to a coin: the Milky Way stretches from New York to Los Angeles. Supermassive black hole TON 618's shadow is 11 times wider than Neptune's entire orbit.",
        },
        quote: "If the solar system were the size of a coin, our galaxy would span an entire continent — and billions of stars would still never touch.",
      },
      {
        heading: "5. The Cosmic Web: The 93-Billion-Light-Year Horizon (10²³ to 10²⁷ m)",
        image: {
          src: "/images/blog/scale/cosmic-web-filaments.jpg",
          alt: "The Cosmic Web glowing filaments and cosmic voids",
          caption: "The Cosmic Web: Trillions of galaxies woven by gravity and dark matter into filaments that mirror neural networks.",
        },
        body: [
          "Zoom out to hundreds of millions of light-years, and individual galaxies blur into dust motes. The Milky Way sits on the outskirts of the Laniakea Supercluster ('Immeasurable Heaven'), an archipelago of 100,000 galaxies spanning 520 million light-years.",
          "On the grandest scale, gravity weaves all matter into the Cosmic Web — filaments of galaxies separated by immense voids like the Boötes Void (a 330-million-light-year expanse of near-nothingness). Strikingly, cosmological simulations look nearly identical to neural networks in a mammalian brain.",
          "Finally, we reach the edge: the Observable Universe (8.8 × 10²⁶ m, or 93 billion light-years across). Why 93 billion light-years if the cosmos is 13.8 billion years old? Because the fabric of space has been expanding like baking dough since the Big Bang."
        ],
        callout: {
          tag: "The Cheat Sheet",
          title: "The 62-Order-of-Magnitude Ladder",
          text: "10⁻³⁵ m (Planck Length) → 10⁻¹⁰ m (Atom) → 10⁰ m (Human: The Geometric Midpoint!) → 10⁹ m (Sun) → 10²¹ m (Milky Way) → 10²⁵ m (Cosmic Web) → 10²⁷ m (Observable Universe).",
        },
        quote: "We are the universe's way of thinking about itself: atoms that woke up, built mirrors, and marveled at the light.",
      },
      {
        heading: "6. Beyond the Edge: Multiverse, Xenoverse & The Truly Weird",
        image: {
          src: "/images/blog/scale/multiverse-bubbles.jpg",
          alt: "Luminous bubble universes floating in a hyperdimensional multiverse",
          caption: "Beyond the horizon: What if our entire 93-billion-light-year bubble is just a single drop in an infinite cosmic ocean?",
        },
        body: [
          "What happens if we keep zooming out past the 93-billion-light-year horizon? Direct observation ends, and theoretical physics takes us down the rabbit hole of speculative cosmology.",
          "• The Multiverse & Bubble Universes: In eternal cosmic inflation, space expands exponentially forever. Certain regions stop inflating and condense into isolated 'bubble universes' floating like carbonation in a champagne glass. Some bubbles share our physics; others have completely different constants of nature.",
          "• Parallel Universes (Quantum Many-Worlds): According to Everettian quantum mechanics, the wavefunction never collapses. Whenever a quantum particle faces multiple potential pathways, reality branches into parallel, non-communicating timelines. In one branch, you wore green socks today; in another, dinosaurs never went extinct.",
          "• The Xenoverse (Alien Physics): A xenoverse refers to universes governed by fundamentally alien laws — realms with 7 macroscopic spatial dimensions, negative gravity, or non-Euclidean mathematics where atoms cannot even form.",
          "• The Metaverse & Simulation Theory: What if realities can be computationally nested? Nick Bostrom's simulation argument points out that if advanced civilizations can run ancestor simulations, simulated minds vastly outnumber biological ones. We might be running inside a hyperdimensional supercomputer.",
          "• The Omniverse: The philosophical ceiling of cosmology: the totality of every conceivable multiverse, xenoverse, mathematical structure, and dimension. If an idea is mathematically consistent (Max Tegmark's Level IV), somewhere in the omniverse, it exists.",
          "• Other Weird Relics: Theoretical physicists have proposed even wilder concepts: The Holographic Principle (our 3D universe is a 2D projection encoded on the cosmic horizon), Boltzmann Brains (lone conscious minds spontaneously fluctuating out of thermal chaos), and Ekpyrotic Brane Collisions (string-theory membranes colliding like cymbals to trigger periodic Big Bangs).",
        ],
        callout: {
          tag: "Cosmic Hierarchy",
          title: "From Universe to Omniverse",
          text: "Observable Universe (Our 93B ly bubble) → Multiverse (Sea of bubble universes) → Xenoverse (Universes with alien physics) → Omniverse (The totality of all possible existence).",
        },
        quote: "The universe is not only stranger than we imagine; it is stranger than we can imagine.",
      },
      {
        heading: "7. Summary: The 62-Order Journey at a Glance",
        image: {
          src: "/images/blog/scale/cosmic-ladder-infographic.jpg",
          alt: "Panoramic celestial continuum of stars, galaxies, and cosmic filaments",
          caption: "The cosmic tapestry: A sweeping panoramic continuum from stardust and nebulae to galaxies and filaments.",
        },
        body: [
          "Traversing 62 orders of magnitude reveals a cosmic truth: reality is not a steady continuum, but an extraordinary hierarchy of emptiness and emergent complexity.",
          "• The Quantum Basement (10⁻³⁵ to 10⁻¹⁰ m): Spacetime pixelates at the Planck length. If an atom were enlarged to a cathedral, the nucleus is a solitary housefly and the electrons are ghosts at the stained-glass walls. Everything you touch is 99.9999999% vacuum held apart by electrostatic force.",
          "• The Human Midpoint (10⁻⁴ to 10⁰ m): A single grain of sand contains more Planck lengths than planet Earth has grains of sand. On the logarithmic ladder from 10⁻³⁵ m to 10²⁷ m, humans (~1.7 m) sit right at the geometric center (~10⁻⁴ m). You are not in the basement of creation; you occupy the penthouse of complexity right in the middle.",
          "• The Solar Emptiness (10⁷ to 10¹³ m): Space is mostly vast, echoing nothingness. Shrinking the Sun to a single red blood cell puts Earth at 85 centimeters away, while the closest star system is a lone blood cell floating 230 kilometers away in another city.",
          "• The Cosmic Macrocosm (10²¹ to 10²⁷ m): Shrink our planetary system to a coin, and the Milky Way spans the North American continent. Zoom out to billions of light-years, and gravity weaves all galaxies into a Cosmic Web resembling brain neurons, spanning an expanding 93-billion-light-year observable bubble.",
          "• Beyond the Horizon (Multiverse & Omniverse): Our 93-billion-light-year realm may be just one bubble among infinite multiverses, parallel quantum branches, simulated realities, and the all-encompassing omniverse.",
          "Next time you look up at the night sky and feel tiny, remember: you are not an insignificant spectator. To an atom, you are an impossibly gigantic universe. To the universe, you are an impossibly clever atom — stardust that woke up, built instruments, and learned to measure the cosmos from end to end.",
        ],
        callout: {
          tag: "Core Takeaway",
          title: "The Golden Rule of Cosmic Scale",
          text: "Logarithmically, a human being sits almost exactly in the center of the universe's scales. We are the bridge between the quantum foam and the cosmic web — complex enough to think, yet small enough to marvel.",
        },
        quote: "To the atom, you are an impossibly vast universe. To the universe, you are an impossibly clever atom.",
      },
    ],
  },
  {
    id: "the-cosmic-calendar",
    title: "The Cosmic Calendar",
    excerpt:
      "If the entire 13.8-billion-year history of the universe were compressed into a standard 365-day calendar year, Earth doesn't form until September, dinosaurs die on December 30th, and all of recorded human history fits into the final ten seconds before midnight.",
    tags: ["Cosmology", "Carl Sagan", "Popular Science", "Cosmic Calendar"],
    date: "2026-11-01",
    accent: "olive",
    featured: true,
    category: "Cosmology",
    coverImage: {
      src: "/images/blog/calendar/cosmic-calendar-cover.jpg",
      alt: "12-month Cosmic Calendar grid floating in deep space tracing 13.8 billion years from the Big Bang to modern Earth",
      caption: "The Cosmic Calendar: 13.8 billion years compressed into a 12-month cosmic year, from January's Big Bang to December's living Earth.",
    },
    sections: [
      {
        heading: "1. January to August: The Cosmic Spring & Summer (The Slow Simmer)",
        image: {
          src: "/images/blog/calendar/section1-cosmic-cliffs.jpg",
          alt: "James Webb Space Telescope Cosmic Cliffs showing glittering landscape of infant stars and cosmic gas clouds",
          caption: "Cosmic dawn to the Milky Way: The James Webb Space Telescope reveals towering cosmic cliffs where infant stars ignite across billions of light-years.",
        },
        body: [
          "In the 1970s, Carl Sagan popularised an ingenious mental hack: squeeze the entire history of the cosmos into a standard 365-day calendar year. The Big Bang erupts at the very first stroke of midnight on January 1st, and the present moment arrives at 11:59:59 PM on December 31st.",
          "On this cosmic scale, time moves at a blistering pace: each second is about 437.6 years. An hour swallows 1.58 million years. A single day evaporates 37.8 million years. And a single month spans roughly 1.15 billion years.",
          "Here is the first shock: for the first eight months of the cosmic year, Earth doesn't even exist. January 1st detonates the Big Bang, bathing the cosmos in pure radiation. By January 6th (13.6 billion years ago), the first stars ignite in the Cosmic Dawn. On March 16th (11 billion years ago), the Milky Way galaxy forms. By April 12th (10 billion years ago), the cosmos reaches 'Cosmic Noon'—the absolute historical peak of universal star formation. And on August 22nd (5 billion years ago), dark energy begins accelerating the expansion of space.",
        ],
        callout: {
          tag: "Mental Model 01",
          title: "The Cosmic Conversion Rate",
          text: "1 Second = 437.6 Years | 1 Minute = 26,256 Years | 1 Hour = 1.58 Million Years | 1 Day = 37.8 Million Years | 1 Month = 1.15 Billion Years.",
        },
        table: {
          title: "The Cosmic Conversion Scale",
          caption: "How cosmic calendar units translate into universal time across 13.8 billion years (1 second ≈ 437.6 years).",
          headers: ["Cosmic Unit", "Duration in Universe Years", "Approximation"],
          rows: [
            ["**1 Cosmic Second**", "437.6 years", "~437.6 years"],
            ["**1 Cosmic Minute**", "26,256 years", "~26.3 thousand years"],
            ["**1 Cosmic Hour**", "1,575,342 years", "~1.58 million years"],
            ["**1 Cosmic Day**", "37,808,219 years", "~37.81 million years"],
            ["**1 Cosmic Month**", "1,150,000,000 years", "~1.15 billion years"],
            ["**1 Cosmic Year**", "13,800,000,000 years", "~13.8 billion years"],
          ],
        },
        quote: "If the universe were a 12-episode streaming epic, planet Earth doesn't even get cast until Episode 9.",
      },
      {
        heading: "2. September to November: Earth Arrives & Life Takes a Two-Month Nap",
        image: {
          src: "/images/blog/calendar/section2-precambrian-earth.jpg",
          alt: "Serene primeval Archean and Proterozoic landscape with emerging stromatolite reefs, crystal turquoise oceans, and luminous infant Moon",
          caption: "September to November: The primeval Precambrian Earth cools, creating turquoise oceans, biogenic stromatolite reefs, and oxygenating skies.",
        },
        body: [
          "Finally, autumn arrives. On September 3rd (4.54 billion years ago), our Sun ignites, and gravity herds rocky leftovers into planet Earth and our planetary system. Just one day later, on September 4th (4.50 billion years ago), a Mars-sized body collides with infant Earth in the [Giant Impact Hypothesis](https://en.wikipedia.org/wiki/Giant-impact_hypothesis), ejecting the debris that rapidly coalesces into our Moon.",
          "By September 7th (4.4 billion years ago), liquid oceans condense across Earth's cooling surface, locking away the oldest terrestrial relics—the [Jack Hills](https://en.wikipedia.org/wiki/Jack_Hills) zircons. Then, on September 22nd (3.8 billion years ago), primitive single-celled prokaryotic microbes stir around hydrothermal vents. Earth's geodynamo establishes a protective magnetic shield on September 25th, the first stable continental cratons stabilise on September 28th, and stromatolites construct the first biogenic reefs by September 30th.",
          "And then, life takes an apparent two-month nap. October and November are famously called the 'Boring Billion.' Yet quiet revolutions are brewing beneath the waves. On October 8th (3.2 billion years ago), cyanobacteria pioneer oxygenic photosynthesis, triggering the transformative [Great Oxidation Event](https://en.wikipedia.org/wiki/Great_Oxidation_Event) on October 30th (2.4 billion years ago).",
          "This atmospheric shift triggers the [Huronian Snowball Earth glaciation](https://en.wikipedia.org/wiki/Huronian_glaciation) on November 1st, followed by the formation of Earth's stratospheric ozone shield on November 9th. On November 14th (1.8 billion years ago), cells accomplish evolution's greatest endosymbiotic merger: eukaryotic cells emerge. [Supercontinent Columbia (Nuna)](https://en.wikipedia.org/wiki/Columbia_(supercontinent)) forms on November 20th, and by November 30th (1.2 billion years ago), the first multicellular organisms arise.",
        ],
        callout: {
          tag: "Mental Model 02",
          title: "Earth Is a September Baby",
          text: "Sept 3: Earth forms | Sept 4: Moon forms | Sept 7: Liquid oceans condense | Sept 22: First microbial life | Oct 30: Great Oxidation Event | Nov 14: Eukaryotic cells emerge | Nov 30: Multicellular life.",
        },
        quote: "Life wasted no time waking up on Earth — but once awake, it spent two cosmic months taking an uninterrupted nap.",
      },
      {
        heading: "3. December: The Holiday Rush of Complex Life & Dinosaurs",
        image: {
          src: "/images/blog/calendar/section3-prehistoric-life-dinosaurs.jpg",
          alt: "Lush Mesozoic valley with giant prehistoric ferns, cycads, winding river, and majestic sauropod dinosaurs under morning sunlight",
          caption: "December: The explosion of complex life — from lush primeval Carboniferous forests to the golden age of dinosaurs roaming ancient valleys.",
        },
        body: [
          "On December 2nd, [supercontinent Rodinia](https://en.wikipedia.org/wiki/Rodinia) amalgamates. On December 13th, the severe [Cryogenian Snowball Earth glaciations](https://en.wikipedia.org/wiki/Cryogenian) blanket the globe. As the thaw arrives, the [Ediacaran biota](https://en.wikipedia.org/wiki/Ediacaran_biota) (the first macroscopic animals) appear on December 16th, followed on December 17th by the famous [Cambrian Explosion](https://en.wikipedia.org/wiki/Cambrian_explosion), filling oceans with trilobites, mineralized shells, and compound eyes.",
          "The milestones now cascade with dizzying speed: land plants and fungi invade the continents on December 19th during the [Great Ordovician Biodiversification Event (GOBE)](https://en.wikipedia.org/wiki/Great_Ordovician_Biodiversification_Event). The [Late Ordovician Mass Extinction](https://en.wikipedia.org/wiki/Late_Ordovician_mass_extinction) (the 1st of the Big Five) strikes on December 20th, followed that evening by the first land insects. Complex [Archaeopteris](https://en.wikipedia.org/wiki/Archaeopteris) forests rise on December 21st, and on December 22nd, tetrapods take their first vertebrate steps onto dry land, navigating the [Late Devonian Mass Extinction](https://en.wikipedia.org/wiki/Late_Devonian_mass_extinction) (the 2nd of the Big Five).",
          "[Supercontinent Pangaea](https://en.wikipedia.org/wiki/Pangaea) forms on December 23rd as Carboniferous coal forests flourish and reptiles emerge. Oxygen reaches a staggering 35% on Christmas Eve (December 24th). Then, on Christmas morning (December 25th), the devastating [Permian-Triassic Extinction](https://en.wikipedia.org/wiki/Permian%E2%80%93Triassic_extinction_event) ('The Great Dying'—the 3rd and deadliest mass extinction) wipes out 95% of marine life. By Christmas evening, the first dinosaurs and early mammals step into the vacant niches.",
          "The [Triassic-Jurassic Extinction](https://en.wikipedia.org/wiki/Triassic%E2%80%93Jurassic_extinction) (the 4th of the Big Five) clears competitors on December 26th. Pangaea begins rifting apart on December 27th, and the first birds and flowering plants appear on December 28th. Finally, on December 30th, the 10-kilometer [Chicxulub asteroid](https://en.wikipedia.org/wiki/Chicxulub_crater) slams into the [Yucatán](https://en.wikipedia.org/wiki/Yucat%C3%A1n_Peninsula), ending the non-avian dinosaurs and handing Earth to mammals, which is known as the [Cretaceous–Paleogene (K–Pg) Extinction](https://en.wikipedia.org/wiki/Cretaceous%E2%80%93Paleogene_extinction_event), while India begins colliding with Asia that afternoon to thrust up the [Himalayas](https://en.wikipedia.org/wiki/Himalayas).",
        ],
        callout: {
          tag: "Mental Model 03",
          title: "The December Sprint",
          text: "Dec 17: Cambrian Explosion → Dec 20: 1st Mass Extinction → Dec 22: Tetrapods on land → Dec 25: The Great Dying & Dinosaurs appear → Dec 30: Asteroid impact.",
        },
        quote: "Dinosaurs roamed Earth for five full cosmic days. Humanity's entire existence is just a fleeting coffee break at the end of the year.",
      },
      {
        heading: "4. December 31st: The Final Midnight Countdown (Where Humans Show Up)",
        image: {
          src: "/images/blog/calendar/section4-human-history-timeline.jpg",
          alt: "Panoramic timeline of human civilisation from Stone Age fire, ancient Egyptian pyramids, classical Greece, Islamic Golden Age astronomy, European sailing voyages, to the Industrial Revolution",
          caption: "December 31st, The Final 60 Seconds: A panoramic journey across human history — from Stone Age campfires and Egyptian pyramids to classical Greece, the Islamic Golden Age of science, European voyages, and the Industrial Revolution.",
        },
        body: [
          "Welcome to New Year's Eve: December 31st. All of mammalian radiation has been unspooling for 24 hours, yet humans are still nowhere to be seen.",
          "At 9:00 PM, early hominids like Australopithecus stand upright on the African savannah. At 11:54 PM, modern Homo sapiens finally arrives. If the cosmic year is a 24-hour party, we walked in six minutes before the fireworks.",
          "Now look at the exact countdown of the final minutes and seconds before midnight:",
          "• 11:58:17 PM (1 min 43 sec ago / 45,000 yr): First cave paintings and figurative art appear across Europe and Indonesia.",
          "• 11:59:30 PM (30 sec ago / 12,800 yr): The [Younger Dryas](https://en.wikipedia.org/wiki/Younger_Dryas) abrupt climate cold snap shakes prehistoric hunter-gatherers.",
          "• 11:59:32 PM (28 sec ago / 12,000 yr): Invention of agriculture ([Neolithic Revolution](https://en.wikipedia.org/wiki/Neolithic_Revolution)); humans domesticate wheat, barley, and cattle.",
          "• 11:59:49 PM (11 sec ago / 5,000 yr): First cities emerge in Sumer; the invention of cuneiform writing marks the dawn of recorded history.",
          "• 11:59:50 PM (10 sec ago / 4,500 yr): Construction of the Great Pyramid of Giza under Pharaoh Khufu.",
          "• 11:59:57 PM (3 seconds ago / 1,200 yr): The [Islamic Golden Age](https://en.wikipedia.org/wiki/Islamic_Golden_Age) peaks; mathematicians, astronomers, and physicians preserve and advance Greek science while developing algebra, chemistry, optics, and algorithms.",
          "• 11:59:59 PM (1 sec ago / 500 yr): The Gutenberg printing press, the [European Renaissance](https://en.wikipedia.org/wiki/Renaissance), and the birth of modern scientific physics.",
          "• 11:59:59 PM (half a second ago / 250 yr): The [Industrial Revolution](https://en.wikipedia.org/wiki/Industrial_Revolution) begins; steam engines, electrification, the nuclear age, computing, and space exploration.",
          "• 00:00:00 AM (now / 0 yr): Present day.",
        ],
        callout: {
          tag: "Mental Model 04",
          title: "The Ten-Second Civilisation",
          text: "All written history — every empire, philosopher, battle, religion, song, and scientific discovery — took place in the last 11 seconds of December 31st.",
        },
        quote: "Every king, peasant, warrior, lover, and explorer who ever lived lived in the final eleven seconds before the cosmic countdown ended.",
      },
      {
        heading: "5. The Master Chronology: 50 Milestones Across 13.8 Billion Years",
        image: {
          src: "/images/blog/calendar/cosmic-calendar-grid-alt.jpg",
          alt: "The Complete Cosmic Calendar chronology grid linking astronomical deep time to human civilisation",
          caption: "The Master Chronology: 50 pivotal astronomical, geological, evolutionary, and civilisational events mapped onto the 365-day Cosmic Calendar.",
        },
        body: [
          "To experience the full perspective of cosmic deep time, here is the complete 50-milestone master chronology. Every event has been converted with mathematical precision from years ago into its exact calendar date, hour, minute, and second.",
          "Notice the rhythm of cosmic history: the universe spends eight months in quiet cosmic gestation and star formation, three months quietly incubating single-celled life in the oceans, and less than one month developing all animals, plants, and dinosaurs. All of human civilisation occupies only the final seconds of the year.",
        ],
        table: {
          title: "Cosmic Timeline Master Index",
          caption: "Calculated on a standard 365-day cosmic year (1 second ≈ 437.6 years, 1 hour ≈ 1.58 million years, 1 day ≈ 37.8 million years).",
          headers: ["Event", "Time (Years Ago)", "Cosmic Calendar Date"],
          rows: [
            ["Big Bang", "13,800,000,000 yr", "January 01"],
            ["First stars ignite (Cosmic Dawn)", "13,600,000,000 yr", "January 06"],
            ["Milky Way Galaxy forms", "11,000,000,000 yr", "March 16"],
            ["Cosmic Noon (Peak star formation in universe)", "10,000,000,000 yr", "April 12"],
            ["Dark energy accelerates cosmic expansion", "5,000,000,000 yr", "August 22"],
            ["Solar System & Earth form", "4,540,000,000 yr", "September 03"],
            ["Formation of the Moon (Giant impact hypothesis)", "4,500,000,000 yr", "September 04"],
            ["Oldest terrestrial material (Jack Hills zircons)", "4,404,000,000 yr", "September 07"],
            ["First liquid oceans condense on Earth", "4,400,000,000 yr", "September 07"],
            ["First microbial life (origin of life on Earth)", "3,800,000,000 yr", "September 22"],
            ["Earth magnetic shield / geodynamo establishes", "3,700,000,000 yr", "September 25"],
            ["First stable continental crusts / cratons form", "3,600,000,000 yr", "September 28"],
            ["Stromatolites build earliest biogenic reefs", "3,500,000,000 yr", "September 30"],
            ["Origin of oxygenic photosynthesis (cyanobacteria)", "3,200,000,000 yr", "October 08"],
            ["Great Oxidation Event (Atmosphere oxygenates)", "2,400,000,000 yr", "October 30"],
            ["Huronian Glaciation (first global Snowball Earth)", "2,300,000,000 yr", "November 01"],
            ["Earth stratospheric ozone layer forms", "2,000,000,000 yr", "November 09"],
            ["First eukaryotic cells (complex cells)", "1,800,000,000 yr", "November 14"],
            ["Supercontinent Columbia (Nuna) forms", "1,600,000,000 yr", "November 20"],
            ["First multicellular organisms", "1,200,000,000 yr", "November 30"],
            ["Supercontinent Rodinia amalgamates", "1,100,000,000 yr", "December 02, evening"],
            ["Cryogenian Snowball Earth (Sturtian/Marinoan)", "717,000,000 yr", "December 13, morning"],
            ["Ediacaran biota (first macroscopic animals)", "575,000,000 yr", "December 16, evening"],
            ["Cambrian Explosion (rapid animal diversification)", "538,000,000 yr", "December 17, evening"],
            ["First land plants & mycorrhizal fungi", "470,000,000 yr", "December 19, afternoon"],
            ["Great Ordovician Biodiversification Event (GOBE)", "467,000,000 yr", "December 19, afternoon"],
            ["Late Ordovician Mass Extinction (1st of Big Five)", "444,000,000 yr", "December 20, morning"],
            ["First insects and land arthropods", "420,000,000 yr", "December 20, evening"],
            ["First complex forests emerge (Archaeopteris)", "385,000,000 yr", "December 21, evening"],
            ["First tetrapods (vertebrates move onto land)", "375,000,000 yr", "December 22, morning"],
            ["Late Devonian Mass Extinction (2nd of Big Five)", "372,000,000 yr", "December 22, morning"],
            ["Supercontinent Pangaea forms", "335,000,000 yr", "December 23, morning"],
            ["Carboniferous coal forests & first reptiles", "310,000,000 yr", "December 23, evening"],
            ["Atmospheric oxygen peaks at ~35% in Carboniferous", "300,000,000 yr", "December 24, morning"],
            ["Permian-Triassic Extinction (The Great Dying / 3rd)", "252,000,000 yr", "December 25, morning"],
            ["First dinosaurs and early mammals appear", "230,000,000 yr", "December 25, evening"],
            ["Triassic-Jurassic Mass Extinction (4th of Big Five)", "201,000,000 yr", "December 26, afternoon"],
            ["Pangaea supercontinent begins breaking apart", "175,000,000 yr", "December 27, morning"],
            ["First birds (Archaeopteryx)", "150,000,000 yr", "December 28, morning"],
            ["First flowering plants (Angiosperms)", "130,000,000 yr", "December 28, afternoon"],
            ["Chicxulub impact & K-Pg Extinction (5th of Big Five)", "66,000,000 yr", "December 30, morning"],
            ["India collides with Asia (Himalayas begin rising)", "50,000,000 yr", "December 30, afternoon"],
            ["First cave paintings and figurative art", "45,000 yr", "December 31, 23:58:17 (1 minute 43 seconds ago)"],
            ["Younger Dryas abrupt climate cold snap", "12,800 yr", "December 31, 23:59:30 (30 seconds ago)"],
            ["Invention of agriculture (Neolithic Revolution)", "12,000 yr", "December 31, 23:59:32 (28 seconds ago)"],
            ["First cities and invention of writing", "5,000 yr", "December 31, 23:59:49 (11 seconds ago)"],
            ["Construction of the Great Pyramid of Giza", "4,500 yr", "December 31, 23:59:50 (10 seconds ago)"],
            ["Islamic Golden Age", "1,200 yr", "December 31, 23:59:57 (3 seconds ago)"],
            ["Printing press & Scientific Revolution", "500 yr", "December 31, 23:59:59 (1 second ago)"],
            ["Industrial Revolution begins", "250 yr", "December 31, 23:59:59 (half a second ago)"],
            ["Present day", "0 yr", "New Year, 00:00:00"],
          ],
        },
        callout: {
          tag: "Interactive Chronology",
          title: "Exploring the Timeline",
          text: "Filter by epoch (Cosmic Dawn, Precambrian Earth, Dinosaurs, or Human Civilisation) or search for specific extinction events, fossils, and civilisations using the interactive controls above.",
        },
        quote: "The cosmos is within us. We are made of star-stuff. We are a way for the cosmos to know itself.",
      },
      {
        heading: "6. Summary & Epilogue: What Does a Cosmic Second Mean for You?",
        image: {
          src: "/images/blog/calendar/section5-deep-field.jpg",
          alt: "Hubble and Webb Deep Field showing thousands of ancient galaxies stretching across cosmic time",
          caption: "A 0.18-second life in a 13.8-billion-year cosmos: We are fleeting observers looking back into the deep ocean of time.",
        },
        body: [
          "Carl Sagan's Cosmic Calendar is both the ultimate exercise in humility and the ultimate badge of wonder. When you look at the master timeline, the perspective is staggering:",
          "• Jan 1 (00:00:00): The Big Bang ignites matter, space, and time.",
          "• March 16: The Milky Way forms from ancient swirling gas.",
          "• Sept 3: The Sun and Earth coalesce from cosmic dust.",
          "• Sept 22: Earliest single-celled microbial life stirs in the oceans.",
          "• Nov 14: Cells evolve complex nuclei and mitochondria.",
          "• Nov 30: Multicellular organisms appear.",
          "• Dec 17: The Cambrian Explosion fills the seas with complex animals.",
          "• Dec 25: Dinosaurs take over the continents.",
          "• Dec 30: Asteroid impact ends the dinosaur era.",
          "• Dec 31 (11:54 PM): Anatomically modern humans emerge in Africa.",
          "• Dec 31 (11:59:48 PM): Recorded human history begins with the first written words.",
          "• Dec 31 (11:59:59 PM): Modern technology, global civilisation, and space travel.",
          "Now consider your own life. If you live to be 80 years old, your entire earthly existence spans approximately 0.18 cosmic seconds. That is less than the blink of an eye.",
          "Yet here is the breathtaking twist: in that 0.18 seconds, you are made of atoms forged inside supernovae that exploded back in July, bound by organic molecules brewed in September, carried by DNA honed across December. We are tiny, brief, and fragile — but we are the universe waking up, reading its own calendar, and understanding the clock.",
        ],
        callout: {
          tag: "The Golden Takeaway",
          title: "The Perspective Paradox",
          text: "Your entire 80-year lifespan is just 0.18 cosmic seconds. But in those 0.18 seconds, you hold the consciousness of a 13.8-billion-year-old cosmos.",
        },
        quote: "We are a way for the cosmos to know itself. In a single cosmic second, don't forget to look up at the stars.",
      },
    ],
  },
];

export const POSTS: Post[] = RAW_POSTS.map((post) => {
  const characterCount = calculateArticleCharacters(post.sections);
  const readTime = calculateReadTime(post.sections);
  const enrichedSections = post.sections?.map((section) => ({
    ...section,
    characterCount: calculateSectionCharacters(section),
    readTime: calculateSectionReadTime(section),
  }));

  return {
    ...post,
    characterCount,
    readTime,
    sections: enrichedSections,
  };
});

export const CATEGORIES = Array.from(new Set(POSTS.map((p) => p.category)));
