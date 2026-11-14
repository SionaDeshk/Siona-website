export { deviceLibrary } from "./records";
export { sourceById } from "./sources";
export type * from "./types";
import { deviceLibrary, type DeviceLibrary } from "./records";
import {
  investigationTopics,
  evidenceLabels,
  type ComponentRecord,
  type EditorialStatus,
  type EditorialReview,
} from "./types";

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
  const sessions = deviceLibrary.researchSessions.filter((item) =>
    item.familyIds.includes(familyId),
  );
  const sourceIds = new Set([
    ...sessions
      .filter((item) => item.familyIds.length === 1)
      .flatMap((item) => [
        ...item.openedSourceIds,
        ...item.inaccessible.map((entry) => entry.sourceId),
      ]),
    family.sourceId,
    family.discovery.sourceId,
    ...(family.discovery.availabilitySourceId
      ? [family.discovery.availabilitySourceId]
      : []),
    ...claims.flatMap((item) => item.citations.map((c) => c.sourceId)),
    ...deviceLibrary.components
      .filter((item) => item.familyId === familyId)
      .map((item) => item.sourceId),
  ]);
  return {
    family,
    claims,
    investigations: deviceLibrary.componentInvestigations.filter(
      (item) => item.familyId === familyId,
    ),
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

/** Explicit exact-component evidence only; family/identifier facts cannot complete technical checks. */
function applicableComponentClaim(
  id: string,
  component: ComponentRecord,
  library: DeviceLibrary,
) {
  const claim = library.claims.find((item) => item.id === id);
  return (
    !!claim &&
    claim.subject.kind === "component" &&
    claim.subject.id === component.id &&
    claim.familyId === component.familyId &&
    claim.label === "Verified specification or regulatory fact" &&
    claim.citations.length > 0 &&
    claim.citations.every((citation) => {
      const source = library.sources.find(
        (item) => item.id === citation.sourceId,
      );
      return (
        !!citation.locator.trim() &&
        source?.access === "read" &&
        !!source.publicationOrRevision &&
        ["manufacturer", "regulatory", "safety"].includes(source.kind)
      );
    })
  );
}
export function componentIsVerified(
  component: ComponentRecord,
  library: DeviceLibrary = deviceLibrary,
) {
  return (
    Object.entries(component.verification).every(([field, checked]) => {
      const evidence =
        component.verificationEvidence?.[
          field as keyof typeof component.verification
        ];
      return (
        checked === true &&
        !!evidence?.length &&
        evidence.every((id) => applicableComponentClaim(id, component, library))
      );
    }) &&
    investigationTopics.every((topic) =>
      library.componentInvestigations.some(
        (row) =>
          row.componentId === component.id &&
          row.familyId === component.familyId &&
          row.topic === topic &&
          row.gapState === "resolved" &&
          row.outcome === "supported" &&
          row.claimIds.some((id) =>
            applicableComponentClaim(id, component, library),
          ),
      ),
    )
  );
}
export const editorialLabels: Record<EditorialStatus, string> = {
  draft: "Draft",
  "needs-review": "Needs editorial review",
  reviewed: "Editorial review recorded",
  "needs-reverification": "Needs re-verification",
};
export const gapLabels = {
  unknown: "Unknown",
  "not-searched": "Not searched",
  "source-inaccessible": "Source inaccessible",
  "not-applicable": "Not applicable",
  resolved: "Resolved within stated scope",
} as const;

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
  const reviewed = (item: {
    id: string;
    editorialStatus: EditorialStatus;
    editorialReview?: EditorialReview;
  }) => {
    if (!(item.editorialStatus in editorialLabels))
      errors.push(`Invalid editorial status ${item.id}`);
    if (
      item.editorialStatus === "reviewed" &&
      (!item.editorialReview?.reference.trim() ||
        !item.editorialReview.scope.trim() ||
        !/^\d{4}-\d{2}-\d{2}$/.test(item.editorialReview.reviewedOn) ||
        typeof item.editorialReview.independentClinicalReview !== "boolean")
    )
      errors.push(`Undocumented editorial review ${item.id}`);
  };
  [...library.families, ...library.claims, ...library.studies].forEach(
    reviewed,
  );
  const dis = library.components.map((item) => item.di.trim());
  if (new Set(dis).size !== dis.length) errors.push("Duplicate exact DI");
  const models = library.components.map(
    (item) =>
      `${item.labeler.trim().toLowerCase()}|${item.model.trim().toLowerCase()}`,
  );
  if (new Set(models).size !== models.length)
    errors.push("Duplicate labeler/model identity");
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
    const discovery = family.discovery;
    if (
      !sources.has(discovery.sourceId) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(discovery.discoveredOn) ||
      !discovery.availabilityScope ||
      !discovery.nextAction
    )
      errors.push(`Incomplete discovery ${family.id}`);
    if (
      discovery.availability === "documented" &&
      (!discovery.availabilitySourceId ||
        !sources.has(discovery.availabilitySourceId))
    )
      errors.push(`Unsupported availability ${family.id}`);
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
        (c) => c.familyId === family.id && componentIsVerified(c, library),
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
    ...library.componentInvestigations,
  ])
    if (!families.has(item.familyId))
      errors.push(`Unknown family ${item.familyId}`);
  for (const component of library.components)
    if (!sources.has(component.sourceId) || !component.model || !component.di)
      errors.push(`Invalid component identity ${component.id}`);
  for (const component of library.components) {
    for (const [field, checked] of Object.entries(component.verification)) {
      const evidence =
        component.verificationEvidence?.[
          field as keyof typeof component.verification
        ];
      if (
        checked &&
        (!evidence?.length ||
          !evidence.every((id) =>
            applicableComponentClaim(id, component, library),
          ))
      )
        errors.push(
          `Unsupported component verification ${component.id}: ${field}`,
        );
    }
    if (
      Object.values(component.verification).every(Boolean) &&
      !componentIsVerified(component, library)
    )
      errors.push(`Required investigation gaps ${component.id}`);
  }
  for (const option of library.options) {
    if (!evidenceLabels.includes(option.evidenceLabel))
      errors.push(`Missing evidence label ${option.id}`);
    citation(option.sourceId, option.locator, option.id);
    if (
      library.sources.find((s) => s.id === option.sourceId)?.url !== option.href
    )
      errors.push(`Option source mismatch ${option.id}`);
  }
  for (const claim of library.claims) {
    if (!evidenceLabels.includes(claim.label))
      errors.push(`Invalid evidence label ${claim.id}`);
    for (const relation of claim.relatedClaims ?? []) {
      if (
        relation.claimId === claim.id ||
        claims.get(relation.claimId)?.familyId !== claim.familyId ||
        !relation.explanation.trim()
      )
        errors.push(`Broken claim relationship ${claim.id}`);
    }
    if (
      claim.label === "Verified specification or regulatory fact" &&
      claim.citations.length &&
      claim.citations.every(
        (item) =>
          library.sources.find((source) => source.id === item.sourceId)
            ?.access === "unavailable",
      )
    )
      errors.push(`Inaccessible verification source ${claim.id}`);
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
      claims.get(item.claimId)?.familyId !== item.familyId ||
      !claims
        .get(item.claimId)
        ?.citations.some((citation) => citation.sourceId === item.sourceId)
    )
      errors.push(`Broken evidence relation ${item.id}`);
  }
  for (const study of library.studies) {
    if (
      study.denominators?.some(
        (item) =>
          !item.label.trim() || !Number.isInteger(item.count) || item.count < 1,
      )
    )
      errors.push(`Invalid study denominator ${study.id}`);
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
    if (
      config.status === "verified" &&
      config.compatibilityCitations.some((item) => {
        const source = library.sources.find(
          (source) => source.id === item.sourceId,
        );
        return (
          !source ||
          source.access !== "read" ||
          !source.publicationOrRevision ||
          !["manufacturer", "regulatory"].includes(source.kind)
        );
      })
    )
      errors.push(`Unsupported assembly compatibility source ${config.id}`);
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
        members.some((c) => !c || !componentIsVerified(c, library))
      )
        errors.push(`Incomplete verified assembly ${config.id}`);
    }
    config.compatibilityCitations.forEach((c) =>
      citation(c.sourceId, c.locator, config.id),
    );
  }
  for (const row of library.componentInvestigations) {
    subject("component", row.componentId, row.familyId);
    if (
      !investigationTopics.includes(row.topic) ||
      !row.claimIds.length ||
      (row.gapState !== "not-searched" && !row.searched.length) ||
      !(row.gapState in gapLabels) ||
      !row.whyItMatters ||
      !row.nextRetrievalRoute ||
      (row.gapState === "resolved" && row.outcome !== "supported") ||
      (row.outcome === "supported" && row.gapState !== "resolved") ||
      !row.barrier ||
      !row.documentNeeded ||
      !row.careTeamQuestion ||
      !/^\d{4}-\d{2}-\d{2}$/.test(row.checkedOn)
    )
      errors.push(`Incomplete component investigation ${row.id}`);
    for (const id of row.claimIds) {
      const claim = claims.get(id);
      if (
        !claim ||
        claim.familyId !== row.familyId ||
        (claim.subject.kind === "component" &&
          claim.subject.id !== row.componentId)
      )
        errors.push(`Mismatched investigation claim ${row.id}: ${id}`);
    }
  }
  for (const componentId of new Set(
    library.componentInvestigations.map((item) => item.componentId),
  )) {
    const topics = library.componentInvestigations
      .filter((item) => item.componentId === componentId)
      .map((item) => item.topic);
    if (
      topics.length !== investigationTopics.length ||
      new Set(topics).size !== investigationTopics.length
    )
      errors.push(`Incomplete investigation checklist ${componentId}`);
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
