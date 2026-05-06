# Test Instructions

## Server is Running
The development server is running on `http://localhost:8000`

## What Was Fixed

### 1. ✅ Add New Person Button
- Button now works
- Click "Add New Person" to add an immigrant to the town
- New person will be age 20-50 with $100-300 starting money

### 2. ⚠️ Casino Balance Tracking
- Fixed indentation issues in gambling code
- Added console logging to track casino transactions
- Casino balance SHOULD now change when people gamble

## How to Test

### Test 1: Add New Person
1. Click the "Add New Person" button
2. You should see a modal: "👋 New Arrival! [Name] (age XX) has arrived in town..."
3. Click Continue
4. Check the People list - new person should be there
5. Check "Alive" stat - should increase by 1

### Test 2: Casino Balance
1. **Open Browser Console** (Press F12, click Console tab)
2. Let the simulation run
3. Wait for evening hours (5pm-11pm = hours 17-23)
4. Watch for console messages:
   - "Casino paid out X, new balance: Y" (when someone wins)
   - "Casino received X, new balance: Y" (when someone loses)
5. Watch the "Casino Bank" stat in the UI - it should change from $5000

### Why Casino Might Not Change Immediately

People only gamble when:
- **Time**: Evening hours (17-23 = 5pm-11pm)
- **Money**: They have at least $35
- **Happiness**: They have ≤70% happiness OR gambling addiction > 15
- **OR Desperate**: Happiness = 0 and money ≥ $20 (can gamble anytime 10am-11pm)

### Force Casino Activity

To see casino activity faster:
1. Use "Skip 1 Day" button to advance time quickly
2. Watch for people with low happiness (they'll gamble more)
3. Look for status messages like:
   - "Won BIG at Casino!"
   - "Lost money at Casino"
   - "WON EVERYTHING at Casino!" (desperate all-in)
   - "Lost everything - final gamble"

### Check Console for Debug Info

In the browser console, you should see:
```
Casino paid out 80, new balance: 4920
Casino received 20, new balance: 4940
Casino paid out 100, new balance: 4840
```

If you DON'T see these messages, people aren't gambling yet.

## Troubleshooting

### "Add New Person" button doesn't work
- Hard refresh the page: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
- Check browser console for errors

### Casino balance stays at $5000
1. Check if people are actually gambling:
   - Look for "At Casino" or "Won BIG at Casino!" status
   - Check Town Log for gambling messages
2. Check browser console for the debug messages
3. If no console messages, people aren't gambling yet
4. Try advancing time with "Skip 1 Day" button
5. Check that it's evening (hour 17-23)

### Weekly Reset
- Every 7 days, if casino has MORE than $5000, excess goes to treasury
- This is intentional - casino transfers profits to town
- Casino should still go BELOW $5000 when paying out big wins

## Expected Behavior

### Casino Balance Should:
- **Decrease** when people win (casino pays out)
- **Increase** when people lose (casino gets 50% of bet, treasury gets other 50%)
- **Transfer excess** to treasury every 7 days if above $5000
- **Close** if balance drops below $100 (people go to town square instead)

### Example Flow:
1. Start: $5000
2. Person bets $40, loses: $5000 + $20 = $5020 (other $20 to treasury)
3. Person bets $60, wins $120: $5020 - $120 = $4900
4. Person bets $100, wins $200: $4900 - $200 = $4700
5. Casino is now at $4700 and should show in UI

## If Still Not Working

If casino balance still doesn't change after people gamble:
1. Share the browser console output
2. Check if you see the debug messages
3. Look for any JavaScript errors in console
4. Try manually in console: `state.casinoBankroll = 4500` and see if UI updates
