import os

hunter_path = r'C:\Users\nanodev\NanoGuard\resources\engine_cpp\include\backdoor_hunter.hpp'
with open(hunter_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_ioc_lines = [
    '                // 1.10 Minecraft 2025/2026 Specific Backdoor: CommandMap Hijack\n',
    '                if (s.find("getCommandMap") != std::string::npos ||\n',
    '                    (s.find("CraftServer") != std::string::npos && s.find("commandMap") != std::string::npos)) {\n',
    '                    HunterFinding f;\n',
    '                    f.category = "CommandMap Hijack / Hidden Bukkit Commands";\n',
    '                    f.severity = "HIGH";\n',
    '                    f.class_name = class_name;\n',
    '                    f.method_name = "<constant_pool>";\n',
    '                    f.offset = i;\n',
    '                    f.instruction_str = "CONSTANT_Utf8: " + s;\n',
    '                    f.description = "Прямой рефлексивный доступ к внутренней таблице команд сервера (CraftServer.getCommandMap). Часто используется для скрытой регистрации чит-команд без объявления в plugin.yml.";\n',
    '                    f.snippet = "CommandMap hook: " + s;\n',
    '                    findings.push_back(f);\n',
    '                }\n',
    '\n',
    '                // 1.11 Vulnerable Libraries (Log4Shell / Fastjson / SnakeYAML CVEs)\n',
    '                if (s.find("org/apache/logging/log4j/core/lookup/JndiLookup") != std::string::npos ||\n',
    '                    s.find("${jndi:ldap:") != std::string::npos ||\n',
    '                    s.find("${jndi:rmi:") != std::string::npos) {\n',
    '                    HunterFinding f;\n',
    '                    f.category = "Critical CVE Exploit (Log4Shell CVE-2021-44228)";\n',
    '                    f.severity = "CRITICAL";\n',
    '                    f.class_name = class_name;\n',
    '                    f.method_name = "<constant_pool>";\n',
    '                    f.offset = i;\n',
    '                    f.instruction_str = "JNDI / Log4j Lookup: " + s;\n',
    '                    f.description = "Критическая уязвимость удалённого исполнения кода (Log4Shell RCE) или наличие уязвимого класса JndiLookup.";\n',
    '                    f.snippet = "CVE finding: " + s;\n',
    '                    findings.push_back(f);\n',
    '                }\n',
    '\n',
    '                // 1.12 Minecraft Session & Launcher Token Stealers\n',
    '                if (s.find(".minecraft/launcher_accounts.json") != std::string::npos ||\n',
    '                    s.find(".minecraft/launcher_profiles.json") != std::string::npos ||\n',
    '                    (s.find("tlauncher") != std::string::npos && s.find("accounts") != std::string::npos) ||\n',
    '                    (s.find("feather") != std::string::npos && s.find("accounts") != std::string::npos)) {\n',
    '                    HunterFinding f;\n',
    '                    f.category = "Minecraft Account & Token Stealer";\n',
    '                    f.severity = "CRITICAL";\n',
    '                    f.class_name = class_name;\n',
    '                    f.method_name = "<constant_pool>";\n',
    '                    f.offset = i;\n',
    '                    f.instruction_str = "Token Path: " + s;\n',
    '                    f.description = "Попытка доступа к сохранённым файлам профилей лаунчеров (TLauncher, Feather, Vanilla) для кражи токенов авторизации игроков и администраторов.";\n',
    '                    f.snippet = "Stealer target: " + s;\n',
    '                    findings.push_back(f);\n',
    '                }\n'
]

insert_idx = -1
for i, l in enumerate(lines):
    if 'Попытка подделки цифровой подписи NanoGuard' in l:
        # After findings.push_back(f); and }\n
        insert_idx = i + 3
        break

assert insert_idx != -1, "insert_idx not found"
lines[insert_idx:insert_idx] = new_ioc_lines

with open(hunter_path, 'w', encoding='utf-8') as f:
    f.writelines(lines)

print("SUCCESS_HUNTER_PATCHED")
