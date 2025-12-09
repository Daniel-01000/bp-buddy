
1️⃣ How Does Chat Coach & History Know About Readings?
Answer: They share data through bpStore.ts
You're using a shared state management system called a store.


┌─────────────────────────────────────────────────────┐
│  bpStore.ts (SHARED DATA STORAGE) 🗄️               │
│  Stores all BP readings in one place                │
│                                                     │
│  readings = [                                       │
│    { id: 1, systolic: 120, diastolic: 80, ... },   │
│    { id: 2, systolic: 135, diastolic: 88, ... }    │
│  ]                                                  │
└───────────────┬──────────────────┬──────────────────┘
                │                  │
                │                  │
        ┌───────┴────────┐  ┌──────┴────────┐
        │                │  │               │
        ↓                ↓  ↓               ↓
┌───────────────┐  ┌──────────────┐  ┌─────────────┐
│ History Screen│  │ Chat Coach   │  │ Home Screen │
│               │  │              │  │             │
│ - Shows list  │  │ - Analyzes   │  │ - Shows     │
│   of readings │  │   readings   │  │   latest    │
│ - Categories  │  │ - Gives      │  │   reading   │
│   (red/green) │  │   advice     │  │             │
└───────────────┘  └──────────────┘  └─────────────┘



2️⃣ What Makes Readings Green, Orange, or Red?
Answer: Based on Blood Pressure Categories (Medical Standards)

// Example 1: Normal (Green)
getBPCategory(115, 75);
// Returns: { category: 'Normal', color: '#10B981' (green) }
// ✅ Healthy!

// Example 2: Elevated (Orange)
getBPCategory(125, 78);
// Returns: { category: 'Elevated', color: '#F59E0B' (orange) }
// ⚠️ Watch it, starting to get high

// Example 3: High Stage 1 (Light Red)
getBPCategory(135, 85);
// Returns: { category: 'High Stage 1', color: '#EF4444' (red) }
// 🔴 High blood pressure, see doctor

// Example 4: High Stage 2 (Dark Red)
getBPCategory(150, 95);
// Returns: { category: 'High Stage 2', color: '#DC2626' (darker red) }
// 🔴🔴 Very high, medication likely needed

// Example 5: Crisis (Emergency Red)
getBPCategory(190, 125);
// Returns: { category: 'Crisis', color: '#991B1B' (darkest red) }
// 🚨 Emergency! Call 911!

Q1: How do Chat Coach & History know about readings?
A1: They both read from bpStore.ts (shared data store)

Q2: What makes readings green/orange/red?
A2: Based on medical categories:
    • Green: < 120/80 (Normal)
    • Orange: 120-129/<80 (Elevated)
    • Red: ≥ 130/80 (High)

Q3: How does AI know how to behave?
A3: Through system prompt (instructions you give it)

Q4: How to make AI behave how you want?
A4: Write detailed system prompt with:
    • Role definition
    • Personality traits
    • Knowledge base
    • Response guidelines
    • Examples