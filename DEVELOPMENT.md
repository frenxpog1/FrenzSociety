# Frenz Society: continuing development direction

Owner direction (November 2026): When Frenz says “keep improving,” continue this game with a coherent, tested increment. Preserve the modern illustrated top-down style, natural people, furnished interiors and visibly performed daily activities. Improve gameplay, detail and polish with research where useful. Do not redesign or replace the game on every pass. Never claim to work unattended between messages or beyond session limits.

## Protect the playable game

- Keep existing browser saves readable. Test save round trips before publishing changes to data.
- Work from the latest Site source; retain previous published versions for recovery.
- Run the regression suite and production build for each code increment. Describe actual verification, distinguishing automated checks from browser checks.
- Keep private Site access unchanged. Original GitHub source is separate from the Site repository.
- Prefer one finished, reviewable improvement over several partial systems. Keep art and UI consistent; protect the playfield.

## Design direction

Give players understandable choices, visible consequences, and residents they can care about. Optional goals should explain real town systems. Avoid arbitrary grind and attention-demanding overlays. Changes to balance, construction costs, jobs and resident needs should create choices that actually work in the simulation.

Research consulted:
- Factorio developer notes on onboarding and coherent progression: https://www.factorio.com/blog/post/fff-241
- GDC, Scott Rigby, intrinsic/extrinsic motivation and autonomy, relatedness, mastery: https://www.gdcvault.com/play/1015985/Intrinsic-and-Extrinsic-Player-Motivation

## Current foundation

Modern vector cutaways; animated directional residents; office/café activities; validated construction; building inspector; browser autosave, backup and portable saves; following; waypoint navigation; live optional community goals in Town. Goals show current conditions, not permanent achievements, and recompute from restored saves without a schema migration.

## Next candidates, selected after inspecting current behavior

1. Better crowd/doorway navigation, furniture avoidance and queue clarity.
2. More meaningful construction and employment choices. Office vacancies now recruit available adults.
3. Resident stories and a readable timeline of meaningful events.
4. Deliberate progression and visible town improvements, preserving sandbox freedom.
5. Environment depth and ambient activity, with performance and mobile checks.

Known limits: no crowd collision solver or complete per-furniture physics; random economy and rapid aging still need balance work. Do not call these solved until verified. See REVIEW.md for update history.

## Resident activity and scalable customization direction

Latest owner feedback: residents were too tall, static scenery alone is insufficient, and equipment/actions should be visible (night police flashlight patrols, social gestures, running, future bicycle/car journeys). Preserve the map direction while deepening inhabitants and player customization.

Implemented foundation: compact resident geometry; a shared behavior module for on-duty patrol eligibility, patrol waypoints, walk/run modes and clipped light cones; physical sidewalk patrol routes; home finish definitions and validated optional per-home saved style. Changing finishes recolors walls, floors, sofa and bedding. This is a finish selector, not free furniture placement. Night beams approximate building walls using ray tests; they do not model furniture shadows, light bouncing or a visibility/security gameplay system.

### Architecture gates for the next systems

- **Furniture:** store catalog type, local room position and rotation on the building; one definition must own rendered footprint, collision footprint, seat/work interaction anchor and clearance. Placement previews and simulation targets must use the same definition. Validate a route from the entrance to required stations before committing a layout. Keep default legacy rooms when custom furniture data is absent. Do not let a cosmetic editor strand residents.
- **Home upgrades:** define explicit room/footprint stages, check the new footprint against streets/neighbors before spending money, and apply room, capacity and station changes as one transaction. Existing autonomous capacity increments do not currently expand the house or its fixed furniture. A full upgrade UI is not yet implemented.
- **Bicycles:** model a journey with walking to a parked bike, mounting, a supported path, dismounting and final walking. Rendering must follow actual movement state, not a bike sprite over a pedestrian route. Preserve road crossing rules and coordinate arrival with service/work tasks.
- **Cars:** require a road-lane graph, parking spaces, turn/junction rules, occupancy and a walking segment on either end. Existing decorative parked cars are not resident-owned vehicles. Do not label scenic traffic as resident transport.
- **Map expansion:** current saves use percentages of a fixed 2300 × 1600 map. Changing WORLD dimensions would stretch all positions. First introduce stable world-unit coordinates and a versioned old-save migration, then chunked scenery/navigation invalidation and buildable district boundaries. Make renderer, movement, placement and save validation consume the same world specification.
- **Performance:** keep static scenery cached; animate only activity layers; avoid entire-map invalidation for one edited room. Benchmark dense crowds before adding transport or larger districts.

Additional research consulted:
- Factorio shared animation/model/material pipeline: https://www.factorio.com/blog/post/fff-218
- Project Zomboid visible equipment and distinct movement states: https://projectzomboid.com/blog/status-and-build-history/
- EA's separate Build Mode object controls: https://help.ea.com/en/articles/the-sims/the-sims-4/make-objects-bigger/

## Robbery encounter foundation

Owner clarification: a robber can fail, lose their nerve and surrender to a nearby officer, then go to jail without a shootout. Crime now has explicit approach, threat, response, confrontation and aftermath phases in `crime.js`. `movement.js` obeys encounter directives before daily targets; `crime-art.js` draws effects from the encounter clock and recorded shot. The hood/mask, weapon and fear/surrender poses are render options, not permanent changes to a resident's identity. Only a physically close, on-duty officer can trigger an arrest/surrender decision. Outcome settlement owns money, jail and death exactly once. See REVIEW.md for current probabilities and skip/save behavior.

Future crime work should extend this encounter model rather than adding a second hourly outcome path. Keep meaningful results tied to physical actors and recorded actions. A police escort requires a shared walking/jail handoff state; disguises affecting identification require actual witness/perception data. Do not claim either from the current cosmetic disguise. Continue using the same movement clock for effects and pause/save behavior. Keep fixtures out of `dist/` and keep ordinary saves readable.
