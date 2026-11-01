@echo off
call "C:\Program Files (x86)\Microsoft Visual Studio\18\BuildTools\VC\Auxiliary\Build\vcvars64.bat"
cd /d "%~dp0"
cl /std:c++17 /O2 /permissive- /utf-8 /MT /EHsc /Iinclude src\main.cpp src\miniz.c /Fe:nanoguard.exe
