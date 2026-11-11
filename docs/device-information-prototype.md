# Knee-device information prototype

Development-only route: `/workspace/intelligence/preview/device-information`, linked from the existing Evo development preview. The route returns 404 in a production build. It shares the existing application and fonts; it is not a public launch or an authenticated patient portal.

The explainer addresses three questions: what the main parts do, how exact identifiers narrow a device question, and what evidence does and does not establish. A local interactive schematic highlights the femoral component, bearing and tibial baseplate. The drawing is generic and explicitly does not establish a compatible Persona assembly. An optional patellar component is acknowledged without selecting one.

Only the researched femoral example has an exact identifier: model 42-5026-066-02 / DI 00889024230408. No tibial or bearing model, combination, material specification, MRI conditions, complete recall status or comparative outcome is invented. Source links accompany the explanations. The page attributes general component roles to AAOS and distinguishes them from manufacturer family information and the exact AccessGUDID record. Research snapshot: November 10, 2026; current source gaps remain visible.

Component selection and the comprehension check use ephemeral React state. No API, storage, tracking, file upload, patient record, AI request or feedback submission is added. Refresh resets the check. The existing Evo routes, scoring, authentication, authorizations, audit mechanisms and database schema are unchanged. No migrations or new dependencies are required.

Review locally at desktop and mobile sizes. Test whether a reader can explain the parts, identify the exact-model example and recognize why a component record is not a full-system safety assessment. The self-check is a demonstration, not user-validation results. Participant research still needs an agreed protocol and consent before recruitment. Source-resolution and independent editorial review remain necessary before substantive clinical-information testing or publication.
