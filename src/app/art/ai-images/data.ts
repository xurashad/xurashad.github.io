/* ─── AI Image Generations Data ─────────────────────────────────────────────
 *  Edit this file to add/update image posts.
 *  Each post can have multiple images (multi-image post).
 *  Only filled-in optional fields will be displayed in the detail view.
 * ────────────────────────────────────────────────────────────────────────── */

export interface ImagePost {
  id: string;
  title: string;
  description?: string;
  images: string[];          // Array of image paths — first one is the thumbnail
  tags: string[];
  model: string;
  prompt?: string;
  date: string;              // ISO date for sorting, e.g. "2025-01-15"
  // Optional metadata — displayed only when present
  negativePrompt?: string;
  seed?: string;
  steps?: number;
  cfg?: number;
  sampler?: string;
  width?: number;
  height?: number;
}

export const IMAGE_POSTS: ImagePost[] = [
  {
    id: "img-001",
    title: "Untitled #1",
    images: ["/art/ai_img/0000000001.webp"],
    tags: ["AI Art"],
    model: "DALL-E",
    date: "2025-03-27",
  },
  {
    id: "img-002",
    title: "Untitled #2",
    images: ["/art/ai_img/0000000002.webp"],
    tags: ["AI Art"],
    model: "DALL-E",
    date: "2025-03-27",
  },
  {
    id: "img-003",
    title: "Untitled #3",
    images: ["/art/ai_img/0000000003.jpeg"],
    tags: ["AI Art"],
    model: "Designer",
    prompt: "Create a visual representation of Palestine where the colors of its flag blend with the forms of olive trees. A stylized map of Palestine is subtly integrated. Include the 'key of return' as a prominent symbol, perhaps held by figures representing refugees. The image should evoke resistance and the powerful yearning for freedom, with Jerusalem as a distant, radiant focal point.",
    date: "2025-05-10",
  },
  {
    id: "img-004",
    title: "Untitled #4",
    images: ["/art/ai_img/0000000004.jpeg"],
    tags: ["AI Art"],
    model: "Designer",
    prompt: "A surreal digital painting of a glowing olive tree growing from ashes, roots like embers, branches as hands holding stones. Background: fragmented cities (Gaza rubble, Jenin murals). Silhouettes of Palestinians transforming into doves. Flag of Palestine, Dome of the Rock. Sunset with gold light. Earthy tones, fiery oranges, keffiyeh-patterned sky. Style: symbolic realism, hope-in-ruins.",
    date: "2025-03-06",
  },
  {
    id: "img-005",
    title: "Untitled #5",
    images: ["/art/ai_img/0000000005.png"],
    tags: ["AI Art"],
    model: "Nano Banana",
    date: "2025-11-27",
  },
  {
    id: "img-006",
    title: "Untitled #6",
    images: ["/art/ai_img/0000000006.png"],
    tags: ["AI Art"],
    model: "Nano Banana",
    date: "2025-11-27",
  },
  {
    id: "img-007",
    title: "Untitled #7",
    images: ["/art/ai_img/0000000007.jpeg"],
    tags: ["AI Art"],
    model: "Designer",
    prompt: "A dark and ominous anime-style photo of a red glowing flames, black hole with a cloudy big disk and red gamma rays. The background is a dark-red smoky scene with fire particles and a starry sky, red nebulae, and planets. The lighting should be dim and the color scheme should be red and black.",
    date: "2024-08-18",
  },
  {
    id: "img-008",
    title: "Untitled #8",
    images: ["/art/ai_img/0000000008.jpeg"],
    tags: ["AI Art"],
    model: "Designer",
    prompt: "A dark and ominous anime-style photo of a red glowing flames, black hole with a cloudy big disk and red gamma rays. The background is a dark-red smoky scene with fire particles and a starry sky, red nebulae, and planets. The lighting should be dim and the color scheme should be red and black.",
    date: "2024-08-18",
  },
  {
    id: "img-009",
    title: "Untitled #9",
    images: ["/art/ai_img/0000000009.jpeg"],
    tags: ["AI Art"],
    model: "Designer",
    prompt: "A dark and ominous anime-style photo of a red glowing flames, black hole with a cloudy big disk and red gamma rays. The background is a dark-red smoky scene with fire particles and a starry sky, red nebulae, and planets. The lighting should be dim and the color scheme should be red and black.",
    date: "2024-08-18",
  },
  {
    id: "img-010",
    title: "Untitled #10",
    images: ["/art/ai_img/0000000010.jpeg"],
    tags: ["AI Art"],
    model: "Designer",
    prompt: "A dark and ominous anime-style photo of a red glowing flames, black hole with a cloudy big disk and red gamma rays. The background is a dark-red smoky scene with fire particles and a starry sky, red nebulae, and planets. The lighting should be dim and the color scheme should be red and black.",
    date: "2024-08-18",
  },
  {
    id: "img-011",
    title: "Untitled #11",
    images: ["/art/ai_img/0000000011.jpeg"],
    tags: ["AI Art"],
    model: "Designer",
    prompt: "Design me a wallpaper with magical bioluminescent lights that represents Palestine, Science, and Philosophy. Colours are a violet-blue gradient that gives the vibe of astro-celestial vibe.",
    date: "2025-10-13",
  },
  {
    id: "img-012",
    title: "Untitled #12",
    images: ["/art/ai_img/0000000012.jpeg"],
    tags: ["AI Art"],
    model: "Designer",
    prompt: "A photorealistic ominous background of something represents integrability theory in particle physics, particle collisions, standard model, cosmology, dark energy and matter, and gravity.",
    date: "2024-08-03",
  },
  {
    id: "img-013",
    title: "Untitled #13",
    images: ["/art/ai_img/0000000013.jpeg"],
    tags: ["AI Art"],
    model: "Designer",
    prompt: "A breathtaking, close-up view of an ancient, emerald forest. The trees are impossibly tall, their branches intertwining to form a dense, glowing green canopy that filters the sunlight into shafts of pure light. The forest floor is a riot of vibrant, luminous mosses and ferns, with exotic, bioluminescent flowers blooming in impossible colors. Giant, twisted roots rise from the earth like natural sculptures, draped in shimmering, dew-kissed cobwebs. Tiny, crystal-winged insects buzz around the light shafts, and in the distance, a waterfall of pure liquid light cascades into a hidden pool, surrounded by shimmering moonpetal lilies.",
    date: "2025-06-24",
  },
  {
    id: "img-014",
    title: "Untitled #14",
    images: ["/art/ai_img/0000000014.png"],
    tags: ["AI Art"],
    model: "Nano Banana",
    date: "2026-03-13",
  },
  {
    id: "img-015",
    title: "Untitled #15",
    images: ["/art/ai_img/0000000015.png"],
    tags: ["AI Art"],
    model: "Nano Banana",
    date: "2026-03-13",
  },
  {
    id: "img-016",
    title: "Untitled #16",
    images: ["/art/ai_img/0000000016.png"],
    tags: ["AI Art"],
    model: "Nano Banana",
    date: "2026-03-13",
  },
  {
    id: "img-017",
    title: "Untitled #17",
    images: ["/art/ai_img/0000000017.png"],
    tags: ["AI Art"],
    model: "Nano Banana",
    date: "2026-03-13",
  },
  {
    id: "img-018",
    title: "Untitled #18",
    images: ["/art/ai_img/0000000018.png"],
    tags: ["AI Art"],
    model: "Nano Banana",
    date: "2026-03-13",
  },
  {
    id: "img-019",
    title: "Untitled #19",
    images: ["/art/ai_img/0000000019.png"],
    tags: ["AI Art"],
    model: "Nano Banana",
    date: "2026-03-13",
  },
  {
    id: "img-020",
    title: "Untitled #20",
    images: ["/art/ai_img/0000000020.png"],
    tags: ["AI Art"],
    model: "Nano Banana",
    date: "2026-03-13",
  },
  {
    id: "img-021",
    title: "Untitled #21",
    images: ["/art/ai_img/0000000021.png"],
    tags: ["AI Art"],
    model: "Nano Banana",
    prompt: "A hauntingly ethereal celestial mirage unfolding across a dark fantasy cosmos, where reality dissolves into a tapestry of bioluminescent wonder. Colossal, majestic planets with crystalline rings hang suspended amidst swirling nebulae of deep amethyst, royal violet, and electric cyan. Jagged pulses of high-energy gamma radiation streak through the void like cosmic lightning, illuminating translucent veils of stardust and radioactive auroras. The atmosphere is thick with a sense of ancient cosmic mystery, featuring intricate light-lattices and shimmering ethereal mists that glow with a cold, transcendent fire against the infinite shadow of the universe.",
    date: "2026-06-03",
  },
  {
    id: "img-022",
    title: "Untitled #22",
    images: ["/art/ai_img/0000000022.png"],
    tags: ["AI Art"],
    model: "DALL-E",
    prompt: "A hauntingly ethereal celestial mirage unfolding across a dark fantasy cosmos, where reality dissolves into a tapestry of bioluminescent wonder. Colossal, majestic planets with crystalline rings hang suspended amidst swirling nebulae of deep amethyst, royal violet, and electric cyan. Jagged pulses of high-energy gamma radiation streak through the void like cosmic lightning, illuminating translucent veils of stardust and radioactive auroras. The atmosphere is thick with a sense of ancient cosmic mystery, featuring intricate light-lattices and shimmering ethereal mists that glow with a cold, transcendent fire against the infinite shadow of the universe.",
    date: "2026-06-03",
  },
];
