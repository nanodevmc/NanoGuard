import struct
import zlib
import os

# Create a valid Linux x86_64 ELF 64-bit Shared Object (.so)
# Containing JNI_OnLoad and target class placeholder "I01IOOOO0I1O0lIIOlI"

# ELF Header: 64 bytes
# e_ident: 16 bytes: 0x7F 'E' 'L' 'F', ELFCLASS64=2, ELFDATA2LSB=1, EV_CURRENT=1, ELFOSABI_SYSV=0, 8 bytes pad
# e_type: ET_DYN (3)
# e_machine: EM_X86_64 (62)
# e_version: EV_CURRENT (1)
# e_entry: 0x1000
# e_phoff: 64 (immediately after header)
# e_shoff: section header offset (calculated later)
# e_flags: 0
# e_ehsize: 64
# e_phentsize: 56
# e_phnum: 3 (LOAD, DYNAMIC, GNU_STACK)
# e_shentsize: 64
# e_shnum: 8

def build_linux_so():
    target_str = b"I01IOOOO0I1O0lIIOlI\x00\x00\x00\x00\x00onEnable\x00\x00\x00\x00()V\x00\x00\x00\x00"
    
    # Simple machine code for JNI_OnLoad:
    # return JNI_VERSION_1_6 (0x00010006)
    # mov eax, 0x10006; ret
    text_code = bytes([
        0xb8, 0x06, 0x00, 0x01, 0x00, # mov eax, 0x10006
        0xc3                          # ret
    ])
    
    rodata = b"[NanoGuard Linux AOT Core]\x00" + target_str
    
    dynstr = b"\x00nanoguard_bridge.so\x00JNI_OnLoad\x00"
    # Symbol table:
    # 0: NULL symbol (24 bytes)
    # 1: JNI_OnLoad: st_name=20, st_info=0x12 (STB_GLOBAL, STT_FUNC), st_other=0, st_shndx=1, st_value=0x1000, st_size=6
    dynsym = bytearray(24 * 2)
    # symbol 1:
    struct.pack_into("<IBBHQQ", dynsym, 24, 20, 0x12, 0, 1, 0x1000, 6)
    
    # Hash table: 1 bucket, 2 chains
    # nbucket=1, nchain=2, bucket[0]=1, chain[0]=0, chain[1]=0
    hash_tbl = struct.pack("<IIIII", 1, 2, 1, 0, 0)
    
    # DYNAMIC section:
    # DT_HASH: 4
    # DT_STRTAB: 5
    # DT_SYMTAB: 6
    # DT_STRSZ: 10
    # DT_SYMENT: 11
    # DT_NULL: 0
    dynamic = (
        struct.pack("<Qq", 4, 0x2000) +
        struct.pack("<Qq", 5, 0x2020) +
        struct.pack("<Qq", 6, 0x2040) +
        struct.pack("<Qq", 10, len(dynstr)) +
        struct.pack("<Qq", 11, 24) +
        struct.pack("<Qq", 0, 0)
    )
    
    # Let's organize segments
    # File layout:
    # 0x0000: ELF Header (64 bytes)
    # 0x0040: Program Headers (3 * 56 = 168 bytes)
    # 0x0100: Pad to page or alignment
    # 0x1000: .text (code) + .rodata
    # 0x2000: .dynamic + .hash + .dynstr + .dynsym
    
    header = bytearray(64)
    header[0:4] = b"\x7fELF"
    header[4] = 2 # 64-bit
    header[5] = 1 # Little-endian
    header[6] = 1 # Version
    header[7] = 0 # System V
    struct.pack_into("<HHIQQQIHHHHHH", header, 16,
                     3,      # e_type = ET_DYN
                     62,     # e_machine = x86_64
                     1,      # e_version
                     0x1000, # e_entry
                     64,     # e_phoff
                     0,      # e_shoff (no sections strictly needed for dlopen, only segments!)
                     0,      # e_flags
                     64,     # e_ehsize
                     56,     # e_phentsize
                     3,      # e_phnum
                     0,      # e_shentsize
                     0,      # e_shnum
                     0)      # e_shstrndx
                     
    # Program Headers:
    # 1. PT_LOAD (RX) for header + text
    # 2. PT_LOAD (RW) for dynamic data
    # 3. PT_DYNAMIC
    ph1 = struct.pack("<IIQQQQQQ",
                      1,          # p_type = PT_LOAD
                      5,          # p_flags = PF_R | PF_X
                      0,          # p_offset
                      0x0000,     # p_vaddr
                      0x0000,     # p_paddr
                      0x1200,     # p_filesz
                      0x1200,     # p_memsz
                      0x1000)     # p_align
                      
    ph2 = struct.pack("<IIQQQQQQ",
                      1,          # p_type = PT_LOAD
                      6,          # p_flags = PF_R | PF_W
                      0x2000,     # p_offset
                      0x2000,     # p_vaddr
                      0x2000,     # p_paddr
                      0x0400,     # p_filesz
                      0x0400,     # p_memsz
                      0x1000)     # p_align
                      
    ph3 = struct.pack("<IIQQQQQQ",
                      2,          # p_type = PT_DYNAMIC
                      6,          # p_flags = PF_R | PF_W
                      0x2000,     # p_offset
                      0x2000,     # p_vaddr
                      0x2000,     # p_paddr
                      len(dynamic), # p_filesz
                      len(dynamic), # p_memsz
                      8)          # p_align
                      
    content = bytearray(0x2400)
    content[0:64] = header
    content[64:64+56] = ph1
    content[64+56:64+112] = ph2
    content[64+112:64+168] = ph3
    
    # Text at 0x1000
    content[0x1000:0x1000+len(text_code)] = text_code
    content[0x1010:0x1010+len(rodata)] = rodata
    
    # Dynamic data at 0x2000
    content[0x2000:0x2000+len(dynamic)] = dynamic
    content[0x2000+len(dynamic):0x2000+len(dynamic)+len(hash_tbl)] = hash_tbl
    content[0x2020:0x2020+len(dynstr)] = dynstr
    content[0x2040:0x2040+len(dynsym)] = dynsym
    
    return bytes(content)

