/**
 * TypeScript definitions for the CV dataset schema from public/cv/cv.json
 */

export interface PersonalInfo {
  name: string;
  name_ar: string;
  title: string;
  institution: string;
  department?: string;
  location: string;
  email: string;
  website: string;
  orcid: string;
  inspirehep: string;
}

export interface CVLinks {
  website: string;
  email: string;
  orcid: string;
  inspirehep: string;
  location?: string;
}

export interface ResearchInterests {
  topics: string[];
  description: string;
  vision: string;
}

export interface Publication {
  article: string;
  authors: string[];
  title: string;
  eprint: string;
  archivePrefix: string;
  primaryClass: string;
  doi: string;
  journal: string;
  volume: string;
  pages: string;
  year: string;
}

export interface WorkExperience {
  position: string;
  institutions: string[];
  location: string;
  tasks?: string[];
  courses?: string[];
  working_time: string;
  start_year: string;
  start_month: string;
  end_year: string | null;
  end_month: string | null;
  current: boolean;
}

export interface ResearchGroup {
  name: string;
  institution: string;
  start_year: string;
  start_month: string;
  end_year: string | null;
  end_month: string | null;
  current: boolean;
}

export interface CourseworkCategory {
  category: string;
  courses: string[];
}

export interface CourseProject {
  title: string;
  course: string;
  semester: string;
  year: string;
}

export interface GrantItem {
  name: string;
  sponsors: string[];
  start_year: string;
  start_month: string;
  end_year?: string;
  end_month?: string;
  number_of_awards?: string;
}

export interface EducationDegree {
  degree: string;
  institution: string;
  department: string;
  location: string;
  start_year: string;
  start_month: string;
  end_year: string | null;
  end_month: string | null;
  thesis_title?: string;
  supervisor?: string;
  grants?: GrantItem[];
  degree_achievement?: string;
  research_topics?: string[];
  coursework?: CourseworkCategory[];
  projects?: CourseProject[];
}

export interface PreUniversityEducation {
  degree: string;
  institution: string;
  location: string;
  school_type: string;
  start_year: string;
  start_month: string;
  end_year: string;
  end_month: string;
  grades: string;
}

export interface SkillCategory {
  category: string;
  skills: string[];
}

export interface SeriesEdition {
  edition: string;
  presentation_type?: "Attendee" | "Speaker" | "Poster" | string;
  sponsors?: string[];
  location?: string;
  year: string;
  month: string;
}

export interface ConferenceSeries {
  title: string;
  editions: SeriesEdition[];
}

export interface SeminarSeries {
  title: string;
  editions: SeriesEdition[];
}

export interface SchoolWorkshopSeries {
  title: string;
  editions: Array<{
    edition: string;
    sponsors?: string[];
    location?: string;
    year: string;
    month: string;
  }>;
}

export interface CompetitionEdition {
  name?: string;
  sponsors?: string[];
  location: string;
  year: string;
  month: string;
}

export interface Competition {
  title: string;
  editions: CompetitionEdition[];
}

export interface CertificationEdition {
  sponsors?: string[];
  location: string;
  start_year: string;
  start_month: string;
  end_year: string;
  end_month: string;
  duration: string;
}

export interface CertificationProgram {
  title: string;
  editions: CertificationEdition[];
}

export interface AppItem {
  name: string;
  description: string;
  link: string | null;
}

export interface AppCategory {
  category: string;
  apps: AppItem[];
}

export interface DevelopedApplications {
  applications_link: string;
  applications: AppCategory[];
}

export interface DatasetItem {
  name: string;
  description: string;
  link: string | null;
}

export interface GeneratedDatasets {
  datasets_link: string;
  datasets: DatasetItem[];
}

export interface Referee {
  name: string;
  affiliation: string;
  relationship: string;
  email: string;
  webpage: string | null;
}

export interface ConsolidatedAwardGrant {
  id: string;
  title: string;
  organization: string;
  period: string;
  type: "grant" | "scholarship" | "distinction" | "honor";
  description?: string;
  accent: "quantum" | "olive" | "crimson" | "amber";
  sponsors?: string[];
}

export interface CVData {
  personal_info?: PersonalInfo;
  links: CVLinks;
  research_interests: ResearchInterests;
  publications: Publication[];
  work_experience: WorkExperience[];
  awards_and_grants?: ConsolidatedAwardGrant[];
  groups: ResearchGroup[];
  education: EducationDegree[];
  pre_university_education: PreUniversityEducation[];
  skills: SkillCategory[];
  conferences: ConferenceSeries[];
  seminars: SeminarSeries[];
  schools_and_workshops: SchoolWorkshopSeries[];
  competitions: Competition[];
  certification_programs: CertificationProgram[];
  developed_applications: DevelopedApplications;
  generated_datasets: GeneratedDatasets;
  projects?: CourseProject[];
  referees: Referee[];
}
