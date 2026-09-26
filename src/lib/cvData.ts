import rawCV from "../../public/cv/cv.json";
import type {
  CVData,
  ConsolidatedAwardGrant,
  CourseProject,
  CourseworkCategory,
  PersonalInfo,
} from "./cvTypes";

export const cvData = rawCV as unknown as CVData;

export const personalInfo: PersonalInfo = cvData.personal_info || {
  name: "Rashad Hamidi",
  name_ar: "رشاد حميدي",
  title: "PhD Researcher in Mathematical and Theoretical Physics",
  institution: "Durham University",
  department: "Department of Mathematical Sciences",
  location: cvData.links.location || "Gateshead, UK",
  email: cvData.links.email || "xurashad@gmail.com",
  website: cvData.links.website || "https://xurashad.github.io/",
  orcid: cvData.links.orcid || "0000-0002-0719-3269",
  inspirehep: cvData.links.inspirehep || "2915639",
};

export function getMonthName(monthStr: string | null | undefined): string {
  if (!monthStr) return "";
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  const idx = parseInt(monthStr, 10) - 1;
  return idx >= 0 && idx < 12 ? months[idx] : monthStr;
}

export function formatPeriod(
  startYear: string,
  startMonth?: string | null,
  endYear?: string | null,
  endMonth?: string | null,
  current?: boolean
): string {
  const start = startMonth ? `${getMonthName(startMonth)} ${startYear}` : startYear;
  if (current) return `${start} – Present`;
  if (!endYear) return start;
  const end = endMonth ? `${getMonthName(endMonth)} ${endYear}` : endYear;
  return `${start} – ${end}`;
}

export function getConsolidatedAwardsAndGrants(): ConsolidatedAwardGrant[] {
  if (cvData.awards_and_grants && cvData.awards_and_grants.length > 0) {
    return cvData.awards_and_grants;
  }

  // Fallback defaults
  return [
    {
      id: "stfc",
      title: "UKRI STFC PhD Studentship",
      organization: "Durham University · UKRI / STFC",
      period: "2022 – 2026",
      type: "grant",
      description: "Full doctoral research studentship funded by the Science and Technology Facilities Council (STFC) and UKRI.",
      accent: "quantum",
      sponsors: [
        "UK Research and Innovation (UKRI)",
        "Science and Technology Facilities Council (STFC)",
        "Durham University",
      ],
    },
    {
      id: "msc-distinction",
      title: "MSc Degree with Distinction",
      organization: "Durham University",
      period: "2022",
      type: "distinction",
      description: "Awarded Distinction in MSc in Particles, Strings and Cosmology.",
      accent: "quantum",
    },
    {
      id: "global-masters",
      title: "Global Masters Scholarship",
      organization: "Durham University",
      period: "2021 – 2022",
      type: "scholarship",
      description: "Highly competitive international merit scholarship covering tuition and stipend.",
      accent: "quantum",
      sponsors: ["Durham University", "Scott Logic", "Trevelyan College"],
    },
    {
      id: "bsc-distinction",
      title: "BSc Degree with Distinction",
      organization: "Birzeit University",
      period: "2021",
      type: "distinction",
      description: "Graduated with Distinction in Physics (Major) and Mathematics (Minor).",
      accent: "olive",
    },
    {
      id: "mosa-naser",
      title: "Mosa Naser Scholarship for Physics (×3)",
      organization: "Birzeit University · Dept. of Physics",
      period: "2018 – 2021",
      type: "scholarship",
      description: "Awarded 3 consecutive academic years for top ranking academic performance in the physics department.",
      accent: "olive",
      sponsors: ["Birzeit University", "Department of Physics"],
    },
    {
      id: "science-faculty",
      title: "Science Faculty Scholarship",
      organization: "Birzeit University · Faculty of Science",
      period: "2018 – 2019",
      type: "scholarship",
      description: "Academic merit scholarship awarded by the Faculty of Science.",
      accent: "olive",
      sponsors: ["Birzeit University", "Faculty of Science"],
    },
    {
      id: "paltel",
      title: "Paltel Group Scholarship",
      organization: "Paltel Group · Birzeit University",
      period: "2017 – 2021",
      type: "grant",
      description: "Four-year university scholarship awarded for outstanding pre-university academic excellence.",
      accent: "olive",
      sponsors: ["Birzeit University", "Paltel Group"],
    },
    {
      id: "honor-scholarships",
      title: "University Honor Scholarship (7 Semesters)",
      organization: "Birzeit University",
      period: "2018 – 2021",
      type: "honor",
      description: "Awarded for 7 semesters for holding top cumulative and semester GPA.",
      accent: "crimson",
      sponsors: ["Birzeit University"],
    },
    {
      id: "honor-roll",
      title: "Dean's Honor Roll (8 Consecutive Semesters)",
      organization: "Birzeit University",
      period: "2017 – 2021",
      type: "honor",
      description: "Maintained Honor Roll distinction every single semester of undergraduate studies.",
      accent: "crimson",
    },
  ];
}

export function getAllCourseProjects(): CourseProject[] {
  if (cvData.projects && cvData.projects.length > 0) {
    return cvData.projects;
  }

  const bsc = cvData.education.find((e) => e.degree.includes("BSc"));
  const bscProjects: CourseProject[] = bsc?.projects || [];

  const mscThesisProject: CourseProject = {
    title: "BTZ Black Hole: Holographic Duality, Entropy, and AdS₃/CFT₂",
    course: "Particles, Strings and Cosmology (MSc Dissertation)",
    semester: "Summer",
    year: "2022",
  };

  return [mscThesisProject, ...bscProjects];
}

export interface DegreeCoursework {
  degreeTitle: string;
  institution: string;
  location: string;
  categories: CourseworkCategory[];
}

export function getAllCoursework(): DegreeCoursework[] {
  const results: DegreeCoursework[] = [];

  const msc = cvData.education.find((e) => e.degree.includes("MSc"));
  if (msc && msc.coursework) {
    results.push({
      degreeTitle: msc.degree,
      institution: msc.institution,
      location: msc.location,
      categories: msc.coursework,
    });
  }

  const bsc = cvData.education.find((e) => e.degree.includes("BSc"));
  if (bsc && bsc.coursework) {
    results.push({
      degreeTitle: bsc.degree,
      institution: bsc.institution,
      location: bsc.location,
      categories: bsc.coursework,
    });
  }

  return results;
}
