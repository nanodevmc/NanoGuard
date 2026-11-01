import os

main_cpp_path = r'C:\Users\nanodev\NanoGuard\resources\engine_cpp\src\main.cpp'
with open(main_cpp_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# 1. Add include for nanoguard_bridge_so_template.hpp
has_so_inc = any('nanoguard_bridge_so_template.hpp' in l for l in lines)
if not has_so_inc:
    for i, l in enumerate(lines):
        if 'nanoguard_bridge_template.hpp' in l:
            lines.insert(i + 1, '#include "../include/nanoguard_bridge_so_template.hpp"\n')
            break

# 2. Inject Linux .so embedding right after nanoguard_bridge.dll embedding
target_idx = -1
for i, l in enumerate(lines):
    if 'entries.push_back(dll_e);' in l:
        target_idx = i
        break

assert target_idx != -1, "target_idx for dll_e not found"

so_embed_lines = [
    '\n',
    '            // Multi-Platform Linux x86_64 ELF (.so) Bridge\n',
    '            std::vector<uint8_t> so_vec = get_embedded_bridge_so(detected_main_class);\n',
    '            if (!so_vec.empty()) {\n',
    '                // Copy alongside output jar\n',
    '                std::string target_so = out_dir + "nanoguard_bridge.so";\n',
    '                std::ofstream dst_so(target_so, std::ios::binary);\n',
    '                dst_so.write(reinterpret_cast<const char*>(so_vec.data()), so_vec.size());\n',
    '                dst_so.close();\n',
    '                std::cout << "[+] Deployed Linux SO alongside JAR: " << target_so << "\\n";\n',
    '\n',
    '                // Embed directly inside JAR archive for Pterodactyl/Linux hosting!\n',
    '                JarEntry so_e;\n',
    '                so_e.filename = "nanoguard_bridge.so";\n',
    '                so_e.data = so_vec;\n',
    '                so_e.uncompressed_size = static_cast<uint32_t>(so_vec.size());\n',
    '                so_e.compressed_size = static_cast<uint32_t>(so_vec.size());\n',
    '                so_e.is_class = false;\n',
    '                entries.push_back(so_e);\n',
    '                std::cout << "[+] Embedded nanoguard_bridge.so directly inside JAR (" << so_vec.size() << " bytes)!\\n";\n',
    '            }\n'
]

lines[target_idx+1:target_idx+1] = so_embed_lines

with open(main_cpp_path, 'w', encoding='utf-8') as f:
    f.writelines(lines)

print("MAIN_CPP_SO_EMBEDDING_ADDED")
