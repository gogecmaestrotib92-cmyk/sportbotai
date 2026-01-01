# DaVinci Resolve - Phone Screen Replacement Tutorial (Beginner Friendly)

## 🎯 What We're Doing
Replace a phone screen in UGC video with your actual SportBot AI app interface.

**Before**: Person holding phone with blank/different screen  
**After**: Person holding phone showing YOUR app interface perfectly tracked

---

## 🚀 Quick Start (Easiest Method)

### Method 1: Fusion Planar Tracker (Recommended for Beginners)

#### Step 1: Prepare Your Footage (5 minutes)

1. **Film the UGC video properly**:
   - Person holds phone at slight angle (not straight on)
   - Phone screen should be visible and not too reflective
   - Good lighting on phone screen
   - Keep phone relatively still (small movements OK)
   - Film at 1080p or 4K

2. **Record your app screen**:
   ```bash
   # macOS (Cmd+Shift+5)
   # Record as 1080x1920 (vertical, phone aspect ratio)
   # Or use iPhone screen recording
   
   # Export as:
   - Format: MOV or MP4
   - Resolution: Match phone screen size in video
   - Duration: Same as UGC clip
   ```

3. **Check your files**:
   - `ugc-person-holding-phone.mp4` (the person talking)
   - `app-screen-recording.mp4` (your SportBot AI interface)

---

#### Step 2: Import to DaVinci Resolve (2 minutes)

1. Open DaVinci Resolve (free version is fine)
2. Create New Project: "SportBot-UGC-Ad-1"
3. Go to **Media Pool** (top left)
4. Drag both videos into Media Pool
5. Drag `ugc-person-holding-phone.mp4` to timeline (bottom)

---

#### Step 3: Add Tracking Points (5 minutes)

This is the "magic" part - we tell DaVinci where the phone corners are.

1. **Select your clip** on timeline
2. Go to **Fusion** tab (bottom, next to Edit/Color)
3. You'll see nodes - click **MediaIn1** node
4. Right-click in node area → **Add Tool** → **Tracking** → **Planar Tracker**

5. **Set up tracking points**:
   - In viewer, you'll see a blue rectangle
   - Drag corners to match phone screen corners EXACTLY
   - Use 4 corner points (top-left, top-right, bottom-left, bottom-right)
   
   **Pro tip**: 
   - Zoom in on phone (Cmd/Ctrl + scroll)
   - Place points just INSIDE phone bezel
   - Avoid placing on person's fingers

6. **Track the motion**:
   - Click **Track Forward** button (▶ icon in tracker controls)
   - Wait 10-30 seconds while it analyzes
   - Check if blue rectangle follows phone throughout clip
   
   **If tracking fails**:
   - Reset and try again with better corner placement
   - Make sure phone has good contrast
   - Track in shorter segments

---

#### Step 4: Replace Screen with Your App (8 minutes)

1. **Add your app footage**:
   - In Fusion, drag `app-screen-recording.mp4` from Media Pool to node area
   - It creates a new **MediaIn2** node

2. **Connect tracking to app footage**:
   - Click **Planar Tracker** node
   - Find **Operation** dropdown → Change to **Corner Pin**
   - Drag connection from **MediaIn2** → **Planar Tracker** → **MediaOut1**

3. **Adjust the screen**:
   - Your app should now appear on phone screen
   - If it's not perfect, adjust in inspector:
     - **Opacity**: Make sure it's 100%
     - **Blend Mode**: Normal
   
4. **Fine-tune corners** (if needed):
   - Go back to first frame
   - In Planar Tracker settings, manually adjust corners
   - Replay to check tracking

---

#### Step 5: Add Phone Screen Glow (Optional - 3 minutes)

Make it look more realistic with screen reflection.

1. **Add Glow**:
   - Right-click → **Add Tool** → **Effect** → **Glow**
   - Connect: PlanarTracker → Glow → MediaOut1
   
2. **Settings**:
   - Glow: 5-10
   - Gain: 1.2
   - Color: Slight blue/teal tint

---

#### Step 6: Export Your Video (5 minutes)

1. Go to **Deliver** tab (bottom right)
2. **Settings**:
   - Format: MP4
   - Codec: H.264
   - Resolution: 1080p (or source resolution)
   - Quality: High
   - Frame Rate: Match source (usually 30fps)

3. **Filename**: `sportbot-ugc-ad-1-final.mp4`
4. Click **Add to Render Queue**
5. Click **Render All**

---

## 🎬 Method 2: Simpler "Overlay" Method (No Tracking)

If tracking is too hard, use this faster method for static shots:

### When to Use:
- Phone is relatively still
- Quick dirty test
- Need result in 10 minutes

### Steps:

1. **Edit Tab** in DaVinci
2. Place `ugc-person-holding-phone.mp4` on Video Track 1
3. Place `app-screen-recording.mp4` on Video Track 2 (above)
4. Select app clip → Inspector panel → Transform:
   - **Position X/Y**: Move to phone screen location
   - **Rotation**: Match phone angle
   - **Scale**: Resize to fit phone screen
   - **Zoom**: Fine-tune size

5. **Crop** app footage to phone shape:
   - Inspector → Cropping
   - Crop Left/Right/Top/Bottom to fit phone screen
   - Or use **Rectangle** shape mask

6. **Keyframe if phone moves**:
   - Enable animation (diamond icon)
   - Move playhead to where phone moves
   - Adjust position/rotation again
   - DaVinci creates smooth transition

