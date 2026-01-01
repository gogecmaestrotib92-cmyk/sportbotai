# CapCut Screen Replacement Tutorial - Complete Beginner Guide

## 🎯 What We're Doing
Replace a phone screen in UGC video with your SportBot AI app using CapCut (way easier than DaVinci!).

**Time to complete**: 15-20 minutes for your first video  
**Cost**: FREE  
**Skill level**: Complete beginner

---

## 📥 Step 1: Download & Install (5 minutes)

### CapCut Desktop (Recommended)
1. Go to: **https://www.capcut.com/tools/desktop-video-editor**
2. Download for Mac (you're on macOS)
3. Install the app
4. Create free account (use Google sign-in)

**Why desktop over mobile?**
- Easier to see details
- Better precision for positioning
- Faster export
- Can use keyboard shortcuts

---

## 📹 Step 2: Prepare Your Files (10 minutes)

### A. Film the UGC Footage

**Option 1: Film yourself**
```bash
# Use iPhone/Camera
1. Set up phone on tripod or stable surface
2. Frame: Upper body visible + hand holding phone
3. Lighting: Bright, even light on your face AND phone
4. Film 15-30 seconds:
   - Hold phone at slight angle (30-45°)
   - Point to phone while talking
   - Keep phone relatively stable
   - Natural hand movements are OK

Script example:
"I used to spend hours researching matches. 
Then I found SportBot AI. (point to phone)
60 seconds and I know everything. 
Real data, no BS. Try it free."
```

**Pro tips**:
- Use phone with dark case (easier to see edges)
- Don't cover phone corners with fingers
- Keep phone screen visible to camera
- Film in landscape (horizontal) for Instagram/YouTube OR portrait (vertical) for TikTok/Reels

**Save as**: `ugc-person-phone.mp4`

### B. Record Your App Screen

**On Mac (easiest)**:
```bash
1. Press Cmd+Shift+5 (opens Screen Recording)
2. Click "Record Selected Portion"
3. Drag to select 1080x1920 area (vertical phone size)
4. Click "Record"
5. Open SportBot AI in browser at localhost:3000
6. Record 20-30 seconds:
   - Homepage hero
   - Click "Analyze Match"
   - Fill in team names
   - Show analysis results
   - Scroll through insights
7. Press Stop in menu bar
8. Screen recording saves to Desktop
```

**Or on iPhone** (if your app is mobile):
```bash
1. Settings → Control Center → Add "Screen Recording"
2. Open SportBot AI app
3. Swipe down → Tap record button
4. Wait 3 seconds countdown
5. Navigate through app (20-30 seconds)
6. Stop recording from control center
7. AirDrop to Mac or email yourself
```

**Save as**: `app-screen-recording.mp4`

---

## 🎬 Step 3: CapCut Screen Replacement (15 minutes)

### Part A: Import & Setup (2 minutes)

1. **Open CapCut Desktop**
2. Click **"New Project"**
3. **Import your files**:
   - Click **"Import"** (top left)
   - Select both files:
     - `ugc-person-phone.mp4`
     - `app-screen-recording.mp4`
   - They appear in Media Library (top)

### Part B: Add to Timeline (1 minute)

1. **Drag `ugc-person-phone.mp4`** to timeline (bottom)
   - This goes on **Track 1** (bottom layer)
   
2. **Drag `app-screen-recording.mp4`** above it
   - This goes on **Track 2** (top layer)
   - Align start points (both clips start at same time)

**Your timeline should look like**:
```
Track 2: [app-screen-recording.mp4] ← Top layer
Track 1: [ugc-person-phone.mp4]     ← Bottom layer
         0s                    30s
```

### Part C: Position App on Phone Screen (5 minutes)

Now the magic happens - we put your app ON the phone screen.

1. **Click on app clip** (Track 2) to select it
2. In **preview window** (center), you'll see your app overlaid on the UGC video
3. Look for **corner handles** on the app preview

**Adjust Position**:
- **Move**: Click and drag app to center it over phone screen
- **Scale**: Drag corner handles to resize - make it smaller to fit phone screen
- **Rotate**: Hover near corner until you see rotation cursor - rotate to match phone angle

**Fine-tune with numbers** (right panel):
- **Scale**: Usually 15-30% (make app small to fit phone)
- **Position X**: Move left/right (-100 to 100)
- **Position Y**: Move up/down (-100 to 100)
- **Rotation**: Match phone angle (0-30°)

**Goal**: App fits perfectly inside phone screen boundaries

### Part D: Crop to Phone Screen Shape (3 minutes)

Your app now covers the whole video. Let's crop it to ONLY show on phone.

**Method 1: Rectangle Mask (Easier)**

1. With app clip selected (Track 2)
2. Right panel → Find **"Mask"** tab
3. Click **"Rectangle"**
4. In preview, you'll see a white rectangle
5. **Adjust mask**:
   - Drag corners to match phone screen corners
   - Resize to cover ONLY phone screen area
   - Use feather slider: 2-5 (softens edges)

**Method 2: Manual Crop**

1. App clip selected (Track 2)
2. Right panel → **"Crop"** section
3. Adjust sliders:
   - **Left**: Crop left edge
   - **Right**: Crop right edge  
   - **Top**: Crop top edge
   - **Bottom**: Crop bottom edge
4. Preview updates in real-time

### Part E: Track Phone Movement (4 minutes)

If phone moves in video, app needs to follow it.

**CapCut Auto Tracking**:

1. Select app clip (Track 2)
2. Right panel → Find **"Tracking"** tab
3. Click **"Object Tracking"**
4. In preview, draw box around phone screen
5. Click **"Start Tracking"**
6. Wait 10-30 seconds while it analyzes
7. Playback to check - app should follow phone!

**If tracking fails**:
- Try smaller tracking box (just phone screen, not whole phone)
- Make sure phone has good lighting/contrast
- Track in 10-second segments instead of full video

**Manual keyframes** (if auto-tracking doesn't work):

1. Move playhead to start (0 seconds)
2. Position app on phone perfectly
3. Click **diamond icon** next to Position (enables keyframes)
4. Move playhead to where phone moves (e.g., 5 seconds)
5. Adjust position again to match phone
6. CapCut creates smooth transition automatically
7. Repeat for each major phone movement

---

## ✨ Step 4: Add Finishing Touches (5 minutes)

### A. Screen Glow Effect (makes it realistic)

1. Select app clip (Track 2)
2. Right panel → **"Effects"** tab
3. Search: **"Glow"** or **"Light"**
4. Apply **"Soft Glow"**
5. Adjust:
   - Intensity: 20-30%
   - Color: Teal (#0D9488 - your brand color)

### B. Reduce App Opacity Slightly

1. App clip selected
2. Right panel → **"Adjustment"**
3. **Opacity**: 95% (adds realism - screens aren't 100% opaque)

### C. Add Text Overlays

1. Top toolbar → **"Text"**
2. Choose style (minimal/clean)
3. Type: **"SportBot AI"** or **"60-second match intel ↓"**
4. Drag to timeline above both clips
5. Position in preview (bottom third usually)
6. Adjust:
   - Font: Sans-serif (Helvetica, Arial)
   - Color: White or Teal (#0D9488)
   - Animation: Fade in/out

### D. Add Background Music (optional)

1. Top toolbar → **"Audio"**
2. Search CapCut library: "upbeat" or "modern"
3. Drag to timeline
4. Lower volume: 20-30% (don't overpower voice)

---

## 📤 Step 5: Export Your Video (3 minutes)

1. Click **"Export"** (top right)
2. **Settings**:
   - **Resolution**: 1080p (or 4K if source was 4K)
   - **Frame Rate**: 30fps (or match source)
   - **Format**: MP4
   - **Quality**: High

3. **Filename**: `sportbot-ugc-ad-1.mp4`
4. **Save location**: Choose folder
5. Click **"Export"**
6. Wait 1-3 minutes for export

---

## 🎯 Quick Troubleshooting

### "App doesn't fit phone screen perfectly"
**Fix**: 
- Use mask instead of crop (more flexible)
- Zoom into preview (pinch/scroll) to see details
- Adjust mask corners pixel by pixel

### "App looks flat/fake on phone"
**Fix**:
- Add soft glow effect
- Reduce opacity to 92-95%
- Add subtle motion blur (Effects → Blur → Motion Blur at 10%)
- Match color tone: if video is warm, add warm tint to app

### "Tracking keeps losing the phone"
**Fix**:
- Use manual keyframes instead (easier than it sounds)
- Track just 5-10 seconds at a time
- Make sure phone has good contrast with background
- OR film with phone more stable

### "Export is taking forever"
**Fix**:
- Export at 1080p instead of 4K (perfectly fine)
- Close other apps
- Let it run - first export always takes longer

### "Colors don't match"
**Fix**:
- Select app clip
- Right panel → Adjustments
- Match brightness/saturation to main video
- If main video is warm (yellow), add warmth to app

---

## 🚀 Faster Workflow Tips

### Presets for Next Videos

After your first video:
1. Save mask shape: Right-click mask → "Save as Preset"
2. Save position: Export project as template
3. For video #2: Import, swap videos, adjust slightly

### Keyboard Shortcuts

- **Space**: Play/Pause
- **Cmd+Z**: Undo
- **J/K/L**: Rewind/Pause/Fast forward
- **I**: Set in point
- **O**: Set out point
- **Cmd+B**: Split clip

### Timeline Navigation

- Zoom timeline: Pinch trackpad or Cmd+/Cmd-
- Scrub: Drag playhead
- Frame-by-frame: Arrow keys left/right

---

## 📋 Checklist: Before You Start

- [ ] CapCut Desktop installed
- [ ] UGC footage filmed (15-30 seconds)
- [ ] App screen recording ready (same duration)
- [ ] Both files in same folder
- [ ] Good lighting in UGC footage
- [ ] Phone screen visible and not glared in UGC

---

## 🎬 Alternative: CapCut Phone Mockup Templates

If manual positioning is too hard, use built-in templates:

1. CapCut → **Templates**
2. Search: **"phone mockup"** or **"screen replacement"**
3. Many have pre-made phone tracking
4. Just replace with your app video
5. Done in 5 minutes!

**Popular templates**:
- "Device Mockup"
- "Phone Screen Show"
- "App Demo"

---

## 💡 Pro Tips

### Filming Tips for Easier Editing:
- Hold phone at 45° angle (not straight on)
- Use phone case with contrasting color
- Film against clean background
- Keep hand steady (rest elbow on table)

### App Recording Tips:
- Match aspect ratio to phone in video
- Add 1-2 second pause at start/end (easier to sync)
- Use demo account with good data
- Show key features in logical flow

### Editing Tips:
- Do rough positioning first, fine-tune later
- Save project every 5 minutes (Cmd+S)
- Export test version at 720p to preview quickly
- Watch full video before final export

---

## 🎯 Your First Video - Step by Step

**Total time: 30 minutes**

### Minute 0-10: Filming
1. Set up phone/camera
2. Film yourself holding phone (15 seconds)
3. Say simple script about SportBot AI

### Minute 10-15: Record App
1. Cmd+Shift+5 (screen record)
2. Navigate through SportBot AI (15 seconds)
3. Stop recording

### Minute 15-30: CapCut Editing
1. Import both files (2 min)
2. Add to timeline (1 min)
3. Position app on phone (5 min)
4. Add mask/crop (3 min)
5. Add glow effect (2 min)
6. Add text overlay (2 min)

### Minute 30-33: Export
1. Export settings: 1080p, 30fps, MP4
2. Export (3 min)

### Minute 33: DONE! 
Post to Instagram/TikTok and track results.

---

## 🎓 Learning Resources

### CapCut Tutorials:
- **CapCut Official**: youtube.com/@CapCut (beginner series)
- **Howfinity**: "CapCut Screen Replacement Tutorial"
- Search YouTube: "CapCut object tracking tutorial"

### Practice:
1. Do one rough version (don't aim for perfect)
2. Review what worked/didn't work
3. Try again with adjustments
4. By video #3, you'll be fast

---

## 🆚 CapCut vs DaVinci Comparison

| Feature | CapCut | DaVinci |
|---------|--------|---------|
| **Learning Curve** | 30 min | 3-4 hours |
| **Tracking** | Auto + Easy manual | Advanced Planar (complex) |
| **Interface** | Simple, clean | Professional, overwhelming |
| **Export Time** | Fast | Slower |
| **Cost** | Free | Free (Studio is $295) |
| **Best For** | Quick UGC ads | Professional VFX |

**Verdict**: Use CapCut for SportBot UGC ads. DaVinci is overkill.

---

## ❓ Common Questions

**Q: Can I do this on my phone instead of desktop?**  
A: Yes! CapCut mobile app has same features, but desktop is easier for precise positioning.

**Q: What if my phone moves a lot in video?**  
A: Either re-film with more stable hand, or use manual keyframes every 3-5 seconds.

**Q: Do I need paid version?**  
A: No. Free version has everything you need for this.

**Q: Can I batch edit multiple videos?**  
A: Sort of - save first project as template, then swap video files for subsequent ads.

**Q: How do I match app timing with when person points?**  
A: On timeline, slide app clip left/right to sync with pointing gesture.

---

## 🎉 After Your First Video

**Test it**:
1. Export 1080p version
2. Watch full video on phone
3. Check if app tracking looks smooth
4. Send to friend for feedback

**Post it**:
1. Instagram Reels / TikTok
2. Caption: "This is how I research matches now 👇"
3. CTA: "Try free - link in bio"

**Measure**:
- 3-second hook rate (did people watch past 3s?)
- Average watch time
- Link clicks
- Comments/DMs

**Iterate**:
- If hook rate low: change first 3 seconds
- If watch time low: make shorter (15s instead of 30s)
- If clicks low: stronger CTA

**By video #5, you'll know what works.**

---

## 🚀 Next Steps

After you master basic screen replacement:

1. **Add animations**: App content changing as person talks
2. **Multiple phones**: Show before/after (old way vs SportBot way)
3. **Green screen**: Film person separately, composite with app
4. **Advanced tracking**: Multiple objects, 3D perspective

**But first**: Just do ONE simple video today. Don't overthink it.

---

## 📦 Files You'll Create

```
/SportBot-UGC-Ads/
├── footage/
│   ├── ugc-person-phone.mp4
│   └── app-screen-recording.mp4
├── capcut-projects/
│   └── sportbot-ad-1.ccp (CapCut project file)
└── exports/
    └── sportbot-ugc-ad-1.mp4 ← Final video!
```

---

**Ready? Let's do this!**

1. Download CapCut now (5 min)
2. Film yourself + record app (15 min)
3. Follow this guide step-by-step (20 min)
4. Export and post your first UGC ad (5 min)

**Total: 45 minutes from zero to posted ad.**

You got this! 🚀
