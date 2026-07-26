/**
 * Shared shape for the long-form, follow-along project guides used by both the
 * SOC-prep and Cloud-prep kits.
 *
 * These guides assume **near-zero prior knowledge**: someone who has never
 * opened a terminal should be able to work through one end to end. That drives
 * three rules the content has to follow.
 *
 *   1. Every command is copy-pasteable and complete. No `<your-value-here>`
 *      unless the step says exactly where to get the value.
 *   2. Every step that changes something ends with a checkpoint — what you
 *      should see if it worked. Without one, a beginner cannot tell a silent
 *      failure from success and carries the breakage forward.
 *   3. Every step that can realistically fail carries its failure modes
 *      inline, next to the command, not in a troubleshooting appendix nobody
 *      scrolls to.
 *
 * Prose fields may contain inline HTML (<b>, <code>, <a>) and render inside
 * .soc-prose containers. Code fields are plain text and render verbatim.
 */

/** A copy-paste block. `label` names it when a step has more than one. */
export interface GuideCommand {
  label?: string;
  /** Shown as a hint chip — "bash", "powershell", "yaml", "hcl", "spl". */
  lang?: string;
  code: string;
  /** Where this runs, when it isn't obvious: "On the Windows VM", "In the AWS CloudShell". */
  where?: string;
}

/** A named thing that can go wrong, and what to do about it. */
export interface GuideFix {
  /** What the reader sees — an error string, a wrong result, nothing happening. */
  problem: string;
  /** Why it happens, in plain terms. */
  cause: string;
  /** The fix. May contain a <code> command. */
  fix: string;
}

export interface GuideStep {
  /** Short imperative title — "Install VirtualBox", "Create the S3 bucket". */
  title: string;
  /**
   * Why this step exists. Beginners follow steps they don't understand and
   * then can't debug them; one sentence of intent prevents that.
   */
  why?: string;
  /** The instructions themselves (HTML). */
  body: string;
  commands?: GuideCommand[];
  /** Checkpoint prose — "You should now see ...". */
  expect?: string;
  /** Sample output for the checkpoint, rendered as a terminal block. */
  expectCode?: string;
  fixes?: GuideFix[];
  /** Rough wall-clock for this step — "10 min", "45 min (mostly waiting)". */
  time?: string;
  /** Flags a step that costs money or is destructive. Rendered as a warning. */
  warn?: string;
}

/** A jargon term defined in plain English before the guide starts. */
export interface GuideTerm {
  term: string;
  plain: string;
}

export interface ProjectGuide {
  /** URL segment — /soc-prep/projects/<slug>. Stable; changing it breaks links. */
  slug: string;
  /** Matches Project.id / CloudProject.id in the kit's projects.ts. */
  projectId: number;
  /** Plain-language framing before step 1: what you are building and why. */
  intro: string;
  /** Jargon used in the guide, defined up front. */
  glossary?: GuideTerm[];
  /** Hardware/account/software you need before starting, spelled out. */
  before?: string[];
  steps: GuideStep[];
  /** What to do with the thing once it works — cleanup, teardown, next steps. */
  after?: string[];
}

/** Look a guide up by slug. */
export function findGuide(
  guides: ProjectGuide[],
  slug: string
): ProjectGuide | undefined {
  return guides.find((g) => g.slug === slug);
}

/** Look a guide up by the project it belongs to. */
export function guideForProject(
  guides: ProjectGuide[],
  projectId: number
): ProjectGuide | undefined {
  return guides.find((g) => g.projectId === projectId);
}
