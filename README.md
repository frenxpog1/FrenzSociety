# Frenz Society · Willow Creek

Frenz Society is a browser-based town simulator. Follow residents through work, meals, friendships and family life, inspect furnished buildings, and expand the neighborhood one lot at a time. The game uses original Canvas artwork and runs in the browser with no runtime packages.

## Quick start

Use Node.js 18 or later. From the project folder, run:

```bash
npm start
```

Open [http://127.0.0.1:8000](http://127.0.0.1:8000). Use the local server so the browser can load the game's JavaScript modules.

```bash
npm test       # Run the regression suite
npm run build  # Prepare the static game in dist/
```

Serve `dist/` on a static host to run the production build.

## Play the town

| Action | Controls |
| --- | --- |
| Explore | Drag the map to pan. Use the wheel or **+ / −** to zoom. With the map focused, arrow keys pan and **Home** resets the view. |
| Follow a resident | Select a living resident on the map, in **Residents**, or in a building profile. The camera follows them and shows their activity, needs and meal progress. Open **Profile** for more details. Drag the map, press **Escape**, or use the stop button to release the camera. |
| Inspect a building | Select it on the map or choose it in **Town**. The profile shows who is inside, who is arriving, and relevant capacity, staff or meal information. **Office**, **Café** and **Home** are quick camera shortcuts. |
| Change the view | Use **Labels** and **Interiors** to control map labels and roof cutaways. On a narrow screen, the initial camera opens closer to the neighborhood. |
| Control time | Use **Pause / Resume**, **+1 hour**, or **+1 day**. **Space** toggles time when focus is on the map. **Settings** controls speed, event pauses, lifespan and starting population. |
| See town progress | **Town** shows live goals for housing, food, happiness and friendships. **Journal** records conversations and major events. |

## What's new in Willow Creek

### Map, buildings and homes

- The illustrated map includes sidewalks, crossings, a riverbank, gardens, picnic spots, street signs and night lighting. Furnished cutaways show workplaces, the café, homes and other public buildings.
- **Build** offers homes, offices, schools and churches. Choose a building, select a clear lot, then choose **Build here**. Green and red outlines show whether the placement is valid. Use **Find open lot** for a suggestion, arrow keys to move the preview, **Enter** to confirm, and **Escape** to cancel. Construction is free in this sandbox.
- New offices recruit eligible job seekers into available positions. Building profiles show job openings and staff assignments. Homes offer Willow, Coastal and Terracotta finishes for walls, floors and furnishings.

### Residents, work and the café

- Resident cards show matching portraits, cash, current activity, hunger, energy and mood. Green and brass controls, layered panels and a clearer clock frame the playable map.
- Residents follow pedestrian routes around buildings and use distinct walking and running strides. Poses cover talking, typing, reading, cooking, serving, eating, sleeping and sweeping. Café tables and counters layer over characters as they move through the room.
- Customers walk to the café, queue, order from a server, wait for a cook, collect their meal and take a table seat. Payment happens once, and a customer still walking to the café cannot block someone already waiting.
- Hungry residents can earn wages to pay for food. Eligible job seekers can earn **$8** maintaining Town Square when the treasury can cover the shift. Police receive shift pay while patrolling or at the station. Residents can still form relationships, raise families, get promoted and visit the casino.

### Crime and public safety

- Robberies play out between nearby outdoor residents. A robber can wear a hood and face covering, approach with a knife or pistol, and frighten the victim. Available officers physically respond when close enough.
- Robbers can lose their nerve, lower their weapon and surrender without a shootout. An ordinary surrender preserves the victim's money and leads to three days in jail. Actual pistol shots have a brief flash, recoil and smoke.
- A robbery reserves its participants only when the encounter can start. Failed attempts let residents continue their normal routines. Night patrols use directional flashlights that stop at building walls.

## Saves and settings

The town autosaves in the current browser and restores paused. In **Settings**, use **Save now**, **Download save**, **Load save**, or **Restore backup**. A downloaded JSON save lets you move a town between browsers or devices. Clearing the browser's site data removes its local saves.

Save validation checks residents, buildings, placements, and active activities or encounters before restoring the town. Saved layouts and home finishes travel with the save file.

## Development

| Area | Files |
| --- | --- |
| App shell and controls | `index.html`, `styles.css`, `src/app.js`, `src/ui.js` |
| Resident decisions and money | `src/simulation.js`, `src/economy.js`, `src/employment.js` |
| Movement, café and crime | `src/navigation.js`, `src/movement.js`, `src/activities.js`, `src/crime.js` |
| Canvas art and animation | `src/world.js`, `src/characters.js`, `src/room-art.js`, `src/animation.js` |
| Saves and regression checks | `src/persistence.js`, `tests/` |

The latest game update passed 81 automated checks. Coverage includes economy and recovery, resident decisions, construction, staffed café service, police response, surrender, and save restoration. See [REVIEW.md](REVIEW.md) for the change history and verification, [ART_DIRECTION.md](ART_DIRECTION.md) for the visual design, and [DEVELOPMENT.md](DEVELOPMENT.md) for planned work.

Crowds can still overlap on narrow routes. Room layouts use fixed furniture positions, and the cars and bicycles on the map are scenery.
