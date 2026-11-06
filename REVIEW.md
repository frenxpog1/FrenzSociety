# Current update — resident recovery and interface polish

A resident leaves their routine for a robbery only after the encounter reserves both participants. Failed approaches and time skips let their normal decision continue. Hungry residents can work to pay for food, and job seekers can earn the cost of a meal maintaining Town Square when the treasury can pay. Police receive their shift pay while patrolling or stationed. Residents who can afford a needed meal eat before gambling or seeking a target.

The interface uses layered green and brass controls, brighter clock text, clearer selection and portrait cards with separate cash and needs. Walking and running use actual distance travelled to advance the stride. Knee lifts and arm swings differ between walking and running. Town maintenance has its own broom pose.

The 81 automated checks cover rejected and competing robbery attempts, hour skips, pay and food recovery, the treasury balance, and existing saves. The desktop and phone-width previews covered the HUD, resident cards, following, and placement controls. A deterministic browser scenario confirmed a job seeker earned $8 from zero cash and appeared sweeping in the square. Residents can still overlap when they share a narrow path.

---

# Current update — resident tracking and gameplay fixes

Click a living resident on the map, in the resident list, or in a building profile to follow them. The compact tracking card shows their activity and needs and opens their profile. Deliberate panning or the stop button releases the camera. Selecting a resident brings back interiors so they remain visible at home and work. The phone-width view starts closer to the neighborhood.

The gameplay review corrected conversations between residents still travelling, café queues blocked by distant customers, distant targets in the desperate robbery path, and missed mourning for deaths during the daily update. Explicit hour skips reconcile travel even when the town is running. Activity labels show travel until a resident arrives. Office openings recruit available adults and show vacancies in the building profile. Hiring respects each office's capacity and preserves existing staff.

All 78 automated checks pass, including office hiring, save restoration, movement, relationships, crime and the 40-day simulation. Desktop and phone-width browser checks covered resident selection, the follow card, profile access, and map framing. Office hiring and vacancy counts were verified in automated checks. Crowded rooms can still have overlapping residents, and building expansion still uses fixed room layouts.

---

# Current update: staged robberies and surrender

Robberies now involve nearby outdoor adults instead of resolving across the entire map. A temporary dark hood and face covering replace the robber's work outfit. The robber approaches with a knife or pistol; the victim raises their hands. An available, on-duty officer within 220 world units physically responds. Once close enough, the robber may lose their nerve, lower the weapon and surrender. Ordinary low-confidence robbers have a 68% surrender chance, declining to 28% at confidence 20; serial killers have a much lower chance. Peaceful surrenders preserve the victim's money and assign the existing 3-day jail sentence. Armed resistance retains dangerous outcomes, with non-graphic muzzle flash, tracer, recoil and smoke only for an actual pistol shot. Police no longer randomly use lethal force against a compliant robber.

One encounter owns its actors until the scene ends; ordinary scheduling and conversations do not overwrite it. Pausing freezes its clock. Active encounters and pending deaths are optional, validated fields in version-1 saves, so old towns remain readable. Money and jail outcomes apply once. Explicit hour/day skips dismiss undecided approaches and settle already decided confrontations before advancing the clock. The aftermath then releases its actors; the prisoner physically travels to jail using normal navigation. Unreachable/expired approaches cancel without charging the victim.

Validation: 69 automated checks pass, including physical response, confidence-based surrender, jail and actor release, paused and unfinished-save round trips, no duplicate money transfer after loading an aftermath, invalid encounter rejection, firearm/knife effects and controller time-skip/restart behavior. The existing 40-day simulation, character, restaurant, economy and save checks also pass. Browser inspection verified threat/surrender/shot artwork by day and night, then the actual game animation, journal entry and physical jail occupancy using a deterministic fixture with autosave blocked. No game-origin errors observed; browser-extension metadata errors were unrelated to the game. No fresh mobile verification. Production build passes.