7. Export same as Method 1

---

## 🛠️ Alternative: Use CapCut (Way Easier!)

If DaVinci is too complex, try CapCut (free, easier):

### CapCut Mobile App (iPhone/Android)
1. Import both videos
2. Overlay app video on top
3. Use **Chroma Key** if phone screen is green
4. Or **Crop** and manually position
5. Export in 5 minutes

### CapCut Desktop (Mac/PC)
1. Download from capcut.com
2. Similar workflow to DaVinci but simpler UI
3. Has built-in phone mockups you can use

---

## 📱 Pro Tips for Better Results

### Filming the UGC:
- ✅ Use phone with matte screen protector (less glare)
- ✅ Hold phone at 30-45° angle to camera
- ✅ Use bright, even lighting
- ✅ Keep hand/phone relatively still (small natural movements OK)
- ❌ Don't move phone too fast
- ❌ Don't let fingers cover corners
- ❌ Avoid harsh shadows on screen

### Recording Your App:
- ✅ Match aspect ratio (9:16 for vertical phone)
- ✅ Use dark mode (less screen glow issues)
- ✅ Record at same frame rate as UGC (30fps usually)
- ✅ Add slight zoom animation for interest
- ❌ Don't include notches/status bar (looks fake)
- ❌ Don't move too fast through app

### Common Issues & Fixes:

**Tracking keeps losing the phone:**
- Film with better lighting
- Use phone case with high-contrast corners
- Track shorter segments (5-10 seconds at a time)

**App screen looks "floaty":**
- Add motion blur to app layer
- Reduce opacity to 95% (slight transparency)
- Add subtle shadow/glow

**Colors don't match:**
- Go to Color tab
- Match app brightness to scene lighting
- If scene is warm (yellow), add warm tint to app

**Screen edges look sharp:**
- Add slight blur to edges
- Use feathered mask
- Add subtle glow (teal accent color)

---

## 🎯 Easiest Path for Complete Beginners

### Option A: Pay Someone ($20-50)
- **Fiverr**: Search "screen replacement video editing"
- **Upwork**: Find video editor familiar with tracking
- Send them: 
  - Your UGC footage
  - Your app screen recording
  - This document for reference
- Get result in 24-48 hours

### Option B: Use Template Service
- **Envato Elements**: Download phone mockup templates
- **Renderforest**: Automated phone video maker
- **Placeit by Envato**: Drag-drop phone mockups

### Option C: Film Smarter, Edit Less
Instead of replacing screen, **film it right the first time**:

1. Get any cheap Android phone
2. Open your SportBot AI app
3. Put phone in someone's hand
4. Film them using YOUR ACTUAL APP
5. No editing needed!

**Cost**: $50-100 used Android phone  
**Time**: 0 editing time  
**Result**: 100% real

---

## 📚 Learning Resources

### DaVinci Resolve Tutorials:
- **YouTube**: "Casey Faris - Screen Replacement DaVinci"
- **YouTube**: "VFX Study - Planar Tracking Tutorial"
- Official docs: blackmagicdesign.com/learn

### Practice Files:
1. Film yourself holding your phone (blank screen)
2. Record 10 seconds of your app
3. Try Method 2 (Overlay) first for quick win
4. Then try Method 1 (Tracking) when comfortable

---

## 🚀 Quick Win: Your First Video Today

**Time: 30 minutes**

1. **Film** (10 min):
   - You or friend holding phone
   - 15-second clip
   - Say: "This app changed how I analyze matches"
   - Point to phone screen while talking

2. **Record app** (5 min):
   - Open SportBot AI
   - Record 15 seconds: Homepage → Analyzer → Results
   - Export as MP4

3. **Edit** (15 min):
   - Use CapCut (easier) or DaVinci Method 2
   - Overlay app on phone screen
   - Position/scale to fit
   - Export

4. **Post**:
   - Instagram Reels / TikTok
   - Caption: "This is how I research matches now"
   - CTA: Link in bio

**Result**: Your first UGC ad with real app interface, done today.

---

## 🎬 Template Workflow Summary

```
Step 1: Film UGC (person + phone) → 15-30 seconds
Step 2: Record app screen → same duration
Step 3: DaVinci/CapCut → overlay/track → 15 min
Step 4: Export → Post → Track metrics
Step 5: Iterate based on results
```

**First video will take 1-2 hours. By video #5, you'll do it in 20 minutes.**

---

## ❓ Stuck? Try This

**If you're stuck after 30 minutes:**
1. Post your issue in DaVinci Resolve Facebook group (200k+ members)
2. Or DM me the footage - I can help troubleshoot
3. Or just hire on Fiverr for $20 to get unblocked

**Remember**: First video is always hardest. After you do one successfully, it becomes routine.

---

## 📦 Files You Should Have Ready

```
/SportBot-UGC-Assets/
├── ugc-footage/
│   ├── person-holding-phone-1.mp4
│   ├── person-holding-phone-2.mp4
│   └── person-holding-phone-3.mp4
├── app-recordings/
│   ├── analyzer-demo-vertical.mp4
│   ├── ai-chat-vertical.mp4
│   └── trending-matches-vertical.mp4
└── final-exports/
    ├── ad-1-final.mp4
    └── ad-2-final.mp4
```

---

**Questions? Issues? Ping me.**  
**Version**: 1.0  
**Last Updated**: Jan 2026  
**Next**: Try your first video, then ask questions!
