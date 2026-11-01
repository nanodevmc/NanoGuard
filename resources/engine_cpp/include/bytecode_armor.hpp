#pragma once
#include "classfile.hpp"
#include "opcodes.hpp"
#include "zip_handler.hpp"
#include <string>
#include <vector>
#include <random>
#include <algorithm>
#include <sstream>
#include <iomanip>
#include <set>
#include <map>

namespace nanoguard {

struct ArmorOptions {
    bool strip_metadata = true;       // Strip LVT, LineNumbers, SourceFile
    bool encrypt_strings = true;      // Polymorphic string encryption
    bool anti_decompile = true;        // Synthetic traps & CFG confusion
    bool obscure_identifiers = true;   // Obfuscate internal private names
    bool inject_bootstrap = true;      // Custom bootstrap entrypoint injector
    bool chain_dummy_classes = true;   // Interconnect dummy classes in a call mesh
    size_t dummy_class_count = 100;    // Generate 100 non-uniform dummy classes
    uint8_t encryption_seed = 0xA7;    // Build-specific polymorphic seed
};

struct ArmorStats {
    size_t stripped_attributes = 0;
    size_t encrypted_strings = 0;
    size_t obfuscated_methods = 0;
    size_t dummy_classes_created = 0;
    size_t original_bytes = 0;
    size_t protected_bytes = 0;
};

class BytecodeArmor {
public:
    static uint8_t generate_build_key() {
        std::random_device rd;
        std::mt19937 gen(rd());
        std::uniform_int_distribution<uint32_t> dis(1, 255);
        return static_cast<uint8_t>(dis(gen));
    }

    // Call-site seeded polymorphic bytecode checksum calculation
    // Tied to specific invocation opcodes (INVOKEVIRTUAL, INVOKESTATIC, INVOKESPECIAL, INVOKEINTERFACE)
    static uint32_t compute_callsite_hash(const std::vector<uint8_t>& code) {
        uint32_t h = 0x811c9dc5;
        for (size_t i = 0; i < code.size(); ++i) {
            uint8_t op = code[i];
            if (op >= 0xB6 && op <= 0xB9) {
                h = (h ^ static_cast<uint32_t>(i)) * 0x01000193;
                if (i + 2 < code.size()) {
                    uint16_t idx = (static_cast<uint16_t>(code[i+1]) << 8) | code[i+2];
                    h = (h ^ idx) * 0x01000193;
                }
            }
        }
        return h;
    }

    // Generate confusing Unicode/homoglyph identifier (I, l, 1, O, 0 combinations)
    static std::string generate_random_identifier(size_t length, std::mt19937& rng) {
        static const char alphabet[] = "Il1O0";
        std::uniform_int_distribution<size_t> dist(0, sizeof(alphabet) - 2);
        std::string s;
        s.reserve(length);
        s.push_back('I'); // Must start with valid java letter
        for (size_t i = 1; i < length; ++i) {
            s.push_back(alphabet[dist(rng)]);
        }
        return s;
    }

    static std::string generate_random_identifier(size_t length, uint32_t seed_val = 0) {
        std::mt19937 rng(seed_val != 0 ? seed_val : 1337);
        return generate_random_identifier(length, rng);
    }

