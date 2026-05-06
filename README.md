# Town Life Simulator

A browser-based life simulation game where you can watch AI-driven characters live their daily lives in a small town. Characters work, eat, socialize, form relationships, have children, gamble at the casino, and navigate the challenges of survival, happiness, and crime.

## 🎮 Features

### Dynamic Character Simulation
- **15 unique characters** with distinct names, traits, skills, and genders
- **Autonomous behavior** - characters make decisions based on their needs (hunger, energy, happiness)
- **Aging system** - characters age day by day, children grow into adults at age 18
- **Health mechanics** - characters can become sick from prolonged unhappiness
- **Children system** - couples have babies that grow up and join the workforce
- **Personality types** - Gambling addicts (20%), career criminals (12.5%), and serial killers

### Social Dynamics
- **Relationship system** with friendship, romance, and conflict metrics
- **Dynamic conversations** - characters talk about work, food, mood, health, and more
- **Romantic relationships** - characters develop crushes and become couples
- **Marriage system** - couples can get married with wedding ceremonies
- **Pregnancy & children** - married couples have babies (95% chance, guaranteed for first 2 kids)
- **Close friendships** - characters form bonds and prefer spending time with friends
- **Conflicts** - stressed or unhappy characters may argue, potentially becoming enemies

### Economic System
- **Jobs with promotions** - 3 levels per job type (Cook I/II/III, Server I/II/III, etc.)
- **Fast promotions** - 7 days for first promotion, 14 days for second
- **Increased wages** - Cook I: $25/hr → Cook III: $60/hr, Analyst III: $65/hr
- **15% income tax** - All wages taxed to fund town treasury
- **Money management** - characters earn wages and spend on food, entertainment
- **Overtime work** - characters work extra hours when money is low
- **Hunger mechanics** - characters must buy meals ($8) or risk starvation
- **Daily expenses** - $10 rent + $3 tax per day ($13 total, reduced from $20)
- **Weekly treasury redistribution** - 90% of treasury distributed based on need (poor get more)

### Crime & Justice System
- **Career criminals** (1 per 8 people) - Rob regardless of happiness, 60-90% robbery chance
- **Desperate robberies** - Poor/unhappy people rob the rich, 40-70% chance
- **Robbery confidence system** - Criminals get better at avoiding police (+2 on success, -3 when caught)
- **Police force** - 1 cop per 5 citizens, day and night shifts
- **Jail system** - 3 days for robbery, 5 days for shootouts, 10 days for serial killers
- **Cop casualties** - Robbers may fight back and kill officers
- **Serial killer** - GUARANTEED spawn at 30+ population, kills every 3 days
- **Serial killer abilities** - 2% detection rate (vs 20% normal), 80% fight back chance, 90% lethal
- **Serial killer respawn** - 2% chance per day after being caught/killed

### Entertainment & Gambling
- **Casino system** - Characters can gamble with 45% win rate (house edge)
- **Gambling addicts** (20% of population) - Start with max addiction, gamble constantly
- **Casino bankroll** - Starts at $5000, refills weekly, closes when broke
- **Desperate gambling** - Broke/depressed people bet everything as last resort
- **Jackpot events** - Big wins/losses trigger dramatic modals
- **Town square** - Free hangout spot, can buy snacks for $15

### Town Infrastructure
- **10 houses** with expandable capacity (residents can upgrade for $150)
- **2 offices** providing employment
- **1 restaurant** for meals and socializing
- **1 town square** for relaxation and social gatherings
- **1 school** for children during the day
- **1 church** for Sunday services
- **1 police station** with jail
- **1 hospital** for treating sickness ($30)
- **1 casino** for gambling and entertainment
- **1 graveyard** for funerals and mourning

### Visual Features
- **Interactive map** with animated character tokens
- **Real-time movement** - characters move between locations based on their activities
- **Speech bubbles** - see what characters are saying during conversations
- **Color-coded status** - visual indicators for working, eating, sleeping, sick, in jail, etc.
- **Event modals** - Dramatic popups for weddings, births, jackpots, murders, arrests
- **Modal queue system** - Multiple events queue up with countdown timers

