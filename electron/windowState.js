/**
 * Remembers the main window's size/position/maximized state between launches.
 */
const fs = require('fs');
const path = require('path');
const { app, screen } = require('electron');

const DEFAULTS = { width: 1366, height: 840 };
const FILE_NAME = 'window-state.json';

function stateFile() {
  return path.join(app.getPath('userData'), FILE_NAME);
}

/** A saved position is only reused if it is still on a connected display. */
function isVisible(bounds) {
  return screen.getAllDisplays().some(({ workArea }) => {
    return (
      bounds.x >= workArea.x - 50 &&
      bounds.y >= workArea.y - 50 &&
      bounds.x + 100 <= workArea.x + workArea.width &&
      bounds.y + 100 <= workArea.y + workArea.height
    );
  });
}

/**
 * @param {{width: number, height: number}} min  the window's minimum size; a
 *   size saved by an older version with a smaller minimum is grown to it.
 */
function load(min = { width: 0, height: 0 }) {
  try {
    const saved = JSON.parse(fs.readFileSync(stateFile(), 'utf8'));
    const state = {
      width: Math.max(Number(saved.width) || DEFAULTS.width, min.width),
      height: Math.max(Number(saved.height) || DEFAULTS.height, min.height),
      isMaximized: !!saved.isMaximized,
    };
    if (Number.isFinite(saved.x) && Number.isFinite(saved.y) && isVisible({ ...state, x: saved.x, y: saved.y })) {
      state.x = saved.x;
      state.y = saved.y;
    }
    return state;
  } catch {
    // First launch: the default size, but never bigger than the screen.
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;
    return {
      width: Math.min(DEFAULTS.width, width),
      height: Math.min(DEFAULTS.height, height),
      isMaximized: false,
    };
  }
}

/** Persists on close; `getNormalBounds` keeps the pre-maximize size. */
function track(win) {
  win.on('close', () => {
    try {
      const bounds = win.getNormalBounds();
      fs.writeFileSync(stateFile(), JSON.stringify({ ...bounds, isMaximized: win.isMaximized() }));
    } catch {
      // Non-critical: next launch just uses the defaults.
    }
  });
}

module.exports = { load, track };