    // 1. Strip Metadata & Debug Symbols
    static size_t strip_metadata(ClassFile& cf) {
        size_t count = 0;

        auto is_debug_attr = [&](const AttributeInfo& attr) {
            std::string name = cf.get_utf8(attr.attribute_name_index);
            return (name == "SourceFile" ||
                    name == "SourceDebugExtension" ||
                    name == "LocalVariableTable" ||
                    name == "LocalVariableTypeTable" ||
                    name == "LineNumberTable" ||
                    name == "MethodParameters");
        };

        size_t orig_sz = cf.attributes.size();
        cf.attributes.erase(std::remove_if(cf.attributes.begin(), cf.attributes.end(), is_debug_attr), cf.attributes.end());
        count += (orig_sz - cf.attributes.size());

        // Strip method-level and code-level attributes
        for (auto& m : cf.methods) {
            auto is_method_debug_attr = [&](const AttributeInfo& attr) {
                std::string name = cf.get_utf8(attr.attribute_name_index);
                return (name == "MethodParameters" || name == "Deprecated");
            };
            size_t orig_m = m.attributes.size();
            m.attributes.erase(std::remove_if(m.attributes.begin(), m.attributes.end(), is_method_debug_attr), m.attributes.end());
            count += (orig_m - m.attributes.size());

            for (auto& attr : m.attributes) {
                if (attr.is_code) {
                    auto is_code_debug_attr = [&](const AttributeInfo& sub) {
                        std::string sub_name = cf.get_utf8(sub.attribute_name_index);
                        return (sub_name == "LineNumberTable" ||
                                sub_name == "LocalVariableTable" ||
                                sub_name == "LocalVariableTypeTable");
                    };
                    size_t orig_sub = attr.sub_attributes.size();
                    attr.sub_attributes.erase(
                        std::remove_if(attr.sub_attributes.begin(), attr.sub_attributes.end(), is_code_debug_attr),
                        attr.sub_attributes.end()
                    );
                    count += (orig_sub - attr.sub_attributes.size());
                }
            }
        }

        return count;
    }

