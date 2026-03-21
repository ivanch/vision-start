# Notes Widget Implementation Plan
## Overview
This document outlines the implementation plan for a Notes / Scratchpad Widget feature that:
1. Provides a text area that saves content to local storage automatically
2. Includes bold and italic formatting buttons
3. Has a toggle icon to show/hide the widget
4. Has a glassy/frosty design with strong blur
## Implementation Steps
### 1. Update Config Interface
In `types.ts`, add a new `notesWidget` configuration object:
```typescript
notesWidget: {
  enabled: boolean;
}
```
### 2. Update ConfigurationModal Component
In `components/ConfigurationModal.tsx`:
- Add `notesWidget` to the config state initialization (lines 18-44)
- Add a new "Notes" tab to the tab navigation (lines 259-284)
- Add a toggle switch for notesWidget.enabled in the Notes tab (lines 552-560)
- Add the Notes tab content with the toggle switch
### 3. Create NotesWidget Component
Create a new file `components/NotesWidget.tsx`:
- Text area for notes input
- Bold and italic formatting buttons
- Toggle icon for showing/hiding the widget
- Glassy/frosty design with strong blur
- Auto-save to localStorage using `userNotes` key
### 4. Update App Component
In `App.tsx`:
- Add notesWidget to the defaultConfig (lines 14-35)
- Add the NotesWidget component to the render output when enabled in config (lines 250-251)
- Add logic to save/load notes from localStorage
## Technical Details
### Configuration Structure
The configuration will be stored in the same way as other widgets:
```typescript
config: {
  notesWidget: {
    enabled: boolean;
  }
}
```
### Local Storage Key
All notes text will be saved to localStorage with the key `userNotes`.
### UI Design
- Widget will be positioned on the left side of the screen
- Vertically centered using flexbox
- Glassy/frosty design using backdrop-blur and background transparency
- Strong blur effect (backdrop-blur-2xl or similar)
- Toggle icon will be positioned on the left edge of the widget
- When hidden, icon shows a "show" indicator
- When open, icon shows a "hide" indicator
### Formatting Buttons
- Bold button (B)
- Italic button (I)
- These will use HTML formatting (bold/italic tags) or rich text approach