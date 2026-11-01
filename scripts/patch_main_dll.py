import os

main_cpp_path = r'C:\Users\nanodev\NanoGuard\resources\engine_cpp\src\main.cpp'
with open(main_cpp_path, 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Add include
inc_target = '#include "../include/native_loader_bytes.hpp"'
inc_replace = '#include "../include/native_loader_bytes.hpp"\n#include "../include/nanoguard_bridge_template.hpp"'
assert inc_target in code, "inc_target not found"
code = code.replace(inc_target, inc_replace)

# 2. Upgrade DLL logic to fallback to embedded template when compile_dll fails
old_dll_block = """        std::string bridge_dll = "nanoguard_bridge.dll";
        if (JvmNativeTranspiler::compile_dll(temp_cpp, bridge_dll)) {
            std::cout << "[+] Native Bridge: successfully compiled " << bridge_dll << " (x86_64 Machine Code)!\\n";
            // Copy alongside output jar
            size_t slash = output_path.find_last_of("/\\\\");
            std::string out_dir = (slash != std::string::npos) ? output_path.substr(0, slash + 1) : "";
            std::string target_dll = out_dir + "nanoguard_bridge.dll";
            std::ifstream src_dll(bridge_dll, std::ios::binary);
            std::ofstream dst_dll(target_dll, std::ios::binary);
            dst_dll << src_dll.rdbuf();
            src_dll.close();
            dst_dll.close();
            std::cout << "[+] Deployed DLL alongside JAR: " << target_dll << "\\n";

            // Also embed directly inside JAR archive
            std::ifstream jar_dll(bridge_dll, std::ios::binary);
            std::vector<uint8_t> dll_vec((std::istreambuf_iterator<char>(jar_dll)), std::istreambuf_iterator<char>());
            JarEntry dll_e;
            dll_e.filename = "nanoguard_bridge.dll";
            dll_e.data = dll_vec;
            dll_e.uncompressed_size = static_cast<uint32_t>(dll_vec.size());
            dll_e.compressed_size = static_cast<uint32_t>(dll_vec.size());
            dll_e.is_class = false;
            entries.push_back(dll_e);

            // Inject NativeBridgeLoader class for automated runtime self-extraction and loading
            JarEntry nbl_e;
            nbl_e.filename = "nanoguard/NativeBridgeLoader.class";
            nbl_e.data.assign(NATIVE_BRIDGE_LOADER_BYTES, NATIVE_BRIDGE_LOADER_BYTES + NATIVE_BRIDGE_LOADER_SIZE);
            nbl_e.uncompressed_size = static_cast<uint32_t>(NATIVE_BRIDGE_LOADER_SIZE);
            nbl_e.compressed_size = static_cast<uint32_t>(NATIVE_BRIDGE_LOADER_SIZE);
            nbl_e.is_class = true;
            entries.push_back(nbl_e);
            std::cout << "[+] Injected automated NativeBridgeLoader (Self-Extracting DLL/SO loader).\\n";
        }"""

new_dll_block = """        std::string bridge_dll = "nanoguard_bridge.dll";
        std::vector<uint8_t> dll_vec;
        bool compiled = JvmNativeTranspiler::compile_dll(temp_cpp, bridge_dll);
        if (compiled) {
            std::cout << "[+] Native Bridge: successfully compiled " << bridge_dll << " via local MSVC cl.exe!\\n";
            std::ifstream jar_dll(bridge_dll, std::ios::binary);
            dll_vec.assign((std::istreambuf_iterator<char>(jar_dll)), std::istreambuf_iterator<char>());
        } else {
            std::cout << "[*] No local cl.exe found. Utilizing ultra-compressed Native Bridge Template (Deflate 9)...\\n";
            dll_vec = get_embedded_bridge_dll(detected_main_class);
            if (!dll_vec.empty()) {
                std::cout << "[+] Successfully generated customized Native DLL (" << dll_vec.size() << " bytes) for " << detected_main_class << "!\\n";
            } else {
                std::cerr << "[!] Error: failed to unpack embedded bridge DLL template.\\n";
            }
        }

        if (!dll_vec.empty()) {
            // Copy alongside output jar
            size_t slash = output_path.find_last_of("/\\\\");
            std::string out_dir = (slash != std::string::npos) ? output_path.substr(0, slash + 1) : "";
            std::string target_dll = out_dir + "nanoguard_bridge.dll";
            std::ofstream dst_dll(target_dll, std::ios::binary);
            dst_dll.write(reinterpret_cast<const char*>(dll_vec.data()), dll_vec.size());
            dst_dll.close();
            std::cout << "[+] Deployed DLL alongside JAR: " << target_dll << "\\n";

            // Embed directly inside JAR archive!
            JarEntry dll_e;
            dll_e.filename = "nanoguard_bridge.dll";
            dll_e.data = dll_vec;
            dll_e.uncompressed_size = static_cast<uint32_t>(dll_vec.size());
            dll_e.compressed_size = static_cast<uint32_t>(dll_vec.size());
            dll_e.is_class = false;
            entries.push_back(dll_e);
            std::cout << "[+] Embedded nanoguard_bridge.dll directly inside JAR archive (" << dll_vec.size() << " bytes)!\\n";

            // Inject NativeBridgeLoader class for automated runtime self-extraction and loading
            JarEntry nbl_e;
            nbl_e.filename = "nanoguard/NativeBridgeLoader.class";
            nbl_e.data.assign(NATIVE_BRIDGE_LOADER_BYTES, NATIVE_BRIDGE_LOADER_BYTES + NATIVE_BRIDGE_LOADER_SIZE);
            nbl_e.uncompressed_size = static_cast<uint32_t>(NATIVE_BRIDGE_LOADER_SIZE);
            nbl_e.compressed_size = static_cast<uint32_t>(NATIVE_BRIDGE_LOADER_SIZE);
            nbl_e.is_class = true;
            entries.push_back(nbl_e);
            std::cout << "[+] Injected automated NativeBridgeLoader (Self-Extracting DLL/SO loader).\\n";
        }"""

assert old_dll_block in code, "old_dll_block not found in main.cpp"
code = code.replace(old_dll_block, new_dll_block)

with open(main_cpp_path, 'w', encoding='utf-8') as f:
    f.write(code)

print("MAIN_CPP_UPDATED_WITH_FALLBACK")