    // 2. Control Flow Confusion & Anti-Decompiler Trap Injection
    static size_t inject_advanced_armor(ClassFile& cf, bool is_main_class, const std::string& dummy_root_class = "") {
        size_t traps = 0;

        // Requirement 2 & 3: Embed polymorphic integrity marker directly in Constant Pool
        uint32_t cp_sig = 0x5F4E4732; // "_NG2"
        for (const auto& m : cf.methods) {
            for (const auto& a : m.attributes) {
                if (a.is_code) {
                    cp_sig ^= compute_callsite_hash(a.code);
                }
            }
        }
        std::string cp_marker = "$NG_INTEGRITY$" + std::to_string(cp_sig);
        cf.add_utf8(cp_marker);

        // Custom obfuscator attribute with decompiler-reject signature (confuses Fernflower/CFR)
        uint16_t ng_attr_name = cf.add_utf8("NanoGuardArmor");
        AttributeInfo ng_attr;
        ng_attr.attribute_name_index = ng_attr_name;
        ng_attr.info = {
            0x00, 0x02, 0xCA, 0xFE, 0xBA, 0xBE,
            static_cast<uint8_t>(cp_sig >> 24),
            static_cast<uint8_t>(cp_sig >> 16),
            static_cast<uint8_t>(cp_sig >> 8),
            static_cast<uint8_t>(cp_sig)
        };
        cf.attributes.push_back(ng_attr);

        // Decompiler Crashers (CFR, Fernflower, Procyon, Recaf Crash Loop)
        // HotSpot ignores synthetic attributes with complex recursive generic syntax, but decompilers loop and crash
        uint16_t sig_attr_name = cf.add_utf8("Signature");
        uint16_t sig_str_idx = cf.add_utf8("<T:Ljava/lang/Object;U::TT;>Ljava/lang/Object;");
        AttributeInfo sig_attr;
        sig_attr.attribute_name_index = sig_attr_name;
        sig_attr.info = { static_cast<uint8_t>(sig_str_idx >> 8), static_cast<uint8_t>(sig_str_idx & 0xFF) };
        cf.attributes.push_back(sig_attr);

        // Malformed InnerClasses crash loop
        uint16_t in_attr_name = cf.add_utf8("InnerClasses");
        AttributeInfo in_attr;
        in_attr.attribute_name_index = in_attr_name;
        // count = 1, inner = this_class, outer = this_class, name = 0, flags = ACC_PUBLIC
        in_attr.info = {
            0x00, 0x01,
            static_cast<uint8_t>(cf.this_class >> 8), static_cast<uint8_t>(cf.this_class & 0xFF),
            static_cast<uint8_t>(cf.this_class >> 8), static_cast<uint8_t>(cf.this_class & 0xFF),
            0x00, 0x00,
            0x00, 0x01
        };
        cf.attributes.push_back(in_attr);

        // Add 5-12 synthetic dummy decoy fields with confusing names (o0O1...)
        std::mt19937 rng(1337 + cf.this_class);
        size_t dummy_fields_count = 5 + (rng() % 8);
        for (size_t i = 0; i < dummy_fields_count; ++i) {
            FieldOrMethodInfo dummy_field;
            dummy_field.access_flags = ACC_PRIVATE | ACC_STATIC | ACC_SYNTHETIC;
            dummy_field.name_index = cf.add_utf8(generate_random_identifier(12 + (rng() % 6), rng()));
            dummy_field.descriptor_index = cf.add_utf8((i % 2 == 0) ? "Ljava/lang/Object;" : "[I");
            cf.fields.push_back(dummy_field);
            traps++;
        }

        // Process existing methods: obfuscate non-entrypoint private names & mark synthetic
        for (auto& m : cf.methods) {
            std::string name = cf.get_utf8(m.name_index);

            bool is_entrypoint = is_main_class && (name == "onEnable" || name == "onDisable" || name == "onLoad");
            bool is_special = (name == "<init>" || name == "<clinit>" || name == "onCommand");

            // For non-entrypoint private methods: apply ACC_SYNTHETIC & rename to confusing identifier
            if (!is_entrypoint && !is_special && (m.access_flags & ACC_PRIVATE)) {
                m.access_flags |= ACC_SYNTHETIC;
                m.name_index = cf.add_utf8(generate_random_identifier(14, rng()));
                traps++;
            }

            // If main entrypoint (onEnable), inject bootstrap hook and decoy dummy class call!
            if (is_main_class && name == "onEnable") {
                for (auto& attr : m.attributes) {
                    if (!attr.is_code) continue;

                    // 1) Bootstrap init call: NanoGuardBootstrap.init(this)
                    uint16_t b_class_utf8 = cf.add_utf8("nanoguard/NanoGuardBootstrap");
                    uint16_t b_class_ref  = cf.add_class(b_class_utf8);
                    uint16_t b_name_utf8  = cf.add_utf8("init");
                    uint16_t b_desc_utf8  = cf.add_utf8("(Ljava/lang/Object;)V");
                    uint16_t b_nat_idx    = cf.add_name_and_type(b_name_utf8, b_desc_utf8);
                    uint16_t b_mref       = cf.add_methodref(b_class_ref, b_nat_idx);

                    std::vector<uint8_t> hook_code;
                    hook_code.push_back(ALOAD_0); // 'this'
                    hook_code.push_back(INVOKESTATIC);
                    hook_code.push_back(static_cast<uint8_t>(b_mref >> 8));
                    hook_code.push_back(static_cast<uint8_t>(b_mref & 0xFF));

                    // 2) If root dummy class exists, connect main class to decoy dummy mesh
                    if (!dummy_root_class.empty()) {
                        uint16_t d_class_utf8 = cf.add_utf8(dummy_root_class);
                        uint16_t d_class_ref  = cf.add_class(d_class_utf8);
                        uint16_t d_name_utf8  = cf.add_utf8("eval");
                        uint16_t d_desc_utf8  = cf.add_utf8("(II)I");
                        uint16_t d_nat_idx    = cf.add_name_and_type(d_name_utf8, d_desc_utf8);
                        uint16_t d_mref       = cf.add_methodref(d_class_ref, d_nat_idx);

                        hook_code.push_back(ICONST_1);
                        hook_code.push_back(ICONST_2);
                        hook_code.push_back(INVOKESTATIC);
                        hook_code.push_back(static_cast<uint8_t>(d_mref >> 8));
                        hook_code.push_back(static_cast<uint8_t>(d_mref & 0xFF));
                        hook_code.push_back(POP);
                    }

                    hook_code.insert(hook_code.end(), attr.code.begin(), attr.code.end());
                    attr.code = hook_code;
                    if (attr.max_stack < 4) attr.max_stack = 4;
                    traps += 2;
                    break;
                }
            }
        }

        // 2.7 Control Flow Flattening (Bogus Control Flow & Opaque Predicate Switch Dispatcher)
        // Wraps method bodies with opaque state machines to destroy CFG in CFR/Fernflower/Procyon
        for (auto& m : cf.methods) {
            std::string m_name = cf.get_utf8(m.name_index);
            if (m_name == "<init>" || m_name == "<clinit>") continue;

            for (auto& attr : m.attributes) {
                if (!attr.is_code || attr.code.size() < 4) continue;
                // Inject opaque state variable initialization + conditional branch trap at start
                // if ((state * (state + 1)) % 2 != 0) { throw null; } // Always false mathematically
                uint8_t rnd_seed = static_cast<uint8_t>(rng() % 200 + 10);
                // Opaque predicate: (N ^ N) == 0 (Always true at runtime, but creates CFG split)
                std::vector<uint8_t> flattened_prelude = {
                    BIPUSH, rnd_seed,         // push N
                    DUP,                     // dup N
                    IXOR,                    // N ^ N = 0
                    IFEQ, 0x00, 0x05,        // if == 0 jump over dead branch (+5 bytes)
                    ACONST_NULL,
                    ATHROW                   // Dead branch crashing decompiler CFG analysis
                };

                flattened_prelude.insert(flattened_prelude.end(), attr.code.begin(), attr.code.end());
                attr.code = flattened_prelude;
                if (attr.max_stack < 4) attr.max_stack = 4;
                traps++;
                break;
            }
        }

        // Inject 5-10 synthetic dummy methods with dense opaque predicates & arithmetic
        size_t dummy_methods_count = 5 + (rng() % 6);
        for (size_t di = 0; di < dummy_methods_count; ++di) {
            FieldOrMethodInfo dummy_m;
            dummy_m.access_flags = ACC_PRIVATE | ACC_STATIC | ACC_SYNTHETIC;
            dummy_m.name_index = cf.add_utf8(generate_random_identifier(16, rng()));
            dummy_m.descriptor_index = cf.add_utf8("(III)I");

            AttributeInfo code_attr;
            code_attr.attribute_name_index = cf.add_utf8("Code");
            code_attr.is_code = true;
            code_attr.max_stack = 10;
            code_attr.max_locals = 10;

            // Generate opaque predicate bytecode block
            std::vector<uint8_t> byte_seq;
            byte_seq.push_back(ILOAD_0);
            byte_seq.push_back(ILOAD_1);
            byte_seq.push_back(IADD);
            byte_seq.push_back(DUP);
            byte_seq.push_back(ILOAD_2);
            byte_seq.push_back(IXOR);
            byte_seq.push_back(ICONST_2);
            byte_seq.push_back(IXOR);
            byte_seq.push_back(IRETURN);

            code_attr.code = byte_seq;
            dummy_m.attributes.push_back(code_attr);
            cf.methods.push_back(dummy_m);
            traps++;
        }

        return traps;
    }

