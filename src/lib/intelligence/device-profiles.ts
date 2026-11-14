import { deviceLibrary } from "./device-library";

/** Existing presentation contract, derived from the shared research library. */
export function profilesForLibrary(library = deviceLibrary) {
  return library.families.flatMap((family) => {
    const component = library.components.find(
      (item) =>
        item.id === family.exampleComponentId && item.familyId === family.id,
    );
    if (!component) return [];
    return [
      {
        id: family.id,
        manufacturer: family.manufacturer,
        family: family.name,
        labeler: component.labeler,
        model: component.model,
        di: component.di,
        size: component.size,
        recordDate: component.recordDate,
        checkedDate: new Date(
          `${component.checkedOn}T12:00:00Z`,
        ).toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
          timeZone: "UTC",
        }),
        identityUrl: library.sources.find(
          (source) => source.id === component.sourceId,
        )!.url,
        manufacturerUrl: library.sources.find(
          (source) => source.id === family.sourceId,
        )!.url,
        scope: family.identityScope,
        regulatoryStatus: component.regulatoryStatus,
        regulatoryNote: component.regulatoryNote,
        regulatoryLinks: component.regulatoryLinks,
        gaps: component.gaps,
      },
    ];
  });
}
export const deviceProfiles = profilesForLibrary();
