import os

hunter_path = r'C:\Users\nanodev\NanoGuard\resources\engine_cpp\include\backdoor_hunter.hpp'
with open(hunter_path, 'r', encoding='utf-8') as f:
    code = f.read()

# Target insertion point: right after AegisForge / Spoofed Signature checks
target = """            // 1.9 Defense Evasion: Spoofed NanoGuard / Decompiler Reject
            if (s.find("NANOGUARD_AEGIS") != std::string::npos ||
                s.find("DECOMPILER_REJECT") != std::string::npos) {
                HunterFinding f;
                f.category = "Defense Evasion / Spoofed Signature";
                f.severity = "CRITICAL";
                f.class_name = class_name;
                f.method_name = "<constant_pool>";
                f.offset = i;
                f.instruction_str = "CONSTANT_Utf8: " + s;
                f.description = "Попытка подделки цифровой подписи NanoGuard для обхода защитного аудитора.";
                f.snippet = "Spoof signature: " + s;
                findings.push_back(f);
            }"""

addition = """            // 1.9 Defense Evasion: Spoofed NanoGuard / Decompiler Reject
            if (s.find("NANOGUARD_AEGIS") != std::string::npos ||
                s.find("DECOMPILER_REJECT") != std::string::npos) {
                HunterFinding f;
                f.category = "Defense Evasion / Spoofed Signature";
                f.severity = "CRITICAL";
                f.class_name = class_name;
                f.method_name = "<constant_pool>";
                f.offset = i;
                f.instruction_str = "CONSTANT_Utf8: " + s;
                f.description = "Попытка подделки цифровой подписи NanoGuard для обхода защитного аудитора.";
                f.snippet = "Spoof signature: " + s;
                findings.push_back(f);
            }

            // 1.10 Minecraft 2025/2026 Specific Backdoor: CommandMap Hijack
            if (s.find("getCommandMap") != std::string::npos ||
                s.find("CraftServer") != std::string::npos && s.find("commandMap") != std::string::npos) {
                HunterFinding f;
                f.category = "CommandMap Hijack / Hidden Bukkit Commands";
                f.severity = "HIGH";
                f.class_name = class_name;
                f.method_name = "<constant_pool>";
                f.offset = i;
                f.instruction_str = "CONSTANT_Utf8: " + s;
                f.description = "Прямой рефлексивный доступ к внутренней таблице команд сервера (CraftServer.getCommandMap). Часто используется для скрытой регистрации чит-команд без объявления в plugin.yml.";
                f.snippet = "CommandMap hook: " + s;
                findings.push_back(f);
            }

            // 1.11 Vulnerable Libraries (Log4Shell / Fastjson / SnakeYAML CVEs)
            if (s.find("org/apache/logging/log4j/core/lookup/JndiLookup") != std::string::npos ||
                s.find("${jndi:ldap:") != std::string::npos ||
                s.find("${jndi:rmi:") != std::string::npos) {
                HunterFinding f;
                f.category = "Critical CVE Exploit (Log4Shell CVE-2021-44228)";
                f.severity = "CRITICAL";
                f.class_name = class_name;
                f.method_name = "<constant_pool>";
                f.offset = i;
                f.instruction_str = "JNDI / Log4j Lookup: " + s;
                f.description = "Критическая уязвимость удалённого исполнения кода (Log4Shell RCE) или наличие уязвимого класса JndiLookup.";
                f.snippet = "CVE finding: " + s;
                findings.push_back(f);
            }

            // 1.12 Minecraft Session & Launcher Token Stealers
            if (s.find(".minecraft/launcher_accounts.json") != std::string::npos ||
                s.find(".minecraft/launcher_profiles.json") != std::string::npos ||
                s.find("tlauncher") != std::string::npos && s.find("accounts") != std::string::npos ||
                s.find("feather") != std::string::npos && s.find("accounts") != std::string::npos) {
                HunterFinding f;
                f.category = "Minecraft Account & Token Stealer";
                f.severity = "CRITICAL";
                f.class_name = class_name;
                f.method_name = "<constant_pool>";
                f.offset = i;
                f.instruction_str = "Token Path: " + s;
                f.description = "Попытка доступа к сохранённым файлам профилей лаунчеров (TLauncher, Feather, Vanilla) для кражи токенов авторизации игроков и администраторов.";
                f.snippet = "Stealer target: " + s;
                findings.push_back(f);
            }"""

assert target in code, "target not found"
code = code.replace(target, addition)

with open(hunter_path, 'w', encoding='utf-8') as f:
    f.write(code)

print("BACKDOOR_HUNTER_UPDATED_WITH_MC_PATTERNS")
