import portfolioData from '../data/portfolio.json';

/**
 * Typed accessor for src/data/portfolio.json — the single content source for
 * the entire application. The game engine reads it to spawn ores, NPCs and
 * monuments; the React overlay reads it to render modals. No portfolio text
 * may be hardcoded anywhere else.
 */

export type SkillTier = 'familiar' | 'intermediate' | 'advanced';

export interface Personal {
  name: string;
  title: string;
  tagline: string;
  contact: string;
  github: string;
  linkedin: string;
  location: string;
}

export interface Skill {
  id: string;
  displayName: string;
  tier: SkillTier;
  /** Which generated ore tile this skill spawns as underground. */
  blockType: string;
  /** [minDepth, maxDepth] in tiles below the surface line. */
  spawnDepth: [number, number];
  /** Relative spawn frequency (higher = more veins). */
  abundance: number;
  description: string;
}

export interface Experience {
  id: string;
  npcName: string;
  role: string;
  zone: string;
  dialogue: string[];
}

export interface Sign {
  id: string;
  zone: string;
  text: string;
}

export interface Project {
  id: string;
  name: string;
  structure: string;
  period: string;
  summary: string;
  highlights: string[];
  tech: string[];
  link: string;
  live: string;
}

export interface Portfolio {
  personal: Personal;
  about: string[];
  skills: Skill[];
  experience: Experience[];
  signs: Sign[];
  projects: Project[];
  futureGoals: string[];
}

const portfolio = portfolioData as unknown as Portfolio;

export const PortfolioService = {
  get all(): Portfolio {
    return portfolio;
  },
  get personal(): Personal {
    return portfolio.personal;
  },
  get about(): string[] {
    return portfolio.about;
  },
  get skills(): Skill[] {
    return portfolio.skills;
  },
  get experience(): Experience[] {
    return portfolio.experience;
  },
  get signs(): Sign[] {
    return portfolio.signs;
  },
  get projects(): Project[] {
    return portfolio.projects;
  },
  get futureGoals(): string[] {
    return portfolio.futureGoals;
  },
  skillById(id: string): Skill | undefined {
    return portfolio.skills.find((s) => s.id === id);
  },
  projectByStructure(structure: string): Project | undefined {
    return portfolio.projects.find((p) => p.structure === structure);
  },
  signsByZone(zone: string): Sign[] {
    return portfolio.signs.filter((s) => s.zone === zone);
  },
};