## 🎯 How to Play

### Getting Started

**Run the Development Server:**
```bash
./start-dev.sh
# Or manually: python3 -m http.server 8000
```

Then open **http://localhost:8000** in your browser.

The simulation starts automatically with 15 characters.

### Controls
- **Pause/Resume** - Stop or continue the simulation
- **Step 1 Hour** - Advance time by one hour manually
- **Step 1 Day** - Skip ahead 24 hours (full day)
- **Restart** - Reset the simulation with new characters
- **Speed** - Adjust simulation speed (Slow, Normal, Fast, Very Fast, Turbo)
- **Resume Delay** - Auto-resume after events (Instant, 3s, 5s, 10s, Manual)
- **Old Age Death** - Set the age at which characters die (45-120 years)
- **Humans** - Set initial population size (10-15 characters)
- **Add Person** - Manually add an immigrant to the town
- **Add School** - Build a school for children
- **Add Church** - Build a church for community

### Monitoring
- **Town Stats** - Track alive, housed, employed, hungry, average money, happiness, couples, kids, deaths, treasury, casino balance, and jail population
- **Town Map** - Click on character tokens to select and view details
- **People List** - Browse all characters with their current status and stats
- **Selected Person Panel** - View detailed information including robbery confidence
- **Conversations** - Read recent conversations between characters
- **Town Log** - Review important events (deaths, relationships, crimes, births, weddings)

## 🏗️ Technical Details

### Architecture
- **Pure vanilla JavaScript** - No frameworks or dependencies
- **ES6 modules** - Clean, maintainable code structure
- **Event-driven simulation** - Time advances hourly with character state updates
- **Relationship graph** - Tracks all pairwise relationships between characters
- **State management** - Centralized state object for simulation data

### Key Mechanics

#### Character Needs
- **Hunger** - Increases over time, must be satisfied by buying food ($8)
- **Energy** - Decreases during activities, restored by sleeping
- **Happiness** - Affected by social interactions, work, and basic needs
- **Depression** - Prolonged low happiness leads to sickness or suicide

#### Daily Schedule
- **6:00-8:00** - Wake up, morning routine
- **9:00-17:00** - Work hours (varies by job)
- **12:00** - Lunch break and socializing
- **17:00-23:00** - Free time, socializing, dates, gambling
- **22:00-6:00** - Sleep

#### Death Conditions
- Old age (configurable threshold)
- Starvation (missing too many meals)
- Sickness combined with severe unhappiness
- Suicide (15% chance when broke, depressed, and desperate)
- Murdered by serial killer
- Killed by police during robbery
- Killed during robbery gone wrong

#### Relationship Thresholds
- **Friend** - 20+ friendship points
- **Close Friend** - 35+ friendship points
- **Crush** - 5+ romance points (very easy)
- **Marriage** - 10+ friendship AND 10+ romance points (very easy)
- **Enemy** - 45+ conflict points

#### Crime Mechanics
- **Career criminals** - 1 per 8 people, 60% base robbery chance, max 90%
- **Desperate people** - Money ≤$40 and happiness <50%, 40% base robbery chance, max 70%
- **Robbery confidence** - 0-20 scale, +2 on success, -3 when caught
- **Detection rates** - Normal: 70% base → 20% min, Serial killer: 15% base → 2% min
- **Target selection** - Rob top 5 richest people with $100+
- **Stolen amount** - $50-$150 per robbery

#### Gambling Mechanics
- **Casino win rate** - 45% (house has 55% edge)
- **Gambling addicts** - 20% of population, start with max addiction (20)
- **Bet amounts** - $40 + (addiction × 3), desperate people bet 80% of money
- **Casino balance** - Starts at $5000, 50% of losses go to treasury, 20% tax on winnings
- **Weekly reset** - Casino refills to $5000 every 7 days