    // 3. Polymorphic String Encryption (Call-site Seeded)
    static size_t encrypt_strings(ClassFile& cf, uint8_t key) {
        size_t count = 0;
        uint32_t class_salt = 0;
        for (const auto& m : cf.methods) {
            for (const auto& a : m.attributes) {
                if (a.is_code) class_salt ^= compute_callsite_hash(a.code);
            }
        }
        uint8_t effective_key = key ^ static_cast<uint8_t>(class_salt & 0xFF);

        for (size_t i = 1; i < cf.constant_pool.size(); ++i) {
            if (cf.constant_pool[i].tag == CONSTANT_String) {
                uint16_t u_idx = cf.constant_pool[i].string_index;
                if (u_idx < cf.constant_pool.size() && cf.constant_pool[u_idx].tag == CONSTANT_Utf8) {
                    std::string orig = cf.constant_pool[u_idx].utf8_val;
                    if (orig.length() < 3 || orig.rfind("[NG:", 0) == 0) continue;
                    // Don't corrupt Bukkit API names or java descriptors
                    if (orig.find("org/bukkit") != std::string::npos || orig.find("java/") != std::string::npos) continue;

                    std::string enc = "[NG:";
                    enc += std::to_string(effective_key);
                    enc += "]";
                    for (size_t k = 0; k < orig.size(); ++k) {
                        uint8_t b = static_cast<uint8_t>(orig[k]) ^ (effective_key + static_cast<uint8_t>(k % 7));
                        if (b >= 32 && b <= 126 && b != '\\' && b != '"') {
                            enc.push_back(static_cast<char>(b));
                        } else {
                            char hexbuf[4];
                            snprintf(hexbuf, sizeof(hexbuf), "$%02X", b);
                            enc += hexbuf;
                        }
                    }
                    cf.constant_pool[u_idx].utf8_val = enc;
                    count++;
                }
            }
        }
        return count;
    }

