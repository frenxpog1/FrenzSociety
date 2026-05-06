# Casino, Police & Robbery System Implementation

## Current Status
✅ Police station and jail buildings already exist
✅ Police Officer jobs already defined (Day/Night shifts + Chief)
✅ Casino bankroll in state (casinoBankroll: 5000)
✅ Game config has robberyChance: 0.05

## What Needs to be Implemented

### 1. Casino Balance System
**Location**: `src/simulation.js` - gambling sections

**Changes needed**:
- Check if casino has enough money before allowing bets
- When player wins: Casino pays out (casinoBankroll -= winnings)
- When player loses: Casino keeps money (casinoBankroll += bet - treasuryShare)
- If casino is broke (< $100): Close casino, people go to town square instead
- Add casino balance to UI stats

### 2. Police Patrol System  
**Location**: `src/simulation.js` - cop behavior

**Changes needed**:
- Cops patrol town square, streets during their shift
- Cops have "On Patrol" status
- Cops can catch robbers in the act
- Add cop indicator on map

### 3. Robbery System
**Location**: `src/simulation.js` - desperate people behavior

**Changes needed**:
- Desperate people (money < $10, happiness < 20) can attempt robbery
- 5% chance per hour to rob someone nearby
- Robbery: Steal $50-150 from random person at same location
- If cop is nearby: 70% chance to get caught → Go to jail for 24 hours
- If no cop: 30% chance victim reports → Cop investigates later
- Jail: Can't work, lose money, happiness drops

### 4. UI Updates
**Location**: `src/render.js`, `index.html`

**Changes needed**:
- Add "Casino Balance" stat
- Add "In Jail" count stat  
- Show jail status in person details
- Add police/jail building colors to legend

## Implementation Priority
1. Casino balance (easiest, most requested)
2. Robbery system (core mechanic)
3. Police patrol & catching (ties it together)
4. UI updates (polish)

Would you like me to implement these one by one, or create a complete implementation file?
