import os
import zlib

dll_path = r'C:\Users\nanodev\NanoGuard\resources\engine\nanoguard_bridge.dll'
out_path = r'C:\Users\nanodev\NanoGuard\resources\engine_cpp\include\nanoguard_bridge_template.hpp'

with open(dll_path, 'rb') as f:
    dll = f.read()

comp = zlib.compress(dll, 9)

with open(out_path, 'w', encoding='utf-8') as f:
    f.write('#pragma once\n#include <cstdint>\n#include <vector>\n#include <string>\n#include <algorithm>\n#include "miniz.h"\n\nnamespace nanoguard {\n\n')
    f.write('// Compressed (Deflate level 9) standalone Native Bridge DLL template\n')
    f.write(f'// Uncompressed size: {len(dll)} bytes, Compressed: {len(comp)} bytes\n')
    f.write('static const uint8_t BRIDGE_DLL_COMPRESSED[] = {\n')
    for i in range(0, len(comp), 16):
        chunk = comp[i:i+16]
        hex_vals = ', '.join(f'0x{b:02x}' for b in chunk)
        f.write(f'    {hex_vals},\n')
    f.write('};\n\n')
    f.write(f'static const size_t BRIDGE_DLL_COMPRESSED_SIZE = {len(comp)};\n')
    f.write(f'static const size_t BRIDGE_DLL_UNCOMPRESSED_SIZE = {len(dll)};\n\n')
    f.write('''inline std::vector<uint8_t> get_embedded_bridge_dll(const std::string& target_class) {
    std::vector<uint8_t> decompressed(BRIDGE_DLL_UNCOMPRESSED_SIZE);
    unsigned long dest_len = BRIDGE_DLL_UNCOMPRESSED_SIZE;
    int status = uncompress(decompressed.data(), &dest_len, BRIDGE_DLL_COMPRESSED, BRIDGE_DLL_COMPRESSED_SIZE);
    if (status != MZ_OK) {
        return {};
    }
    decompressed.resize(dest_len);

    // Patch target class in DLL binary: replace "I01IOOOO0I1O0lIIOlI"
    const std::string placeholder = "I01IOOOO0I1O0lIIOlI";
    auto it = std::search(decompressed.begin(), decompressed.end(), placeholder.begin(), placeholder.end());
    if (it != decompressed.end()) {
        size_t pos = std::distance(decompressed.begin(), it);
        // Clean placeholder and up to 32 bytes
        size_t max_len = 32;
        for (size_t i = 0; i < max_len && (pos + i) < decompressed.size(); ++i) {
            decompressed[pos + i] = 0;
        }
        // Write new target class name
        size_t write_len = std::min(target_class.size(), max_len - 1);
        for (size_t i = 0; i < write_len; ++i) {
            decompressed[pos + i] = static_cast<uint8_t>(target_class[i]);
        }
    }
    return decompressed;
}

} // namespace nanoguard
''')

print('GENERATED_TEMPLATE_HPP')
