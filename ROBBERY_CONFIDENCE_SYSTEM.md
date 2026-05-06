# Robbery Confidence System - Implementation Summary

## New Features Implemented

### 1. ✅ Robbery Confidence Mechanic
People now have a `robberyConfidence` stat (0-20) that affects their criminal behavior:

**How It Works:**
- Starts at 0 for all people
- **Increases by +2** on successful robbery (max 20)
- **Decreases by -3** when caught by police
- Higher confidence = better at avoiding police detection

**Detection Rates:**
- Base detection rate with cops: 70%
- Confidence bonus: -5% per confidence point (max -40%)
- Minimum detection rate: 20% (even with max confidence)
- Example: Confidence 8 = 70% - 40% = 30% detection rate

### 2. ✅ Desperation Triggers Robbery (Not Suicide)
**Old Behavior:**
- Money ≤ $0 + depressed 6+ hours = 35% chance suicide

**New Behavior:**
- Money ≤ $5 + depressed 4+ hours + happiness ≤ 20 = **Attempt robbery first**
- Suicide only as **last resort** (money = $0, depressed 8+ hours, happiness ≤ 10, 15% chance)

### 3. ✅ Robbery Success Benefits
When robbery succeeds:
- Steal $50-150 from victim
- **+30 happiness** (big boost!)
- **Reset depression** (depressedHours = 0)
- **+2 confidence**
- Victim loses money and -25 happiness

### 4. ✅ Getting Caught Consequences
When caught by police:
- **-3 confidence** (drops back down)
- **-30 to -40 happiness**
- Sent to jail (3-5 days)
- 5% chance of lethal force (death)

### 5. ✅ Show Starting Money in Arrival Message
New arrivals now show their starting money:
- "Emma (Female, age 34) has arrived in town as a Server I with $247!"

### 6. ✅ Robbery Confidence in Person Details
Person details now show:
- **Robbery Confidence: X/20** (orange text)
- Only shows if confidence > 0

## Game Balance Changes

### Suicide Rate Reduced
- **Old**: 35% chance when broke + depressed 6 hours
- **New**: 15% chance when broke + depressed 8 hours + happiness ≤ 10
- **Reason**: People try robbery before suicide

### Desperation Threshold Lowered
- **Old**: Money ≤ $10, happiness < 20 for regular robbery
- **New**: Money ≤ $5, happiness ≤ 20 for desperate robbery
- **Reason**: More people will attempt robbery when desperate

### Robbery Benefits Increased
- **Success**: +30 happiness (was not specified before)
- **Success**: Resets depression completely
- **Reason**: Successful robbery should feel rewarding and prevent immediate re-desperation

## Example Scenarios

### Scenario 1: First-Time Robber
1. Person has $3, happiness 18%, depressed 5 hours
2. Attempts robbery (confidence: 0)
3. **Success!** Steals $120
4. Now has $123, happiness 48%, confidence 2, depression reset
5. Can buy food, pay rent, survive

### Scenario 2: Repeat Offender
1. Person has confidence 8 from previous robberies
2. Attempts another robbery
3. Detection rate: 70% - 40% = 30% (much better odds!)
4. **Success!** Confidence increases to 10
5. Becomes more skilled criminal

### Scenario 3: Getting Caught
1. Person has confidence 6
2. Attempts robbery, cop catches them (30% chance)
3. Sent to jail for 3 days
4. Confidence drops to 3
5. Happiness drops by 30
6. After release, may try again if desperate

### Scenario 4: Career Criminal
1. Person reaches confidence 20 (max)
2. Detection rate: 70% - 40% = 30% minimum
3. Still 30% chance to get caught (can't be perfect)
4. If caught, drops to confidence 17
5. Must rebuild confidence through more robberies

## UI Changes

### Person Details Display
Now shows (when applicable):
- **Robbery Confidence: 8/20** (orange text)
- Only visible if confidence > 0
- Helps identify career criminals

### Arrival Messages
- "Emma (Female, age 34) has arrived in town as a Server I **with $247**!"
- Shows starting money for transparency

### Robbery Event Modals
- "💰 Robbery Success! [Name] successfully robbed [Victim] of $120! Their confidence is growing (8)."
- "🚓 Arrested! [Name] tried to rob [Victim] but was caught! Sent to jail for 3 days. Confidence dropped to 5."

## Files Modified

1. **src/app.js**
   - Added robberyConfidence to new person creation
   - Rewrote robbery handling with confidence system
   - Added starting money to arrival message

2. **src/simulation.js**
   - Changed desperation to trigger robbery before suicide
   - Reduced suicide rate and increased threshold
   - Added desperate robbery logic

3. **src/people.js**
   - Added robberyConfidence: 0 to createPeople

4. **src/render.js**
   - Added robbery confidence display in person details

## Testing Instructions

1. **Hard refresh**: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)

2. **Test Desperation Robbery**:
   - Find someone with low money ($5 or less)
   - Watch their happiness drop below 20%
   - They should attempt robbery instead of suicide
   - Check Town Log for robbery messages

3. **Test Confidence Growth**:
   - Watch a successful robber
   - Click on them to see their details
   - Should show "Robbery Confidence: 2/20" (or higher)
   - Each successful robbery increases it

4. **Test Getting Caught**:
   - Watch for "🚓 Arrested!" modal
   - Check the robber's confidence - should have dropped
   - They'll be in jail for 3 days

5. **Test Career Criminal**:
   - Find someone with high confidence (10+)
   - They have better odds of success
   - Still can get caught (minimum 20% with cops)

## Expected Behavior

### Death Rates Should Decrease
- Fewer suicides (people rob instead)
- Fewer hunger deaths (robbery provides money for food)
- More deaths from police shootouts (5% lethal force)
- More deaths from robbery violence (5% murder rate)

### Crime Should Increase
- More robbery attempts when people are desperate
- Successful robbers become repeat offenders
- High-confidence criminals are harder to catch
- Police become more important for town safety

### Economic Impact
- Money circulates through robbery (not destroyed)
- Victims lose money but robbers gain it
- Creates wealth inequality
- Successful criminals can escape poverty
