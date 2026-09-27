!include LogicLib.nsh
!include FileFunc.nsh

!ifndef BUILD_UNINSTALLER
  # NSIS's 7z installer stages an expanded copy in TEMP before copying it to
  # INSTDIR. Its copy-error message says "cannot be closed" even for disk-full
  # errors, so check space before removing an old version or extracting files.
  Function SammenhengCheckFreeSpace
    Pop $0
    System::Call 'kernel32::GetDiskFreeSpaceExW(w r0, *l .r1, p 0, p 0) i.r2'
    ${If} $2 == 0
      MessageBox MB_OK|MB_ICONSTOP "Sammenheng could not check free disk space on $0. Check that the drive is available and try again." /SD IDOK
      SetErrorLevel 112
      Quit
    ${EndIf}
    System::Int64Op $1 / 1048576
    Pop $1
    IntOp $2 ${APP_64_UNPACKED_SIZE} / 1024
    IntOp $2 $2 * 2
    IntOp $2 $2 + 384
    ${If} $1 < $2
      MessageBox MB_OK|MB_ICONSTOP "Not enough free disk space on $0.$\r$\n$\r$\nSammenheng needs at least $2 MB free during installation; only $1 MB is available. Free about 2 GB and run the installer again.$\r$\n$\r$\nWindows uses its temporary-files drive as well as the installation drive. Existing notes and app files have not been changed." /SD IDOK
      SetErrorLevel 112
      Quit
    ${EndIf}
  FunctionEnd

  !macro customInit
    ${GetRoot} "$TEMP" $0
    Push "$0\"
    Call SammenhengCheckFreeSpace
    ${GetRoot} "$INSTDIR" $0
    Push "$0\"
    Call SammenhengCheckFreeSpace
  !macroend
!endif
