; Included by electron-builder into the NSIS installer (electron-builder.yml → nsis.include),
; ahead of its own template.
;
;   Welcome → install folder → progress → finish, in Persian, in Loop's own design: the
;   welcome, folder and finish pages are Loop's pages over the whole window; NSIS's
;   progress page gets Loop's header band and button bar around it.

; --- Persian, right to left ------------------------------------------------------------
; electron-builder calls the language "Persian", but NSIS's files are named "Farsi", so its
; language macro is replaced. Its own message strings still come in for LCID 1065
; (installerLanguages: fa_IR in electron-builder.yml).
!macroundef addLangs
!macro addLangs
  ; strings NSIS's Farsi file lacks (the "for me / for everyone" page); defined here they
  ; become its Farsi strings instead of an English fallback, which the build rejects (-WX)
  !define MULTIUSER_TEXT_INSTALLMODE_TITLE "انتخاب کاربران"
  !define MULTIUSER_TEXT_INSTALLMODE_SUBTITLE "مشخص کنید $(^NameDA) برای کدام کاربران نصب شود."
  !define MULTIUSER_INNERTEXT_INSTALLMODE_TOP "انتخاب کنید $(^NameDA) فقط برای شما نصب شود یا برای همه‌ی کاربران این رایانه. $(^ClickNext)"
  !define MULTIUSER_INNERTEXT_INSTALLMODE_ALLUSERS "نصب برای همه‌ی کاربران این رایانه"
  !define MULTIUSER_INNERTEXT_INSTALLMODE_CURRENTUSER "نصب فقط برای من"
  !insertmacro MUI_LANGUAGE "Farsi"
!macroend

; --- Short setup -----------------------------------------------------------------------
; Always install for the current user (no admin prompt), so the "for all users / only for
; me" page is never shown.
!macro customInstallMode
  StrCpy $isForceCurrentInstall "1"
!macroend

; --- Loop's pages ----------------------------------------------------------------------
; Pictures drawn by `npm run installer:art` (scripts/installer-art/pages.html), in the size
; made for the display scale, so nothing is blurred by stretching. A page picture fills the
; whole window, its 46 px button bar included; the buttons are separate pictures laid over
; it (normal / hover, hand cursor), positioned from build/installer/layout.nsh. NSIS's own
; grey buttons are hidden meanwhile but still answer Enter (next) and Esc (cancel).
!include "${BUILD_RESOURCES_DIR}\installer\layout.nsh"
!ifndef BUILD_UNINSTALLER
  !include StrContains.nsh ; electron-builder's; its own folder page (now off) included it
!endif

!define LOOP_ART "${BUILD_RESOURCES_DIR}\installer"
; button slots: 1 primary · 2 secondary · 3 tertiary · 4 browse (folder page)

!macro loopExtractButton PAGE NAME SLOT SCALE
  File "/oname=$PLUGINSDIR\loop-b${SLOT}.bmp" "${LOOP_ART}\${PAGE}-${NAME}-${SCALE}.bmp"
  File "/oname=$PLUGINSDIR\loop-b${SLOT}h.bmp" "${LOOP_ART}\${PAGE}-${NAME}-hover-${SCALE}.bmp"
!macroend

!macro loopExtractScale PAGE SCALE
  File "/oname=$PLUGINSDIR\loop-page.bmp" "${LOOP_ART}\${PAGE}-${SCALE}.bmp"
  !insertmacro loopExtractButton ${PAGE} primary 1 ${SCALE}
  !insertmacro loopExtractButton ${PAGE} secondary 2 ${SCALE}
  !if ${PAGE} == folder
    !insertmacro loopExtractButton ${PAGE} tertiary 3 ${SCALE}
    !insertmacro loopExtractButton ${PAGE} browse 4 ${SCALE}
  !endif
!macroend

!macro loopExtract PAGE
  InitPluginsDir
  ${If} $loop.Scale == 200
    !insertmacro loopExtractScale ${PAGE} 200
  ${ElseIf} $loop.Scale == 150
    !insertmacro loopExtractScale ${PAGE} 150
  ${ElseIf} $loop.Scale == 125
    !insertmacro loopExtractScale ${PAGE} 125
  ${Else}
    !insertmacro loopExtractScale ${PAGE} 100
  ${EndIf}
