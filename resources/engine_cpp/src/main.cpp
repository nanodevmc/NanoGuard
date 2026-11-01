#include "../include/classfile.hpp"
#include "../include/backdoor_hunter.hpp"
#include "../include/bytecode_armor.hpp"
#include "../include/zip_handler.hpp"
#include "../include/security_pipeline.hpp"
#include "../include/encrypted_loader.hpp"
#include "../include/native_bridge.hpp"
#include "../include/jvm_transpiler.hpp"
#include "../include/native_loader_bytes.hpp"
#include "../include/nanoguard_bridge_template.hpp"
#include "../include/nanoguard_bridge_so_template.hpp"
#include <set>
#include <ctime>
#include <sstream>

#include <iostream>
#include <fstream>
#include <string>
#include <vector>
#include <chrono>

using namespace nanoguard;

void print_banner() {
    std::cout << R"(
  _   _                      ____                     _ 
 | \ | | __ _ _ __   ___    / ___|_   _  __ _ _ __ __| |
 |  \| |/ _` | '_ \ / _ \  | |  _| | | |/ _` | '__/ _` |
 | |\  | (_| | | | | (_) | | |_| | |_| | (_| | | | (_| |
 |_| \_|\__,_|_| |_|\___/   \____|\__,_|\__,_|_|  \__,_|
   ɴᴀᴛɪᴠᴇ ʙʏᴛᴇᴄᴏᴅᴇ ᴀʀᴍᴏʀ & ʙᴀᴄᴋᴅᴏᴏʀ ʜᴜɴᴛᴇʀ (v0.1.2)
)" << "\n";
}

void print_help() {
    print_banner();
    std::cout << "Usage:\n";
    std::cout << "  nanoguard.exe --audit <plugin.jar> [--out <report.json>]\n";
    std::cout << "  nanoguard.exe --protect <plugin.jar> [options] [--out <output.jar>]\n\n";
    std::cout << "Protection Options:\n";
    std::cout << "  --strip-lvt          Strip debug symbols & local variable tables\n";
    std::cout << "  --encrypt-strings    Encrypt string literals with callsite-seeded polymorphic XOR\n";
    std::cout << "  --anti-decompile     Inject control flow traps, opaque predicates & synthetic bridges\n";
    std::cout << "  --vm                 Enable bytecode virtualization (Custom VM ISA)\n";
    std::cout << "  --antitamper         Inject SHA-256 integrity check and Anti-Dump hooks\n";
    std::cout << "  --encrypt-classes    Encrypt class files with dynamic runtime loader\n";
    std::cout << "  --owner <name>       Embed digital watermark & build ID into constant pool\n";
    std::cout << "  --help               Display this help message\n";
    std::cout << "  --version            Display version info\n\n";
}

std::string escape_json(const std::string& str) {
    std::string res;
    for (char c : str) {
        if (c == '"') res += "\\\"";
        else if (c == '\\') res += "\\\\";
        else if (c == '\b') res += "\\b";
        else if (c == '\f') res += "\\f";
        else if (c == '\n') res += "\\n";
        else if (c == '\r') res += "\\r";
        else if (c == '\t') res += "\\t";
        else res += c;
    }
    return res;
}

int main(int argc, char* argv[]) {
    if (argc < 2) {
        print_help();
        return 0;
    }

    std::string mode = "";
    std::string input_jar = "";
    std::string output_path = "";
    bool strip_lvt = false;
    bool encrypt_strings = false;
    bool anti_decompile = false;
    bool enable_vm = false;
    bool enable_antitamper = false;
    bool enable_encrypt_classes = false;
    bool flatten_root = false;
    bool enable_native_dll = false;
    std::string owner_name = "";

    for (int i = 1; i < argc; ++i) {
        std::string arg = argv[i];
        if (arg == "--help" || arg == "-h") {
            print_help();
            return 0;
        } else if (arg == "--version" || arg == "-v") {
            std::cout << "NanoGuard v0.1.2 (Native C++17 Core Engine)\n";
            std::cout << "Author: NanoDev (t.me/WineSquad)\n";
            return 0;
        } else if (arg == "--audit" && i + 1 < argc) {
            mode = "audit";
            input_jar = argv[++i];
        } else if (arg == "--protect" && i + 1 < argc) {
            mode = "protect";
            input_jar = argv[++i];
        } else if (arg == "--out" && i + 1 < argc) {
            output_path = argv[++i];
        } else if (arg == "--strip-lvt") {
            strip_lvt = true;
        } else if (arg == "--encrypt-strings") {
            encrypt_strings = true;
        } else if (arg == "--anti-decompile") {
            anti_decompile = true;
        } else if (arg == "--vm") {
            enable_vm = true;
        } else if (arg == "--antitamper") {
            enable_antitamper = true;
        } else if (arg == "--encrypt-classes") {
            enable_encrypt_classes = true;
        } else if (arg == "--owner" && i + 1 < argc) {
            owner_name = argv[++i];
        } else if (arg == "--flatten-root") {
            flatten_root = true;
        } else if (arg == "--native-dll") {
            enable_native_dll = true;
        }
    }

    if (mode.empty()) {
        std::cerr << "[!] Error: Specify either --audit or --protect mode.\n";
        return 1;
    }

    // Read input JAR
    std::vector<uint8_t> jar_bytes;
    if (!JarArchive::read_file(input_jar, jar_bytes)) {
        std::cerr << "[!] Error: Failed to open JAR file: " << input_jar << "\n";
        return 1;
    }

    std::vector<JarEntry> entries;
    if (!JarArchive::parse_entries(jar_bytes, entries)) {
        std::cerr << "[!] Error: Failed to parse ZIP structure from: " << input_jar << "\n";
        return 1;
    }

    if (mode == "audit") {
        auto start_t = std::chrono::high_resolution_clock::now();
        std::vector<HunterFinding> all_findings;
        std::string detected_obf = "None / Standard Javac";
        size_t class_count = 0;

        size_t hidden_blobs = 0;
        for (const auto& entry : entries) {
            if (!entry.is_class) {
                // Check fake NANOGUARD.INF markers
                if (entry.filename == "NANOGUARD.INF" || entry.filename == "META-INF/NANOGUARD.INF" || entry.filename.find("NANOGUARD.INF") != std::string::npos) {
                    std::string content(reinterpret_cast<const char*>(entry.data.data()), entry.data.size());
                    if (content.find("AEGIS") != std::string::npos || content.find("DECOMPILER_REJECT") != std::string::npos) {
                        HunterFinding f;
                        f.category = "Defense Evasion / Spoofed NanoGuard Marker";
                        f.severity = "CRITICAL";
                        f.class_name = entry.filename;
                        f.method_name = "<archive_entry>";
                        f.description = "Обнаружен поддельный маркер 'NANOGUARD.INF' со строками AEGIS, маскирующий вредоносный плагин под защиту NanoGuard.";
                        f.snippet = content.substr(0, std::min<size_t>(content.size(), 80));
                        all_findings.push_back(f);
                    }
                }

                // Check hidden payload blobs (.aeg, .enc, .bin in aegis/blobs)
                if (entry.filename.find(".aeg") != std::string::npos ||
                    entry.filename.find("aegis/blobs/") != std::string::npos) {
                    hidden_blobs++;
                }
                continue;
            }

            class_count++;

            ClassFile cf;
            if (cf.parse(entry.data.data(), entry.data.size())) {
                std::string obf = BackdoorHunter::detect_obfuscator(cf);
                if (obf != "None / Standard Javac") {
                    detected_obf = obf;
                }

                auto findings = BackdoorHunter::scan_class(cf);
                all_findings.insert(all_findings.end(), findings.begin(), findings.end());
            }
        }

        if (hidden_blobs > 0) {
            HunterFinding f;
            f.category = "Hidden Encrypted Dropper Blobs";
            f.severity = "CRITICAL";
            f.class_name = "aegis/blobs/*.aeg";
            f.method_name = "<archive_blobs>";
            f.description = "Обнаружены скрытые зашифрованные полезные нагрузки (" + std::to_string(hidden_blobs) + " шт. .aeg блобов), распаковываемые в рантайме в обход статического анализа.";
            f.snippet = "Blobs count: " + std::to_string(hidden_blobs);
            all_findings.push_back(f);
        }

        auto end_t = std::chrono::high_resolution_clock::now();
        double elapsed_ms = std::chrono::duration<double, std::milli>(end_t - start_t).count();

        // Calculate threat score (deduplicated per category to avoid false-positive inflation on benign plugins)
        int danger_score = 0;
        bool has_critical = false;
        bool has_high = false;
        int medium_count = 0;
        for (const auto& f : all_findings) {
            if (f.severity == "CRITICAL") has_critical = true;
            else if (f.severity == "HIGH") has_high = true;
            else if (f.severity == "MEDIUM") medium_count++;
        }
        if (has_critical) danger_score += 65;
        if (has_high) danger_score += 30;
        if (!has_critical && !has_high) {
            // Only benign/medium reflection calls present, cap threat score at 15 (CLEAN)
            danger_score = std::min(15, medium_count * 2);
        } else {
            danger_score += std::min(15, medium_count * 2);
        }
        if (danger_score > 100) danger_score = 100;

        print_banner();
        std::cout << "[+] Target JAR: " << input_jar << "\n";
        std::cout << "[+] Scanned Classes: " << class_count << " classes in " << elapsed_ms << " ms\n";
        std::cout << "[+] Obfuscation: " << detected_obf << "\n";
        std::cout << "[+] Threat Level: " << danger_score << "/100 ("
                  << (danger_score >= 60 ? "DANGEROUS" : (danger_score >= 20 ? "SUSPICIOUS" : "CLEAN")) << ")\n";
        std::cout << "[+] Total Findings: " << all_findings.size() << "\n\n";

        for (const auto& f : all_findings) {
            std::cout << "  [" << f.severity << "] " << f.category << "\n";
            std::cout << "    Class: " << f.class_name << "\n";
            std::cout << "    Method: " << f.method_name << "\n";
            std::cout << "    Instruction: " << f.instruction_hex << "\n";
            std::cout << "    Description: " << f.description << "\n";
            if (!f.snippet.empty()) {
                std::cout << "    Snippet:\n" << f.snippet << "\n";
            }
            std::cout << "  --------------------------------------------------\n";
        }

        if (!output_path.empty()) {
            std::ofstream jf(output_path);
            jf << "{\n";
            jf << "  \"target\": \"" << escape_json(input_jar) << "\",\n";
            jf << "  \"total_classes\": " << class_count << ",\n";
            jf << "  \"obfuscator\": \"" << escape_json(detected_obf) << "\",\n";
            jf << "  \"danger_score\": " << danger_score << ",\n";
            jf << "  \"findings_count\": " << all_findings.size() << ",\n";
            jf << "  \"findings\": [\n";
            for (size_t i = 0; i < all_findings.size(); ++i) {
                const auto& f = all_findings[i];
                jf << "    {\n";
                jf << "      \"category\": \"" << escape_json(f.category) << "\",\n";
                jf << "      \"severity\": \"" << escape_json(f.severity) << "\",\n";
                jf << "      \"class\": \"" << escape_json(f.class_name) << "\",\n";
                jf << "      \"method\": \"" << escape_json(f.method_name) << "\",\n";
                jf << "      \"offset\": " << f.offset << ",\n";
                jf << "      \"instruction\": \"" << escape_json(f.instruction_hex) << "\",\n";
                jf << "      \"description\": \"" << escape_json(f.description) << "\"\n";
                jf << "    }" << (i + 1 < all_findings.size() ? "," : "") << "\n";
            }
            jf << "  ]\n";
            jf << "}\n";
            std::cout << "[+] Saved JSON audit report to: " << output_path << "\n";
        }

    } else if (mode == "protect") {
        print_banner();
        std::cout << "[*] Running Bytecode Armor Protection Pipeline...\n";

        ArmorOptions opts;
        opts.strip_metadata = strip_lvt;
        opts.encrypt_strings = encrypt_strings;
        opts.anti_decompile = anti_decompile;
        opts.encryption_seed = BytecodeArmor::generate_build_key();

        ArmorStats total_stats;
        size_t processed_classes = 0;
        std::string detected_main_class = "";
        std::string package_prefix = "";

        for (const auto& entry : entries) {
            if (entry.filename == "plugin.yml" && !entry.data.empty()) {
                std::string yml(reinterpret_cast<const char*>(entry.data.data()), entry.data.size());
                size_t pos = yml.find("main:");
                if (pos != std::string::npos) {
                    size_t end = yml.find_first_of("\r\n", pos);
                    std::string line = yml.substr(pos + 5, end - (pos + 5));
                    line.erase(0, line.find_first_not_of(" \t'\""));
                    line.erase(line.find_last_not_of(" \t'\"") + 1);
                    std::replace(line.begin(), line.end(), '.', '/');
                    detected_main_class = line;
                }
                break;
            }
        }

        // Pre-discover package prefix
        for (const auto& entry : entries) {
            if (!entry.is_class || entry.data.empty()) continue;
            ClassFile cf;
            if (cf.parse(entry.data.data(), entry.data.size())) {
                std::string cn = cf.get_class_name(cf.this_class);
                size_t slash = cn.find_last_of('/');
                if (slash != std::string::npos) {
                    package_prefix = cn.substr(0, slash);
                    break;
                }
            }
        }

        std::mt19937 rng(1337 + static_cast<uint32_t>(opts.encryption_seed));

        // Package Flattening: move all classes directly into the root folder of the JAR
        if (flatten_root) {
            std::cout << "[*] Package Flattening: deleting package folders, relocating all classes to root...\n";
            BytecodeArmor::flatten_and_repackage_to_root(entries, detected_main_class, rng);
            package_prefix = "";
        }

        // Generate Decoy Dummy Classes mesh in root
        std::string dummy_root_class = "";
        std::vector<JarEntry> generated_dummies;
        if (opts.dummy_class_count > 0) {
            std::vector<ClassFile> dummy_files;
            dummy_files.reserve(opts.dummy_class_count);

            // First generate class names
            std::vector<std::string> dummy_names;
            for (size_t di = 0; di < opts.dummy_class_count; ++di) {
                std::string dname = package_prefix + "/internal/Decoy" + std::to_string(di) + "_" + BytecodeArmor::generate_random_identifier(8, rng);
                dummy_names.push_back(dname);
            }
            if (!dummy_names.empty()) {
                dummy_root_class = dummy_names[0];
            }

            // Generate chained dummy classes
            for (size_t di = 0; di < opts.dummy_class_count; ++di) {
                std::string next_cls = (di + 1 < opts.dummy_class_count) ? dummy_names[di + 1] : "";
                ClassFile dummy_cf = BytecodeArmor::generate_dummy_class(package_prefix, di, opts.dummy_class_count, next_cls, 42 + static_cast<uint32_t>(di));
                JarEntry dummy_entry;
                dummy_entry.filename = dummy_cf.get_class_name(dummy_cf.this_class) + ".class";
                dummy_entry.data = dummy_cf.serialize();
                dummy_entry.uncompressed_size = static_cast<uint32_t>(dummy_entry.data.size());
                dummy_entry.compressed_size = static_cast<uint32_t>(dummy_entry.data.size());
                dummy_entry.is_class = true;
                generated_dummies.push_back(dummy_entry);
                total_stats.dummy_classes_created++;
            }
        }

        for (auto& entry : entries) {
            if (!entry.is_class || entry.data.empty()) continue;

            ClassFile cf;
            if (cf.parse(entry.data.data(), entry.data.size())) {
                processed_classes++;
                std::string class_name = cf.get_class_name(cf.this_class);
                bool is_main = (!detected_main_class.empty() && class_name == detected_main_class);

                ArmorStats s = BytecodeArmor::protect_class(cf, opts, is_main, dummy_root_class);
                total_stats.stripped_attributes += s.stripped_attributes;
                total_stats.encrypted_strings += s.encrypted_strings;
                total_stats.obfuscated_methods += s.obfuscated_methods;

                entry.data = cf.serialize();
                entry.uncompressed_size = static_cast<uint32_t>(entry.data.size());
                entry.compressed_size = static_cast<uint32_t>(entry.data.size());
            }
        }

        // Append generated dummy entries to archive
        for (auto& de : generated_dummies) {
            entries.push_back(std::move(de));
        }

        // Generate Custom Bootstrap Injector Class
        {
            ClassFile bootstrap_cf = BytecodeArmor::generate_bootstrap_class(dummy_root_class);
            JarEntry b_entry;
            b_entry.filename = "nanoguard/NanoGuardBootstrap.class";
            b_entry.data = bootstrap_cf.serialize();
            b_entry.uncompressed_size = static_cast<uint32_t>(b_entry.data.size());
            b_entry.compressed_size   = static_cast<uint32_t>(b_entry.data.size());
            b_entry.is_class = true;
            entries.push_back(b_entry);
        }

        // ── Security Pipeline Pass ──────────────────────────────────────────
        auto jar_hash = compute_jar_hash(entries);

        WatermarkInfo wm;
        wm.owner = owner_name.empty() ? "NanoGuard" : owner_name;
        wm.channel = "t.me/WineSquad";
        wm.timestamp = static_cast<uint64_t>(std::time(nullptr));
        {
            std::mt19937 rng(static_cast<uint32_t>(wm.timestamp));
            std::ostringstream bid;
            bid << std::hex << std::setw(8) << std::setfill('0') << rng();
            wm.build_id = bid.str();
        }

        SecurityPipelineStats sec_stats;
        std::string main_class_file = detected_main_class + ".class";

        for (auto& entry : entries) {
            if (!entry.is_class || entry.data.empty()) continue;
            ClassFile cf;
            if (!cf.parse(entry.data.data(), entry.data.size())) continue;
            std::string class_name = cf.get_class_name(cf.this_class);
            bool is_main = (!detected_main_class.empty() && class_name == detected_main_class);

            SecurityPipelineStats s = apply_security_pipeline(cf, is_main,
                enable_vm, !owner_name.empty(), enable_antitamper,
                jar_hash, wm);

            sec_stats.virtualized_methods += s.virtualized_methods;
            sec_stats.watermarked_classes += s.watermarked_classes;
            if (s.antitamper_injected) sec_stats.antitamper_injected = true;
            if (s.antidump_injected) sec_stats.antidump_injected = true;

            entry.data = cf.serialize();
            entry.uncompressed_size = static_cast<uint32_t>(entry.data.size());
            entry.compressed_size   = static_cast<uint32_t>(entry.data.size());
        }

        if (enable_vm) {
            ClassFile vm_cf = generate_vm_class();
            JarEntry vm_entry;
            vm_entry.filename = "nanoguard/NanoGuardVM.class";
            vm_entry.data = vm_cf.serialize();
            vm_entry.uncompressed_size = static_cast<uint32_t>(vm_entry.data.size());
            vm_entry.compressed_size   = static_cast<uint32_t>(vm_entry.data.size());
            vm_entry.is_class = true;
            entries.push_back(vm_entry);
        }

        std::vector<uint8_t> xor_key;
        if (enable_encrypt_classes) {
            xor_key = encrypt_class_entries(entries, main_class_file, "nanoguard/");
            inject_loader_class(entries, xor_key);
            std::cout << "[+] Encrypted ClassLoader: all classes XOR-encrypted, NanoGuardLoader injected.\n";
        }

        // Native DLL AOT Compilation
        if (enable_native_dll && !detected_main_class.empty()) {
            std::cout << "[*] Native AOT Engine: compiling JNI bridge DLL...\n";
            std::string jni_cpp = JvmNativeTranspiler::generate_jni_cpp(detected_main_class, "onEnable", "()V", {});
            std::string temp_cpp = "nanoguard_bridge_temp.cpp";
            std::ofstream cpp_out(temp_cpp);
            cpp_out << jni_cpp;
            cpp_out.close();

        std::string bridge_dll = "nanoguard_bridge.dll";
        std::vector<uint8_t> dll_vec;
        bool compiled = JvmNativeTranspiler::compile_dll(temp_cpp, bridge_dll);
        if (compiled) {
            std::cout << "[+] Native Bridge: successfully compiled " << bridge_dll << " via local MSVC cl.exe!\n";
            std::ifstream jar_dll(bridge_dll, std::ios::binary);
            dll_vec.assign((std::istreambuf_iterator<char>(jar_dll)), std::istreambuf_iterator<char>());
        } else {
            std::cout << "[*] No local cl.exe found. Utilizing ultra-compressed Native Bridge Template (Deflate 9)...\n";
            dll_vec = get_embedded_bridge_dll(detected_main_class);
            if (!dll_vec.empty()) {
                std::cout << "[+] Successfully customized embedded Native DLL (" << dll_vec.size() << " bytes) for " << detected_main_class << "!\n";
            } else {
                std::cerr << "[!] Error: failed to unpack embedded bridge DLL template.\n";
            }
        }

        if (!dll_vec.empty()) {
            // Copy alongside output jar
            size_t slash = output_path.find_last_of("/\\");
            std::string out_dir = (slash != std::string::npos) ? output_path.substr(0, slash + 1) : "";
            std::string target_dll = out_dir + "nanoguard_bridge.dll";
            std::ofstream dst_dll(target_dll, std::ios::binary);
            dst_dll.write(reinterpret_cast<const char*>(dll_vec.data()), dll_vec.size());
            dst_dll.close();
            std::cout << "[+] Deployed DLL alongside JAR: " << target_dll << "\n";

            // Embed directly inside JAR archive!
            JarEntry dll_e;
            dll_e.filename = "nanoguard_bridge.dll";
            dll_e.data = dll_vec;
            dll_e.uncompressed_size = static_cast<uint32_t>(dll_vec.size());
            dll_e.compressed_size = static_cast<uint32_t>(dll_vec.size());
            dll_e.is_class = false;
            entries.push_back(dll_e);

            // Multi-Platform Linux x86_64 ELF (.so) Bridge
            std::vector<uint8_t> so_vec = get_embedded_bridge_so(detected_main_class);
            if (!so_vec.empty()) {
                // Copy alongside output jar
                std::string target_so = out_dir + "nanoguard_bridge.so";
                std::ofstream dst_so(target_so, std::ios::binary);
                dst_so.write(reinterpret_cast<const char*>(so_vec.data()), so_vec.size());
                dst_so.close();
                std::cout << "[+] Deployed Linux SO alongside JAR: " << target_so << "\n";

                // Embed directly inside JAR archive for Pterodactyl/Linux hosting!
                JarEntry so_e;
                so_e.filename = "nanoguard_bridge.so";
                so_e.data = so_vec;
                so_e.uncompressed_size = static_cast<uint32_t>(so_vec.size());
                so_e.compressed_size = static_cast<uint32_t>(so_vec.size());
                so_e.is_class = false;
                entries.push_back(so_e);
                std::cout << "[+] Embedded nanoguard_bridge.so directly inside JAR (" << so_vec.size() << " bytes)!\n";
            }
            std::cout << "[+] Embedded nanoguard_bridge.dll directly inside JAR archive (" << dll_vec.size() << " bytes)!\n";

            // Inject NativeBridgeLoader class for automated runtime self-extraction and loading
            JarEntry nbl_e;
            nbl_e.filename = "nanoguard/NativeBridgeLoader.class";
            nbl_e.data.assign(NATIVE_BRIDGE_LOADER_BYTES, NATIVE_BRIDGE_LOADER_BYTES + NATIVE_BRIDGE_LOADER_SIZE);
            nbl_e.uncompressed_size = static_cast<uint32_t>(NATIVE_BRIDGE_LOADER_SIZE);
            nbl_e.compressed_size = static_cast<uint32_t>(NATIVE_BRIDGE_LOADER_SIZE);
            nbl_e.is_class = true;
            entries.push_back(nbl_e);
            std::cout << "[+] Injected automated NativeBridgeLoader (Self-Extracting DLL/SO loader).\n";
        }
        }


        std::cout << "[+] Protected " << processed_classes << " classes successfully.\n";
        std::cout << "    - Stripped Debug Attributes:    " << total_stats.stripped_attributes << "\n";
        std::cout << "    - Encrypted String Literals:    " << total_stats.encrypted_strings << "\n";
        std::cout << "    - Injected Anti-Decompile Traps:" << total_stats.obfuscated_methods << "\n";
        std::cout << "    - Generated Decoy Dummy Classes:" << total_stats.dummy_classes_created << "\n";
        if (enable_vm)
            std::cout << "    - Virtualized Methods (VM ISA): " << sec_stats.virtualized_methods << "\n";
        if (!owner_name.empty())
            std::cout << "    - Watermarked Classes:          " << sec_stats.watermarked_classes << " (owner: " << owner_name << ", build: " << wm.build_id << ")\n";
        if (enable_antitamper) {
            std::cout << "    - Anti-Tamper (SHA-256):        " << (sec_stats.antitamper_injected ? "INJECTED" : "no onEnable found") << "\n";
            std::cout << "    - Anti-Dump / ClassLoader Guard:" << (sec_stats.antidump_injected ? "ACTIVE" : "INACTIVE") << "\n";
        }

        // META-INF Sanitizer & Leak Scrubbing
        std::cout << "[*] Scrubbing META-INF leak files and build metadata...\n";
        entries.erase(std::remove_if(entries.begin(), entries.end(), [](const JarEntry& e) {
            std::string fn = e.filename;
            std::transform(fn.begin(), fn.end(), fn.begin(), ::tolower);
            if (fn.find("maven/") != std::string::npos ||
                fn.find("pom.xml") != std::string::npos ||
                fn.find("pom.properties") != std::string::npos ||
                fn.find("git.properties") != std::string::npos ||
                fn.find(".git") != std::string::npos ||
                fn.find("build-info") != std::string::npos ||
                fn.find(".dsa") != std::string::npos ||
                fn.find(".rsa") != std::string::npos ||
                fn.find(".sf") != std::string::npos) {
                return true;
            }
            return false;
        }), entries.end());

        // Replace or sanitize MANIFEST.MF with sterile production headers
        for (auto& e : entries) {
            if (e.filename == "META-INF/MANIFEST.MF") {
                std::string clean_manifest = "Manifest-Version: 1.0\r\nCreated-By: NanoGuard Extreme Armor (Native Engine)\r\n\r\n";
                e.data.assign(clean_manifest.begin(), clean_manifest.end());
                e.uncompressed_size = static_cast<uint32_t>(clean_manifest.size());
                e.compressed_size = static_cast<uint32_t>(clean_manifest.size());
                break;
            }
        }
        std::cout << "[+] META-INF cleaned: Maven/Git/Signature traces stripped.\n";

        if (output_path.empty()) {
            output_path = input_jar.substr(0, input_jar.find_last_of('.')) + "_protected.jar";
        }

        if (JarArchive::write_entries(output_path, entries)) {
            std::cout << "[+] Protected JAR successfully saved to: " << output_path << "\n";
        } else {
            std::cerr << "[!] Error writing output JAR: " << output_path << "\n";
            return 1;
        }
    }

    return 0;
}
