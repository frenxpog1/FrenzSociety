# Town Life Simulator

A browser-based life simulation game where you can watch AI-driven characters live their daily lives in a small town. Characters work, eat, socialize, form relationships, have children, and navigate the challenges of survival and happiness in a dynamic economy.

## 🎮 Features

### Dynamic Character Simulation
- **110 unique names** (55 female, 55 male) for diverse character generation
- **Autonomous behavior** - characters make decisions based on their needs (hunger, energy, happiness)
- **Aging system** - characters age day by day and eventually die of old age
- **Health mechanics** - characters can become sick from prolonged unhappiness
- **Children system** - couples can have babies who grow up and become adults at age 18
- **Immigration** - Add new people to the town with the "Add New Person" button

### Social Dynamics
- **Relationship system** with friendship, romance, and conflict metrics
- **Dynamic conversations** - characters talk about work, food, mood, health, robbery, and more
- **Romantic relationships** - characters can develop crushes and become couples
- **Marriage system** - couples can get married at the church with friends attending
- **Close friendships** - characters form bonds and prefer spending time with friends
- **Conflicts** - stressed or unhappy characters may argue, potentially becoming enemies
- **Family dynamics** - parents care for children, children attend school

### Economic System
- **Jobs with promotions** - 3 levels per job type with faster advancement (7 days for Level I→II, 14 days for Level II→III)
- **Higher wages** - Increased salaries across all positions (Cook I: $25/hr, Analyst III: $65/hr)
- **Income tax** - 15% tax on all wages goes to town treasury
- **Daily expenses** - $15 rent + $5 tax per adult per day
- **Money management** - characters earn wages and spend money on food, entertainment
- **Overtime work** - characters work extra hours when money is low
- **Job switching** - fired police officers automatically get reassigned to new jobs
- **Unemployment assistance** - 30% daily chance for unemployed people to find entry-level jobs
- **Weekly redistribution** - Town treasury redistributes 50% of funds to all citizens every 7 days

### Crime & Law Enforcement
- **Robbery system** - desperate people target the richest citizens
- **Confidence mechanic** - successful robberies increase confidence (0-20), getting caught decreases it
- **Police patrol** - officers patrol town square 60% of work hours
- **Jail system** - caught criminals serve time in jail (24-120 hours depending on severity)
- **Violence** - 10% chance robbers fight back, 5% chance of lethal outcomes
- **Wealth redistribution** - robberies naturally balance wealth inequality

### Gambling & Entertainment
- **Casino system** - characters can gamble with 61% win rate
- **Gambling addiction** - winning increases addiction, addicts work extra to fund habit
- **Casino bankroll** - starts at $5000, tracks wins/losses, closes if broke
- **Desperate gambling** - broke people bet everything as last resort
- **Town square fallback** - when casino is broke, people hang out at town square instead
- **Weekly casino profits** - Excess over $5000 transferred to town treasury

### Housing System
- **Automatic housing assignment** - homeless people automatically assigned to available houses
- **Dynamic capacity** - houses can be upgraded for $100 to accommodate children
- **Town assistance** - treasury helps families expand homes if they can't afford it
- **Smart allocation** - dead people free up space for new residents
- **Autonomous expansion** - town builds new houses when population exceeds capacity

### Town Infrastructure
- **10+ houses** with expandable capacity
- **2 offices** providing employment
- **1 restaurant** for meals and socializing
- **1 town square** for relaxation and social gatherings
- **1 police station** with dynamic force sizing (1 cop per 5 citizens)
- **1 jail** for criminals
- **1 hospital** for treating sickness
- **1 casino** for gambling and entertainment
- **1 church** for weddings and Sunday services
- **1 graveyard** for funerals and mourning
- **Expandable** - Add more offices, schools, and churches with buttons

### Visual Features
- **Interactive map** with animated character tokens
- **Real-time movement** - characters move between locations based on their activities
- **Speech bubbles** - see what characters are saying during conversations
- **Color-coded status** - visual indicators for working, eating, sleeping, sick, in jail, etc.
- **Event modals** - dramatic notifications for weddings, births, jackpots, deaths, arrests

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
- **Step 1 Day** - Skip ahead 24 hours (stops if major event occurs)
- **Restart** - Reset the simulation with new characters
- **Speed** - Adjust simulation speed (Slow, Normal, Fast, Very Fast, Turbo)
- **Resume Delay** - Set how long to wait after events (0s, 3s, 5s, 10s, or Manual)
- **Old Age Death** - Set the age at which characters die (45-120 years)
- **Humans** - Set initial population size (10-15 characters)
- **Add New Person** - Manually add immigrants to the town
- **Add Office/School/Church** - Expand town infrastructure

### Monitoring
- **Town Stats** - Track alive, housed, employed, hungry, average money, happiness, couples, kids, graveyard, casino bank, town treasury
- **Town Map** - Click on character tokens to select and view details
- **People List** - Browse all characters with their current status and stats
- **Selected Person Panel** - View detailed information including robbery confidence
- **Conversations** - Read recent conversations between characters
- **Town Log** - Review important events (deaths, relationships, robberies, promotions, births)

## 🏗️ Technical Details

### Architecture
- **Pure vanilla JavaScript** - No frameworks or dependencies
- **Modular ES6 design** - 10 separate modules for clean code organization
- **Event-driven simulation** - Time advances hourly with character state updates
- **Relationship graph** - Tracks all pairwise relationships between characters
- **State management** - Centralized state object for simulation data

