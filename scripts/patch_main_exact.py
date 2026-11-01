main_cpp_path = r'C:\Users\nanodev\NanoGuard\resources\engine_cpp\src\main.cpp'
with open(main_cpp_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# 1. Include check
inc_line = '#include "../include/nanoguard_bridge_template.hpp"\n'
has_inc = any('nanoguard_bridge_template.hpp' in l for l in lines)
if not has_inc:
    for i, l in enumerate(lines):
        if 'native_loader_bytes.hpp' in l:
            lines.insert(i + 1, inc_line)
            break

# 2. Find start of bridge_dll and end of closing brace
start_idx = -1
end_idx = -1
for i, l in enumerate(lines):
    if 'std::string bridge_dll = "nanoguard_bridge.dll";' in l:
        start_idx = i
        break

assert start_idx != -1, "start_idx not found"

for j in range(start_idx, start_idx + 40):
    if 'Injected automated NativeBridgeLoader' in lines[j]:
        end_idx = j + 2 # closing brace of if
        break

assert end_idx != -1, "end_idx not found"

new_code_lines = [
    '        std::string bridge_dll = "nanoguard_bridge.dll";\n',
    '        std::vector<uint8_t> dll_vec;\n',
    '        bool compiled = JvmNativeTranspiler::compile_dll(temp_cpp, bridge_dll);\n',
    '        if (compiled) {\n',
    '            std::cout << "[+] Native Bridge: successfully compiled " << bridge_dll << " via local MSVC cl.exe!\\n";\n',
    '            std::ifstream jar_dll(bridge_dll, std::ios::binary);\n',
    '            dll_vec.assign((std::istreambuf_iterator<char>(jar_dll)), std::istreambuf_iterator<char>());\n',
    '        } else {\n',
    '            std::cout << "[*] No local cl.exe found. Utilizing ultra-compressed Native Bridge Template (Deflate 9)...\\n";\n',
    '            dll_vec = get_embedded_bridge_dll(detected_main_class);\n',
    '            if (!dll_vec.empty()) {\n',
    '                std::cout << "[+] Successfully customized embedded Native DLL (" << dll_vec.size() << " bytes) for " << detected_main_class << "!\\n";\n',
    '            } else {\n',
    '                std::cerr << "[!] Error: failed to unpack embedded bridge DLL template.\\n";\n',
    '            }\n',
    '        }\n',
    '\n',
    '        if (!dll_vec.empty()) {\n',
    '            // Copy alongside output jar\n',
    '            size_t slash = output_path.find_last_of("/\\\\");\n',
    '            std::string out_dir = (slash != std::string::npos) ? output_path.substr(0, slash + 1) : "";\n',
    '            std::string target_dll = out_dir + "nanoguard_bridge.dll";\n',
    '            std::ofstream dst_dll(target_dll, std::ios::binary);\n',
    '            dst_dll.write(reinterpret_cast<const char*>(dll_vec.data()), dll_vec.size());\n',
    '            dst_dll.close();\n',
    '            std::cout << "[+] Deployed DLL alongside JAR: " << target_dll << "\\n";\n',
    '\n',
    '            // Embed directly inside JAR archive!\n',
    '            JarEntry dll_e;\n',
    '            dll_e.filename = "nanoguard_bridge.dll";\n',
    '            dll_e.data = dll_vec;\n',
    '            dll_e.uncompressed_size = static_cast<uint32_t>(dll_vec.size());\n',
    '            dll_e.compressed_size = static_cast<uint32_t>(dll_vec.size());\n',
    '            dll_e.is_class = false;\n',
    '            entries.push_back(dll_e);\n',
    '            std::cout << "[+] Embedded nanoguard_bridge.dll directly inside JAR archive (" << dll_vec.size() << " bytes)!\\n";\n',
    '\n',
    '            // Inject NativeBridgeLoader class for automated runtime self-extraction and loading\n',
    '            JarEntry nbl_e;\n',
    '            nbl_e.filename = "nanoguard/NativeBridgeLoader.class";\n',
    '            nbl_e.data.assign(NATIVE_BRIDGE_LOADER_BYTES, NATIVE_BRIDGE_LOADER_BYTES + NATIVE_BRIDGE_LOADER_SIZE);\n',
    '            nbl_e.uncompressed_size = static_cast<uint32_t>(NATIVE_BRIDGE_LOADER_SIZE);\n',
    '            nbl_e.compressed_size = static_cast<uint32_t>(NATIVE_BRIDGE_LOADER_SIZE);\n',
    '            nbl_e.is_class = true;\n',
    '            entries.push_back(nbl_e);\n',
    '            std::cout << "[+] Injected automated NativeBridgeLoader (Self-Extracting DLL/SO loader).\\n";\n',
    '        }\n'
]

lines[start_idx:end_idx] = new_code_lines

with open(main_cpp_path, 'w', encoding='utf-8') as f:
    f.writelines(lines)

print("SUCCESS_PATCHED_MAIN_CPP")
