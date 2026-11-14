// Shared shapes. Content inputs are minimal structural types (no dependency on the
// web app's generated types), so this package runs anywhere: browser, Worker, Node.

export interface Skill {
  id: string;
  name: string;
  category: string;
  proficiency?: string;
}

export interface Role {
  org: string;
  title: string;
  employmentType?: string;
  workplace?: string;
  start: string; // "YYYY-MM"
  end?: string;
  location?: string;
  summary?: string;
  highlights?: readonly { text: string; project?: string }[];
  skills?: readonly string[];
}

export interface Project {
  slug: string;
  title: string;
  summary: string;
  type: string;
  period?: string;
  status?: string;
  featured?: boolean;
  /** "YYYY" or "YYYY-MM"; no end = ongoing. */
  dates?: { start: string; end?: string };
  role?: string;
  org?: string;
  tags?: readonly string[];
  skills?: readonly string[];
}

export interface Education {
  id: string;
  institute: string;
  shortName: string;
  degree: string;
  field?: string;
  start: number;
  end?: number;
  skills?: readonly string[];
}

export interface Corpus {
  profile: {
    name: string;
    title: string;
    headline: string;
    shortBio?: string;
    bio: readonly string[];
    location: string;
    roles?: readonly string[];
    links?: readonly { label: string; url: string }[];
  };
  skills: readonly Skill[];
  organizations: readonly { id: string; name: string }[];
  roles: readonly Role[];
  education: readonly Education[];
  projects: readonly Project[];
  about?: readonly { id: string; title: string; summary: string; skills?: readonly string[] }[];
  learning?: readonly string[];
  /** Case-study markdown by project slug. */
  caseStudies: ReadonlyMap<string, string>;
  /** Resume HTML (content/resume/resume.html). */
  resumeHtml?: string;
  /** "YYYY-MM" used for "x+ years" and "present"; injected so tests are stable. */
  today: string;
}

export type ChunkKind =
  | 'profile'
  | 'career'
  | 'role'
  | 'education'
  | 'skills'
  | 'project'
  | 'case-study'
  | 'about'
  | 'resume';

/** One citable fact-sized piece of my data. */
export interface Chunk {
  id: string;
  kind: ChunkKind;
  title: string;
  text: string;
  /** Graph node ids this chunk is about; the first is the primary one. */
  nodes: string[];
  url?: string;
}

export interface Retrieved {
  chunk: Chunk;
  /** Fused rank score (RRF). */
  score: number;
  /** Raw BM25 score, used for the confidence check. */
  bm25: number;
}

export type AnswerKind = 'answer' | 'unknown' | 'policy' | 'smalltalk';

export interface Answer {
  kind: AnswerKind;
  text: string;
  /** Graph node ids to light up. */
  citations: string[];
  urls: string[];
  /** Chunks the answer was built from (for the verifier and debugging). */
  sources: Chunk[];
  /** A follow-up question this answer offers; "yes" next turn asks it. */
  suggest?: string;
  /** The answer was about someone else ("who is Himanshu?"): their name, so a
   *  following "his role" is confirmed before answering about Chandrashekhar. */
  aboutOther?: string;
}