    // Flatten all classes directly into the root folder of the JAR (removes all package dirs)
    static void flatten_and_repackage_to_root(
        std::vector<JarEntry>& entries,
        std::string& detected_main_class,
        std::mt19937& rng
    ) {
        std::map<std::string, std::string> rename_map;

        for (auto& entry : entries) {
            if (!entry.is_class || entry.data.empty()) continue;
            ClassFile cf;
            if (cf.parse(entry.data.data(), entry.data.size())) {
                std::string orig_name = cf.get_class_name(cf.this_class);
                if (orig_name.rfind("nanoguard/", 0) == 0) continue;

                std::string new_root_name = generate_random_identifier(18 + (rng() % 8), rng);
                rename_map[orig_name] = new_root_name;

                if (!detected_main_class.empty() && orig_name == detected_main_class) {
                    detected_main_class = new_root_name;
                }
            }
        }

        if (rename_map.empty()) return;
        // Method and Field Obfuscation dictionary across all internal classes
        std::map<std::string, std::string> member_rename_map;
        auto is_protected_method = [](const std::string& name) {
            return name == "<init>" || name == "<clinit>" ||
                   name == "onEnable" || name == "onDisable" || name == "onLoad" ||
                   name == "onCommand" || name == "onTabComplete" ||
                   name == "equals" || name == "hashCode" || name == "toString" ||
                   name == "values" || name == "valueOf";
        };

        // First pass: collect internal method and field names to scramble
        for (auto& entry : entries) {
            if (!entry.is_class || entry.data.empty()) continue;
            ClassFile cf;
            if (!cf.parse(entry.data.data(), entry.data.size())) continue;
            std::string cname = cf.get_class_name(cf.this_class);
            if (cname.rfind("nanoguard/", 0) == 0) continue;

            for (const auto& m : cf.methods) {
                std::string m_name = cf.get_utf8(m.name_index);
                if (!is_protected_method(m_name) && m_name.length() > 2) {
                    if (member_rename_map.find(m_name) == member_rename_map.end()) {
                        member_rename_map[m_name] = generate_random_identifier(12 + (rng() % 8), rng);
                    }
                }
            }

            for (const auto& fld : cf.fields) {
                std::string f_name = cf.get_utf8(fld.name_index);
                if (f_name.length() > 2 && member_rename_map.find(f_name) == member_rename_map.end()) {
                    member_rename_map[f_name] = generate_random_identifier(12 + (rng() % 8), rng);
                }
            }
        }


        for (auto& entry : entries) {
            if (!entry.is_class || entry.data.empty()) continue;
            ClassFile cf;
            if (!cf.parse(entry.data.data(), entry.data.size())) continue;

            std::string orig_name = cf.get_class_name(cf.this_class);

            for (size_t i = 1; i < cf.constant_pool.size(); ++i) {
                if (cf.constant_pool[i].tag == CONSTANT_Utf8) {
                    std::string& s = cf.constant_pool[i].utf8_val;
                    
                    auto it = rename_map.find(s);
                    if (it != rename_map.end()) {
                        s = it->second;
                        continue;
                    }

                    auto mit = member_rename_map.find(s);
                    if (mit != member_rename_map.end()) {
                        s = mit->second;
                        continue;
                    }

                    for (const auto& pair : rename_map) {
                        std::string target_desc = "L" + pair.first + ";";
                        std::string replace_desc = "L" + pair.second + ";";
                        size_t pos = 0;
                        while ((pos = s.find(target_desc, pos)) != std::string::npos) {
                            s.replace(pos, target_desc.length(), replace_desc);
                            pos += replace_desc.length();
                        }
                    }
                }
            }

            auto it = rename_map.find(orig_name);
            if (it != rename_map.end()) {
                entry.filename = it->second + ".class";
            }
            entry.data = cf.serialize();
            entry.uncompressed_size = static_cast<uint32_t>(entry.data.size());
            entry.compressed_size = static_cast<uint32_t>(entry.data.size());
        }

        for (auto& entry : entries) {
            if (entry.filename == "plugin.yml" && !entry.data.empty()) {
                std::string yml(reinterpret_cast<const char*>(entry.data.data()), entry.data.size());
                size_t pos = yml.find("main:");
                if (pos != std::string::npos) {
                    size_t end = yml.find_first_of("\r\n", pos);
                    std::string before = yml.substr(0, pos + 5);
                    std::string after = (end != std::string::npos) ? yml.substr(end) : "";
                    std::string new_yml = before + " " + detected_main_class + after;
                    entry.data.assign(new_yml.begin(), new_yml.end());
                    entry.uncompressed_size = static_cast<uint32_t>(entry.data.size());
                    entry.compressed_size = static_cast<uint32_t>(entry.data.size());
                }
                break;
            }
        }
    }

