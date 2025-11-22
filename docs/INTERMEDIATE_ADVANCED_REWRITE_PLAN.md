# Intermediate & Advanced Passage Rewrite Plan

## Objectives
Establish coherent, pedagogically tiered English passages for intermediate and advanced levels that: 
1. Reinforce previously acquired high‑frequency vocabulary while incrementally introducing mid/high utility academic and thematic terms.
2. Model discourse structures appropriate to CEFR B1→B2 (intermediate) and B2→C1 (advanced) transitions.
3. Provide lexical, syntactic, and rhetorical scaffolding for analytical tasks (summarizing, contrasting, inferring cause/effect, evaluating arguments).

## Level Differentiation Summary
| Dimension | Intermediate (B1→B2) | Advanced (B2→C1) |
|-----------|----------------------|------------------|
| Passage Word Count | 450–600 each (x4) | 650–850 each (x3) |
| Sentence Length | Mean 13–16 words; few > 22 | Mean 17–20 words; strategic > 28 for complex clauses |
| High-Frequency (NGSL) Ratio | ≥ 0.70 | 0.55–0.65 (controlled decrease) |
| New Academic/Abstract Terms per Passage | 8–12 (recycled 2–4) | 15–20 (recycled 5–8) |
| Cohesion Devices | Basic connectives + pronoun reference + light parallelism | Full range: concessive, hedging, stance markers, nominalizations |
| Rhetorical Patterns | Cause–effect, problem–solution, comparison | Multi-stage argument, counterargument + rebuttal, synthesis |
| Figurative / Metadiscourse | Minimal | Moderate, purposeful (e.g., “In essence”, “By contrast”) |

## Thematic Tracks
Intermediate Themes (select 4):
- Personal Health Technology & Behavior (wearables + habit formation)
- Local Environmental Actions (recycling logistics, community gardens)
- Digital Communication & Misunderstanding (tone, emoji pragmatics)
- Learning Strategies & Cognitive Load (study spacing, retrieval)
- Optional (if needed): Everyday Economics (budgeting micro-decisions)

Advanced Themes (select 3):
- Ethical Dimensions of AI Deployment (privacy vs. utility, algorithmic bias)
- Climate Adaptation & Global Equity (resilience, resource allocation trade-offs)
- Innovation Policy & Labor Transformation (automation, upskilling ecosystem)
- (Fallback) Historical Narratives & Collective Memory (interpretive framing)

## Structural Templates
Intermediate (per passage):
1. Context Setup (2–3 sentences) – concrete, relatable scenario.
2. Explanatory Development (3–4 sentences) – mechanism or process with cause/effect signalling.
3. Example Cluster (2–3 sentences) – two contrasting mini-examples (A vs B) to solidify pattern.
4. Light Reflection (2 sentences) – benefit, caution, or next step.

Advanced (per passage):
1. Framing & Thesis – situate issue + nuanced claim.
2. Layered Expansion – elaborate claim using data, principle, or theoretical lens.
3. Counterpoint – articulate credible opposing view; fair representation.
4. Rebuttal / Synthesis – integrate, weigh trade-offs, refine stance.
5. Forward-Looking / Implication – policy, ethical, or strategic outlook.

## Lexical Progression
Intermediate: Introduce mid-frequency verbs (adjust, allocate, emerge), adjectives (reliable, subtle), and nouns (metrics, barrier) with immediate paraphrase or context clue.
Advanced: Add abstract nouns (resilience, compliance, disparity), stance verbs (contend, mitigate), hedging (largely, arguably), precision qualifiers (granular, systemic).

## Cohesion & Discourse Markers
Intermediate Connectives Set:
"However", "Therefore", "For example", "Also", "Instead", "Because" (limit to ≤ 2 per 100 words).
Advanced Extended Set:
Add "Consequently", "Nonetheless", "In contrast", "Underlying", "Moreover", "In essence", "Simultaneously", hedges ("largely", "partially").

## Sentence Complexity Targets
Intermediate: ≤ 15% of sentences with one subordinate clause; avoid nested relative + conditional combos.
Advanced: 30–40% with multi-clause (subordination or participial phrases); occasional fronted adverbials; maintain clarity (no garden paths).

## Collocation & Register Guidelines
Maintain authentic collocations: "mitigate risk", "allocate resources", "foster collaboration"; avoid invented pairings. Register should remain neutral-academic for advanced; semi-formal for intermediate.

## Avoidances / Red Flags
- Template loops (“In the X, Y becomes important”) – ban.
- Unnatural noun–verb mismatch (“practice city”).
- Excess pronoun ambiguity.
- Overuse of generic verbs (make, do) when precise alternatives exist.
- Excess repetition of stance phrases (limit identical clause openings to ≤ 2 per passage).

## Quantitative Validation Targets
Will extend `passage_validator.py` to output:
- Flesch Reading Ease (target: Intermediate 65–75; Advanced 50–60)
- Dale–Chall (Intermediate ≤ 8.0; Advanced ≤ 9.0)
- Repetition Rate: any word > 4% total tokens flagged (except stoplist: the, and, to, of, in, a, is, we).
- Collocation Sanity: simple bigram frequency check; rare bigram threshold (≤1 occurrence across set) prompts review if abstract.

## Rewrite Workflow
1. Draft intermediate passage 1 using template; run validator; adjust high frequency ratio.
2. Complete remaining intermediate passages ensuring recycled new terms.
3. Draft advanced passage 1 emphasizing balanced counterargument.
4. Integrate validator extensions; re-run all.
5. Peer-style manual pass: coherence, collocations, lexical variety.
6. Update `index.json` with new counts + vocabulary metrics.

## Future Enhancements
- Add semantic field tagging (health, policy, tech) for adaptive sequencing.
- Named entity density limit (≤ 5 per advanced passage) to avoid cognitive overload.
- Clause complexity score for scaffolding recommendations.

---
This plan serves as the blueprint before generating the new texts. Next step: implement validator extensions, then begin intermediate drafting.