#### Serial Killer Mechanics
- **Spawn** - GUARANTEED when population reaches 30+ (first time only)
- **Respawn** - 2% chance per day after being caught/killed
- **Kill interval** - Every 3 days
- **Detection** - 15% base → 2% min (vs 70% → 20% for normal robbers)
- **Combat** - 80% fight back chance, 90% lethal to cops
- **Jail time** - 10 days (vs 3 days normal)
- **Status loss** - Loses serial killer status when caught (can respawn later)

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
├── FEATURES.md            # Feature documentation
├── ROBBERY_CONFIDENCE_SYSTEM.md  # Crime mechanics
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

**Important:** The project uses ES6 modules, so you MUST use a server. Opening `index.html` directly won't work.

**Hard Refresh:** After making changes, use `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows/Linux) to clear cache.

## 🎨 Design Features

- **Modern UI** with clean, card-based layout
- **Responsive design** - Works on desktop, tablet, and mobile
- **Color-coded elements** - Different colors for different building types and character states
- **Smooth animations** - Character movement with easing and wandering behavior
- **Event modals** - Dramatic popups for major events with auto-resume timers
- **Accessible** - Semantic HTML with ARIA labels

## 🔧 Customization

You can easily customize the simulation by modifying constants in `src/constants.js`:

```javascript
export const gameConfig = {
  mealCost: 8,                     // Cost of food
  lowMoneyLine: 25,                // Threshold for overtime work
  friendThreshold: 20,             // Points needed for friendship
  coupleFriendThreshold: 10,       // Friendship needed for marriage
  coupleRomanceThreshold: 10,      // Romance needed for marriage
  pregnancyChance: 0.95,           // 95% chance per day
  gamblingAddictChance: 0.20,      // 20% are gambling addicts
  careerCriminalRatio: 8,          // 1 per 8 people
  serialKillerMinPop: 30,          // Spawn at 30+ population
  serialKillerKillInterval: 3,     // Kills every 3 days
};
```

## 🎯 Gameplay Tips

1. **Population Growth** - Encourage marriages by keeping happiness high. First 2 babies are guaranteed!
2. **Crime Prevention** - Hire more police (1 per 5 citizens) to catch criminals
3. **Economic Balance** - Treasury redistributes 90% weekly, poor people get more
4. **Gambling Addicts** - 20% of population will gamble constantly and may turn to crime
5. **Serial Killer** - Spawns guaranteed at 30+ population, extremely hard to catch (2% detection)
6. **Career Criminals** - 12.5% of population will rob regardless of happiness
7. **House Upgrades** - Rich residents ($150+) can upgrade house capacity for $150
8. **Casino Strategy** - 45% win rate means house always wins long-term

## 🚀 Recent Updates

### Latest Features (v2.0)
- ✅ Casino system with gambling addicts (20% of population)
- ✅ Crime system with career criminals and robbery confidence
- ✅ Serial killer system (guaranteed spawn at 30+, 2% respawn)
- ✅ Serial killers are extremely hard to catch (2% detection vs 20% normal)
- ✅ Children grow into adults at age 18 and get jobs
- ✅ Marriage and pregnancy system (95% chance, guaranteed first 2 kids)
- ✅ Job promotions (7 days → 14 days) with wage increases
- ✅ Treasury redistribution (90% weekly, need-based)
- ✅ House capacity upgrades ($150)
- ✅ Reduced daily expenses ($13 vs $20)
- ✅ Increased wages across all jobs
- ✅ Event modal queue system with auto-resume
- ✅ Police force scales with population (1 per 5 citizens)

## 📝 License

This project is open source and available for educational and personal use.

## 🤝 Contributing

Feel free to fork this project and submit pull requests with improvements or new features!

---

**Enjoy watching your virtual town come to life!** 🏘️👨‍👩‍👧‍👦💰🎰🔪

