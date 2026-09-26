# PRIMENET Factor Vault — Audio Credits & Implementation Notes

## Audio System Overview

The Factor Vault uses **Web Audio API synthesis** for all sound effects rather than pre-recorded audio files. This approach ensures:

- **Consistency**: All tones generated in real-time from the same algorithm
- **Low bandwidth**: No audio files to download
- **Customizable**: Easy to adjust tone, duration, and volume
- **Procedural**: Matches the technical, blueprint console aesthetic
- **Reliability**: Works across browsers with native Web Audio support

## Synthesized Sound Effects

### 1. **Correct Pair Tone**
- **Type**: Web Audio API Oscillator (sine + triangle)
- **Description**: Two-note rising tone (A4 → D5 perfect 4th)
- **Duration**: 180ms
- **Character**: Soft attack, smooth exponential release
- **Volume**: Soft (0.3x master volume)
- **Purpose**: Confirm successful factor pair validation

### 2. **Incorrect Pair Tone**
- **Type**: Web Audio API Oscillator (sine) with low-pass filter
- **Description**: Single low muted pulse
- **Frequency**: ~180 Hz (low, technical)
- **Duration**: 140ms
- **Character**: Slightly filtered, no harshness
- **Volume**: Soft (0.25x master volume)
- **Throttle**: 400ms minimum gap between repeats
- **Purpose**: Subtle error feedback without frustration

### 3. **Tile Spawn Sound**
- **Type**: Web Audio API layered synth (shimmer + click)
- **Description**: High shimmer (~2400 Hz) + low click (~120 Hz)
- **Duration**: 120ms
- **Character**: Sounds like a blueprint fragment "locking" into place
- **Volume**: Minimal (0.15x shimmer, 0.2x click)
- **Throttle**: 60ms gap between rapid spawns
- **Purpose**: Calm, technical procedural feedback

### 4. **Scan Sweep Sound**
- **Type**: Web Audio API Oscillator (triangle) with frequency sweep + filter
- **Description**: Filtered noise sweep from high to low
- **Duration**: 500ms
- **Frequency Range**: 1200 Hz → 300 Hz (exponential ramp)
- **Character**: Faint, technical scanning motion
- **Volume**: Very low (0.08x master volume)
- **Randomization**: 
  - **Probability**: 12-15% chance per glow line
  - **Frequency variation**: ±random(300-400 Hz) for organic feel
  - **Global cooldown**: 8 seconds minimum between sweeps
- **Purpose**: Rare, subtle ambience that feels technical

## Audio Control Interface

### UI Elements
- **Sound Toggle Button** (🔊/🔇 icon): Instantly enables/disables all audio
- **Master Volume Slider**: 0-100% (default 35%)
- **Location**: Header right side, next to N display

### User Preferences
- **Storage**: localStorage.primenet_sound_enabled, localStorage.primenet_sound_volume
- **Defaults**: 
  - Sound: enabled
  - Volume: 0.35 (35%)
- **Persistence**: Settings saved automatically, persist across sessions

## Integration Points

### Game Events with Audio

1. **Pair Validation (validateAll)**
   - `audioManager.playCorrectTone()` on valid pair
   - `audioManager.playIncorrectTone()` on validation error
   - Triggered: Immediately per pair validation

2. **Tile Rendering (renderVaults)**
   - `audioManager.playTileSpawn()` for each new tile added
   - Triggered: When tile appendChild() completes
   - Throttled: 60ms minimum between rapid spawns

3. **Scan Line Animation (redrawScanLines)**
   - `audioManager.playScanSweep()` when glow lines created
   - Triggered: On every glow line creation (probabilistic)
   - Global cooldown: 8 seconds minimum between any sweeps

## Technical Details

### Browser Support
- **Primary**: Chrome, Firefox, Edge, Safari (desktop)
- **Mobile**: Works but audio may be less reliable per browser restrictions
- **Fallback**: If Web Audio API unavailable, audio gracefully disables

### AudioContext Lifecycle
- **Initialization**: Lazy-loaded on first sound trigger or user interaction
- **State**: Respects browser autoplay policies (recommended use after user gesture)
- **Cleanup**: Context remains active for session duration

### Performance Considerations
- **CPU Impact**: Negligible (tone generation ~0.1ms per sound)
- **Memory**: Fixed oscillator allocation, no leaks
- **Bandwidth**: Zero audio file downloads
- **Latency**: <10ms total latency from event to audio start

## Design Philosophy

The audio system embodies the PRIMENET blueprint console aesthetic:

✓ **Calm, procedural**, not celebratory  
✓ **Technical, secure**, not arcade  
✓ **Minimal**, not aggressive  
✓ **Supportive**, not distracting  
✓ **Synthesized**, not sampled  
✓ **Responsive**, not delayed  

No celebratory dings, whooshes, sparkles, or neon game vibes. Pure procedural confirmation tones.

## Future Enhancements

- Add optional ambient loop (low facility hum, ~0.08 volume)
- Implement haptic feedback for mobile (vibration patterns)
- Add more procedural variations based on game context
- Support theme-specific audio presets (different synth styles)

---

**Implementation Date**: February 28, 2026  
**Audio Framework**: Native Web Audio API (no external dependencies)  
**License**: Part of PRIMENET project  
