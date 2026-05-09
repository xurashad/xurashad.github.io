/* ─── AI Music Generations Data ─────────────────────────────────────────────
 *  Edit this file to add/update music tracks.
 *  Add thumbnail images to public/art/ai_music/ and reference them here.
 *  Only filled-in optional fields will be displayed in the detail view.
 * ────────────────────────────────────────────────────────────────────────── */

export interface MusicTrack {
  id: string;
  title: string;
  description?: string;
  audioSrc: string;
  thumbnail: string;         // Path to thumbnail image
  tags: string[];
  model: string;
  prompt?: string;
  date: string;              // ISO date for sorting
  duration?: string;         // e.g. "2:30"
  // Optional metadata — displayed only when present
  seed?: string;
  temperature?: number;
  style?: string;
}

export const MUSIC_TRACKS: MusicTrack[] = [
  {
    id: "track-001",
    title: "Levantine Mirage",
    audioSrc: "/art/ai_music/0000000001.mp3",
    thumbnail: "/art/ai_music/thumbnails/0000000001.png",
    tags: ["Arabic", "Celtic", "Oud", "Qanun", "Nay", "Celtic harp"],
    model: "flowmusic",
    prompt: "Relaxing fantasy music deeply rooted in traditional Palestinian Arabic sounds, accompanied by gentle Celtic undertones. Featuring prominent, beautiful melodies from the Oud, Qanun, and Nay, layered softly with a Celtic harp. Inspired by Levantine folklore and mystical landscapes, this music evokes the richness of nature and ancient heritage. The calm rhythms and soulful Middle Eastern melodies will transport you to a serene desert fantasy world. Peaceful, cinematic OST.",
    date: "2026-05-08",
  },
  {
    id: "track-002",
    title: "Ancient Sands & Emerald Isles",
    audioSrc: "/art/ai_music/0000000002.mp3",
    thumbnail: "/art/ai_music/thumbnails/0000000002.png",
    tags: ["Arabic", "Celtic", "Oud", "Qanun", "Nay", "Celtic harp"],
    model: "flowmusic",
    prompt: "Relaxing fantasy music deeply rooted in traditional Palestinian Arabic sounds, accompanied by gentle Celtic undertones. Featuring prominent, beautiful melodies from the Oud, Qanun, and Nay, layered softly with a Celtic harp. Inspired by Levantine folklore and mystical landscapes, this music evokes the richness of nature and ancient heritage. The calm rhythms and soulful Middle Eastern melodies will transport you to a serene desert fantasy world. Peaceful, cinematic OST.",
    date: "2026-05-08",
  },
  {
    id: "track-003",
    title: "Levantine Mystic Fantasy",
    audioSrc: "/art/ai_music/0000000003.mp3",
    thumbnail: "/art/ai_music/thumbnails/0000000003.png",
    tags: ["Arabic", "Celtic", "Oud", "Qanun", "Nay", "Celtic harp"],
    model: "flowmusic",
    prompt: "Relaxing fantasy music deeply rooted in traditional Palestinian Arabic sounds, accompanied by gentle Celtic undertones. Featuring prominent, beautiful melodies from the Oud, Qanun, and Nay, layered softly with a Celtic harp. Inspired by Levantine folklore and mystical landscapes, this music evokes the richness of nature and ancient heritage. The calm rhythms and soulful Middle Eastern melodies will transport you to a serene desert fantasy world. Peaceful, cinematic OST.",
    date: "2026-05-08",
  },
  {
    id: "track-004",
    title: "Ancient Sands & Harps",
    audioSrc: "/art/ai_music/0000000004.mp3",
    thumbnail: "/art/ai_music/thumbnails/0000000004.png",
    tags: ["Arabic", "Celtic", "Oud", "Qanun", "Nay", "Celtic harp"],
    model: "flowmusic",
    prompt: "Relaxing fantasy music deeply rooted in traditional Palestinian Arabic sounds, accompanied by gentle Celtic undertones. Featuring prominent, beautiful melodies from the Oud, Qanun, and Nay, layered softly with a Celtic harp. Inspired by Levantine folklore and mystical landscapes, this music evokes the richness of nature and ancient heritage. The calm rhythms and soulful Middle Eastern melodies will transport you to a serene desert fantasy world. Peaceful, cinematic OST.",
    date: "2026-05-08",
  },
];