!macroend

; a rectangle of layout.nsh (px at 100 %) → this window's pixels, in $R0..$R3 (x y w h)
!macro loopScaleRect X Y W H
  IntOp $R0 ${X} * $loop.W
  IntOp $R0 $R0 / ${LOOP_PAGE_W}
  IntOp $R1 ${Y} * $loop.H
  IntOp $R1 $R1 / ${LOOP_PAGE_H}
  IntOp $R2 ${X} + ${W}
  IntOp $R2 $R2 * $loop.W
  IntOp $R2 $R2 / ${LOOP_PAGE_W}
  IntOp $R2 $R2 - $R0
  IntOp $R3 ${Y} + ${H}
  IntOp $R3 $R3 * $loop.H
  IntOp $R3 $R3 / ${LOOP_PAGE_H}
  IntOp $R3 $R3 - $R1
!macroend

!macro loopLoadBmp FILE W H OUT
  System::Call 'user32::LoadImage(p 0, t "${FILE}", i 0, i ${W}, i ${H}, i 0x10) p .s' ; LR_LOADFROMFILE
  Pop ${OUT}
!macroend

; one button picture at a layout.nsh rectangle, as slot SLOT
!macro loopButton SLOT X Y W H
  !insertmacro loopScaleRect ${X} ${Y} ${W} ${H}
  ${NSD_CreateBitmap} $R0 $R1 $R2 $R3 ""
  Pop $loop.Btn${SLOT}
  !insertmacro loopLoadBmp "$PLUGINSDIR\loop-b${SLOT}.bmp" $R2 $R3 $loop.Bmp${SLOT}
  !insertmacro loopLoadBmp "$PLUGINSDIR\loop-b${SLOT}h.bmp" $R2 $R3 $loop.Hov${SLOT}
  SendMessage $loop.Btn${SLOT} 0x0172 0 $loop.Bmp${SLOT} ; STM_SETIMAGE, IMAGE_BITMAP
  ${NSD_OnClick} $loop.Btn${SLOT} loopClick${SLOT}
!macroend

; the setup window is mirrored for Persian; Loop's pictures carry their own direction
!macro loopNoMirror HWND
  System::Call 'user32::GetWindowLong(p ${HWND}, i -20) i .r1'
  IntOp $2 0x402000 ~ ; WS_EX_LAYOUTRTL | WS_EX_RTLREADING
  IntOp $1 $1 & $2
  System::Call 'user32::SetWindowLong(p ${HWND}, i -20, i r1)'
!macroend

; is the cursor ($1, $2 on screen) over button SLOT? then $3 = SLOT
!macro loopIfOver SLOT
  ${If} $loop.Btn${SLOT} <> 0
    System::Call '*(i, i, i, i) p .r4'
    System::Call 'user32::GetWindowRect(p $loop.Btn${SLOT}, p r4)'
    System::Call '*$4(i .r5, i .r6, i .r7, i .r8)'
    System::Free $4
    ${If} $1 >= $5
    ${AndIf} $1 < $7
    ${AndIf} $2 >= $6
    ${AndIf} $2 < $8
      StrCpy $3 ${SLOT}
    ${EndIf}
  ${EndIf}
!macroend

!macro loopPaintButton SLOT
  ${If} $loop.Btn${SLOT} <> 0
    ${If} $loop.Hover == ${SLOT}
      SendMessage $loop.Btn${SLOT} 0x0172 0 $loop.Hov${SLOT}
    ${Else}
      SendMessage $loop.Btn${SLOT} 0x0172 0 $loop.Bmp${SLOT}
    ${EndIf}
  ${EndIf}
!macroend

!macro loopFreeButton SLOT
  ${If} $loop.Btn${SLOT} <> 0
    System::Call 'gdi32::DeleteObject(p $loop.Bmp${SLOT})'
    System::Call 'gdi32::DeleteObject(p $loop.Hov${SLOT})'
    StrCpy $loop.Btn${SLOT} 0
  ${EndIf}
!macroend

