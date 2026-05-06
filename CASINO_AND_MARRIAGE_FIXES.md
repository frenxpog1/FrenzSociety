# Casino & Marriage Fixes

## Issues Fixed

### 1. ✅ Casino Bank Going Negative

**Problem**: Casino balance could go negative when paying out winnings

**Root Cause**: 
- Casino paid out winnings without checking if it had enough money
- `state.casinoBankroll -= payout` could result in negative values

**Solution**:
- Added check: `if (state.casinoBankroll >= updated.casinoPayout)`
- If casino can't afford full payout, it pays what it has and goes to $0
- Prevents negative balance
- Logs when casino goes broke

**Code Location**: `src/app.js` lines ~228-238

### 2. ✅ People Not Marrying/Having Kids

**Problem**: No marriages or babies happening

**Root Cause**: 
- Marriage required BOTH people to have $150+
- With increased robberies, people are too poor
- Money requirement was too high for new economy

**Solution**:
- Lowered marriage requirement from $150 to **$50** per person
- Now people can marry with just $100 total between them
- More realistic for robbery-heavy economy

**Code Location**: `src/interactions.js` line ~105

## How It Works Now

### Casino Balance Protection
```javascript
if (state.casinoBankroll >= updated.casinoPayout) {
  // Casino can afford it
  state.casinoBankroll -= updated.casinoPayout;
} else {
  // Casino is broke, pay what we can
  const actualPayout = Math.max(0, state.casinoBankroll);
  state.casinoBankroll = 0;
  console.log(`Casino broke! Could only pay ${actualPayout}`);
}
```

### Marriage Requirements (Updated)
- ✅ Not already coupled
- ✅ No existing partner
- ✅ Not children
- ✅ Not related (no incest)
- ✅ Opposite genders
- ✅ Friendship ≥ 25
- ✅ Romance ≥ 30
- ✅ **Money ≥ $50 each** (was $150)
- ✅ 75% random chance

## Expected Behavior

### Casino Balance
**Before Fix:**
- Casino: $5000
- Big win: $10,000 payout
- Result: Casino = -$5000 ❌

**After Fix:**
- Casino: $5000
- Big win: $10,000 payout
- Result: Casino = $0, player gets $5000 ✅
- Casino closes (balance < $100)

### Marriages
**Before Fix:**
- Person A: $80, Person B: $90
- Romance: 35, Friendship: 30
- Result: Can't marry (need $150 each) ❌

**After Fix:**
- Person A: $80, Person B: $90
- Romance: 35, Friendship: 30
- Result: Can marry! ($50+ each) ✅

### Pregnancy/Babies
**Before**: No marriages = No babies
**After**: More marriages = More babies!

## Testing Instructions

1. **Hard refresh**: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)

2. **Test Casino Balance**:
   - Open browser console (F12)
   - Watch for "Casino paid out" messages
   - Casino balance should never go negative
   - Should see "Casino broke!" if it runs out

3. **Test Marriages**:
   - Watch for "💒 Wedding!" modals
   - Check Town Log for marriage messages
   - People with $50+ should be able to marry
   - Look for couples in People list

4. **Test Babies**:
   - After marriages happen, wait for babies
   - Should see "👶 New Baby!" modals
   - Check "Kids" stat - should increase
   - Look for purple "Child" chips in People list

## Expected Results

### Casino Balance
- ✅ Never goes negative
- ✅ Stays at $0 when broke
- ✅ Casino closes when < $100
- ✅ People go to town square instead

### Marriages
- ✅ More frequent (lower money requirement)
- ✅ Happens even in poor economy
- ✅ People with $50-100 can marry
- ✅ Leads to more babies

### Population Growth
- ✅ More couples = more babies
- ✅ Kids grow up at age 18
- ✅ Get jobs and contribute
- ✅ Population stays stable/grows

## Game Balance Impact

### Positive Effects
- **More marriages**: Lower barrier to entry
- **More babies**: Population growth
- **Stable casino**: No negative balance bugs
- **Better economy**: Marriages happen despite robberies

### Considerations
- **Easier to marry**: May have too many couples
- **More kids**: More mouths to feed
- **Casino closes more**: If too many big wins
- **Wealth still matters**: Need $50+ to marry

## Configuration

Marriage money requirement is hardcoded in `src/interactions.js`:
```javascript
personA.money >= 50 && personB.money >= 50
```

To adjust:
- **Higher** (e.g., 100): Fewer marriages, more selective
- **Lower** (e.g., 25): More marriages, easier to form couples
- **Remove**: Anyone can marry regardless of money

## Files Modified

1. **src/app.js**
   - Added casino balance check before payout
   - Prevents negative balance
   - Logs when casino goes broke

2. **src/interactions.js**
   - Lowered marriage money requirement
   - Changed from $150 to $50 per person
   - Enables marriages in poor economy

## Troubleshooting

### Still No Marriages?
Check if people meet ALL requirements:
- Opposite genders ✓
- Not related ✓
- Friendship ≥ 25 ✓
- Romance ≥ 30 ✓
- Money ≥ $50 each ✓
- Not already partnered ✓

### Casino Still Negative?
- Hard refresh to clear cache
- Check browser console for errors
- Verify you're on latest code

### No Babies?
- Need couples first (check Couples stat)
- 25% chance per day per couple
- Need home space (or $150 to upgrade)
- Check Town Log for pregnancy messages