Limits: outdoor encounters only; no crowd collision, witness investigation, carried inventory, dropped-weapon pickup, police escort or new health system. Hour/day skips abstract unfinished scenes rather than animating an entire skipped hour. Disguises are visual encounter equipment, not a separate identity-detection mechanic.

---

# Current update: compact residents, night patrol and home finishes

Standing residents have shorter legs and a more compact body relative to furniture. Running-errand states use faster movement and a separate stride cadence; nearby talking residents turn toward each other without the side-view idle pose overwriting their gestures. Police marked On Patrol physically travel a sidewalk circuit while on duty. At night, held flashlights project directional cones clipped against building footprints. Patrol status is shown in the follow view and no longer counts as an incoming square visitor.

Home building profiles now offer Willow, Coastal and Terracotta finishes, recoloring floor, wall accent, primary bedding and sofa. The optional interiorStyle save field is validated; existing saves retain the default. Full furniture movement, geometric house upgrades, bikes, cars and district expansion are not implemented. DEVELOPMENT.md records their shared-data, collision, navigation and migration prerequisites.

Validation: 59 automated checks pass, including patrol eligibility, physical patrol travel and off-duty transition, beam direction/wall clipping, new home finish round trips, legacy defaults and rejection of unsupported themes. Existing 40-day simulation and service/persistence checks also pass. Browser inspection verified the home selector and visible palette change, plus compact characters, equipment and talking poses in a fixed night rendering fixture. No application errors observed. No fresh mobile verification in this pass.

---

# Current update: landscaped map details

The map adds pocket gardens, picnic furniture, flower/shrub islands, river reeds, bank rocks, water lilies, ripples, intersection nameplates, flush drainage grates and utility covers. A deterministic scenery planner checks building clearances, roads and entrance route segments. New construction takes precedence over decorative plots; plots are derived scenery, not saved buildings or interactive amenities. Tree canopies are excluded from those plot footprints.

Validation: 55 automated checks pass, including deterministic plot placement, road/building/entrance clearance and replacement by construction. Desktop browser screenshots reviewed at town scale and zoomed street scale; no application errors observed. The production build passes. This pass does not add collision physics, interactive picnic behavior, or a fresh native-mobile verification.

---

# Current update: community goals and continuing direction

Town now includes four optional live goals: housing, food, happiness and friendships, with current progress and shortcuts to residents, the café and square. These reflect present conditions, not permanent achievements. They derive from existing save data and require no save format change. DEVELOPMENT.md records the owner's continuing November direction, design references, release safeguards, known limits and next candidates.

Validation: 53 automated checks pass. New goal coverage includes restored-state equivalence, living-resident filtering, real homes, friendship eligibility, empty towns and bounded progress. Desktop browser review confirms the goal layout and café shortcut using an existing saved town. This pass has not had a fresh native-mobile test.

---

# Current update: smoother travel and clearer café space

Travel now uses world distances instead of map percentages, giving equal walking speeds on both axes. A frame can consume several route waypoints, so lower frame rates no longer force a stop at every corner. Arrival poses require physical proximity to the station. Café dining anchors match the drawn chairs; pickup overflow no longer shares the ordering line, and finished diners/social groups use spaced front gathering positions. Focusing a building reuses the town scenery cache rather than regenerating the entire neighborhood.

Validation: 50 automated checks cover equal travel speed, frame partition invariance across corners, exact station arrival, and all previous simulation/save/service checks. This is still waypoint navigation, with no resident-to-resident collision solver.

---

# Current update: natural residents and lived-in rooms

Residents now use smaller tapered faces, balanced adult proportions, independent skin/hair/clothing variation, five directional hairstyles, glasses, layered outfits and job uniforms. Walking uses alternating articulated limbs; sitting, typing, reading, eating and cooking have separate poses. Portraits in resident lists and profiles use the same identity as the map character and remain stable through saved games.

