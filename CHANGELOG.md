# Changelog

## [2.1.0] - Children & Family System

### Added
- **Children system**: Couples can now have children!
  - 15% chance per day for couples aged 18-45
  - Children grow up and become adults at age 18
  - Children automatically get jobs when they turn 18
  - Children stay at home or play in town square
  - Parents feed their children
- **Lowered romance thresholds** for faster couple formation:
  - Crush threshold: 25 → 15
  - Couple friendship threshold: 35 → 25
  - Couple romance threshold: 45 → 30
- Child indicator in UI (purple "Child" chip)
- Parent information shown in child details
- Age-based job assignment for new adults

### Changed
- Romance develops faster between compatible characters
- Children have simplified needs (no work, less complex behavior)
- UI shows age and child status clearly

### Technical Details
- Added `createChild()` function in `people.js`
- Added `checkPregnancies()` function in `app.js`
- Added child growth logic in `simulation.js`
- Updated rendering to handle children properly
- Children tracked with `isChild` flag and `parentAId`/`parentBId`

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
