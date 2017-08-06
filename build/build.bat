@ECHO OFF
pushd %~dp0

:detectMsBuildFromVsVersion
if exist "%ProgramFiles%\Microsoft Visual Studio\2017\Professional\Common7\Tools\VsDevCmd.bat" goto detectMsBuildFromVs15
if exist "%ProgramFiles(x86)%\Microsoft Visual Studio\2017\Professional\Common7\Tools\VsDevCmd.bat" goto detectMsBuildFromVs15
if not "%VS140COMNTOOLS%"=="" goto detectMsBuildFromVs14
if not "%VS120COMNTOOLS%"=="" goto detectMsBuildFromVs12
if not "%VS110COMNTOOLS%"=="" goto detectMsBuildFromVs11
if not "%VS100COMNTOOLS%"=="" goto detectMsBuildFromVs10
echo Something is funny with your VS-Version.
echo I'll try to detect msbuild the old way...
goto detectMsBuildFromFramework 

:detectMsBuildFromVs10
echo VS2010 detected. Loading Env-Settings for VS2010.
call "%VS100COMNTOOLS%"\\vsvars32.bat
::msbuild is in path now..
set msbuild=msbuild.exe
goto build

:detectMsBuildFromVs11
echo VS2012 detected. Loading Env-Settings for VS2012.
call "%VS110COMNTOOLS%"\\vsvars32.bat
::msbuild is in path now..
set msbuild=msbuild.exe
goto build 

:detectMsBuildFromVs12
echo VS2013 detected. Loading Env-Settings for VS2013.
call "%VS120COMNTOOLS%"\\vsvars32.bat
::msbuild is in path now..
set msbuild=msbuild.exe
goto build

:detectMsBuildFromVs14
echo VS2015 detected. Loading Env-Settings for VS2015.
call "%VS140COMNTOOLS%"\\vsvars32.bat
::msbuild is in path now..
set msbuild=msbuild.exe
goto build

:detectMsBuildFromVs15
echo VS2017 detected. Loading Env-Settings for VS2017.
if exist "%ProgramFiles%\Microsoft Visual Studio\2017\Professional\Common7\Tools\VsDevCmd.bat" (
  call "%ProgramFiles%\Microsoft Visual Studio\2017\Professional\Common7\Tools\VsDevCmd.bat"
) else (
  call "%ProgramFiles(x86)%\Microsoft Visual Studio\2017\Professional\Common7\Tools\VsDevCmd.bat"
)
::msbuild is in path now..
set msbuild=msbuild.exe
goto build

:detectMsBuildFromFramework
REG.exe Query HKLM\Hardware\Description\System\CentralProcessor\0 | findstr /i "x86" > NUL
If %ERRORLEVEL% == 0 (
    SET BITS=32
) ELSE (
    SET BITS=64
)

echo. > _framework.txt
FOR /f "usebackq delims=\ tokens=5" %%G IN (`reg.exe query HKLM\Software\Microsoft\.NetFramework`) DO echo %%G >> _framework.txt
FOR /f "usebackq tokens=1" %%G IN (`findstr /i v4 _framework.txt`) DO SET Version=%%G
del _framework.txt

set msbuild=C:\Windows\Microsoft.NET\Framework%BITS:32=%\%Version%\msbuild.exe

if exist %msbuild% goto build
echo MSBuild could not be found.
echo I detected %BITS%bits
echo Net Framework 4 is: %Version% 
echo So I guesst msbuild to be at: %msbuild% 
echo but it is not :-( 
echo I can not proceed, you got to fix this...
echo. 
goto error

:build
echo The MS-Build in use is:
%msbuild% /version
echo.
echo.

%msbuild% build.proj
if not %ERRORLEVEL% == 0 goto error

::%msbuild% build.proj /target:tests
::if not %ERRORLEVEL% == 0 goto error

goto exit
:error
echo There was an error!
pause

:exit
popd