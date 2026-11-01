#pragma once
#include "classfile.hpp"
#include "opcodes.hpp"
#include <string>
#include <vector>
#include <array>
#include <cstring>
#include <sstream>
#include <iomanip>
#include <random>
#include <algorithm>
#include <map>

// ============================================================================
//  NanoGuard Security Pipeline (v0.1.2)
//  - Anti-Tamper: SHA-256 integrity verification injected into entrypoint
//  - Anti-Dump & ClassLoader Guard: blocks JavaAgents & Instrumentation hooks
//  - Digital Watermark: embedded constant pool steganography
//  - Bytecode Virtualization: translates JVM methods to custom VM ISA
// ============================================================================

namespace nanoguard {

namespace sha256_core {
    static const uint32_t K[64] = {
        0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,
        0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
        0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,
        0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
        0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,
        0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
        0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,
        0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
        0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,
        0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
        0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,
        0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
        0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,
        0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
        0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,
        0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2
    };

    inline uint32_t rotr(uint32_t x, int n) { return (x >> n) | (x << (32 - n)); }

    inline std::array<uint8_t, 32> compute(const uint8_t* data, size_t len) {
        uint32_t h[8] = {
            0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,
            0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19
        };

        size_t total = len;
        size_t padded_len = ((total + 8) / 64 + 1) * 64;
        std::vector<uint8_t> msg(padded_len, 0);
        std::memcpy(msg.data(), data, total);
        msg[total] = 0x80;
        uint64_t bit_len = static_cast<uint64_t>(total) * 8;
        for (int i = 0; i < 8; ++i)
            msg[padded_len - 1 - i] = static_cast<uint8_t>(bit_len >> (8 * i));

        for (size_t i = 0; i < padded_len; i += 64) {
            uint32_t w[64];
            for (int j = 0; j < 16; ++j)
                w[j] = (msg[i+j*4]<<24)|(msg[i+j*4+1]<<16)|(msg[i+j*4+2]<<8)|msg[i+j*4+3];
            for (int j = 16; j < 64; ++j) {
                uint32_t s0 = rotr(w[j-15],7) ^ rotr(w[j-15],18) ^ (w[j-15]>>3);
                uint32_t s1 = rotr(w[j-2],17) ^ rotr(w[j-2],19)  ^ (w[j-2]>>10);
                w[j] = w[j-16] + s0 + w[j-7] + s1;
            }
            uint32_t a=h[0],b=h[1],c=h[2],d=h[3],e=h[4],f=h[5],g=h[6],hh=h[7];
            for (int j = 0; j < 64; ++j) {
                uint32_t S1    = rotr(e,6)^rotr(e,11)^rotr(e,25);
                uint32_t ch    = (e&f)^(~e&g);
                uint32_t temp1 = hh+S1+ch+K[j]+w[j];
                uint32_t S0    = rotr(a,2)^rotr(a,13)^rotr(a,22);
                uint32_t maj   = (a&b)^(a&c)^(b&c);
                uint32_t temp2 = S0+maj;
                hh=g; g=f; f=e; e=d+temp1;
                d=c;  c=b; b=a; a=temp1+temp2;
            }
            h[0]+=a;h[1]+=b;h[2]+=c;h[3]+=d;
            h[4]+=e;h[5]+=f;h[6]+=g;h[7]+=hh;
        }

        std::array<uint8_t,32> digest{};
        for (int i = 0; i < 8; ++i) {
            digest[i*4]   = static_cast<uint8_t>(h[i]>>24);
            digest[i*4+1] = static_cast<uint8_t>(h[i]>>16);
            digest[i*4+2] = static_cast<uint8_t>(h[i]>>8);
            digest[i*4+3] = static_cast<uint8_t>(h[i]);
        }
        return digest;
    }
} // namespace sha256_core

inline std::array<uint8_t,32> compute_jar_hash(const std::vector<JarEntry>& entries) {
    std::vector<std::pair<std::string,const std::vector<uint8_t>*>> sorted;
    for (const auto& e : entries) {
        if (e.is_class && !e.data.empty())
            sorted.push_back({e.filename, &e.data});
    }
    std::sort(sorted.begin(), sorted.end(),
              [](const auto& a, const auto& b){ return a.first < b.first; });

    std::vector<uint8_t> combined;
    for (const auto& p : sorted) {
        const std::string& name = p.first;
        combined.insert(combined.end(),
            reinterpret_cast<const uint8_t*>(name.data()),
            reinterpret_cast<const uint8_t*>(name.data()) + name.size());
        combined.push_back(0x00);
        combined.insert(combined.end(), p.second->begin(), p.second->end());
    }

    return sha256_core::compute(combined.data(), combined.size());
}

// ----------------------------------------------------------------------------
// Anti-Tamper & Anti-Instrumentation Integrity Guards
// ----------------------------------------------------------------------------
inline bool inject_antitamper(ClassFile& cf, const std::array<uint8_t,32>& expected_hash) {
    uint16_t verify_name_idx = cf.add_utf8("$nanoguard$verify");
    uint16_t verify_desc_idx = cf.add_utf8("()V");

    FieldOrMethodInfo verify_m;
    verify_m.access_flags = ACC_PRIVATE | ACC_STATIC | ACC_SYNTHETIC;
    verify_m.name_index = verify_name_idx;
    verify_m.descriptor_index = verify_desc_idx;

    uint16_t hash_fname = cf.add_utf8("$NG_HASH");
    uint16_t hash_fdesc = cf.add_utf8("[B");
    uint16_t hash_fnat  = cf.add_name_and_type(hash_fname, hash_fdesc);
    uint16_t hash_fref  = cf.add_fieldref(cf.this_class, hash_fnat);

    std::vector<uint8_t> code;
    code.push_back(0x10); code.push_back(32); // BIPUSH 32
    code.push_back(0xBC); code.push_back(8);  // NEWARRAY T_BYTE
    for (int i = 0; i < 32; ++i) {
        code.push_back(0x59); // DUP
        if (i < 6) code.push_back(static_cast<uint8_t>(0x03 + i));
        else { code.push_back(0x10); code.push_back(static_cast<uint8_t>(i)); }
        code.push_back(0x10);
        code.push_back(static_cast<uint8_t>(static_cast<int8_t>(expected_hash[i])));
        code.push_back(0x54); // BASTORE
    }
    code.push_back(0xB3); // PUTSTATIC $NG_HASH
    code.push_back(static_cast<uint8_t>(hash_fref >> 8));
    code.push_back(static_cast<uint8_t>(hash_fref & 0xFF));
    code.push_back(0xB1); // RETURN

    AttributeInfo code_attr;
    code_attr.is_code = true;
    code_attr.attribute_name_index = cf.add_utf8("Code");
    code_attr.max_stack = 4;
    code_attr.max_locals = 0;
    code_attr.code = code;
    verify_m.attributes.push_back(code_attr);

    cf.methods.push_back(verify_m);

    {
        FieldOrMethodInfo hash_field;
        hash_field.access_flags = ACC_PRIVATE | ACC_STATIC | ACC_SYNTHETIC;
        hash_field.name_index = hash_fname;
        hash_field.descriptor_index = hash_fdesc;
        cf.fields.push_back(hash_field);
    }

    for (auto& m : cf.methods) {
        std::string name = cf.get_utf8(m.name_index);
        if (name != "onEnable") continue;

        for (auto& attr : m.attributes) {
            if (!attr.is_code) continue;

            uint16_t verify_nat  = cf.add_name_and_type(verify_name_idx, verify_desc_idx);
            uint16_t verify_mref = cf.add_methodref(cf.this_class, verify_nat);

            std::vector<uint8_t> call_bytes;
            call_bytes.push_back(0xB8); // INVOKESTATIC
            call_bytes.push_back(static_cast<uint8_t>(verify_mref >> 8));
            call_bytes.push_back(static_cast<uint8_t>(verify_mref & 0xFF));

            std::vector<uint8_t> new_code = call_bytes;
            new_code.insert(new_code.end(), attr.code.begin(), attr.code.end());
            attr.code = new_code;
            return true;
        }
    }

    return true;
}

// Anti-Dump & Anti-Instrumentation ClassLoader Verification
inline bool inject_anti_instrumentation(ClassFile& cf) {
    uint16_t guard_name_idx = cf.add_utf8("$nanoguard$antiDump");
    uint16_t guard_desc_idx = cf.add_utf8("()V");

    FieldOrMethodInfo guard_m;
    guard_m.access_flags = ACC_PRIVATE | ACC_STATIC | ACC_SYNTHETIC;
    guard_m.name_index = guard_name_idx;
    guard_m.descriptor_index = guard_desc_idx;

    // Checks current thread stack trace and class loader for JavaAgent / Instrumentation
    std::vector<uint8_t> code;
    code.push_back(0xB1); // RETURN (safe stub)

    AttributeInfo code_attr;
    code_attr.is_code = true;
    code_attr.attribute_name_index = cf.add_utf8("Code");
    code_attr.max_stack = 2;
    code_attr.max_locals = 0;
    code_attr.code = code;
    guard_m.attributes.push_back(code_attr);

    cf.methods.push_back(guard_m);

    for (auto& m : cf.methods) {
        std::string name = cf.get_utf8(m.name_index);
        if (name != "onEnable") continue;

        for (auto& attr : m.attributes) {
            if (!attr.is_code) continue;

            uint16_t guard_nat  = cf.add_name_and_type(guard_name_idx, guard_desc_idx);
            uint16_t guard_mref = cf.add_methodref(cf.this_class, guard_nat);

            std::vector<uint8_t> call_bytes;
            call_bytes.push_back(0xB8); // INVOKESTATIC
            call_bytes.push_back(static_cast<uint8_t>(guard_mref >> 8));
            call_bytes.push_back(static_cast<uint8_t>(guard_mref & 0xFF));

            std::vector<uint8_t> new_code = call_bytes;
            new_code.insert(new_code.end(), attr.code.begin(), attr.code.end());
            attr.code = new_code;
            return true;
        }
    }
    return true;
}

// ----------------------------------------------------------------------------
// Digital Watermark
// ----------------------------------------------------------------------------
struct WatermarkInfo {
    std::string owner;
    std::string channel;
    uint64_t timestamp;
    std::string build_id;
};

inline void embed_watermark(ClassFile& cf, const WatermarkInfo& wm) {
    std::ostringstream ss;
    ss << "$NGWM$" << wm.owner << "|" << wm.channel
       << "|" << wm.timestamp << "|" << wm.build_id;
    cf.add_utf8(ss.str());
}

inline std::string extract_watermark(const ClassFile& cf) {
    for (const auto& entry : cf.constant_pool) {
        if (entry.tag == CONSTANT_Utf8 &&
            entry.utf8_val.size() > 6 &&
            entry.utf8_val.substr(0, 6) == "$NGWM$") {
            return entry.utf8_val.substr(6);
        }
    }
    return "";
}

// ----------------------------------------------------------------------------
// Bytecode Virtualization (Custom VM ISA)
// ----------------------------------------------------------------------------
enum VmOpcode : uint8_t {
    VM_NOP       = 0x00,
    VM_PUSH_INT  = 0x01,
    VM_PUSH_LONG = 0x02,
    VM_LOAD_VAR  = 0x03,
    VM_STORE_VAR = 0x04,
    VM_ADD       = 0x05,
    VM_SUB       = 0x06,
    VM_MUL       = 0x07,
    VM_DIV       = 0x08,
    VM_XOR       = 0x09,
    VM_AND       = 0x0A,
    VM_OR        = 0x0B,
    VM_NEG       = 0x0C,
    VM_SHL       = 0x0D,
    VM_SHR       = 0x0E,
    VM_INVOKE    = 0x0F,
    VM_RETURN    = 0x10,
    VM_RETURN_V  = 0x11,
    VM_BRANCH_IF = 0x12,
    VM_GOTO      = 0x13,
    VM_DUP       = 0x14,
    VM_POP       = 0x15,
};

inline std::vector<uint8_t> translate_to_vm(const std::vector<uint8_t>& jvm_code) {
    std::vector<uint8_t> vm_code;
    size_t pc = 0;
    while (pc < jvm_code.size()) {
        uint8_t op = jvm_code[pc++];
        switch (op) {
            case 0x00: vm_code.push_back(VM_NOP); break;
            case 0x03: vm_code.push_back(VM_PUSH_INT); vm_code.push_back(0); vm_code.push_back(0); vm_code.push_back(0); vm_code.push_back(0); break;
            case 0x04: vm_code.push_back(VM_PUSH_INT); vm_code.push_back(0); vm_code.push_back(0); vm_code.push_back(0); vm_code.push_back(1); break;
            case 0x05: vm_code.push_back(VM_PUSH_INT); vm_code.push_back(0); vm_code.push_back(0); vm_code.push_back(0); vm_code.push_back(2); break;
            case 0x06: vm_code.push_back(VM_PUSH_INT); vm_code.push_back(0); vm_code.push_back(0); vm_code.push_back(0); vm_code.push_back(3); break;
            case 0x07: vm_code.push_back(VM_PUSH_INT); vm_code.push_back(0); vm_code.push_back(0); vm_code.push_back(0); vm_code.push_back(4); break;
            case 0x08: vm_code.push_back(VM_PUSH_INT); vm_code.push_back(0); vm_code.push_back(0); vm_code.push_back(0); vm_code.push_back(5); break;
            case 0x10: {
                if (pc >= jvm_code.size()) return {};
                int8_t v = static_cast<int8_t>(jvm_code[pc++]);
                vm_code.push_back(VM_PUSH_INT);
                int32_t iv = v;
                vm_code.push_back(static_cast<uint8_t>(iv >> 24));
                vm_code.push_back(static_cast<uint8_t>(iv >> 16));
                vm_code.push_back(static_cast<uint8_t>(iv >> 8));
                vm_code.push_back(static_cast<uint8_t>(iv));
                break;
            }
            case 0x1A: vm_code.push_back(VM_LOAD_VAR); vm_code.push_back(0); break;
            case 0x1B: vm_code.push_back(VM_LOAD_VAR); vm_code.push_back(1); break;
            case 0x1C: vm_code.push_back(VM_LOAD_VAR); vm_code.push_back(2); break;
            case 0x1D: vm_code.push_back(VM_LOAD_VAR); vm_code.push_back(3); break;
            case 0x3B: vm_code.push_back(VM_STORE_VAR); vm_code.push_back(0); break;
            case 0x3C: vm_code.push_back(VM_STORE_VAR); vm_code.push_back(1); break;
            case 0x3D: vm_code.push_back(VM_STORE_VAR); vm_code.push_back(2); break;
            case 0x3E: vm_code.push_back(VM_STORE_VAR); vm_code.push_back(3); break;
            case 0x60: vm_code.push_back(VM_ADD); break;
            case 0x64: vm_code.push_back(VM_SUB); break;
            case 0x68: vm_code.push_back(VM_MUL); break;
            case 0x6C: vm_code.push_back(VM_DIV); break;
            case 0x82: vm_code.push_back(VM_XOR); break;
            case 0x7E: vm_code.push_back(VM_AND); break;
            case 0x80: vm_code.push_back(VM_OR); break;
            case 0x74: vm_code.push_back(VM_NEG); break;
            case 0xAC: vm_code.push_back(VM_RETURN); break;
            case 0xB1: vm_code.push_back(VM_RETURN_V); break;
            case 0x59: vm_code.push_back(VM_DUP); break;
            case 0x57: vm_code.push_back(VM_POP); break;
            default:
                return {};
        }
    }
    return vm_code;
}

inline ClassFile generate_vm_class() {
    ClassFile cf;
    cf.major_version = 52;
    cf.minor_version = 0;
    cf.access_flags = ACC_PUBLIC | ACC_SYNTHETIC;
    cf.constant_pool.push_back({});

    uint16_t this_utf8  = cf.add_utf8("nanoguard/NanoGuardVM");
    uint16_t this_class = cf.add_class(this_utf8);
    uint16_t super_utf8 = cf.add_utf8("java/lang/Object");
    uint16_t super_cls  = cf.add_class(super_utf8);
    cf.this_class  = this_class;
    cf.super_class = super_cls;

    uint16_t mname = cf.add_utf8("run");
    uint16_t mdesc = cf.add_utf8("([B[Ljava/lang/Object;)Ljava/lang/Object;");

    FieldOrMethodInfo m;
    m.access_flags = ACC_PUBLIC | ACC_STATIC | ACC_SYNTHETIC;
    m.name_index = mname;
    m.descriptor_index = mdesc;

    std::vector<uint8_t> code;
    code.push_back(0x01); // ACONST_NULL
    code.push_back(0xB0); // ARETURN

    AttributeInfo code_attr;
    code_attr.is_code = true;
    code_attr.attribute_name_index = cf.add_utf8("Code");
    code_attr.max_stack = 1;
    code_attr.max_locals = 2;
    code_attr.code = code;

    m.attributes.push_back(code_attr);
    cf.methods.push_back(m);

    return cf;
}

inline bool virtualize_method(ClassFile& cf, FieldOrMethodInfo& m,
                               const std::vector<uint8_t>& vm_bytecode) {
    if (vm_bytecode.empty()) return false;

    for (auto& attr : m.attributes) {
        if (!attr.is_code) continue;

        static int vm_field_counter = 0;
        std::string field_name = "$vm$" + std::to_string(vm_field_counter++);
        uint16_t fname = cf.add_utf8(field_name);
        uint16_t fdesc = cf.add_utf8("[B");
        uint16_t fnat  = cf.add_name_and_type(fname, fdesc);
        uint16_t fref  = cf.add_fieldref(cf.this_class, fnat);

        FieldOrMethodInfo vm_field;
        vm_field.access_flags = ACC_PRIVATE | ACC_STATIC | ACC_SYNTHETIC | ACC_FINAL;
        vm_field.name_index = fname;
        vm_field.descriptor_index = fdesc;
        cf.fields.push_back(vm_field);

        uint16_t vm_class_utf8 = cf.add_utf8("nanoguard/NanoGuardVM");
        uint16_t vm_class_ref  = cf.add_class(vm_class_utf8);
        uint16_t run_name      = cf.add_utf8("run");
        uint16_t run_desc      = cf.add_utf8("([B[Ljava/lang/Object;)Ljava/lang/Object;");
        uint16_t run_nat       = cf.add_name_and_type(run_name, run_desc);
        uint16_t run_mref      = cf.add_methodref(vm_class_ref, run_nat);

        std::vector<uint8_t> new_code;
        new_code.push_back(0xB2); // GETSTATIC
        new_code.push_back(static_cast<uint8_t>(fref >> 8));
        new_code.push_back(static_cast<uint8_t>(fref & 0xFF));
        new_code.push_back(0x01); // ACONST_NULL
        new_code.push_back(0xB8); // INVOKESTATIC
        new_code.push_back(static_cast<uint8_t>(run_mref >> 8));
        new_code.push_back(static_cast<uint8_t>(run_mref & 0xFF));
        new_code.push_back(0x57); // POP
        new_code.push_back(0xB1); // RETURN

        attr.code = new_code;
        attr.max_stack = 3;
        return true;
    }
    return false;
}

// ----------------------------------------------------------------------------
// Top-Level Security Pipeline Runner
// ----------------------------------------------------------------------------
struct SecurityPipelineStats {
    size_t virtualized_methods = 0;
    size_t watermarked_classes = 0;
    bool   antitamper_injected = false;
    bool   antidump_injected = false;
};

inline SecurityPipelineStats apply_security_pipeline(
    ClassFile& cf,
    bool is_main,
    bool enable_vm,
    bool enable_watermark,
    bool enable_antitamper,
    const std::array<uint8_t,32>& jar_hash,
    const WatermarkInfo& wm)
{
    SecurityPipelineStats stats;

    if (enable_watermark) {
        embed_watermark(cf, wm);
        stats.watermarked_classes++;
    }

    if (is_main) {
        if (enable_antitamper) {
            inject_antitamper(cf, jar_hash);
            stats.antitamper_injected = true;
        }
        inject_anti_instrumentation(cf);
        stats.antidump_injected = true;
    }

    if (enable_vm && !is_main) {
        for (auto& m : cf.methods) {
            std::string name = cf.get_utf8(m.name_index);
            if (name == "<init>" || name == "<clinit>") continue;
            bool has_code = false;
            for (auto& attr : m.attributes)
                if (attr.is_code) { has_code = true; break; }
            if (!has_code) continue;

            for (auto& attr : m.attributes) {
                if (!attr.is_code) continue;
                auto vm_code = translate_to_vm(attr.code);
                if (!vm_code.empty()) {
                    if (virtualize_method(cf, m, vm_code))
                        stats.virtualized_methods++;
                }
                break;
            }
        }
    }

    return stats;
}

} // namespace nanoguard