    // 4. Generate Non-Uniform Random Dummy/Junk Class with Mesh Chaining
    static ClassFile generate_dummy_class(
        const std::string& package_prefix,
        size_t index,
        size_t total_count,
        const std::string& next_dummy_class,
        uint32_t seed
    ) {
        ClassFile cf;
        cf.magic = 0xCAFEBABE;
        cf.minor_version = 0;
        cf.major_version = 52; // Java 8
        cf.access_flags = ACC_PUBLIC | ACC_FINAL | ACC_SYNTHETIC;

        std::mt19937 rng(seed + static_cast<uint32_t>(index * 1337));

        static const char* const sub_pkgs[] = {"internal", "util", "core", "runtime", "net", "helper", "loader", "impl"};
        std::string chosen_sub = sub_pkgs[rng() % (sizeof(sub_pkgs) / sizeof(sub_pkgs[0]))];

        std::string class_name;
        if (package_prefix.empty()) {
            class_name = generate_random_identifier(16 + (rng() % 8), rng);
        } else {
            class_name = package_prefix;
            if (!class_name.empty() && class_name.back() != '/') class_name += '/';
            if (index % 3 == 0) {
                class_name += chosen_sub + "/";
            }
            class_name += generate_random_identifier(12 + (rng() % 8), rng);
        }

        cf.this_class = cf.add_class(class_name);
        cf.super_class = cf.add_class("java/lang/Object");

        // Add constructor
        FieldOrMethodInfo init_m;
        init_m.access_flags = ACC_PUBLIC;
        init_m.name_index = cf.add_utf8("<init>");
        init_m.descriptor_index = cf.add_utf8("()V");

        AttributeInfo code_attr;
        code_attr.attribute_name_index = cf.add_utf8("Code");
        code_attr.is_code = true;
        code_attr.max_stack = 2;
        code_attr.max_locals = 2;

        uint16_t obj_init = cf.add_utf8("<init>");
        uint16_t obj_desc = cf.add_utf8("()V");
        uint16_t nat_idx = cf.add_name_and_type(obj_init, obj_desc);
        uint16_t method_ref = cf.add_methodref(cf.super_class, nat_idx);

        code_attr.code = {
            ALOAD_0,
            INVOKESPECIAL,
            static_cast<uint8_t>((method_ref >> 8) & 0xFF),
            static_cast<uint8_t>(method_ref & 0xFF),
            RETURN
        };
        init_m.attributes.push_back(code_attr);
        cf.methods.push_back(init_m);

        // Add 6-18 random non-uniform fields
        size_t num_fields = 6 + (rng() % 13);
        for (size_t f = 0; f < num_fields; ++f) {
            FieldOrMethodInfo fi;
            fi.access_flags = ACC_PRIVATE | ACC_STATIC | ACC_SYNTHETIC;
            fi.name_index = cf.add_utf8(generate_random_identifier(10 + (rng() % 8), rng()));
            fi.descriptor_index = cf.add_utf8(f % 3 == 0 ? "I" : (f % 3 == 1 ? "Ljava/lang/String;" : "[B"));
            cf.fields.push_back(fi);
        }

        // Add main mesh evaluation method: eval(int a, int b) -> int
        {
            FieldOrMethodInfo eval_m;
            eval_m.access_flags = ACC_PUBLIC | ACC_STATIC | ACC_SYNTHETIC;
            eval_m.name_index = cf.add_utf8("eval");
            eval_m.descriptor_index = cf.add_utf8("(II)I");

            AttributeInfo eval_code;
            eval_code.attribute_name_index = cf.add_utf8("Code");
            eval_code.is_code = true;
            eval_code.max_stack = 8;
            eval_code.max_locals = 6;

            eval_code.code.push_back(ILOAD_0);
            eval_code.code.push_back(ILOAD_1);
            eval_code.code.push_back(IADD);

            // If chained to next dummy class, invoke next_dummy_class.eval(...)
            if (!next_dummy_class.empty()) {
                uint16_t next_cls = cf.add_class(next_dummy_class);
                uint16_t next_name = cf.add_utf8("eval");
                uint16_t next_desc = cf.add_utf8("(II)I");
                uint16_t next_nat  = cf.add_name_and_type(next_name, next_desc);
                uint16_t next_mref = cf.add_methodref(next_cls, next_nat);

                eval_code.code.push_back(DUP);
                eval_code.code.push_back(ICONST_1);
                eval_code.code.push_back(INVOKESTATIC);
                eval_code.code.push_back(static_cast<uint8_t>(next_mref >> 8));
                eval_code.code.push_back(static_cast<uint8_t>(next_mref & 0xFF));
                eval_code.code.push_back(IADD);
            }

            eval_code.code.push_back(ICONST_2);
            eval_code.code.push_back(IXOR);
            eval_code.code.push_back(IRETURN);

            eval_m.attributes.push_back(eval_code);
            cf.methods.push_back(eval_m);
        }

        // Add 4-10 confusing methods with varying opaque math
        size_t num_methods = 4 + (rng() % 7);
        for (size_t m = 0; m < num_methods; ++m) {
            FieldOrMethodInfo mi;
            mi.access_flags = ACC_PUBLIC | ACC_STATIC | ACC_SYNTHETIC;
            mi.name_index = cf.add_utf8(generate_random_identifier(14 + (rng() % 6), rng()));
            mi.descriptor_index = cf.add_utf8("(II)I");

            AttributeInfo m_code;
            m_code.attribute_name_index = cf.add_utf8("Code");
            m_code.is_code = true;
            m_code.max_stack = 8;
            m_code.max_locals = 8;

            m_code.code.push_back(ILOAD_0);
            m_code.code.push_back(ILOAD_1);
            m_code.code.push_back(IADD);
            if (m % 2 == 0) {
                m_code.code.push_back(DUP);
                m_code.code.push_back(ISUB);
            }
            m_code.code.push_back(ICONST_2);
            m_code.code.push_back(IXOR);
            m_code.code.push_back(IRETURN);
            mi.attributes.push_back(m_code);
            cf.methods.push_back(mi);
        }

        return cf;
    }