Residents render from back to front. Countertops and café tables join the depth pass, occupied office chairs cover seated waists, and carried meals stay attached to the person. Pointer selection uses the visible body, including the head, rather than a small circle at the feet. Roof-hidden residents cannot intercept clicks. Rooms add varied computer documents and charts, stationery, books, wall clocks synchronized with town time, menus, cutlery, framed pictures and kitchen details. Frontages add mailboxes, house numbers, flower boxes and bicycles; trees have irregular canopies.

`npm test`: 47 passing checks. New checks cover identity stability after serialization and need changes, picking bounds for adults/children/seated/sleeping/dead residents, and finite draw geometry with balanced canvas transforms across all directional poses and uniforms. Existing service, save, construction, placement and 40-day simulation coverage remains in place. Browser review covers the character set, occupied office, café counter layering, head selection, portraits, live movement, roof switching and the embedded 390-pixel mobile view. These are illustrated vector characters; crowd and furniture collisions remain the existing simulation limits.

---

# Current update: plan, build and inspect

Expansion now has a visible placement preview, explicit confirmation, keyboard positioning, cancellation, and a suggested clear lot. Homes and offices join schools and churches in the Build menu. Confirmation rechecks the real footprint and the 100-building save limit; previews never enter the live building list or a save. Buildings can be inspected from the map or the Town selector. Their profiles distinguish physical occupants, arrivals, departures, housing capacity, workstations, staff and meal activity, with links to resident profiles. The focused camera now recenters when a drawer changes the playfield width.

`npm test`: 44 passing checks. Added coverage includes cancelling and confirming construction, stale previews, blocked roads/lots, invalid types and coordinates, capacity limits, preview rendering, and presence versus destination in building profiles. Desktop/mobile browser checks cover road rejection, suggested placement, confirmation, reload persistence, keyboard cancellation, the live office roster and resident navigation. The original simulation balance and furniture collision limits remain as documented in ART_DIRECTION.md.

---

# Current update: save, follow and observe

This version adds browser autosave, portable JSON saves, previous-save recovery, paused restoration, a resident-follow camera with live activity and meal progress, evening lighting, and a quiet default event journal. The café accepts a new order while an earlier customer waits at pickup. Paused hour/day skips now place residents at the activity being displayed.

`npm test`: 38 checks, including a 40-day town save round trip, finances, movement and meal restoration, quota failures, corrupt JSON and versions, duplicate IDs/seats, unsafe keys, invalid locations/jobs, preserved backups, and the existing placement/service tests. Browser checks cover follow, manual save, reload at the saved hour, backup recovery, JSON export, new-town cancellation and mobile controls. Save-file validation is tested directly; file selection/import has not been tested on every browser or native device.

See [ART_DIRECTION.md](ART_DIRECTION.md) for persistence limits. The following sections record prior iterations and their historical test counts.

---

# Current update: modern streets and validated lots

The current edition replaces the pixel rendering with original vector characters, furniture, contemporary roof details and a lighter interface. Streets include asphalt, curbs, sidewalks, crossings, stop markings, lighting, benches, parked cars and planted corners. Room close-ups draw directly at display resolution; the distant scenery cache is rendered at higher resolution.

The original map coordinates left too little space after interiors grew. Initial buildings now use a larger planned layout. Shared footprint validation rejects neighbors, streets and world edges; expansion has no random overlap fallback. Home construction charges only after a valid lot is found. Entrances and residents use obstacle-aware pedestrian paths around other buildings, favoring sidewalks and marked crossings.

`npm test`: 25 passing checks, including all initial footprints, map saturation, refusal to charge on a full map, entrance connectivity, an office-to-café path, the staffed service integration, and the earlier 40-day controller run. Desktop/mobile browser checks cover the new render, room focus, roof/interior switching and expansion controls. See [ART_DIRECTION.md](ART_DIRECTION.md) for current limits.

The following sections record the earlier iterations; their art descriptions and test counts are historical.

---

# Current update: visible interiors and activities

See [ART_DIRECTION.md](ART_DIRECTION.md) for research references, design choices and current limits. This update adds furnished cutaways, directional character poses, workstation and queue navigation, and a staffed café service loop. Static terrain and room art are cached so they are not rebuilt every animation frame.

