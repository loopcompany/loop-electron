; Included by electron-builder into the NSIS installer (electron-builder.yml → nsis.include).
; Keeps the setup short: always install for the current user (no admin prompt), so the
; "for all users / only for me" page is never shown — Welcome → folder → install → finish.
!macro customInstallMode
  StrCpy $isForceCurrentInstall "1"
!macroend
