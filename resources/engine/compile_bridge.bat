@echo off
setlocal
call "C:\Program Files (x86)\Microsoft Visual Studio\18\BuildTools\VC\Auxiliary\Build\vcvars64.bat" >nul 2>&1
if "%~1"=="" (
    echo [!] No input cpp specified
    exit /b 1
)
if "%~2"=="" (
    echo [!] No output dll specified
    exit /b 1
)
cl /std:c++17 /O2 /permissive- /utf-8 /LD "%~1" -I"C:\Program Files\Java\jdk-17\include" -I"C:\Program Files\Java\jdk-17\include\win32" /Fe:"%~2"
exit /b %ERRORLEVEL%
