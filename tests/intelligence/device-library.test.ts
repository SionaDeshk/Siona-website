import { test } from "node:test";
import assert from "node:assert/strict";
import {
  deviceLibrary,
  familyResearch,
  claimById,
  validateDeviceLibrary,
} from "../../src/lib/intelligence/device-library";
import {
  deviceProfiles,
  profilesForLibrary,
} from "../../src/lib/intelligence/device-profiles";

const copy = () => structuredClone(deviceLibrary);
test("device library has valid source, subject, evidence and research-log relations", () => {
  assert.deepEqual(validateDeviceLibrary(), []);
  for (const claim of deviceLibrary.claims) {
    assert.ok(claim.editorialStatus !== "reviewed");
    if (claim.label !== "Unknown or not yet verified")
      assert.ok(claim.citations.length > 0);
  }
  assert.equal(deviceLibrary.configurations.length, 0);
});
test("research depth does not promote editorial readiness or verify an identified component", () => {
  const persona = familyResearch("persona")!;
  assert.equal(persona.family.depth, "family-overview");
  assert.equal(persona.family.editorialStatus, "needs-review");
  assert.ok(
    persona.components.every(
      (component) => !Object.values(component.verification).some(Boolean),
    ),
  );
  const changed = copy();
  changed.families[0].depth = "verified-component";
  assert.ok(
    validateDeviceLibrary(changed).some((error) =>
      error.includes("Unverified component depth"),
    ),
  );
});
test("family selectors isolate manufacturers and preserve the existing identifier presentation", () => {
  const persona = familyResearch("persona")!,
    triathlon = familyResearch("triathlon")!;
  assert.equal(familyResearch("unknown"), undefined);
  assert.ok(persona.claims.every((item) => item.familyId === "persona"));
  assert.ok(triathlon.claims.every((item) => item.familyId === "triathlon"));
  assert.equal(triathlon.technologies.length, 0);
  assert.ok(!triathlon.sources.some((item) => item.id.startsWith("iq-")));
  assert.equal(deviceProfiles[0].model, "42-5026-066-02");
  assert.equal(deviceProfiles[1].di, "07613327040272");
  assert.equal(deviceProfiles[1].regulatoryLinks.length, 0);
});
test("source/claim defects and cross-family subjects cannot silently enter the library", () => {
  const changed = copy();
  changed.claims[0].citations[0].sourceId = "missing";
  changed.claims[1].citations[0].locator = "";
  changed.claims[2].subject = { kind: "component", id: "triathlon-femoral" };
  const errors = validateDeviceLibrary(changed);
  assert.ok(errors.some((error) => error.includes("Unknown source")));
  assert.ok(errors.some((error) => error.includes("Missing passage locator")));
  assert.ok(errors.some((error) => error.includes("does not belong")));
});
test("a single identified component and generic citation cannot verify an assembly", () => {
  const changed = copy();
  changed.configurations.push({
    id: "invalid-assembly",
    familyId: "persona",
    componentIds: ["persona-femoral"],
    status: "verified",
    compatibilityCitations: [
      { sourceId: "persona-professional", locator: "Family overview" },
    ],
  });
  assert.ok(
    validateDeviceLibrary(changed).some((error) =>
      error.includes("Incomplete verified assembly"),
    ),
  );
  changed.configurations[0].componentIds.push("triathlon-femoral");
  assert.ok(
    validateDeviceLibrary(changed).some((error) =>
      error.includes("Mixed/unknown components"),
    ),
  );
});
test("material and MRI claims remain scoped; partial access and recall matching stay explicit", () => {
  const material = claimById("persona-tinidium");
  assert.equal(material.subject.kind, "option");
  assert.match(
    material.applicability,
    /no match to the identified femoral model/i,
  );
  assert.match(
    claimById("persona-femoral-mri-record").limitations,
    /current exact-component labeling/,
  );
  assert.equal(
    deviceLibrary.sources.find((item) => item.id === "persona-trial")!.access,
    "partial",
  );
  assert.equal(
    deviceLibrary.safetyNotices[0].matchToExample,
    "not-established",
  );
  assert.ok(
    deviceLibrary.researchSessions[0].terms.includes(
      '"42-5026-066-02" materials labeling',
    ),
  );
  assert.ok(
    !deviceLibrary.families.some((item) =>
      /hypoallergenic/i.test(item.category),
    ),
  );
});

test("discovery candidates can exist without fabricated exact identifiers", () => {
  const changed = copy();
  changed.families.push({
    ...changed.families[1],
    id: "discovery-only",
    name: "Discovery only",
    exampleComponentId: null,
  });
  assert.deepEqual(validateDeviceLibrary(changed), []);
  assert.equal(profilesForLibrary(changed).length, 2);
  const shuffled = copy();
  shuffled.options.reverse();
  assert.deepEqual(validateDeviceLibrary(shuffled), []);
});
