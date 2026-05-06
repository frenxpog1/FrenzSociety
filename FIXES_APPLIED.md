# Fixes Applied

## 1. Add New Person Button ✅

**Issue**: Button wasn't working

**Fix Applied**:
- Added event handler in `src/app.js` for `addPersonBtn`
- Creates a new person aged 20-50 with $100-300
- Shows modal "👋 New Arrival!" when person is added
- Adds person to state.people array

**Code Location**: `src/app.js` line ~897

## 2. Casino Balance Not Updating ⚠️

**Issue**: Casino balance stays at $5000

**Fixes Applied**:
1. Fixed indentation in `src/simulation.js` for `casinoShare` and `casinoContribution` variables (lines 245, 246, 490, 491)
2. Added console logging in `src/app.js` to track casino payouts and contributions
3. Verified all three gambling sections properly set:
   - `next.casinoPayout` when player wins
   - `next.casinoContribution` when player loses

**How It Should Work**:
- When player wins: `state.casinoBankroll -= casinoPayout`
- When player loses: `state.casinoBankroll += casinoContribution` (50% of bet)
- Other 50% of losses go to treasury

**Debug Steps**:
1. Open browser console (F12)
2. Watch for messages like:
   - "Casino paid out X, new balance: Y"
   - "Casino received X, new balance: Y"
3. If you don't see these messages, people aren't gambling
4. Check if people have enough money (need $35+) and low happiness (≤70%)

**Possible Causes If Still Not Working**:
1. People don't have enough money to gamble ($35 minimum)
2. People are too happy (need happiness ≤ 70% or gambling addiction > 15)
3. Wrong time of day (gambling happens 5pm-11pm, hours 17-23)
4. Weekly reset on day 7 transfers excess above $5000 to treasury

## Testing Instructions

1. **Test Add Person Button**:
   - Click "Add New Person" button
   - Should see modal "👋 New Arrival!"
   - Check People list - new person should appear
   - New person will be age 20-50 with $100-300

2. **Test Casino Balance**:
   - Open browser console (F12 → Console tab)
   - Let simulation run for several hours (17-23 = 5pm-11pm)
   - Watch for console messages about casino payouts/contributions
   - Watch casino balance stat in UI - should change from $5000
   - If people are gambling, you'll see:
     - Status: "Won BIG at Casino!" or "Lost money at Casino"
     - Console logs showing balance changes

3. **Force Gambling** (if needed):
   - Wait until evening (hour 17-23)
   - People need money ($35+) and low happiness
   - Or wait for desperate gambling (happiness = 0, money ≥ $20)

## Files Modified

1. `src/app.js` - Added addPersonBtn event handler, added console logging for casino balance
2. `src/simulation.js` - Fixed indentation for casinoShare and casinoContribution
3. `index.html` - Added "Add New Person" button
4. `src/state.js` - Added addPersonBtn element reference

## Next Steps If Casino Still Not Working

If casino balance still shows $5000 after people gamble:

1. Check browser console for the debug messages
2. If no messages appear, the casino balance code isn't being reached
3. Possible issues:
   - `casinoPayout` or `casinoContribution` properties not being set
   - Properties being deleted before app.js processes them
   - Render happening before state update

4. Try adding this to browser console to manually test:
```javascript
state.casinoBankroll = 4500;
```
Then check if UI updates. If it does, the render is working and issue is in the update logic.
