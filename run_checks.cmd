@echo off
cd /d d:\GIT\bubble
echo Running TypeScript check...
npx tsc --noEmit
if errorlevel 1 (
    echo.
    echo TypeScript check failed. Trying npm run build...
    npm run build
) else (
    echo TypeScript check passed!
)