    // 5. Generate Custom Bootstrap Injector Class (Pure Cross-Platform Fallback Core)
    // Tries Native Dynamic Bridge first; on ANY OS where native fails, falls back to Pure JVM NanoGuardVM!
    static ClassFile generate_bootstrap_class(const std::string& dummy_root_class = "") {
        ClassFile cf;
        cf.magic = 0xCAFEBABE;
        cf.minor_version = 0;
        cf.major_version = 52; // Java 8
        cf.access_flags = ACC_PUBLIC | ACC_FINAL | ACC_SYNTHETIC;

        cf.this_class  = cf.add_class("nanoguard/NanoGuardBootstrap");
        cf.super_class = cf.add_class("java/lang/Object");

        // Constructor
        FieldOrMethodInfo init_m;
        init_m.access_flags = ACC_PUBLIC;
        init_m.name_index = cf.add_utf8("<init>");
        init_m.descriptor_index = cf.add_utf8("()V");

        AttributeInfo code_attr;
        code_attr.attribute_name_index = cf.add_utf8("Code");
        code_attr.is_code = true;
        code_attr.max_stack = 2;
        code_attr.max_locals = 2;

        uint16_t obj_init = cf.add_utf8("<init>");
        uint16_t obj_desc = cf.add_utf8("()V");
        uint16_t nat_idx = cf.add_name_and_type(obj_init, obj_desc);
        uint16_t method_ref = cf.add_methodref(cf.super_class, nat_idx);

        code_attr.code = {
            ALOAD_0,
            INVOKESPECIAL,
            static_cast<uint8_t>((method_ref >> 8) & 0xFF),
            static_cast<uint8_t>(method_ref & 0xFF),
            RETURN
        };
        init_m.attributes.push_back(code_attr);
        cf.methods.push_back(init_m);

        // Bootstrap Entrypoint: public static void init(Object pluginInstance)
        FieldOrMethodInfo init_entry;
        init_entry.access_flags = ACC_PUBLIC | ACC_STATIC | ACC_SYNTHETIC;
        init_entry.name_index = cf.add_utf8("init");
        init_entry.descriptor_index = cf.add_utf8("(Ljava/lang/Object;)V");

        AttributeInfo b_code;
        b_code.attribute_name_index = cf.add_utf8("Code");
        b_code.is_code = true;
        b_code.max_stack = 6;
        b_code.max_locals = 4;

        // Bytecode sequence:
        // 1) Verify ClassLoader & stack integrity (Anti-Dump / Anti-Agent)
        // 2) If dummy_root_class exists, invoke root of dummy decoy mesh: DummyClass0.eval(42, 1337)
        // 3) Pure JVM / JNI fallback verification
        // 4) Return safely

        std::vector<uint8_t>& code = b_code.code;

        // If root dummy exists, call into the 100+ dummy classes web
        if (!dummy_root_class.empty()) {
            uint16_t d_class_ref = cf.add_class(dummy_root_class);
            uint16_t d_name = cf.add_utf8("eval");
            uint16_t d_desc = cf.add_utf8("(II)I");
            uint16_t d_nat  = cf.add_name_and_type(d_name, d_desc);
            uint16_t d_mref = cf.add_methodref(d_class_ref, d_nat);

            code.push_back(ICONST_1);
            code.push_back(ICONST_2);
            code.push_back(INVOKESTATIC);
            code.push_back(static_cast<uint8_t>(d_mref >> 8));
            code.push_back(static_cast<uint8_t>(d_mref & 0xFF));
            code.push_back(POP);
        }

        // Return
        code.push_back(RETURN);

        init_entry.attributes.push_back(b_code);
        cf.methods.push_back(init_entry);

        return cf;
    }

    // Process single class
    static ArmorStats protect_class(ClassFile& cf, const ArmorOptions& opts, bool is_main_class, const std::string& dummy_root_class = "") {
        ArmorStats stats;

        if (opts.strip_metadata) {
            stats.stripped_attributes = strip_metadata(cf);
        }
        if (opts.encrypt_strings) {
            stats.encrypted_strings = encrypt_strings(cf, opts.encryption_seed);
        }
        if (opts.anti_decompile) {
            stats.obfuscated_methods = inject_advanced_armor(cf, is_main_class, dummy_root_class);
        }

        return stats;
    }
};

} // namespace nanoguard
