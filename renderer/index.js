// The desktop bundle's entry is the mobile project's own web entry.
// The dialog shims go first, so every module sees the in-app alert().
import '@desktop/dialogShims';
import '@mobile/index.web';
