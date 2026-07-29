/**
 * Resolve a case study's `guide_slug` to the prep-kit walkthrough it names,
 * and the reverse.
 *
 * A slug alone does not say which kit it belongs to, so both arrays are
 * searched. Slugs are unique across the two kits in practice; if that ever
 * stops being true, SOC wins and the ambiguity is worth fixing at the source
 * rather than encoding a preference here.
 */
import { CLOUD_GUIDES } from "@/lib/cloud-prep/guides";
import { SOC_GUIDES } from "@/lib/soc-prep/guides";
import type { Project } from "@/lib/types";

export interface GuideLink {
  slug: string;
  href: string;
  /** Which kit — used for the label, e.g. "SOC PREP". */
  kit: "soc" | "cloud";
  kitLabel: string;
  title: string;
  steps: number;
}

/** The walkthrough a project points at, or null if it names none / an unknown one. */
export function guideForProject(project: Project): GuideLink | null {
  const slug = project.case_study?.guide_slug?.trim();
  if (!slug) return null;

  const soc = SOC_GUIDES.find((g) => g.slug === slug);
  if (soc) {
    return {
      slug,
      href: `/soc-prep/projects/${slug}`,
      kit: "soc",
      kitLabel: "SOC PREP",
      title: soc.slug,
      steps: soc.steps.length,
    };
  }

  const cloud = CLOUD_GUIDES.find((g) => g.slug === slug);
  if (cloud) {
    return {
      slug,
      href: `/cloud-security-prep/projects/${slug}`,
      kit: "cloud",
      kitLabel: "CLOUD SECURITY PREP",
      title: cloud.slug,
      steps: cloud.steps.length,
    };
  }

  // Slug typo'd in the admin panel, or the guide was renamed. Render nothing
  // rather than a dead link.
  return null;
}

/**
 * The published project that documents a given guide, if there is one.
 * Powers the "I built this" back-link on the walkthrough pages.
 */
export function projectForGuide(
  projects: Project[],
  guideSlug: string
): Project | null {
  return (
    projects.find((p) => p.case_study?.guide_slug?.trim() === guideSlug) ?? null
  );
}
