@echo off
REM Creative Dimensions Poster Studio. Usage:
REM   render.bat configs\example-dark-glow.json            (full quality)
REM   render.bat configs\example-dark-glow.json --preview  (fast check)
set BLENDER="C:\Program Files\Blender Foundation\Blender 5.3\blender.exe"
if not exist %BLENDER% (
  echo Blender 5.3 not found at %BLENDER%
  echo Edit the BLENDER line in render.bat to point at your blender.exe
  pause
  exit /b 1
)
%BLENDER% -b --factory-startup -P "%~dp0render_poster.py" -- --config %*
pause
