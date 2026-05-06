# Changelog

## [2.2.0] - Career Progression & Desperate Gambling

### Added
- **Job promotion system**: Workers can now get promoted with salary increases!
  - 3 levels for each job type (entry → senior → manager/lead/executive)
  - Office Clerk: $16 → $24 → $35/hour
  - Analyst: $22 → $32 → $45/hour
  - Server: $14 → $20 → $30/hour
  - Cook: $18 → $28 → $40/hour
  - Promotion requirements: 70+ happiness, $100+ money, 15% daily chance
  - Promotions give +20 happiness and $50 bonus
- **Final desperate gamble**: When happiness hits 0, people bet EVERYTHING at casino
  - All-in bet with their entire balance
  - 49% chance to win double and save their life (+60 happiness)
  - 51% chance to lose everything and likely die
  - Dramatic last-chance mechanic for desperate situations
- Gambling addiction now affects promotion eligibility (addicts spend money)

### Changed
- Entry-level jobs now properly assigned to new adults and starting characters
- Job system expanded from 4 jobs to 12 jobs (3 levels each)
- Casino becomes even more important for desperate people
- Higher-paid workers can sustain gambling addictions better

### Technical Details
- Added `nextPromotion` field to job definitions
- Added `entryLevelJobs` array for initial job assignment
- Added `checkPromotions()` function in `app.js`
- Updated job assignment in `people.js` and `simulation.js`
- Enhanced desperate gambling logic with all-in mechanic

## [2.1.0] - Children & Family System

### Added
- **Children system**: Couples can now have children!
  - 10% chance per day for couples
  - Children grow up and become adults at age 18
  - Children automatically get jobs when they turn 18
  - Children stay at home or play in town square
  - Parents feed their children
- **Dead body removal**: Dead people are removed from the simulation after 3 days
  - Bodies are "laid to rest at the graveyard" with a log message
  - Cleans up relationships, motion data, and speech data
  - Prevents clutter and keeps the simulation running smoothly
- **Lowered romance thresholds** for faster couple formation:
  - Crush threshold: 25 → 15
  - Couple friendship threshold: 35 → 25
  - Couple romance threshold: 45 → 30
- **Desperate entertainment priority**: People with low happiness now prioritize entertainment/gambling before dying
  - Desperate people (happiness ≤ 30) go to casino/cinema/mall from 10am-11pm
  - Can potentially save themselves by winning at casino
  - Gives people a chance to recover before suicide
- Child indicator in UI (purple "Child" chip)
- Parent information shown in child details
- Age-based job assignment for new adults

### Changed
- Romance develops faster between compatible characters
- Children have simplified needs (no work, less complex behavior)
- UI shows age and child status clearly
- Death tracking now includes `deathDay` property
- Suicide threshold increased from 4 hours → 6 hours depressed
- Suicide chance decreased from 40% → 35%

### Technical Details
- Added `createChild()` function in `people.js`
- Added `checkPregnancies()` function in `app.js`
- Added `removeDead()` function in `app.js`
- Added child growth logic in `simulation.js`
- Updated rendering to handle children properly
- Children tracked with `isChild` flag and `parentAId`/`parentBId`
- Dead people tracked with `deathDay` property
- Automatic cleanup of dead people after 3 days

## [2.0.0] - Modular Refactor

### Changed
- **Complete modular refactor**: Split 1,280-line monolithic file into 10 focused modules
- Project now uses ES6 modules for better maintainability
- Requires local server to run (ES6 module requirement)

### Added
- `src/app.js` - Main application and initialization
- `src/constants.js` - Game configuration
- `src/utils.js` - Utility functions
- `src/state.js` - State management
- `src/people.js` - Character system
- `src/relationships.js` - Social dynamics
- `src/simulation.js` - Core game loop
- `src/interactions.js` - Conversation system
- `src/render.js` - UI rendering
- `src/animation.js` - Movement and animations
- `HOW-TO-USE.md` - Comprehensive usage guide
- `start-dev.sh` - Easy server startup script

### Removed
- `simulator.js` - Replaced by modular structure
- `index-old.html` - No longer needed

## [1.1.0] - Gender Compatibility

### Added
- **Gender compatibility for romantic relationships**: Characters can now only form romantic relationships with opposite genders
  - Romance points only increase between male-female pairs
  - Same-gender characters can still be close friends but won't develop crushes or become couples

### Technical Details
- Added `gendersCompatible` check: `personA.gender !== personB.gender`
- Romance gain is now conditional on gender compatibility
- Couple formation requires `gendersCompatible` to be true
- Same-gender friendships remain unaffected

## [1.0.0] - Initial Release

### Features
- 15 unique characters with traits, skills, and genders
- Dynamic AI behavior based on needs (hunger, energy, happiness)
- Relationship system with friendship, romance, and conflict
- Economic system with jobs and money management
- Town infrastructure (houses, offices, restaurant, town square)
- Real-time character movement and animations
- Interactive UI with detailed character information
- Conversation system with context-aware dialogue
- Health mechanics (sickness, depression, death)
- Configurable simulation speed and parameters
