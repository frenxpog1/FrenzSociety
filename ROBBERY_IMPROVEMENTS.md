# Robbery System Improvements

## Changes Made

### 1. ✅ Robberies Happen Much More Often

**Old System:**
- Money ≤ $10, happiness < 20
- 5% chance per hour
- Random victim selection

**New System:**
- Money ≤ $30, happiness < 40 (more people qualify)
- **15% base chance** (3x more frequent!)
- **+2% per confidence point** (experienced criminals rob more)
- **Max 50% chance** for high-confidence criminals

### 2. ✅ Target the Richest People

**Old System:**
- Random victim with money > $50

**New System:**
- Only target people with **money > $100** (significant wealth)
- Sort victims by wealth
- Pick from **top 5 richest** people
- Balances wealth inequality automatically

### 3. ✅ Desperate Robbery Improvements

**Old System:**
- Money ≤ $5, depressed 4+ hours, happiness ≤ 20

**New System:**
- Money ≤ $15, depressed 3+ hours, happiness ≤ 30 (easier to trigger)
- Target **top 3 richest** people
- Shows victim's money in log

## Expected Results

### More Robberies
- **Before**: Rare, maybe 1-2 per day
- **After**: Common, 5-10+ per day depending on poverty levels

### Wealth Redistribution
- Rich people get robbed more often
- Poor people gain money through robbery
- Natural wealth balancing mechanism
- Creates Robin Hood effect

### Career Criminals
- High confidence = rob more often
- Confidence 10 = 35% chance per hour
- Confidence 20 = 55% chance per hour (capped at 50%)
- Successful criminals become repeat offenders

## Example Scenarios

### Scenario 1: Poor Person Targets Rich
1. Person has $25, happiness 35%
2. 15% chance to attempt robbery
3. Finds richest person with $500
4. Robs them for $50-150
5. Now has $125-175, can survive

### Scenario 2: Career Criminal
1. Person has confidence 15 from past robberies
2. Has $28, happiness 38%
3. 15% + 30% = 45% chance to rob
4. Almost every other hour attempts robbery
5. Targets top 5 richest people

### Scenario 3: Wealth Balancing
1. Rich person has $800
2. Gets robbed 3 times in one day
3. Loses $300-450 total
4. Now has $350-500 (more balanced)
5. Poor robbers now have money to survive

## Game Balance Impact

### Positive Effects
- **Fewer deaths** from poverty (people rob instead)
- **Wealth redistribution** (rich → poor)
- **More drama** (robbery events are exciting)
- **Police more important** (need cops to stop crime wave)

### Potential Issues
- **Too much crime** if everyone is poor
- **Rich people struggle** to keep money
- **Police overwhelmed** if not enough cops
- **Jail overcrowding** if many get caught

## Configuration

All values are configurable in `src/constants.js`:

```javascript
export const gameConfig = {
  robberyChance: 0.05,        // Base 5% → becomes 15% (×3)
  robberyMinSteal: 50,        // Minimum stolen
  robberyMaxSteal: 150,       // Maximum stolen
  copCatchChance: 0.7,        // 70% if cops present
  jailTimeHours: 24,          // Hours in jail
};
```

## Testing Instructions

1. **Hard refresh**: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)

2. **Watch for robberies**:
   - Look for "💰 [Name] is targeting [Victim] who has $XXX..." in Town Log
   - Check for "💰 Robbery Success!" or "🚓 Arrested!" modals
   - Watch people's status: "Attempting robbery"

3. **Check wealth distribution**:
   - Note richest person's money
   - Watch them get robbed multiple times
   - See poor people gain money

4. **Monitor confidence**:
   - Click on successful robbers
   - See "Robbery Confidence: X/20" increase
   - Watch them rob more frequently

## Expected Behavior

### First Hour
- 2-3 robbery attempts (if people are poor)
- Some succeed, some get caught
- Wealth starts redistributing

### After 1 Day
- 10-20+ robbery attempts
- Several career criminals emerge (confidence 5-10)
- Wealth gap narrows
- More people in jail

### After 3 Days
- Crime wave if poverty is high
- Some criminals at max confidence (20)
- Rich people struggle to stay rich
- Police force becomes critical

## Files Modified

1. **src/simulation.js**
   - Increased robbery chance from 5% to 15% base
   - Added confidence bonus (+2% per point)
   - Changed victim selection to target richest
   - Lowered money threshold ($10 → $30)
   - Raised happiness threshold (20 → 40)
   - Desperate robbery: $5 → $15, depressed 4h → 3h

## Balancing Tips

If robberies are **too frequent**:
- Increase police force (hire more cops)
- Lower `robberyChance` in constants.js
- Increase jail time to keep criminals locked up longer

If robberies are **too rare**:
- Already maximized! System is now very active
- Check if people have enough money (need poverty)
- Make sure there are rich targets (money > $100)
