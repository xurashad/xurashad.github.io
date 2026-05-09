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
    date: "2025-01-01",
  },
  {
    id: "img-002",
    title: "Untitled #2",
    images: ["/art/ai_img/0000000002.webp"],
    tags: ["AI Art"],
    model: "DALL-E",
    date: "2025-01-02",
  },
  {
    id: "img-003",
    title: "Untitled #3",
    images: ["/art/ai_img/0000000003.jpeg"],
    tags: ["AI Art"],
    model: "Designer",
    date: "2025-01-03",
  },
  {
    id: "img-004",
    title: "Untitled #4",
    images: ["/art/ai_img/0000000004.jpeg"],
    tags: ["AI Art"],
    model: "Designer",
    date: "2025-01-04",
  },
  {
    id: "img-005",
    title: "Untitled #5",
    images: ["/art/ai_img/0000000005.png"],
    tags: ["AI Art"],
    model: "Nano Banana",
    date: "2025-01-05",
  },
  {
    id: "img-006",
    title: "Untitled #6",
    images: ["/art/ai_img/0000000006.png"],
    tags: ["AI Art"],
    model: "Nano Banana",
    date: "2025-01-06",
  },
  {
    id: "img-007",
    title: "Untitled #7",
    images: ["/art/ai_img/0000000007.jpeg"],
    tags: ["AI Art"],
    model: "Designer",
    date: "2025-01-07",
  },
  {
    id: "img-008",
    title: "Untitled #8",
    images: ["/art/ai_img/0000000008.jpeg"],
    tags: ["AI Art"],
    model: "Designer",
    date: "2025-01-08",
  },
  {
    id: "img-009",
    title: "Untitled #9",
    images: ["/art/ai_img/0000000009.jpeg"],
    tags: ["AI Art"],
    model: "Designer",
    date: "2025-01-09",
  },
  {
    id: "img-010",
    title: "Untitled #10",
    images: ["/art/ai_img/0000000010.jpeg"],
    tags: ["AI Art"],
    model: "Designer",
    date: "2025-01-10",
  },
  {
    id: "img-011",
    title: "Untitled #11",
    images: ["/art/ai_img/0000000011.jpeg"],
    tags: ["AI Art"],
    model: "Designer",
    date: "2025-01-11",
  },
  {
    id: "img-012",
    title: "Untitled #12",
    images: ["/art/ai_img/0000000012.jpeg"],
    tags: ["AI Art"],
    model: "Nano Banana",
    date: "2025-01-12",
  },
  {
    id: "img-013",
    title: "Untitled #13",
    images: ["/art/ai_img/0000000013.jpeg"],
    tags: ["AI Art"],
    model: "Designer",
    date: "2025-01-13",
  },
  {
    id: "img-014",
    title: "Untitled #14",
    images: ["/art/ai_img/0000000014.png"],
    tags: ["AI Art"],
    model: "Nano Banana",
    date: "2025-01-14",
  },
  {
    id: "img-015",
    title: "Untitled #15",
    images: ["/art/ai_img/0000000015.png"],
    tags: ["AI Art"],
    model: "Nano Banana",
    date: "2025-01-15",
  },
  {
    id: "img-016",
    title: "Untitled #16",
    images: ["/art/ai_img/0000000016.png"],
    tags: ["AI Art"],
    model: "Nano Banana",
    date: "2025-01-16",
  },
  {
    id: "img-017",
    title: "Untitled #17",
    images: ["/art/ai_img/0000000017.png"],
    tags: ["AI Art"],
    model: "Nano Banana",
    date: "2025-01-17",
  },
  {
    id: "img-018",
    title: "Untitled #18",
    images: ["/art/ai_img/0000000018.png"],
    tags: ["AI Art"],
    model: "Nano Banana",
    date: "2025-01-18",
  },
  {
    id: "img-019",
    title: "Untitled #19",
    images: ["/art/ai_img/0000000019.png"],
    tags: ["AI Art"],
    model: "Nano Banana",
    date: "2025-01-19",
  },
  {
    id: "img-020",
    title: "Untitled #20",
    images: ["/art/ai_img/0000000020.png"],
    tags: ["AI Art"],
    model: "Nano Banana",
    date: "2025-01-20",
  },
  {
    id: "img-021",
    title: "Untitled #21",
    images: ["/art/ai_img/0000000021.jpeg"],
    tags: ["AI Art"],
    model: "Designer",
    date: "2025-01-21",
  },
  {
    id: "img-022",
    title: "Untitled #22",
    images: ["/art/ai_img/0000000022.jpeg"],
    tags: ["AI Art"],
    model: "Designer",
    date: "2025-01-22",
  },
  {
    id: "img-023",
    title: "Untitled #23",
    images: ["/art/ai_img/0000000023.jpeg"],
    tags: ["AI Art"],
    model: "Designer",
    date: "2025-01-23",
  },
  {
    id: "img-024",
    title: "Untitled #24",
    images: ["/art/ai_img/0000000024.jpeg"],
    tags: ["AI Art"],
    model: "Designer",
    date: "2025-01-24",
  },
  {
    id: "img-025",
    title: "Untitled #25",
    images: ["/art/ai_img/0000000025.jpeg"],
    tags: ["AI Art"],
    model: "Designer",
    date: "2025-01-25",
  },
  {
    id: "img-026",
    title: "Untitled #26",
    images: ["/art/ai_img/0000000026.jpeg"],
    tags: ["AI Art"],
    model: "Designer",
    date: "2025-01-26",
  },
  {
    id: "img-027",
    title: "Untitled #27",
    images: ["/art/ai_img/0000000027.jpeg"],
    tags: ["AI Art"],
    model: "Designer",
    date: "2025-01-27",
  },
  {
    id: "img-028",
    title: "Untitled #28",
    images: ["/art/ai_img/0000000028.jpeg"],
    tags: ["AI Art"],
    model: "Designer",
    date: "2025-01-28",
  },
];
