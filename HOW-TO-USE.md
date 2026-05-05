# How to Use Your Modular Simulator

## ✅ What You Have Now

Your simulator is now **fully modular** with clean separation of concerns!

## 🚀 Quick Start

### To Run the Simulator:
```bash
./start-dev.sh
```

Then open: **http://localhost:8000**

That's it! The modular version is now the main version.

## 📂 Modular Structure

```
town-life-simulator/
├── index.html              ← Main entry point
├── styles.css              ← All styling
│
├── src/                    ← Modular source code
│   ├── app.js             ← Main application & initialization
│   ├── constants.js       ← Game configuration
│   ├── utils.js           ← Helper functions
│   ├── state.js           ← State management
│   ├── people.js          ← Character system
│   ├── relationships.js   ← Social dynamics
│   ├── simulation.js      ← Core game loop & person updates
│   ├── interactions.js    ← Conversations & relationship updates
│   ├── render.js          ← UI rendering
│   └── animation.js       ← Movement & animations
│
├── package.json           ← Project config
├── start-dev.sh           ← Easy server start
├── README.md              ← User documentation
├── DEVELOPMENT.md         ← Development guide
└── CHANGELOG.md           ← Change history
```

## 🎯 Module Responsibilities

### `app.js` - Main Application
- Initializes the application
- Manages game loop (advanceHour, processInteractions)
- Handles event listeners
- Coordinates all other modules

### `constants.js` - Configuration
- Character names, traits, skills
- Job definitions
- Building locations
- Game balance values (meal cost, thresholds, etc.)

### `utils.js` - Utilities
- Pure helper functions
- No side effects
- Reusable across modules

### `state.js` - State Management
- Global game state
- DOM element references
- Centralized state access

### `people.js` - Character Management
- Character creation
- Home and job assignment
- Character lookup functions

### `relationships.js` - Social System
- Relationship tracking
- Friendship/romance/conflict calculations
- Relationship queries and summaries

### `simulation.js` - Core Logic
- Person state updates (hunger, energy, happiness)
- Work, sleep, eating logic
- Death conditions
- Building occupancy

### `interactions.js` - Social Interactions
- Conversation topic selection
- Dialogue generation
- Relationship updates (with gender compatibility!)
- Argument logic

### `render.js` - UI Rendering
- Stats display
- Map rendering
- People list
- Detail panels
- Conversations and logs

### `animation.js` - Movement
- Character movement
- Speech bubble animations
- Smooth transitions

## 🔧 Adding New Features

### Example: Add a New Building Type

1. **Update constants.js**:
```javascript
export const buildings = [
  // ... existing buildings
  { id: "park", type: "park", name: "Town Park", x: 30, y: 60 },
];
```

2. **Update simulation.js** (if needed):
```javascript
// Add park-specific behavior in updatePerson()
if (state.hour >= 14 && state.hour <= 17 && next.energy >= 40) {
  next.locationId = "park";
  next.status = "Relaxing at park";
  next.happiness = clamp(next.happiness + 8, 0, 100);
  return next;
}
```

3. **Update styles.css**:
```css
.building.park {
  background: #d4f1d4;
}
```

### Example: Add a New Character Trait

1. **Update constants.js**:
```javascript
export const traits = [
  // ... existing traits
  "Athletic",
];
```

2. **Update simulation.js**:
```javascript
// Add trait-specific behavior
if (next.trait === "Athletic" && state.hour >= 6 && state.hour <= 8) {
  next.energy = clamp(next.energy + 5, 0, 100);
  next.happiness = clamp(next.happiness + 3, 0, 100);
}
```

## 🐛 Debugging

### Browser Console
- Open DevTools (F12)
- Check Console tab for errors
- Use Network tab to see module loading

### Common Issues

**Module not found**:
- Make sure server is running (`./start-dev.sh`)
- Check import paths are correct
- Verify file exists in `src/` folder

**Function not defined**:
- Check that function is exported: `export function myFunction()`
- Check that function is imported: `import { myFunction } from './module.js'`

**State not updating**:
- Verify state mutations happen in correct module
- Check that `render()` is called after state changes
- Use browser debugger to step through code

## 💡 Benefits You Now Have

✅ **Easy to find code** - Each file has one clear purpose  
✅ **Easy to add features** - Know exactly where to add code  
✅ **Easy to debug** - Smaller files, clearer errors  
✅ **Easy to test** - Can test modules independently  
✅ **Easy to collaborate** - Multiple people can work on different modules  
✅ **Better IDE support** - Autocomplete and type hints work better  

## 📝 Development Workflow

1. **Start server**: `./start-dev.sh`
2. **Open browser**: http://localhost:8000
3. **Make changes** to files in `src/`
4. **Refresh browser** to see changes
5. **Check console** for any errors

## 🎉 You're All Set!

Your simulator is now fully modular and ready for easy development. Each module is focused, testable, and maintainable.

**No more 1,200+ line files!** 🚀
