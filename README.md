# Vision Start
#### Small startpage 

## Predefined themes

1. Abstract
2. Aurora (Vista vibes)
3. Mountain

## Run Locally

**Prerequisites:**  Node.js

1. Install dependencies:
   `npm install`
2. Run the app:
   `npm run dev`

## to-do
* [x] Multiple Wallpapers
* [x] Remake icons
* [] Increase offline compatibility
  * Use chrome.storage.local for wallpapers
  * Use chrome.storage.local for some logos
    * Some logos have CORS enabled, we can add `"<all_urls>"` to the manifest.json file and cache them on storage local
* Dynamic Weather Widget
  * A box with information about the current weather, with manual entry on the location
  * Display current temperature, weather condition (e.g., "Sunny," "Cloudy"), and a corresponding icon
  * Optionally, show a 3-day forecast when clicked or hovered
* Search Bar Widget
  * Positioned to the right or left side of the clock, display a nice search bar
  * Behaviour:
    * When not in focus, it could be highly transparent with just a faint border and a search icon.
    * When clicked, it would smoothly expand and become slightly more opaque, with a soft glow around the border (similar to the existing ones)
  * Config to allow changing the default search engine
* Draggable & Resizable Grid System
  * Allow users to drag and drop all widgets (Clock, Website Tiles, Weather, Title, etc.) into any position on a grid
* Notes / Scratchpad Widget
  * A simple text area that saves its content to local storage automatically.
  * Maybe some extra formatting (bold, italic, increase font size, etc).
* Theme-ing
  * A Light/Dark Mode toggle
  * Custom Accent Colors
    * Selection of 6-8 accent colors that are guaranteed to look good with both Light and Dark themes
    * Define CSS variables for the accent color
  * Dynamic Wallpaper-Based Theming
    * Automatically adapt the UI's accent color to match the current wallpaper
  * Minimal feel toggle
    * Disable title & subtitle and search widget
    * Tiles become small stylish lines

From a technical side:
* Refactor everything :(
* Add small nginx demo (with docker)