The regression suite now contains 19 tests, including a movement-and-service integration run, payment and refund rules, physical staff arrival, pause preservation, unique seats, and the earlier 40-day controller run. Browser inspection covers office seating and café service, plus the responsive layout.

---

# Frenz Society review and upgrade

## What changed

The opening screen is now a full canvas town, with a low-profile green and parchment HUD. Seeded terrain, a river, trees, gabled buildings, a fountain, resident sprites, night shading, and road-following movement replace the DOM building cards. Drag, wheel, zoom buttons, fit-to-town, labels, and keyboard camera controls work independently of simulation time. Resident details, statistics, expansion, the journal and settings live in collapsible panels. Mobile starts zoomed into the town and uses an overlay drawer.

New modules separate canvas presentation (`world.js`), interface navigation (`ui.js`), financial settlement (`economy.js`), and movement interpolation (`animation.js`). The simulation remains vanilla JavaScript with no runtime dependency or external asset requirement.

## Confirmed defects fixed

- Add Person called the nonexistent `renderAll`, crashing the action after adding a resident.
- Restart kept mutated buildings, upgrades, treasury, casino funds, queued events and delayed-resume timers. It now restores the initial town and clears event state.
- Population input advertised 30 but silently clamped at 15. Housing assignment also dereferenced a missing house above 20. The supported 10–30 population range now works, and homeless residents remain visible at the square.
- Event dismissal incorrectly resumed a manually paused simulation. It now remembers the prior running state; delayed callbacks are cancelled on restart.
- Winning casino wagers disappeared from the books; payouts credited residents more than the casino could pay. Wagers are credited first, winnings capped, and settlement applied exactly once.
- Treasury redistribution deducted rounded-away shares. Remainders now stay in the treasury.
- Weddings required $10 but deducted $20. Each partner must have the full fee.
- Romance could accumulate for children and parent–child pairs. Immediate-family and child checks apply before romance accumulates.
- Dead partners blocked remarriage and counted as living couples. Partner and couple state is cleared.
- Jailed people could participate in offsite social interactions, act as police, or commit queued robberies. Eligibility uses remaining jail hours rather than an exact status string.
- Homeless residents could receive a null destination and disappear. Home destinations now fall back to the town square.
- Child meals never charged parents. Meal payments are resolved after hourly updates, independently of parent/child update order.
- Graveyard totals were never updated. The count includes present bodies and residents already removed for burial.
- Animation could jump after a background tab resumed. Frame deltas are bounded; movement and simulation clocks are separate.
- The development command could not accept managed preview arguments. A small Node server now supports host and port arguments, and a build script emits only browser assets.

## Validation

`npm test` runs 10 deterministic regression checks, including a seeded 40-day, 30-resident controller simulation. Tests cover housing overflow, night shifts, casino conservation and repeat settlement, treasury rounding, family/child romance exclusions, wedding affordability, jail release, arrival rendering, pause preservation and complete restart.

Browser checks cover the initial canvas scene, the resident profile drawer, paused arrival/event dismissal, zoom controls, time stepping, expansion, and a 390 × 844 embedded mobile viewport. The controller test uses a minimal DOM harness; it is not a substitute for real-browser rendering checks.

## Remaining limits

This review does not establish that every possible bug is eliminated. The inherited simulation is highly random and intentionally accelerated (91 age-days per town day); long-term economy and population balance still need extended playtesting. Road movement is presentation interpolation, not a collision or traffic simulation. Buildings can still exhaust the map's expansion slots. Progress resets on page reload; there is no persistent save system. Native-device touch gestures and every browser/OS combination have not been exhaustively tested. Shared-family meal accounting does not reserve funds between simultaneous child requests, so subsidy/budget behavior for poor households remains a balance issue.

The original GitHub repository is not pushed or overwritten by this change. A separate private playable preview is provided, along with the reviewed source branch.
