# Replace Phone Screens in Existing InVideo UGC Videos - Step by Step

## 🎯 What You Have
- ✅ UGC video from InVideo (person holding phone with generic screen)
- ✅ Screen recording of your SportBot AI app
- ❓ Need to replace phone screen with your app

**Time**: 15-20 minutes per video

---

## 🚀 Quick Start - Exact Steps

### Step 1: Download Your InVideo Video (2 min)

1. Go to InVideo AI project
2. Click **"Export"** or **"Download"**
3. Choose highest quality (1080p)
4. Save as: `invideo-ugc-original.mp4`

### Step 2: Prepare Your App Recording (2 min)

You said you already have this, but verify:
- **Duration**: Should match the phone screen time in InVideo video
- **Aspect ratio**: 9:16 (vertical) for phone screen
- **File**: `sportbot-app-screen.mp4`

**If app recording is too long/short**:
- Open in CapCut
- Trim to exact duration needed
- Export as new file

---

### Step 3: Open in CapCut Desktop (1 min)

1. Open CapCut Desktop
2. New Project
3. Import both files:
   - `invideo-ugc-original.mp4` (the InVideo video)
   - `sportbot-app-screen.mp4` (your app)

---

### Step 4: Add to Timeline (1 min)

```
Track 2: [sportbot-app-screen.mp4]  ← Your app (top layer)
Track 1: [invideo-ugc-original.mp4] ← InVideo video (bottom)
         0s                      30s
```

1. Drag `invideo-ugc-original.mp4` to **Track 1** (bottom)
2. Drag `sportbot-app-screen.mp4` to **Track 2** (above it)
3. Align them so they start at same time

---

### Step 5: Find When Phone Appears (2 min)

1. **Play the video** (spacebar)
2. **Note timestamps** when phone screen is visible
   - Example: Person shows phone from 10s to 25s
3. **Trim your app clip** to match:
   - Select app clip on Track 2
   - Move start of clip to 10s (when phone appears)
   - Trim end to 25s (when phone disappears)

**Quick trim**:
- Move playhead to 10s
- Select app clip
- Press **"S"** to split
- Delete the part before 10s
- Repeat for end at 25s

---

### Step 6: Position App on Phone Screen (5 min)

This is the main part:

