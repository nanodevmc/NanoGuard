# NanoGuard - Project State

- **Версия**: 0.1.2 (Экстремальная защита, Native AOT .DLL, Package Flattening & Decompiler Crashers)
- **Архитектура**:
  - Native C++17 Core Engine (`resources/engine_cpp`): Backdoor Hunter с контекстной фильтрацией рефлексий и ложных срабатываний; Bytecode Armor с Package Flattening (корень архива без папок пакетов), генерацией 100+ связанных мусорных decoy-классов, Decompiler Crashers (рекурсивные дженерик-сигнатуры и циклические InnerClasses) и AOT-транслятором в x86_64 машинный код (`nanoguard_bridge.dll` через MSVC cl.exe с аппаратным Win32 Anti-Debug).
  - Rust FastScan Core (`crates/nanoguard-fastscan`): параллельный сканер с Rayon, memmap2, откалиброванными правилами YARA и изоляцией затененных библиотек (HikariCP, SnakeYAML, Gson).
  - GUI (`electron`, `src`): темная терминальная эстетика NanoDecompiler (`#070a08`, `#0c100d`, `#1f2721`, `#9bf246`), интерактивные переключатели всех 8 систем защиты, подмена иконки в Windows Taskbar.
  - Локальная сборка: готовые установщики (`Setup.exe` и `Portable.exe`), аватар и иконки PIL на Рабочем столе.
- **Окружение**: Windows 10, Intel Pentium P4600, 4 GB RAM.
- **Правила разработки**:
  - Только `cmd.exe /c`, PowerShell категорически запрещен.
  - Секреты и токены никогда не сохраняются в файлах репозитория.
  - Без push в git (аккаунт временно заблокирован), все компиляции локальные.

## Реализовано и проверено:
1. **Точный аудит без ложных срабатываний**:
   - `NeoBuyer.jar`, `GlowCases.jar`, `NanoMarket.jar`, `NanoForge.jar` показывают 0-15/100 (CLEAN).
2. **Package Flattening (Все классы в корень)**:
   - Полное удаление структуры каталогов пакетов, перенос всех классов в корень с рандомизацией имен и патчингом дескрипторов.
3. **Native AOT .DLL Transpiler**:
   - Компиляция `nanoguard_bridge.dll` в x86_64 Machine Code с защитой `IsDebuggerPresent`.
4. **Decompiler Crashers**:
   - Зацикленные дженерики и рекурсивные InnerClasses, вызывающие StackOverflow в CFR, Procyon, Fernflower, Recaf.
5. **Инсталлеры на Рабочем столе**:
   - `NanoGuard-0.1.2-Windows-Setup.exe` (~69.7 МБ) и `NanoGuard-0.1.2-Windows-Portable.exe` (~69.4 МБ).