### Key Mechanics

#### Character Needs
- **Hunger** - Increases over time, must be satisfied by buying food ($12/meal)
- **Energy** - Decreases during activities, restored by sleeping
- **Happiness** - Affected by social interactions, work, gambling, relationships

#### Daily Schedule
- **6:00-8:00** - Wake up, morning routine
- **8:00-18:00** - Work hours (varies by job and shift)
- **12:00** - Lunch break and socializing
- **17:00-23:00** - Free time, socializing, dates, gambling
- **22:00-6:00** - Sleep

#### Death Conditions
- Old age (configurable threshold)
- Starvation (missing 4+ meals with 96%+ hunger)
- Sickness combined with severe unhappiness (18+ hours sick, happiness ≤12)
- Suicide (only if broke, depressed 8+ hours, happiness ≤10, and can't rob - reduced to 15% chance)
- Killed by police during robbery (5% chance)
- Murdered during robbery (5% chance)
- Killed in shootout with police (40% chance if robber fights back)

#### Pregnancy & Children
- **45% base chance per day** for couples to have a baby
- **First child bonus** - 67.5% chance (1.5x multiplier)
- **Second child bonus** - 54% chance (1.2x multiplier)
- **Third+ children** - 22.5% chance after 3 kids (0.5x multiplier)
- **Baby bonuses** - $150 per parent + 40 happiness boost
- **Home expansion** - $100 to add capacity, town helps if parents can't afford
- **Children grow up** - Become adults at age 18, get jobs and move out

#### Marriage Requirements
- **Money** - $30 per person (lowered for easier marriage)
- **Friendship** - 25+ points
- **Romance** - 30+ points
- **Wedding cost** - $100 per person
- **85% chance** when requirements met

#### Relationship Thresholds
- **Friend** - 20+ friendship points
- **Close Friend** - 35+ friendship points
- **Crush** - 15+ romance points (lowered)
- **Couple** - 25+ friendship AND 30+ romance points (lowered)
- **Enemy** - 45+ conflict points

#### Robbery Mechanics
- **Trigger** - Money ≤$30 AND happiness <40
- **Base chance** - 15% per hour (increased from 5%)
- **Confidence bonus** - +2% per confidence point (max 50% total)
- **Targets** - Top 5 richest people with $100+
- **Success rewards** - $50-150 stolen, +30 happiness, +2 confidence
- **Caught penalties** - -3 confidence, 72 hours jail, -30 happiness
- **Police effectiveness** - 70% base catch rate, reduced by confidence (max -40%)

#### Promotion System
- **Level I → Level II** - 7 days worked (was 15)
- **Level II → Level III** - 14 days worked (was 30)
- **Requirements** - 70+ happiness, $100+ money
- **Rewards** - Higher wage, +20 happiness, $50 bonus

## 📁 Project Structure

```
town-life-simulator/
├── index.html              # Main entry point
├── styles.css              # Complete styling
├── src/                    # Modular source code
│   ├── app.js             # Main application & events
│   ├── constants.js       # Game configuration
│   ├── utils.js           # Utility functions
│   ├── state.js           # State management
│   ├── people.js          # Character creation
│   ├── relationships.js   # Social dynamics
│   ├── simulation.js      # Core game loop
│   ├── interactions.js    # Conversations & marriage
│   ├── render.js          # UI rendering
│   └── animation.js       # Movement animations
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
- **Event modals** - Dramatic pop-ups for major life events
- **Queue system** - Multiple events shown in sequence
- **Accessible** - Semantic HTML with ARIA labels

## 🔧 Customization

You can easily customize the simulation by modifying constants in `src/constants.js`:

```javascript
const gameConfig = {
  mealCost: 12,                    // Cost of food
  hospitalCost: 30,                // Cost of medical treatment
  lowMoneyLine: 25,                // Threshold for overtime work
  friendThreshold: 20,             // Points needed for friendship
  crushThreshold: 15,              // Points needed for romantic interest
  coupleRomanceThreshold: 30,      // Points needed to become a couple
  pregnancyChance: 0.45,           // 45% daily chance for couples
  casinoStartingBalance: 5000,     // Casino starting funds
  robberyChance: 0.05,             // Base robbery chance (15% with multiplier)
  copCatchChance: 0.7,             // 70% chance cop catches robber
};
```

## 🚀 Recent Updates

### Version 2.0 - Economic & Social Overhaul
- ✅ Faster promotions (7/14 days instead of 15/30)
- ✅ Higher wages across all jobs
- ✅ 15% income tax system
- ✅ Automatic housing assignment for homeless
- ✅ Job switching for fired police officers
- ✅ 30% daily job-finding chance for unemployed
- ✅ Increased pregnancy rates (45% base, bonuses for first kids)
- ✅ Bigger baby bonuses ($150 per parent)
- ✅ Cheaper home expansion ($100 instead of $150)
- ✅ Town treasury helps with housing
- ✅ Easier marriage ($30 requirement, 85% chance)
- ✅ Casino broke behavior (people go to town square)
- ✅ Robbery system with confidence mechanic
- ✅ Police patrol and jail system
- ✅ Weekly treasury redistribution

## 📝 License

This project is open source and available for educational and personal use.

## 🤝 Contributing

Feel free to fork this project and submit pull requests with improvements or new features!

---

**Enjoy watching your virtual town come to life!** 🏘️👶💰🎰👮
