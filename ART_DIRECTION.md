# Modern Willow Creek

The current visual direction is a contemporary illustrated 2D neighborhood: smooth vector shapes, softly shaded materials, rounded furniture, restrained highlights, glass and concrete, and a light interface anchored by forest green. Character faces and articulated limbs are vector shapes, not pixel columns. Room geometry still shares the exact workstation and service positions used by simulation.

Streets have separate asphalt, curb and sidewalk dimensions, intersection clearances, zebra crossings, stop markings, lighting, planters, benches, parked cars and bridge railings. Footpaths are generated from entrance-to-pavement routes and avoid occupied building footprints. The same planner routes residents between buildings with a preference for pavement and crossings. This is a pedestrian planner, not a vehicle traffic simulator; parked cars are scenic props.

The map is 2300 × 1600 world units, with extra buildable land. Every building has an actual footprint that includes walls and clearance. Initial placement, expansion and road art use a shared street definition. Invalid placements return no building; there is no unchecked random fallback, and a failed home build does not charge its resident.

Office equipment includes widescreen monitors, keyboards, mouse mats, cups, filing and printing. The café contains stainless kitchen counters, hob, chopping board, sink, refrigerator, espresso machine, till and dining furniture. Roof view has differentiated solar arrays, glazing, terrace details, ventilation, signage and civic markings.

Exterior pedestrian routes use an obstacle-aware grid and a shared route cache. Interior routes use activity anchors and aisle waypoints; they are not full per-furniture collision physics. Crowds do not collide with each other. The café service, economy and needs remain the existing simulation; recipes and ingredient inventory are not implemented. Progress autosaves in the current browser. Save files are portable JSON snapshots, and restored towns start paused. Local storage is not cloud synchronization; download a save before clearing browser data or starting a fresh town.

## Earlier research references

The earlier iteration researched Kenney's character and top-down furniture examples and Ludeon's visible work/needs model. Current game art is original vector drawing; no third-party asset files are bundled.

- https://kenney.nl/assets/roguelike-characters
- https://kenney.nl/assets/top-down-shooter
- https://rimworldgame.com/


## Watch and resume update

Residents can be followed with an eased camera, a planned-route trace, live activity text and meal progress. Default event handling writes to the journal without pausing; Pause for major events restores the interrupting modal behavior. Café customers step aside after ordering so the next customer can use the till while a cook prepares the previous meal. Window and street lighting respond to evening and night.

Save data excludes timers, DOM objects, active popups and absolute wall-clock deadlines. Imports are checked before any current state is replaced, including identifiers, locations, building clearances, finances and dining reservations. Files larger than 2 MB, unsupported versions, more than 600 resident records or invalid job templates are refused. A previous valid autosave is retained for recovery; an unchanged paused town does not churn that backup. Loading recovers a backup if the current save is damaged. If neither save can be decoded, the stored data stays untouched until the player explicitly saves again. Native touch hardware and every browser storage mode have not been exhaustively tested.

## Construction and building profiles

Players can place homes, offices, schools and churches on validated lots. The translucent preview uses the finished building art and the same clearance bounds as placement validation. Confirmation checks again so a resident-built home cannot silently steal a previewed lot. Construction previews and inspector selection are temporary interface state; confirmed buildings persist. The building profile reports physical presence separately from logical destinations and updates twice per second while open. Employment still follows the inherited job assignment system; a new office does not automatically recruit residents.


## Resident illustration and lived-in details

The resident renderer now favors a roughly six-head adult silhouette, a tapered jaw, small facial features and ears, narrow side profiles, and consistent uniform details. Appearance derives from the saved resident ID: skin tone, hair, hairstyle, outfit and glasses vary independently and do not change with needs or random animation frames. Children scale down; seated poses shorten the stance and bend the legs. Portraits reuse the same face and uniform drawing. Walking and task gestures use the simulation activity clock, so pause freezes them.

People are drawn in physical depth order. Café counters and table surfaces are repainted at their own depths; occupied office chair backs cover the seated waist. Meal plates are drawn in the resident's hands while carried and on the table during eating. These are visual occlusion rules, not new physical collisions. Residents still share aisle and queue anchors, so dense crowds can overlap.

New static detail includes computer documents/charts/editors, notebooks, sticky notes, pens, monitor cables, noticeboards, framed home pictures, bedside lamps, table settings, printed menus, numbered mailboxes, planting boxes and bicycles. Town clocks follow the simulated hour. Ready meals appear on the pickup counter. Decorative additions stay inside the existing lot clearance and do not alter building capacity, jobs, saved finances or meal pricing.


## Landscaped map pass

Deterministic pocket gardens, picnic furniture and planted islands introduce local variation without changing the established palette. Plots yield to building expansion and are kept clear of planned entrance routes, roads and buildings. Reeds, rocks, lilies and ripples add riverbank detail; street plates, utility covers and grates add close-range street texture. These are cached cosmetic assets, not additional simulation facilities or obstacles.
