# New Features: Children & Family System

## ✨ What's New

### 1. Children System
Couples can now have children! This adds a whole new dimension to the simulation.

#### How It Works:
- **Pregnancy Chance**: 15% per day for couples
- **Age Requirements**: Both parents must be 18-45 years old
- **Birth**: Children are born with combined parent names (e.g., "ArBe" from Ari + Bea)
- **Growth**: Children age normally and become adults at 18
- **Job Assignment**: When children turn 18, they automatically get a random job

#### Child Behavior:
- **Simplified Needs**: Children have basic hunger, energy, and happiness
- **No Work**: Children don't work or earn money
- **Daily Routine**:
  - 8am-9am: Wake up at home
  - 9am-3pm: Playing at Town Square
  - 3pm-10pm: At home
  - 10pm-8am: Sleeping
- **Parental Care**: Parents automatically feed their children when hungry

### 2. Faster Romance
Romance now develops much faster, making couples form more quickly!

#### New Thresholds:
| Metric | Old | New | Change |
|--------|-----|-----|--------|
| Crush | 25 | **15** | -40% |
| Couple Friendship | 35 | **25** | -29% |
| Couple Romance | 45 | **30** | -33% |

**Result**: Characters fall in love and become couples much faster!

### 3. Enhanced UI

#### New Visual Indicators:
- **Purple "Child" chip** on children in the people list
- **Age display** shows years clearly
- **Parent information** in child detail panel
- **Job status** shows "Child" or "Too young to work" for children

#### Detail Panel Updates:
- Shows parent names for children
- Hides irrelevant info for children (money, partner, friends)
- Displays age with "(Child)" indicator

## 🎮 How to Experience It

### Watch Couples Form:
1. Start the simulation
2. Speed up time (use "Very Fast" or "Turbo")
3. Watch the "Couples" stat increase
4. Check the Town Log for "fell in love" messages

### See Children Born:
1. Wait for couples to form
2. Keep the simulation running
3. Watch for birth announcements in the Town Log
4. Look for new people with combined names (e.g., "ArBe", "ClDa")

### Watch Children Grow:
1. Select a child from the people list (purple "Child" chip)
2. Check their age in the detail panel
3. Speed up time to age 18
4. Watch them get a job automatically!

## 📊 Statistics

### Expected Outcomes:
- **Couple Formation**: ~2-3 days with new thresholds
- **First Birth**: ~3-5 days after first couple forms
- **Child to Adult**: 18 years (18 days in-game)
- **Population Growth**: ~1-2 children per couple over time

### Population Dynamics:
- **Starting Population**: 12 adults
- **After 30 days**: ~15-20 people (adults + children)
- **After 60 days**: ~20-30 people (multi-generational)

## 🔧 Technical Details

### New Configuration:
```javascript
gameConfig = {
  crushThreshold: 15,              // Lowered from 25
  coupleFriendThreshold: 25,       // Lowered from 35
  coupleRomanceThreshold: 30,      // Lowered from 45
  childAdultAge: 18,               // Age when children become adults
  pregnancyChance: 0.15,           // 15% chance per day
}
```

### New Person Properties:
```javascript
{
  isChild: true,           // Flag for children
  parentAId: "person-1",   // First parent ID
  parentBId: "person-2",   // Second parent ID
}
```

### New Functions:
- `createChild(parentA, parentB, state)` - Creates a new child
- `checkPregnancies()` - Checks for new births daily
- Child growth logic in `updatePerson()`

## 🎯 Future Enhancements

### Potential Additions:
- **Schools**: Children attend school during the day
- **Education**: Children learn skills that affect their adult jobs
- **Inheritance**: Children inherit money/property from parents
- **Family Homes**: Larger houses for families with children
- **Childcare**: Parents need to balance work and childcare
- **Adoption**: Single adults can adopt children
- **Multiple Children**: Couples can have 2-3 children
- **Grandparents**: Multi-generational family interactions

### Balancing Options:
- Adjust pregnancy chance (currently 15%)
- Change adult age threshold (currently 18)
- Modify child needs and behavior
- Add child-specific events and interactions

## 🐛 Known Behaviors

### Expected Behaviors:
- Children don't form relationships (they're too young)
- Children don't appear in the friend modal
- Children stay at their parents' home
- Parents' money decreases when feeding children
- Children get random jobs at 18 (not inherited)

### Design Decisions:
- **Simple child names**: Combined parent names for easy identification
- **No child death**: Children don't die from hunger/sickness (protected by parents)
- **Automatic job assignment**: Ensures children become productive adults
- **No child romance**: Children can't form romantic relationships

## 📝 Tips

### For Faster Population Growth:
1. Increase simulation speed to "Turbo"
2. Ensure couples stay happy (they need high happiness to stay together)
3. Keep adults healthy and well-fed
4. Watch for breakups (arguing couples won't have children)

### For Stable Families:
1. Monitor couple happiness
2. Ensure both parents have jobs
3. Keep parents' money above $25
4. Avoid high-conflict situations

## 🎉 Enjoy!

Your town can now grow organically through births and children growing up. Watch as families form, children are born, and new generations take over the town!

**The simulation is now truly multi-generational!** 🏘️👨‍👩‍👧‍👦
