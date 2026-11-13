export { deviceLibrary } from "./records";
export { sourceById } from "./sources";
export type * from "./types";
import { deviceLibrary, type DeviceLibrary } from "./records";

export const depthLabels = {
  "discovery-candidate": "Discovery candidate",
  "family-overview": "Family overview",
  "verified-component": "Verified component",
  "evidence-comparison": "Evidence comparison",
} as const;
export function familyResearch(familyId: string) {
  const family = deviceLibrary.families.find((item) => item.id === familyId);
  if (!family) return undefined;
  const claims = deviceLibrary.claims.filter(
    (item) => item.familyId === familyId,
  );
  const sourceIds = new Set([
    family.sourceId,
    ...claims.flatMap((item) => item.citations.map((c) => c.sourceId)),
    ...deviceLibrary.components
      .filter((item) => item.familyId === familyId)
      .map((item) => item.sourceId),
  ]);
  return {
    family,
    claims,
    sources: deviceLibrary.sources.filter((item) => sourceIds.has(item.id)),
    components: deviceLibrary.components.filter(
      (item) => item.familyId === familyId,
    ),
    options: deviceLibrary.options.filter((item) => item.familyId === familyId),
    technologies: deviceLibrary.technologies.filter(
      (item) => item.familyId === familyId,
    ),
    configurations: deviceLibrary.configurations.filter(
      (item) => item.familyId === familyId,
    ),
    studies: deviceLibrary.studies.filter((item) => item.familyId === familyId),
    safetyNotices: deviceLibrary.safetyNotices.filter(
      (item) => item.familyId === familyId,
    ),
    questions: deviceLibrary.openQuestions.filter(
      (item) => item.familyId === familyId,
    ),
    sessions: deviceLibrary.researchSessions.filter((item) =>
      item.familyIds.includes(familyId),
    ),
  };
}
export function claimById(id: string) {
  const item = deviceLibrary.claims.find((claim) => claim.id === id);
  if (!item) throw new Error(`Unknown device claim: ${id}`);
  return item;
}

