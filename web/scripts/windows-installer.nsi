; AI Job Search for Windows: the installer (built with NSIS by scripts/build-windows.sh).
; Installs for the current user only (no administrator rights), adds Start menu and Desktop
; shortcuts, and an uninstaller. Saved keys in %APPDATA%\AI Job Search are kept unless the
; person removes them.

Unicode true
!include "MUI2.nsh"

!ifndef VERSION
  !define VERSION "0.1.0"
!endif
!define APPNAME "AI Job Search"
!define LAUNCH 'powershell.exe'
!define LAUNCH_ARGS '-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "$INSTDIR\launcher.ps1"'

Name "${APPNAME}"
OutFile "${OUTFILE}"
InstallDir "$LOCALAPPDATA\Programs\${APPNAME}"
RequestExecutionLevel user
SetCompressor /SOLID lzma
BrandingText "${APPNAME} ${VERSION}"

!define MUI_ICON "${STAGE}\AppIcon.ico"
!define MUI_UNICON "${STAGE}\AppIcon.ico"
!define MUI_FINISHPAGE_RUN
!define MUI_FINISHPAGE_RUN_TEXT "Open AI Job Search now"
!define MUI_FINISHPAGE_RUN_FUNCTION LaunchApp

!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_LANGUAGE "English"

Function LaunchApp
  Exec '"${LAUNCH}" ${LAUNCH_ARGS}'
FunctionEnd

Section "Install"
  SetOutPath "$INSTDIR"
  ; A fresh copy each time, so old app files never linger.
  RMDir /r "$INSTDIR\app"
  File /r "${STAGE}\*.*"
  WriteUninstaller "$INSTDIR\Uninstall.exe"

  CreateDirectory "$SMPROGRAMS\${APPNAME}"
  CreateShortcut "$SMPROGRAMS\${APPNAME}\${APPNAME}.lnk" "${LAUNCH}" '${LAUNCH_ARGS}' "$INSTDIR\AppIcon.ico" 0 SW_SHOWMINIMIZED
  CreateShortcut "$SMPROGRAMS\${APPNAME}\Uninstall ${APPNAME}.lnk" "$INSTDIR\Uninstall.exe"
  CreateShortcut "$DESKTOP\${APPNAME}.lnk" "${LAUNCH}" '${LAUNCH_ARGS}' "$INSTDIR\AppIcon.ico" 0 SW_SHOWMINIMIZED

  ; Listed in Settings > Apps, so it can be removed the usual way.
  !define UNINST "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APPNAME}"
  WriteRegStr HKCU "${UNINST}" "DisplayName" "${APPNAME}"
  WriteRegStr HKCU "${UNINST}" "DisplayVersion" "${VERSION}"
  WriteRegStr HKCU "${UNINST}" "DisplayIcon" "$INSTDIR\AppIcon.ico"
  WriteRegStr HKCU "${UNINST}" "UninstallString" '"$INSTDIR\Uninstall.exe"'
  WriteRegStr HKCU "${UNINST}" "InstallLocation" "$INSTDIR"
  WriteRegDWORD HKCU "${UNINST}" "NoModify" 1
  WriteRegDWORD HKCU "${UNINST}" "NoRepair" 1
SectionEnd

Section "Uninstall"
  Delete "$DESKTOP\${APPNAME}.lnk"
  RMDir /r "$SMPROGRAMS\${APPNAME}"
  RMDir /r "$INSTDIR"
  DeleteRegKey HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APPNAME}"
SectionEnd