raw_so = build_linux_so()
print(f"Generated Linux .so binary: {len(raw_so)} bytes")

# Save raw .so to resources/engine
with open(r'C:\Users\nanodev\NanoGuard\resources\engine\nanoguard_bridge.so', 'wb') as f:
    f.write(raw_so)

# Compress via zlib (Deflate level 9)
comp_so = zlib.compress(raw_so, 9)
print(f"Compressed .so: {len(comp_so)} bytes (ratio: {len(raw_so)/len(comp_so):.2f})")

# Generate nanoguard_bridge_so_template.hpp
out_hpp = r'C:\Users\nanodev\NanoGuard\resources\engine_cpp\include\nanoguard_bridge_so_template.hpp'
with open(out_hpp, 'w', encoding='utf-8') as f:
    f.write('#pragma once\n#include <cstdint>\n#include <vector>\n#include <string>\n#include <algorithm>\n#include "miniz.h"\n\nnamespace nanoguard {\n\n')
    f.write(f'// Compressed (Deflate 9) Standalone Linux x86_64 ELF Shared Object (.so) template\n')
    f.write(f'// Uncompressed: {len(raw_so)} bytes, Compressed: {len(comp_so)} bytes\n')
    f.write('static const uint8_t BRIDGE_SO_COMPRESSED[] = {\n')
    for i in range(0, len(comp_so), 16):
        chunk = comp_so[i:i+16]
        hex_vals = ', '.join(f'0x{b:02x}' for b in chunk)
        f.write(f'    {hex_vals},\n')
    f.write('};\n\n')
    f.write(f'static const size_t BRIDGE_SO_COMPRESSED_SIZE = {len(comp_so)};\n')
    f.write(f'static const size_t BRIDGE_SO_UNCOMPRESSED_SIZE = {len(raw_so)};\n\n')
    f.write('''inline std::vector<uint8_t> get_embedded_bridge_so(const std::string& target_class) {
    std::vector<uint8_t> decompressed(BRIDGE_SO_UNCOMPRESSED_SIZE);
    unsigned long dest_len = BRIDGE_SO_UNCOMPRESSED_SIZE;
    int status = uncompress(decompressed.data(), &dest_len, BRIDGE_SO_COMPRESSED, BRIDGE_SO_COMPRESSED_SIZE);
    if (status != MZ_OK) {
        return {};
    }
    decompressed.resize(dest_len);

    // Patch target class in ELF binary: replace placeholder "I01IOOOO0I1O0lIIOlI"
    const std::string placeholder = "I01IOOOO0I1O0lIIOlI";
    auto it = std::search(decompressed.begin(), decompressed.end(), placeholder.begin(), placeholder.end());
    if (it != decompressed.end()) {
        size_t pos = std::distance(decompressed.begin(), it);
        size_t max_len = 32;
        for (size_t i = 0; i < max_len && (pos + i) < decompressed.size(); ++i) {
            decompressed[pos + i] = 0;
        }
        size_t write_len = std::min(target_class.size(), max_len - 1);
        for (size_t i = 0; i < write_len; ++i) {
            decompressed[pos + i] = static_cast<uint8_t>(target_class[i]);
        }
    }
    return decompressed;
}

} // namespace nanoguard
''')

print("SUCCESS_GEN_SO_TEMPLATE")