; $loop.W / $loop.H = the window's client area; $loop.Scale = the picture set for it
; (497 px wide at 100 %; 175 % takes the 200 % set)
!macro loopMeasure
  System::Call '*(i, i, i, i) p .r0'
  System::Call 'user32::GetClientRect(p $HWNDPARENT, p r0)'
  System::Call '*$0(i, i, i .r1, i .r2)'
  System::Free $0
  StrCpy $loop.W $1
  StrCpy $loop.H $2
  ${If} $loop.W > 870
    StrCpy $loop.Scale 200
  ${ElseIf} $loop.W > 683
    StrCpy $loop.Scale 150
  ${ElseIf} $loop.W > 559
    StrCpy $loop.Scale 125
  ${Else}
    StrCpy $loop.Scale 100
  ${EndIf}
!macroend

; NSIS's own header and button bar out of the way / back (Back is NSIS's own business)
!macro loopHideChrome
  GetDlgItem $0 $HWNDPARENT 1036 ; the line under the header
  ShowWindow $0 ${SW_HIDE}
  ShowWindow $mui.Header.Background ${SW_HIDE}
  ShowWindow $mui.Header.Text ${SW_HIDE}
  ShowWindow $mui.Header.SubText ${SW_HIDE}
  ShowWindow $mui.Header.Image ${SW_HIDE}
  ShowWindow $mui.Branding.Background ${SW_HIDE}
  ShowWindow $mui.Branding.Text ${SW_HIDE}
  ShowWindow $mui.Line.Standard ${SW_HIDE}
  ShowWindow $mui.Line.FullWindow ${SW_HIDE}
  ShowWindow $mui.Button.Back ${SW_HIDE}
  ShowWindow $mui.Button.Next ${SW_HIDE}
  ShowWindow $mui.Button.Cancel ${SW_HIDE}
!macroend

!macro loopShowChrome
  GetDlgItem $0 $HWNDPARENT 1036
  ShowWindow $0 ${SW_SHOW}
  ShowWindow $mui.Header.Background ${SW_SHOW}
  ShowWindow $mui.Header.Text ${SW_SHOW}
  ShowWindow $mui.Header.SubText ${SW_SHOW}
  ShowWindow $mui.Header.Image ${SW_SHOW}
  ShowWindow $mui.Branding.Background ${SW_SHOW}
  ShowWindow $mui.Branding.Text ${SW_SHOW}
  ShowWindow $mui.Line.Standard ${SW_SHOW}
  ShowWindow $mui.Button.Next ${SW_SHOW}
  ShowWindow $mui.Button.Cancel ${SW_SHOW}
!macroend

