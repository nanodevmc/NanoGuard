# NanoGuard - Project State

- **Версия**: 0.1.2 (Экстремальная защита & Редизайн в стиле NanoDecompiler)
- **Архитектура**:
  - Native C++17 Core Engine (`resources/engine_cpp`): Backdoor Hunter с инспекцией архивов (поиск скрытых `.aeg` блобов и поддельных маркеров), Bytecode Armor с генерацией 100+ связанных мусорных классов (decoy mesh), кастомным Bootstrap-инжектором и гибридной связкой Java <-> Native (dynamic `RegisterNatives` в `JNI_OnLoad` + Pure JVM VM fallback для поддержки всех ОС).
  - Rust FastScan Core (`crates/nanoguard-fastscan`): параллельный сканер с Rayon, memmap2, zip 9.0.5, энтропией Шеннона и YARA-сигнатурами.
  - GUI (`electron`, `src`): тотальный редизайн под темную терминальную эстетику NanoDecompiler (`#070a08`, `#0c100d`, `#1f2721`, `#9bf246` кислотный зеленый, шрифты `Inter` и `JetBrains Mono`).
  - Electron Task Manager: подмена иконки через `app.setAppUserModelId` и `nativeImage` (`build/icon.ico`, `build/icon.png`).
  - CI/CD (`.github/workflows/build-and-release.yml`): мультиплатформенная матрица сборки и релиза v0.1.2.
- **Окружение**: Windows 10, Intel Pentium P4600, 4 GB RAM.
- **Правила разработки**:
  - Только `cmd.exe /c`, PowerShell категорически запрещен.
  - Сборка тяжелых бинарников через GitHub Actions, чтобы не нагружать слабый ПК.
  - Секреты и токены никогда не сохраняются в файлах репозитория.

## Реализовано в v0.1.2
1. **5 Уровней защиты байткода**:
   - 1: Отказ от статичных маркеров в корне (проверка структуры без единого `NANOGUARD.INF`).
   - 2: Полиморфные динамические контрольные суммы на адресах вызовов (`compute_callsite_hash`).
   - 3: Встраивание маркеров целостности в Constant Pool каждого класса (скрытые синтетические атрибуты).
   - 4: Криптографическая связка Java <-> Native (рандомизированный `RegisterNatives` с зачисткой памяти) + Pure JVM VM фоллбэк для 100% работы на любых ОС.
   - 5: Антидамп и контроль ClassLoader (проверка стека вызовов, блокировка JavaAgent / ByteBuddy).
2. **Экстремальная обфускация**:
   - Генерация 100+ связанных мусорных decoy-классов с непрозрачными предикатами.
   - Кастомный Bootstrap-инжектор (`NanoGuardBootstrap.class`), перехватывающий точку входа (`onEnable`).
3. **Редизайн GUI в стиле NanoDecompiler**:
   - Терминальный интерфейс (`#070a08` фон, `#9bf246` акценты, сетка и моноширинные бейджи).
   - Корректная иконка в Диспетчере задач Windows и таскбаре.