1. **Move playhead** to where phone is clearest (e.g., 15s)
2. **Click app clip** on Track 2 (it's selected)
3. In **preview window**, you see app overlaid on video

**Resize & Position**:
- **Drag corner handles** to make app smaller (fit phone screen)
- **Drag center** to move app over phone screen
- **Hover near corner** → rotate to match phone angle

**Use the right panel numbers** for precision:
- **Scale**: Usually 20-35% (small to fit phone)
- **Position X**: -50 to 50 (left/right)
- **Position Y**: -30 to 30 (up/down)  
- **Rotation**: 10-30° (match phone tilt)

**Goal**: Your app fits perfectly inside the phone screen boundaries in the InVideo video

---

### Step 7: Mask App to Phone Shape (3 min)

Right now your app covers the whole screen. Let's show it ONLY on the phone:

1. **With app clip selected** (Track 2)
2. Right panel → **"Mask"** button
3. Choose **"Rectangle"** mask
4. **Adjust mask in preview**:
   - Drag 4 corners to match phone screen corners
   - Make it slightly smaller than phone screen (to hide edges)
5. **Feather**: Set to 3-5 (softens edges, looks more realistic)

**Visual check**:
- Play video
- App should only appear on phone screen
- Nothing outside phone screen visible

---

### Step 8: Track Phone Movement (5 min)

If the phone moves in the InVideo video, your app needs to follow it.

**Option A: Auto Track (Try First)**

1. App clip selected (Track 2)
2. Right panel → **"Tracking"** tab
3. Click **"Object Tracking"** or **"Smart Tracking"**
4. In preview, **draw box around phone screen** (not whole phone, just screen)
5. Click **"Start Tracking"**
6. Wait 10-30 seconds
7. **Play to verify** - does app follow phone?

**If tracking works**: Great! Skip to Step 9.

**Option B: Manual Keyframes (If Auto Tracking Fails)**

1. Move playhead to **start** of phone appearance (e.g., 10s)
2. Position app perfectly on phone
3. **Click diamond icon** next to Position/Scale/Rotation (enables keyframing)
4. Move playhead to **next phone position** (e.g., 13s)
5. Adjust app position to match phone
6. CapCut creates smooth transition
7. **Repeat** every 3-5 seconds where phone moves
8. Play to check - should look smooth

**Keyframe tips**:
- More keyframes = smoother tracking
- Place keyframes where phone changes direction
- You can adjust keyframes later (just move playhead and adjust)

---

### Step 9: Add Realism (3 min)

Make it look like the app is really on the phone:

**A. Screen Glow**
1. App clip selected
2. Right panel → **"Effects"**
3. Search: "Glow"
4. Apply **"Soft Glow"** or **"Light"**
5. Adjust intensity: 15-25%

**B. Slight Transparency**
1. App clip selected  
2. Right panel → **"Adjustment"**
3. **Opacity**: 92-95% (phones aren't 100% opaque)

**C. Match Colors** (if needed)
1. If InVideo video is warm/cool toned
2. App clip → Adjustment
3. **Temperature**: Adjust to match scene
4. **Saturation**: Match video saturation

---

### Step 10: Export Final Video (3 min)

1. Click **"Export"** (top right)
2. **Settings**:
   - Format: **MP4**
   - Resolution: **1080p** (or match source)
   - Frame Rate: **30fps**
   - Quality: **High**
3. **Filename**: `sportbot-ugc-ad-final.mp4`
4. Click **"Export"**
5. Wait 2-5 minutes

**Done!** You now have your InVideo UGC video with your real app on the phone screen.

---

## 🔧 Troubleshooting Common Issues

### Problem: "App doesn't fit phone screen perfectly"

**Solution**:
- Zoom into preview (pinch or Cmd+scroll)
- Adjust mask corners pixel by pixel
- Use **grid overlay** (View → Grid) for alignment
- Try at different timestamps - phone angle changes

### Problem: "Tracking loses the phone"

**Solution**:
- Split the clip where tracking fails
- Track shorter segments (5-10 seconds each)
- Use manual keyframes instead (easier for short clips)
- Make sure tracking box is TIGHT around phone screen

### Problem: "App looks floaty/fake"

**Solution**:
- Reduce opacity to 93-95%
- Add motion blur: Effects → Blur → Motion Blur (10%)
- Match lighting: if phone is in shadow, darken app
- Add subtle shadow: Effects → Shadow (low opacity)

### Problem: "App is wrong aspect ratio"

**Solution**:
- Your app recording should be 9:16 (phone vertical)
- If it's not, crop it first:
  - Select app clip → Crop
  - Adjust to phone shape
  - Or re-record app at correct size

### Problem: "Mask doesn't follow phone"

**Solution**:
- Mask is separate from tracking
- You need to track the clip FIRST
- Then add mask on top
- Or use manual keyframes to move mask

### Problem: "Colors don't match"

**Solution**:
- App clip → Adjustments
- **Brightness**: Match to video lighting
- **Contrast**: Match video contrast
- **Temperature**: Warm it up if video is warm, cool if video is cool
- **Saturation**: Reduce if video is desaturated

---

## 💡 Pro Tips

### Before You Start:
- **Watch your InVideo video** and note exact timestamps when phone appears
- **Check phone angle** - is it tilted? Rotating? Moving?
- **Prepare app recording** to be slightly longer than needed (easier to trim)

### While Editing:
- **Work at 0.5x speed** when positioning (easier to see details)
- **Pause often** and check different frames
- **Use keyboard shortcuts**: Space (play), J/L (rewind/forward), Arrow keys (frame-by-frame)
- **Save frequently**: Cmd+S every few minutes

### For Best Results:
- **Add subtle animation to app** - slight zoom or scroll makes it feel alive
- **Time app actions with voice** - if person says "and here are the stats", show stats on app
- **Keep app visible 5-10 seconds** - long enough to read but not boring

---

## 🎬 Example Workflow for Your Videos

Let's say you have 3 InVideo UGC videos:

**Video 1: "60 Second Game Changer"**
```
1. InVideo shows phone from 8s to 22s (14 seconds)
2. Trim your app recording to 14 seconds
3. Position app on phone at 8s mark
4. Track/keyframe for 14 seconds
5. Add glow effect
6. Export as: sportbot-ad-1-final.mp4
Time: 20 minutes
```

**Video 2 & 3**: Same process, gets faster each time.

By video 3, you'll do it in 10 minutes.

---

## ⚡ Quick Reference - CapCut Controls

### Essential Shortcuts:
- **Space**: Play/Pause
- **J/K/L**: Rewind/Pause/Fast Forward
- **Cmd+Z**: Undo
- **S**: Split clip at playhead
- **Delete**: Remove selected clip
- **Cmd+S**: Save project
- **Cmd+Shift+E**: Export
- **Arrow keys**: Move frame by frame

### Panel Navigation:
- **Left**: Media library (your files)
- **Center**: Preview window (what you see)
- **Right**: Properties (adjust selected clip)
- **Bottom**: Timeline (your edit)

### Zoom Timeline:
- **Cmd +/-**: Zoom in/out timeline
- **Shift+Z**: Fit timeline to window

---

## 📋 Checklist: Before Export

- [ ] App fits phone screen perfectly
- [ ] App follows phone movement smoothly
- [ ] Mask hides app outside phone screen
- [ ] Glow effect applied (subtle)
- [ ] Opacity reduced to 92-95%
- [ ] Colors match scene lighting
- [ ] No jittering or jumping
- [ ] Watched full video at least twice
- [ ] Audio is in sync

---

## 🎯 If You Get Stuck

### After 30 minutes of trying:

**Option 1**: Post in CapCut Facebook group
- "How do I track a phone screen replacement?"
- Share screenshot
- Usually get answer in 30 min

**Option 2**: Hire on Fiverr ($20-30)
- Search: "screen replacement video editing"
- Send them:
  - InVideo video
  - Your app recording  
  - "Replace phone screen with this app"
- Get result in 24 hours

**Option 3**: Simplify
- Just show app screen separately (no replacement)
- Cutaway shots: Person talks → cut to app fullscreen → back to person
- Easier to edit, still effective

---

## 🎥 Alternative Approach: Cutaways

If screen replacement is too hard, do this instead:

```
Timeline:
[Person talking 5s] → [App fullscreen 10s] → [Person talking 5s]
```

**Advantages**:
- No tracking needed
- Faster to edit (5 minutes)
- Clear view of app features
- Still looks professional

**How**:
1. InVideo video on Track 1
2. Split at points where you want to show app
3. Insert app recording fullscreen
4. Add simple transition (fade/wipe)
5. Done!

Many successful UGC ads use this instead of screen replacement.

---

## ✅ Success Criteria

Your final video should:
- ✅ App clearly visible on phone screen
- ✅ Tracking smooth with no jittering  
- ✅ Looks realistic (not floating)
- ✅ Colors/lighting match
- ✅ Visible for 5-10 seconds minimum
- ✅ 1080p export quality

---

## 🚀 Next Video Will Be Faster

**First video**: 30-45 minutes (learning)  
**Second video**: 20 minutes (getting comfortable)  
**Third video**: 10-15 minutes (you've got it)  
**Fifth video**: 5-10 minutes (muscle memory)

**The key**: Just finish one, even if imperfect. Learning by doing beats tutorial-watching.

---

**Ready to try?**

1. Open CapCut now
2. Import your InVideo video + app recording
3. Follow Step 1-10 above
4. Don't aim for perfect - aim for done
5. You can always redo it faster next time

Let me know which step you get stuck on and I'll help troubleshoot! 🚀