/** Authoring checks only. These do not assign clinical quality, depth or readiness. */
export function validateDeviceLibrary(
  library: DeviceLibrary = deviceLibrary,
): string[] {
  const errors: string[] = [];
  const groups = {
    family: library.families,
    component: library.components,
    option: library.options,
    technology: library.technologies,
  };
  const families = new Set(library.families.map((item) => item.id));
  const sources = new Set(library.sources.map((item) => item.id));
  const claims = new Map(library.claims.map((item) => [item.id, item]));
  for (const [name, items] of Object.entries(library)) {
    const ids = items.map((item) => item.id);
    if (new Set(ids).size !== ids.length)
      errors.push(`Duplicate id in ${name}`);
  }
  const citation = (sourceId: string, locator: string, where: string) => {
    if (!sources.has(sourceId))
      errors.push(`Unknown source ${sourceId} in ${where}`);
    if (!locator.trim()) errors.push(`Missing passage locator in ${where}`);
  };
  const subject = (kind: keyof typeof groups, id: string, familyId: string) => {
    const item = groups[kind].find((item) => item.id === id);
    if (
      !item ||
      (kind === "family"
        ? item.id !== familyId
        : !("familyId" in item) || item.familyId !== familyId)
    )
      errors.push(`Subject ${id} does not belong to ${familyId}`);
  };
  for (const source of library.sources) {
    if (
      !source.url.startsWith("https://") ||
      !/^\d{4}-\d{2}-\d{2}$/.test(source.checkedOn)
    )
      errors.push(`Invalid source metadata ${source.id}`);
    if (!source.dateNote || !source.limitation)
      errors.push(`Missing source scope ${source.id}`);
  }
  for (const family of library.families) {
    if (
      family.exampleComponentId &&
      !library.components.some(
        (component) =>
          component.id === family.exampleComponentId &&
          component.familyId === family.id,
      )
    )
      errors.push(`Invalid family example ${family.id}`);
    if (!sources.has(family.sourceId))
      errors.push(`Unknown family source ${family.id}`);
    if (
      family.depth === "verified-component" &&
      !library.components.some(
        (c) =>
          c.familyId === family.id &&
          Object.values(c.verification).every(Boolean),
      )
    )
      errors.push(`Unverified component depth ${family.id}`);
    if (
      family.depth === "evidence-comparison" &&
      !library.studies.some((s) => s.familyId === family.id)
    )
      errors.push(`No scoped comparison for ${family.id}`);
  }
  for (const item of [
    ...library.components,
    ...library.options,
    ...library.technologies,
    ...library.claims,
    ...library.studies,
    ...library.safetyNotices,
    ...library.openQuestions,
    ...library.configurations,
  ])
    if (!families.has(item.familyId))
      errors.push(`Unknown family ${item.familyId}`);
  for (const component of library.components)
    if (!sources.has(component.sourceId) || !component.model || !component.di)
      errors.push(`Invalid component identity ${component.id}`);
  for (const option of library.options) {
    citation(option.sourceId, option.locator, option.id);
    if (
      library.sources.find((s) => s.id === option.sourceId)?.url !== option.href
    )
      errors.push(`Option source mismatch ${option.id}`);
  }
  for (const claim of library.claims) {
    subject(claim.subject.kind, claim.subject.id, claim.familyId);
    if (
      !claim.text ||
      !claim.applicability ||
      !claim.limitations ||
      !claim.geography ||
      !claim.checkedOn
    )
      errors.push(`Incomplete claim ${claim.id}`);
    if (
      !claim.citations.length &&
      !["Unknown or not yet verified", "Business hypothesis"].includes(
        claim.label,
      )
    )
      errors.push(`Unsupported claim ${claim.id}`);
    claim.citations.forEach((c) => citation(c.sourceId, c.locator, claim.id));
  }
  for (const item of [...library.studies, ...library.safetyNotices]) {
    if (
      !sources.has(item.sourceId) ||
      claims.get(item.claimId)?.familyId !== item.familyId
    )
      errors.push(`Broken evidence relation ${item.id}`);
  }
  for (const study of library.studies) {
    if (
      !Number.isInteger(study.sampleSize) ||
      study.sampleSize < 1 ||
      !study.configuration ||
      !study.population ||
      !study.comparator ||
      !study.followUp ||
      !study.outcome ||
      !study.uncertainty ||
      !study.funding ||
      !study.limitations
    )
      errors.push(`Incomplete scoped study ${study.id}`);
  }
  for (const question of library.openQuestions)
    subject(question.subject.kind, question.subject.id, question.familyId);
  for (const config of library.configurations) {
    if (!config.componentIds.length)
      errors.push(`Empty configuration ${config.id}`);
    if (
      config.componentIds.some(
        (id) =>
          !library.components.some(
            (c) => c.id === id && c.familyId === config.familyId,
          ),
      )
    )
      errors.push(`Mixed/unknown components ${config.id}`);
    if (config.status === "verified" && !config.compatibilityCitations.length)
      errors.push(`Missing compatibility evidence ${config.id}`);
    if (config.status === "verified") {
      const members = config.componentIds.map((id) =>
        library.components.find((c) => c.id === id),
      );
      const roles = new Set(members.map((c) => c?.role));
      if (
        !["Femoral component", "Bearing insert", "Tibial baseplate"].every(
          (role) => roles.has(role),
        ) ||
        members.some((c) => !c || !Object.values(c.verification).every(Boolean))
      )
        errors.push(`Incomplete verified assembly ${config.id}`);
    }
    config.compatibilityCitations.forEach((c) =>
      citation(c.sourceId, c.locator, config.id),
    );
  }
  for (const session of library.researchSessions) {
    if (
      session.familyIds.some((id) => !families.has(id)) ||
      session.openedSourceIds.some((id) => !sources.has(id)) ||
      session.inaccessible.some((item) => !sources.has(item.sourceId))
    )
      errors.push(`Broken research log ${session.id}`);
  }
  return errors;
}
