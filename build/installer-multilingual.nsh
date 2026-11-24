; Native Unicode MUI pages use NSIS's translated labels and per-language RTL.
; Bitmap pages in installer.nsh are retained as historical artwork, but their
; baked Persian instructions must not be used for a non-Persian installation.
!macroundef addLangs
!macro addLangs
  !define MULTIUSER_TEXT_INSTALLMODE_TITLE "انتخاب کاربران"
  !define MULTIUSER_TEXT_INSTALLMODE_SUBTITLE "مشخص کنید $(^NameDA) برای کدام کاربران نصب شود."
  !define MULTIUSER_INNERTEXT_INSTALLMODE_TOP "انتخاب کنید $(^NameDA) فقط برای شما نصب شود یا برای همهٔ کاربران این رایانه. $(^ClickNext)"
  !define MULTIUSER_INNERTEXT_INSTALLMODE_ALLUSERS "نصب برای همهٔ کاربران این رایانه"
  !define MULTIUSER_INNERTEXT_INSTALLMODE_CURRENTUSER "نصب فقط برای من"
  !insertmacro MUI_LANGUAGE "Farsi"
  !insertmacro MUI_LANGUAGE "English"
  !insertmacro MUI_LANGUAGE "SimpChinese"
  !define MULTIUSER_TEXT_INSTALLMODE_TITLE "Pilih pengguna"
  !define MULTIUSER_TEXT_INSTALLMODE_SUBTITLE "Pilih pengguna untuk pemasangan $(^NameDA)."
  !define MULTIUSER_INNERTEXT_INSTALLMODE_TOP "Pasang untuk anda atau semua pengguna komputer ini. $(^ClickNext)"
  !define MULTIUSER_INNERTEXT_INSTALLMODE_ALLUSERS "Semua pengguna"
  !define MULTIUSER_INNERTEXT_INSTALLMODE_CURRENTUSER "Untuk saya sahaja"
  !insertmacro MUI_LANGUAGE "Malay"
  !insertmacro MUI_LANGUAGE "French"
  !insertmacro MUI_LANGUAGE "Arabic"
!macroend

!macro customInstallMode
  StrCpy $isForceCurrentInstall "1"
!macroend

!macro customWelcomePage
  !insertmacro MUI_PAGE_WELCOME
!macroend