!macro loopPageCode
  Var loop.Kind
  Var loop.Page
  Var loop.W
  Var loop.H
  Var loop.Scale
  Var loop.Picture
  Var loop.PictureBmp
  Var loop.Hover
  Var loop.Path ; folder page: the text box with the folder, and the size note
  Var loop.Size
  Var loop.PathFont
  Var loop.SizeFont
  !insertmacro loopButtonVars 1
  !insertmacro loopButtonVars 2
  !insertmacro loopButtonVars 3
  !insertmacro loopButtonVars 4

  ; a page over the whole window, NSIS's chrome hidden; the buttons come next
  Function loopPageBegin
    StrCpy $loop.Btn1 0
    StrCpy $loop.Btn2 0
    StrCpy $loop.Btn3 0
    StrCpy $loop.Btn4 0
    nsDialogs::Create 1044
    Pop $loop.Page
    ${If} $loop.Page == error
      Abort
    ${EndIf}
    !insertmacro loopNoMirror $loop.Page
    SetCtlColors $loop.Page "" 040F1F
    !insertmacro loopMeasure
    System::Call 'user32::SetWindowPos(p $loop.Page, p 0, i 0, i 0, i $loop.W, i $loop.H, i 0x10)' ; HWND_TOP, SWP_NOACTIVATE
    !insertmacro loopHideChrome
  FunctionEnd

  ; the page picture under the buttons, hover, show; then NSIS's chrome back
  Function loopPageRun
    ${NSD_CreateBitmap} 0 0 $loop.W $loop.H ""
    Pop $loop.Picture
    !insertmacro loopLoadBmp "$PLUGINSDIR\loop-page.bmp" $loop.W $loop.H $loop.PictureBmp
    SendMessage $loop.Picture 0x0172 0 $loop.PictureBmp
    System::Call 'user32::SetWindowPos(p $loop.Picture, p 1, i 0, i 0, i 0, i 0, i 0x13)' ; HWND_BOTTOM

    StrCpy $loop.Hover 0
    ${NSD_CreateTimer} loopHoverTick 40
    nsDialogs::Show
    ${NSD_KillTimer} loopHoverTick
    StrCpy $loop.Hover 0
    Call loopPaintHover ; the arrow cursor back for every static control

    System::Call 'gdi32::DeleteObject(p $loop.PictureBmp)'
    !insertmacro loopFreeButton 1
    !insertmacro loopFreeButton 2
    !insertmacro loopFreeButton 3
    !insertmacro loopFreeButton 4
    !insertmacro loopShowChrome
  FunctionEnd

  ; hover: the lighter picture and the hand cursor while the mouse is over a button
  Function loopHoverTick
    System::Call '*(i, i) p .r0'
    System::Call 'user32::GetCursorPos(p r0)'
    System::Call '*$0(i .r1, i .r2)'
    System::Free $0
    StrCpy $3 0
    System::Call 'user32::GetForegroundWindow() p .r0'
    ${If} $0 == $HWNDPARENT
      !insertmacro loopIfOver 1
      !insertmacro loopIfOver 2
      !insertmacro loopIfOver 3
      !insertmacro loopIfOver 4
    ${EndIf}
    ${If} $3 != $loop.Hover
      StrCpy $loop.Hover $3
      Call loopPaintHover
    ${EndIf}
  FunctionEnd

  Function loopPaintHover
    !insertmacro loopPaintButton 1
    !insertmacro loopPaintButton 2
    !insertmacro loopPaintButton 3
    !insertmacro loopPaintButton 4
    ${If} $loop.Hover == 0
      System::Call 'user32::LoadCursor(p 0, p 32512) p .r0' ; IDC_ARROW
    ${Else}
      System::Call 'user32::LoadCursor(p 0, p 32649) p .r0' ; IDC_HAND
    ${EndIf}
    ; the cursor of the STATIC class (only Loop's page is on screen meanwhile)
    System::Call 'user32::SetClassLongW(p $loop.Picture, i -12, p r0)'
    System::Call 'user32::SetCursor(p r0)'
  FunctionEnd


  Function loopNext
    SendMessage $HWNDPARENT 0x408 1 0 ; WM_NOTIFY_OUTER_NEXT
  FunctionEnd

  Function loopCancel
    SendMessage $HWNDPARENT ${WM_COMMAND} 2 0 ; IDCANCEL
  FunctionEnd

  ; primary: welcome → start · folder → install · finish → open Loop and close
  Function loopClick1
    Pop $0
    ${If} $loop.Kind == finish
      ; as electron-builder's own "Run" option: as the signed-in user, `--updated` on an update
      ${If} ${isUpdated}
        StrCpy $1 "--updated"
      ${Else}
        StrCpy $1 ""
      ${EndIf}
      HideWindow
      ${StdUtils.ExecShellAsUser} $0 "$launchLink" "open" "$1"
    ${EndIf}
    Call loopNext
  FunctionEnd

  ; secondary: welcome → cancel · folder → back · finish → close
  Function loopClick2
    Pop $0
    ${If} $loop.Kind == welcome
      Call loopCancel
    ${ElseIf} $loop.Kind == folder
      SendMessage $HWNDPARENT 0x408 -1 0
    ${Else}
      Call loopNext
    ${EndIf}
  FunctionEnd

  ; tertiary (folder): cancel
  Function loopClick3
    Pop $0
    Call loopCancel
  FunctionEnd

  ; browse (folder): pick another folder
  Function loopClick4
    Pop $0
    StrCpy $R9 $loop.Path ; (a dotted name breaks NSD_GetText's System::Call)
    ${NSD_GetText} $R9 $1
    nsDialogs::SelectFolderDialog "پوشه‌ای را برای نصب لوپ انتخاب کنید" "$1"
    Pop $1
    ${If} $1 != error
    ${AndIf} $1 != ""
      !insertmacro loopWithAppFolder $1
      ${NSD_SetText} $loop.Path $1
      Call loopShowSize
    ${EndIf}
  FunctionEnd
!macroend

!macro loopButtonVars SLOT
  Var loop.Btn${SLOT}
  Var loop.Bmp${SLOT}
  Var loop.Hov${SLOT}
!macroend

; like electron-builder's own folder page: Loop always gets a folder of its own
!macro loopWithAppFolder VAR
  ${StrContains} $0 "${APP_FILENAME}" ${VAR}
  ${If} $0 == ""
    StrCpy $0 ${VAR} 1 -1
    ${If} $0 == "\"
      StrCpy ${VAR} "${VAR}${APP_FILENAME}"
    ${Else}
      StrCpy ${VAR} "${VAR}\${APP_FILENAME}"
    ${EndIf}
  ${EndIf}
!macroend

; --- page 1: welcome -------------------------------------------------------------------
!macro customWelcomePage
  !insertmacro MUI_PAGE_INIT
  !insertmacro loopPageCode

  Page custom loopWelcomeCreate

  Function loopWelcomeCreate
    StrCpy $loop.Kind welcome
    Call loopPageBegin
    !insertmacro loopExtract welcome
    !insertmacro loopButton 1 ${LOOP_WELCOME_PRIMARY_X} ${LOOP_WELCOME_PRIMARY_Y} ${LOOP_WELCOME_PRIMARY_W} ${LOOP_WELCOME_PRIMARY_H}
    !insertmacro loopButton 2 ${LOOP_WELCOME_SECONDARY_X} ${LOOP_WELCOME_SECONDARY_Y} ${LOOP_WELCOME_SECONDARY_W} ${LOOP_WELCOME_SECONDARY_H}
    Call loopPageRun
  FunctionEnd
!macroend

; --- page 2: install folder (electron-builder's own is off: allowToChangeInstallationDirectory)
; --- page 3: NSIS's progress page in Loop's band and bar ---------------------------------
!macro customPageAfterChangeDir
  Var loop.Header
  Var loop.HeaderBmp
  Var loop.Footer
  Var loop.FooterBmp

  Page custom loopFolderCreate loopFolderLeave

  Function loopFolderCreate
    ; an update keeps the folder it has (as electron-builder's own page does)
    ${If} ${isUpdated}
      Abort
    ${EndIf}
    StrCpy $loop.Kind folder
    Call loopPageBegin
    !insertmacro loopExtract folder

    ; the path: a real text box on the picture's flat field
    !insertmacro loopScaleRect ${LOOP_FOLDER_SLOT_PATH_X} ${LOOP_FOLDER_SLOT_PATH_Y} ${LOOP_FOLDER_SLOT_PATH_W} ${LOOP_FOLDER_SLOT_PATH_H}
    nsDialogs::CreateControl EDIT ${WS_CHILD}|${WS_VISIBLE}|${WS_TABSTOP}|${WS_CLIPSIBLINGS}|${ES_AUTOHSCROLL} 0 $R0 $R1 $R2 $R3 "$INSTDIR"
    Pop $loop.Path
    SetCtlColors $loop.Path E7EDF7 061224
    IntOp $0 $R3 * 62
    IntOp $0 $0 / 100
    System::Call 'gdi32::CreateFont(i -$0, i 0, i 0, i 0, i 400, i 0, i 0, i 0, i 1, i 0, i 0, i 5, i 0, t "Segoe UI") p .s'
    Pop $loop.PathFont
    SendMessage $loop.Path ${WM_SETFONT} $loop.PathFont 1

    ; the size note: a real label on the picture's flat card
    !insertmacro loopScaleRect ${LOOP_FOLDER_SLOT_SIZE_X} ${LOOP_FOLDER_SLOT_SIZE_Y} ${LOOP_FOLDER_SLOT_SIZE_W} ${LOOP_FOLDER_SLOT_SIZE_H}
    nsDialogs::CreateControl STATIC ${WS_CHILD}|${WS_VISIBLE}|${WS_CLIPSIBLINGS}|${SS_RIGHT} 0x2000 $R0 $R1 $R2 $R3 "" ; WS_EX_RTLREADING
    Pop $loop.Size
    SetCtlColors $loop.Size 8A9AB4 0B1A2F
    IntOp $0 $R3 * 70
    IntOp $0 $0 / 100
    System::Call 'gdi32::CreateFont(i -$0, i 0, i 0, i 0, i 400, i 0, i 0, i 0, i 1, i 0, i 0, i 5, i 0, t "Tahoma") p .s'
    Pop $loop.SizeFont
    SendMessage $loop.Size ${WM_SETFONT} $loop.SizeFont 1
    Call loopShowSize

    !insertmacro loopButton 1 ${LOOP_FOLDER_PRIMARY_X} ${LOOP_FOLDER_PRIMARY_Y} ${LOOP_FOLDER_PRIMARY_W} ${LOOP_FOLDER_PRIMARY_H}
    !insertmacro loopButton 2 ${LOOP_FOLDER_SECONDARY_X} ${LOOP_FOLDER_SECONDARY_Y} ${LOOP_FOLDER_SECONDARY_W} ${LOOP_FOLDER_SECONDARY_H}
    !insertmacro loopButton 3 ${LOOP_FOLDER_TERTIARY_X} ${LOOP_FOLDER_TERTIARY_Y} ${LOOP_FOLDER_TERTIARY_W} ${LOOP_FOLDER_TERTIARY_H}
    !insertmacro loopButton 4 ${LOOP_FOLDER_BROWSE_X} ${LOOP_FOLDER_BROWSE_Y} ${LOOP_FOLDER_BROWSE_W} ${LOOP_FOLDER_BROWSE_H}
    Call loopPageRun
    System::Call 'gdi32::DeleteObject(p $loop.PathFont)'
    System::Call 'gdi32::DeleteObject(p $loop.SizeFont)'
  FunctionEnd

  Function loopFolderLeave
    StrCpy $R9 $loop.Path ; (a dotted name breaks NSD_GetText's System::Call)
    ${NSD_GetText} $R9 $1
    ${If} $1 == ""
      StrCpy $1 $INSTDIR
    ${EndIf}
    !insertmacro loopWithAppFolder $1
    StrCpy $INSTDIR $1
  FunctionEnd

  ; «حجم نصب حدود … مگابایت · فضای آزاد درایو C حدود … گیگابایت» for the folder in the text box
  Function loopShowSize
    ; the unpacked app, as electron-builder measured it (KB)
    !ifdef APP_64_UNPACKED_SIZE
      StrCpy $0 ${APP_64_UNPACKED_SIZE}
    !else ifdef APP_32_UNPACKED_SIZE
      StrCpy $0 ${APP_32_UNPACKED_SIZE}
    !else
      SectionGetSize 0 $0
    !endif
    IntOp $0 $0 / 1024
    StrCpy $R9 $loop.Path ; (a dotted name breaks NSD_GetText's System::Call)
    ${NSD_GetText} $R9 $1
    StrCpy $2 $1 1 ; drive letter
    StrCpy $4 $1 3 ; "C:\"
    ClearErrors
    ${DriveSpace} "$4" "/D=F /S=M" $3
    ${If} ${Errors}
      ${NSD_SetText} $loop.Size "حجم نصب حدود $0 مگابایت"
    ${ElseIf} $3 > 1023
      IntOp $3 $3 * 10
      IntOp $3 $3 / 1024
      IntOp $5 $3 % 10
      IntOp $3 $3 / 10
      ${NSD_SetText} $loop.Size "حجم نصب حدود $0 مگابایت   ·   فضای آزاد درایو ‏$2‏ حدود $3.$5 گیگابایت"
    ${Else}
      ${NSD_SetText} $loop.Size "حجم نصب حدود $0 مگابایت   ·   فضای آزاد درایو ‏$2‏ فقط $3 مگابایت"
    ${EndIf}
  FunctionEnd

  ; the progress page: Loop's band over it and Loop's bar under it, NSIS's chrome hidden
  !define MUI_PAGE_CUSTOMFUNCTION_SHOW loopInstallShow
  !define MUI_PAGE_CUSTOMFUNCTION_LEAVE loopInstallLeave

  Function loopInstallShow
    StrCpy $loop.Kind install
    !insertmacro loopMeasure
    InitPluginsDir
    SetDetailsPrint none ; not "extracting loop-header.bmp" in the progress line
    ${If} $loop.Scale == 200
      !insertmacro loopExtractBands 200
    ${ElseIf} $loop.Scale == 150
      !insertmacro loopExtractBands 150
    ${ElseIf} $loop.Scale == 125
      !insertmacro loopExtractBands 125
    ${Else}
      !insertmacro loopExtractBands 100
    ${EndIf}
    SetDetailsPrint both

    ; the band covers NSIS's header; the bar runs from NSIS's line above the buttons down
    System::Call '*(i, i) p .r0'
    System::Call 'user32::ClientToScreen(p $HWNDPARENT, p r0)'
    System::Call '*$0(i, i .r9)'
    System::Free $0
    System::Call '*(i, i, i, i) p .r0'
    System::Call 'user32::GetWindowRect(p $mui.Header.Background, p r0)'
    System::Call '*$0(i, i, i, i .r6)'
    System::Call 'user32::GetWindowRect(p $mui.Line.Standard, p r0)'
    System::Call '*$0(i, i .r7, i, i)'
    System::Free $0
    IntOp $6 $6 - $9 ; band height
    IntOp $7 $7 - $9 ; bar top
    IntOp $8 $loop.H - $7 ; bar height

    !insertmacro loopOverlay $loop.Header $loop.HeaderBmp "$PLUGINSDIR\loop-header.bmp" 0 $loop.W $6
    !insertmacro loopOverlay $loop.Footer $loop.FooterBmp "$PLUGINSDIR\loop-footer.bmp" $7 $loop.W $8
    !insertmacro loopHideChrome
  FunctionEnd

  Function loopInstallLeave
    System::Call 'user32::DestroyWindow(p $loop.Header)'
    System::Call 'user32::DestroyWindow(p $loop.Footer)'
    System::Call 'gdi32::DeleteObject(p $loop.HeaderBmp)'
    System::Call 'gdi32::DeleteObject(p $loop.FooterBmp)'
    !insertmacro loopShowChrome
  FunctionEnd
!macroend

!macro loopExtractBands SCALE
  File "/oname=$PLUGINSDIR\loop-header.bmp" "${LOOP_ART}\install-header-${SCALE}.bmp"
  File "/oname=$PLUGINSDIR\loop-footer.bmp" "${LOOP_ART}\install-footer-${SCALE}.bmp"
!macroend

; a picture child of the setup window at (0, Y), W × H — over NSIS's own chrome
!macro loopOverlay HWND BMP FILE Y W H
  System::Call 'user32::CreateWindowExW(i 0, w "STATIC", w "", i 0x5400000E, i 0, i ${Y}, i ${W}, i ${H}, p $HWNDPARENT, p 0, p 0, p 0) p .s' ; WS_CHILD|WS_VISIBLE|WS_CLIPSIBLINGS|SS_BITMAP
  Pop ${HWND}
  !insertmacro loopNoMirror ${HWND}
  !insertmacro loopLoadBmp "${FILE}" ${W} ${H} ${BMP}
  SendMessage ${HWND} 0x0172 0 ${BMP}
!macroend

; --- page 4: finish --------------------------------------------------------------------
!macro customFinishPage
  ; the progress page moves on to this page by itself (MUI's own finish page does the same)
  AutoCloseWindow true

  Page custom loopFinishCreate

  Function loopFinishCreate
    StrCpy $loop.Kind finish
    Call loopPageBegin
    !insertmacro loopExtract finish
    !insertmacro loopButton 1 ${LOOP_FINISH_PRIMARY_X} ${LOOP_FINISH_PRIMARY_Y} ${LOOP_FINISH_PRIMARY_W} ${LOOP_FINISH_PRIMARY_H}
    !insertmacro loopButton 2 ${LOOP_FINISH_SECONDARY_X} ${LOOP_FINISH_SECONDARY_Y} ${LOOP_FINISH_SECONDARY_W} ${LOOP_FINISH_SECONDARY_H}
    Call loopPageRun
  FunctionEnd
!macroend
