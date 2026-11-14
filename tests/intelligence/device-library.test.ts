import { test } from "node:test";
import assert from "node:assert/strict";
import {
  deviceLibrary,
  familyResearch,
  claimById,
  validateDeviceLibrary,
  componentIsVerified,
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
  changed.claims.filter(
    (claim) => claim.citations.length,
  )[0].citations[0].sourceId = "missing";
  changed.claims.filter(
    (claim) => claim.citations.length,
  )[1].citations[0].locator = "";
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
    deviceLibrary.researchSessions.some((session) =>
      session.terms.includes('"42-5026-066-02" materials labeling'),
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

test("both exact components reuse all six topics without borrowing manufacturer evidence", () => {
  for (const familyId of ["persona", "triathlon"]) {
    const record = familyResearch(familyId)!;
    assert.equal(record.investigations.length, 6);
    assert.equal(
      new Set(record.investigations.map((row) => row.topic)).size,
      6,
    );
    for (const row of record.investigations) {
      assert.equal(row.componentId, record.family.exampleComponentId);
      for (const id of row.claimIds)
        assert.equal(claimById(id).familyId, familyId);
      assert.ok(row.documentNeeded && row.barrier && row.careTeamQuestion);
    }
    assert.ok(
      record.components.every(
        (c) => !Object.values(c.verification).some(Boolean),
      ),
    );
  }
  assert.ok(
    familyResearch("persona")!.sources.some(
      (source) => source.id === "zimmer-labeling-portal",
    ),
  );
  assert.ok(
    !familyResearch("triathlon")!.sources.some(
      (source) => source.id === "zimmer-labeling-portal",
    ),
  );
  assert.equal(claimById("persona-compatibility-check").subject.kind, "family");
  assert.equal(
    claimById("persona-material-check").label,
    "Unknown or not yet verified",
  );
});

test("investigation integrity rejects missing topics, unsupported references and cross-family claims", () => {
  const changed = copy();
  changed.componentInvestigations[0].claimIds = ["triathlon-role-check"];
  changed.componentInvestigations[1].documentNeeded = "";
  changed.componentInvestigations.pop();
  const errors = validateDeviceLibrary(changed);
  assert.ok(
    errors.some((error) => error.includes("Mismatched investigation claim")),
  );
  assert.ok(
    errors.some((error) =>
      error.includes("Incomplete component investigation"),
    ),
  );
  assert.ok(
    errors.some((error) =>
      error.includes("Incomplete investigation checklist"),
    ),
  );
});

test("different record IDs cannot hide duplicate DI or normalized labeler/model identities", () => {
  const changed = copy();
  changed.components.push({
    ...changed.components[0],
    id: "duplicate-with-new-record-id",
    di: ` ${changed.components[0].di} `,
    model: ` ${changed.components[0].model} `,
    labeler: changed.components[0].labeler.toUpperCase(),
  });
  const errors = validateDeviceLibrary(changed);
  assert.ok(errors.includes("Duplicate exact DI"));
  assert.ok(errors.includes("Duplicate labeler/model identity"));
});

test("checked boxes, family marketing and identifier facts cannot complete technical verification", () => {
  const changed = copy();
  const component = changed.components[0];
  for (const field of Object.keys(
    component.verification,
  ) as (keyof typeof component.verification)[])
    component.verification[field] = true;
  changed.families[0].depth = "verified-component";
  assert.equal(componentIsVerified(component, changed), false);
  assert.ok(
    validateDeviceLibrary(changed).some((error) =>
      error.includes("Unsupported component verification"),
    ),
  );
  component.verificationEvidence = {
    labeling: ["persona-femoral-identity"],
    materials: ["persona-tinidium"],
    fixation: ["persona-fixation-check"],
    compatibility: ["persona-compatibility-check"],
    safetyReview: ["persona-regulatory-check"],
  };
  const errors = validateDeviceLibrary(changed);
  assert.ok(
    errors.some((error) => error.includes("Unverified component depth")),
  );
  assert.ok(
    errors.some((error) => error.includes("Required investigation gaps")),
  );
  assert.ok(
    errors.some((error) => error.includes("persona-femoral: materials")),
  );
});

test("required gaps and inaccessible sources cannot be waived by a not-applicable label", () => {
  const changed = copy(),
    component = changed.components[0];
  // Synthetic authoring fixture only, never a claim about the actual implant.
  changed.claims.push({
    ...changed.claims[0],
    id: "test-only-component-evidence",
    subject: { kind: "component", id: component.id },
    text: "Synthetic fixture",
    label: "Verified specification or regulatory fact",
    citations: [
      {
        sourceId: "persona-fda-original",
        locator: "Synthetic fixture locator",
      },
    ],
  });
  component.verificationEvidence = {};
  for (const field of Object.keys(
    component.verification,
  ) as (keyof typeof component.verification)[]) {
    component.verification[field] = true;
    component.verificationEvidence[field] = ["test-only-component-evidence"];
  }
  const rows = changed.componentInvestigations.filter(
    (row) => row.componentId === component.id,
  );
  for (const row of rows) {
    row.gapState = "resolved";
    row.outcome = "supported";
    row.claimIds = ["test-only-component-evidence"];
  }
  assert.equal(componentIsVerified(component, changed), true);
  rows.find((row) => row.topic === "mri")!.gapState = "not-applicable";
  assert.equal(componentIsVerified(component, changed), false);
  rows.find((row) => row.topic === "mri")!.gapState = "resolved";
  changed.sources.find(
    (source) => source.id === "persona-fda-original",
  )!.access = "unavailable";
  assert.equal(componentIsVerified(component, changed), false);
});

test("editorial review requires a dated record independently of research depth", () => {
  const changed = copy();
  changed.families[0].editorialStatus = "reviewed";
  assert.ok(
    validateDeviceLibrary(changed).some((error) =>
      error.includes("Undocumented editorial review"),
    ),
  );
  changed.families[0].editorialReview = {
    reference: "test-only-review-record",
    reviewedOn: "2026-11-13",
    scope: "Synthetic editorial fixture, no clinical endorsement",
    independentClinicalReview: false,
  };
  assert.ok(
    !validateDeviceLibrary(changed).some((error) =>
      error.includes("Undocumented editorial review"),
    ),
  );
  assert.equal(changed.families[0].depth, "family-overview");
  changed.families[0].editorialStatus = "needs-reverification";
  assert.deepEqual(validateDeviceLibrary(changed), []);
});

test("evidence labels, discovery availability and linked assertions cannot silently lose provenance", () => {
  const changed = copy();
  changed.claims[0].label = "" as never;
  changed.options[0].evidenceLabel = "" as never;
  changed.families[0].discovery.availability = "documented";
  changed.families[0].discovery.availabilitySourceId = null;
  changed.claims.find(
    (claim) => claim.id === "persona-consumer-material-scope",
  )!.relatedClaims![0].claimId = "triathlon-role-check";
  const errors = validateDeviceLibrary(changed);
  for (const message of [
    "Invalid evidence label",
    "Missing evidence label",
    "Unsupported availability",
    "Broken claim relationship",
  ])
    assert.ok(
      errors.some((error) => error.includes(message)),
      message,
    );
  assert.equal(
    claimById("persona-material-check").label,
    "Unknown or not yet verified",
  );
});
