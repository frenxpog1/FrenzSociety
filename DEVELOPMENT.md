# Development Guide

## Project Structure

```
town-life-simulator/
├── index.html              # Original single-file version (works without server)
├── index-modular.html      # Modular version (requires server)
├── simulator.js            # Original monolithic code
├── styles.css              # All styling
├── package.json            # Project configuration
├── src/                    # Modular source files
│   ├── app.js             # Main application (copy of simulator.js for now)
│   ├── constants.js       # Game constants and configuration
│   ├── utils.js           # Utility functions
│   ├── state.js           # Global state management
│   ├── people.js          # Character management
│   └── relationships.js   # Relationship system
└── README.md              # User documentation
```

## Running the Project

### Option 1: Original Version (No Server Required)
Simply open `index.html` in your browser:
```bash
open index.html
```

### Option 2: Modular Version (Requires Server)
Start the development server:
```bash
npm run dev
# or
python3 -m http.server 8000
```

Then open http://localhost:8000/index-modular.html in your browser.

## Development Workflow

### Adding New Features

1. **For quick prototyping**: Edit `simulator.js` directly
2. **For production**: Break features into modules in `src/`

### Module Structure (Future Refactoring)

The `src/` folder contains the foundation for a fully modular version:

- **constants.js** - All game configuration values
- **utils.js** - Pure utility functions
- **state.js** - Global state and DOM references
- **people.js** - Character creation and management
- **relationships.js** - Social dynamics
- **simulation.js** (to be created) - Core game loop
- **interactions.js** (to be created) - Conversation system
- **render.js** (to be created) - UI rendering
- **animation.js** (to be created) - Movement and animations

### Next Steps for Full Modularization

1. Extract simulation logic from `app.js` into separate modules
2. Create proper imports/exports for all functions
3. Add JSDoc comments for better IDE support
4. Consider adding TypeScript for type safety
5. Add unit tests for core logic

## Debugging

### Browser Console
Open DevTools (F12) to see any errors or logs.

### Common Issues

**Module not found errors**:
- Make sure you're running a local server
- Check that file paths in imports are correct

**Functions not defined**:
- Ensure all imports are at the top of files
- Check that exports match imports

**State not updating**:
- Verify state mutations are happening correctly
- Check that render() is called after state changes

## Performance Tips

- The simulation runs at configurable speeds (0.5x to 30x)
- Animation uses requestAnimationFrame for smooth 60fps
- State updates happen on fixed intervals (hourly ticks)
- Conversations are throttled to prevent UI overload

## Code Style

- Use ES6+ features (const/let, arrow functions, destructuring)
- Keep functions small and focused
- Use descriptive variable names
- Add comments for complex logic
- Follow the existing code style

## Git Workflow

```bash
# Make changes
git add .
git commit -m "feat: add new feature"
git push origin main
```

## Future Enhancements

See README.md for a list of potential features to add.
