# Town Life Simulator

A browser-based life simulation game where you can watch AI-driven characters live their daily lives in a small town. Characters work, eat, socialize, form relationships, and navigate the challenges of survival and happiness.

## 🎮 Features

### Dynamic Character Simulation
- **15 unique characters** with distinct names, traits, skills, and genders
- **Autonomous behavior** - characters make decisions based on their needs (hunger, energy, happiness)
- **Aging system** - characters age day by day and eventually die of old age
- **Health mechanics** - characters can become sick from prolonged unhappiness

### Social Dynamics
- **Relationship system** with friendship, romance, and conflict metrics
- **Dynamic conversations** - characters talk about work, food, mood, health, and more
- **Romantic relationships** - characters can develop crushes and become couples
- **Close friendships** - characters form bonds and prefer spending time with friends
- **Conflicts** - stressed or unhappy characters may argue, potentially becoming enemies

### Economic System
- **Jobs** - 4 different job types (Office Clerk, Analyst, Server, Cook) with varying wages
- **Money management** - characters earn wages and spend money on food
- **Overtime work** - characters work extra hours when money is low
- **Hunger mechanics** - characters must buy meals or risk starvation

### Town Infrastructure
- **10 houses** with limited capacity
- **2 offices** providing employment
- **1 restaurant** for meals and socializing
- **1 town square** for relaxation and social gatherings

### Visual Features
- **Interactive map** with animated character tokens
- **Real-time movement** - characters move between locations based on their activities
- **Speech bubbles** - see what characters are saying during conversations
- **Color-coded status** - visual indicators for working, eating, sleeping, sick, etc.

## 🎯 How to Play

### Getting Started

**Run the Development Server:**
```bash
./start-dev.sh
# Or manually: python3 -m http.server 8000
```

Then open **http://localhost:8000** in your browser.

The simulation starts automatically with 12 characters.

### Controls
- **Pause/Resume** - Stop or continue the simulation
- **Step 1 Hour** - Advance time by one hour manually
- **Restart** - Reset the simulation with new characters
- **Speed** - Adjust simulation speed (Slow, Normal, Fast, Very Fast, Turbo)
- **Old Age Death** - Set the age at which characters die (45-120 years)
- **Humans** - Set initial population size (10-15 characters)

### Monitoring
- **Town Stats** - Track alive, housed, employed, hungry, average money, happiness, and couples
- **Town Map** - Click on character tokens to select and view details
- **People List** - Browse all characters with their current status and stats
- **Selected Person Panel** - View detailed information about a selected character
- **Conversations** - Read recent conversations between characters
- **Town Log** - Review important events (deaths, relationships, job changes)

## 🏗️ Technical Details

### Architecture
- **Pure vanilla JavaScript** - No frameworks or dependencies
- **Event-driven simulation** - Time advances hourly with character state updates
- **Relationship graph** - Tracks all pairwise relationships between characters
- **State management** - Centralized state object for simulation data

### Key Mechanics

#### Character Needs
- **Hunger** - Increases over time, must be satisfied by buying food
- **Energy** - Decreases during activities, restored by sleeping
- **Happiness** - Affected by social interactions, work, and basic needs

#### Daily Schedule
- **6:00-8:00** - Wake up, morning routine
- **9:00-17:00** - Work hours (varies by job)
- **12:00** - Lunch break and socializing
- **17:00-21:00** - Free time, socializing, dates
- **22:00-6:00** - Sleep

#### Death Conditions
- Old age (configurable threshold)
- Starvation (missing too many meals)
- Sickness combined with severe unhappiness

#### Relationship Thresholds
- **Friend** - 20+ friendship points
- **Close Friend** - 35+ friendship points
- **Crush** - 25+ romance points
- **Couple** - 35+ friendship AND 45+ romance points
- **Enemy** - 45+ conflict points

## 📁 Project Structure

```
town-life-simulator/
├── index.html              # Main entry point
├── styles.css              # Complete styling
├── src/                    # Modular source code
│   ├── app.js             # Main application
│   ├── constants.js       # Game configuration
│   ├── utils.js           # Utility functions
│   ├── state.js           # State management
│   ├── people.js          # Character system
│   ├── relationships.js   # Social dynamics
│   ├── simulation.js      # Core game loop
│   ├── interactions.js    # Conversations
│   ├── render.js          # UI rendering
│   └── animation.js       # Movement
├── README.md              # This file
├── HOW-TO-USE.md          # Usage guide
├── DEVELOPMENT.md         # Development guide
├── CHANGELOG.md           # Change history
└── package.json           # Project configuration
```

## 🔧 Development

See [HOW-TO-USE.md](HOW-TO-USE.md) for detailed instructions.

**Quick Start:**
```bash
# Start development server
./start-dev.sh

# Or manually
python3 -m http.server 8000
```

The project uses ES6 modules for clean, maintainable code.

## 🎨 Design Features

- **Modern UI** with clean, card-based layout
- **Responsive design** - Works on desktop, tablet, and mobile
- **Color-coded elements** - Different colors for different building types and character states
- **Smooth animations** - Character movement with easing and wandering behavior
- **Accessible** - Semantic HTML with ARIA labels

## 🔧 Customization

You can easily customize the simulation by modifying constants in `simulator.js`:

```javascript
const mealCost = 12;              // Cost of food
const lowMoneyLine = 25;          // Threshold for overtime work
const friendThreshold = 20;       // Points needed for friendship
const crushThreshold = 25;        // Points needed for romantic interest
const coupleRomanceThreshold = 45; // Points needed to become a couple
```

## 🚀 Future Enhancement Ideas

- Save/load simulation state
- More building types (hospital, school, park)
- Children and family mechanics
- Career progression and skill development
- Weather and seasons
- Random events and emergencies
- Character customization
- Multiplayer observation mode

## 📝 License

This project is open source and available for educational and personal use.

## 🤝 Contributing

Feel free to fork this project and submit pull requests with improvements or new features!

---

**Enjoy watching your virtual town come to life!** 🏘️
