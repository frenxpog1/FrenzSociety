# Frenz Society · Willow Creek

**Development status** · Playable prototype in active development

## Abstract

Frenz Society is a top-down browser sandbox about a town and the people who live in it. Residents make their own decisions as they work, eat, rest, spend money, and form relationships. Their needs, jobs and finances shape the day. A hungry worker might order lunch at the café, a job seeker might take a paid shift in Town Square, and an officer on night patrol might respond to a nearby robbery.

You guide the neighborhood by observing residents, checking how the town is doing, welcoming newcomers, and placing buildings where they can serve the community. Follow one person to see how their day unfolds, or zoom out and look for shared problems such as crowded homes and a shortage of jobs. Optional community goals give you reasons to improve housing, meals, happiness and friendships at your own pace. The game uses original Canvas artwork and runs in the browser without runtime packages.

## Current features

| System | What's playable now |
| --- | --- |
| Living residents | Residents have individual needs, money, jobs, personalities and routines. They can make friends, argue, form couples, raise children, get sick and grow older. The town has a school, hospital, church, casino and graveyard alongside homes and workplaces. |
| Illustrated town | Explore sidewalks, crossings, gardens, picnic spots and the riverbank. Toggle roofs and furnished cutaways. Residents have matching portraits and distinct poses for walking, running, working, cooking, eating, sleeping and sweeping. |
| Work and the economy | Residents earn wages, pay taxes and daily expenses, and can receive promotions. Offices recruit eligible job seekers into vacancies. Hungry workers can take shifts to afford food, and eligible job seekers can earn $8 maintaining Town Square when the treasury has funds. The town can redistribute treasury funds, and the casino has its own bankroll. |
| Staffed café | Customers travel to the café, queue, order from a server, wait for a cook, collect their food and eat at a table. Payment happens once. Customers still travelling cannot hold up the queue. |
| Police and crime | Robberies play out between nearby outdoor residents, and available officers travel to intervene. A robber can surrender peacefully. An ordinary surrender keeps the victim's money safe and leads to three days in jail. A failed attempt lets the resident return to their routine. Night patrols carry directional flashlights. |
| Construction and interiors | Place homes, offices, schools and churches with a lot preview and placement checks. Inspect who's present, who's coming, housing capacity, staff, vacancies and café orders. Select Willow, Coastal or Terracotta finishes for homes. |
| Observation and progress | Follow a resident with a camera card that shows their current activity and needs. Review town statistics and live goals in **Town**, and read conversations and major events in **Journal**. |
| Time and saves | Pause, resume, change speed, or step by an hour or day. The town autosaves locally and supports portable JSON saves and backup recovery. |

## How to play

### Start the game

Use Node.js 18 or later. From the project folder, run:

```bash
npm start
```

Open [http://127.0.0.1:8000](http://127.0.0.1:8000). The local server lets the browser load the game's JavaScript modules.

### Your first day

1. **Watch someone work.** Click a living resident on the map or choose one in **Residents**. The camera follows them, and the follow card shows their needs and activity. Open **Profile** for details such as their job, household and relationships.
2. **Look inside the café.** Use the **Café** shortcut, then select the building to inspect it. Watch orders move from the counter to the kitchen and tables as time passes.
3. **Pick a town goal.** Open **Town** to see current housing, meal, happiness and friendship goals. The progress changes as residents go through their day.
4. **Expand the neighborhood.** Open **Build**, choose a home, office, school or church, and select a lot. Green means the lot is clear. Use **Find open lot** for a suggestion, then confirm with **Build here**. Construction is free in the current sandbox. You can also choose **Welcome a neighbor** in the Build panel.
5. **See what changed.** Let time run or step forward, then inspect a building or open **Journal**. Check who moved in, where people are working, or what happened while you were following someone.

### Controls

| Action | Mouse, touch or keyboard |
| --- | --- |
| Pan and zoom | Drag the map. Scroll or use **+ / −** to zoom. With the map focused, arrow keys pan and **Home** resets the view. |
| Follow or stop | Select a living resident on the map, in **Residents**, or in a building profile. Drag the map, press **Escape**, or use **×** on the follow card to stop. |
| Inspect buildings | Select a building on the map or use **Town → Inspect a building**. Use **Labels** and **Interiors** to adjust the map view. |
| Place a building | Click or tap a lot. With the map focused, arrow keys move the preview, **Shift** moves it farther, **Enter** confirms, and **Escape** cancels. |
| Change time | Use **Pause / Resume**, **+1 hour**, or **+1 day**. **Space** toggles pause when the map is focused. **Settings** controls speed, event pauses, lifespan and starting population. |

### Save and return

The town autosaves in your browser and restores paused. Use **Settings → Save now** to save immediately, **Download save** to export a JSON file, **Load save** to import it, or **Restore backup** to recover an earlier save. Exporting lets you move your town between devices. Clearing your browser's site data removes the local saves.

## Development roadmap

The game is in active development. These are planned improvements and longer-term ideas.

| Priority | Planned feature or improvement | What it would add |
| --- | --- | --- |
| Near term | **Crowd movement and furniture clearance** | Better spacing on narrow paths, at doors and in queues, plus routes that take furniture footprints into account. |
| Near term | **Simulation balance and reliability** | Improve aging, household costs, food recovery, wages and the pace of major events. Keep existing towns readable as saves evolve. |
| Near term | **Animation, UI and mobile polish** | More visible everyday activities, clearer feedback when residents change plans, richer street detail and better performance in busy scenes. |
| Planned | **Resident stories and town progression** | Personal timelines for jobs, moves, relationships and major events. More meaningful community milestones and choices about how the town grows. |
| Planned | **Furniture and home upgrades** | Place and rotate furniture, expand homes, and give residents usable paths to beds, seats and workstations after a layout change. |
| Longer term | **Bicycles and cars** | Resident journeys that include finding a vehicle, following appropriate paths or roads, parking, and walking to the final destination. |
| Longer term | **New districts** | More room for neighborhoods and landmarks, with navigation, rendering and save support for a larger map. |

Residents can currently overlap in tight spaces. Home finishes change the look of fixed room layouts, and the cars and bicycles on the map are scenery. See [DEVELOPMENT.md](DEVELOPMENT.md) for the roadmap and implementation details.

## Project setup and testing

```bash
npm test       # Run the regression suite
npm run build  # Prepare the static game in dist/
```

Serve `dist/` on a static host for the production build. The game update passed 81 automated checks covering resident behavior, economy, construction, café service, crime and save restoration.

| Area | Files |
| --- | --- |
| App shell and controls | `index.html`, `styles.css`, `src/app.js`, `src/ui.js` |
| Resident decisions and money | `src/simulation.js`, `src/economy.js`, `src/employment.js` |
| Movement, café and crime | `src/navigation.js`, `src/movement.js`, `src/activities.js`, `src/crime.js` |
| Canvas art and animation | `src/world.js`, `src/characters.js`, `src/room-art.js`, `src/animation.js` |
| Saves and regression checks | `src/persistence.js`, `tests/` |

See [REVIEW.md](REVIEW.md) for completed updates and verification, and [ART_DIRECTION.md](ART_DIRECTION.md) for the visual design.
