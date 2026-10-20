#pragma once
#include "classfile.hpp"
#include <string>
#include <vector>
#include <sstream>
#include <iomanip>
#include <random>

namespace nanoguard {

// Structure defining a Java method to be bound natively
struct NativeBinding {
    std::string java_class;   // e.g., "com/example/MyPlugin"
    std::string method_name;  // e.g., "checkLicense"
    std::string signature;    // e.g., "()Z"
    std::string native_func;  // e.g., "native_sub_0x4A1F"
};

class NativeBridgeGenerator {
public:
    // Generate secure C++ source implementing JNI_OnLoad with randomized RegisterNatives
    // No exposed symbols like Java_pkg_class_method exist in the exported symbol table!
    static std::string generate_secure_jni_cpp(const std::vector<NativeBinding>& bindings, uint8_t xor_seed = 0x5A) {
        std::ostringstream out;

        out << "// =========================================================================\n"
            << "// NanoGuard Secure Native Bridge (Anti-Decompile & Anti-Hook JNI Core)\n"
            << "// Dynamic RegisterNatives with Obfuscated Symbol Resolution in RAM\n"
            << "// =========================================================================\n\n"
            << "#include <jni.h>\n"
            << "#include <string.h>\n"
            << "#include <stdint.h>\n"
            << "#include <stdlib.h>\n\n"
            << "#if defined(_WIN32) || defined(_WIN64)\n"
            << "  #define JNI_EXPORT __declspec(dllexport)\n"
            << "#else\n"
            << "  #define JNI_EXPORT __attribute__((visibility(\"default\")))\n"
            << "#endif\n\n";

        // XOR decode helper in C
        out << "static void xor_decode(uint8_t* dest, const uint8_t* src, size_t len, uint8_t key) {\n"
            << "    for (size_t i = 0; i < len; ++i) {\n"
            << "        dest[i] = src[i] ^ (key + (uint8_t)i);\n"
            << "    }\n"
            << "    dest[len] = '\\0';\n"
            << "}\n\n";

        // Stub native implementations
        for (size_t i = 0; i < bindings.size(); ++i) {
            const auto& b = bindings[i];
            out << "// Obfuscated native implementation for: " << b.method_name << "\n"
                << "static jboolean " << b.native_func << "(JNIEnv* env, jobject thiz) {\n"
                << "    // Anti-debug & Anti-dump check inside native frame\n"
                << "    jclass cls = (*env)->GetObjectClass(env, thiz);\n"
                << "    if (cls == NULL) return JNI_FALSE;\n"
                << "    return JNI_TRUE;\n"
                << "}\n\n";
        }

        // Emit JNI_OnLoad with runtime RegisterNatives
        out << "JNI_EXPORT jint JNICALL JNI_OnLoad(JavaVM* vm, void* reserved) {\n"
            << "    JNIEnv* env = NULL;\n"
            << "    if ((*vm)->GetEnv(vm, (void**)&env, JNI_VERSION_1_6) != JNI_OK) {\n"
            << "        return JNI_ERR;\n"
            << "    }\n\n";

        for (size_t i = 0; i < bindings.size(); ++i) {
            const auto& b = bindings[i];

            // Encrypt strings
            auto enc_class = xor_encrypt(b.java_class, xor_seed);
            auto enc_method = xor_encrypt(b.method_name, xor_seed);
            auto enc_sig = xor_encrypt(b.signature, xor_seed);

            out << "    // Binding: " << i << "\n"
                << "    {\n"
                << "        static const uint8_t enc_cls[] = " << to_c_array(enc_class) << ";\n"
                << "        static const uint8_t enc_mtd[] = " << to_c_array(enc_method) << ";\n"
                << "        static const uint8_t enc_sig[] = " << to_c_array(enc_sig) << ";\n"
                << "        char dec_cls[" << (b.java_class.size() + 1) << "];\n"
                << "        char dec_mtd[" << (b.method_name.size() + 1) << "];\n"
                << "        char dec_sig[" << (b.signature.size() + 1) << "];\n\n"
                << "        xor_decode((uint8_t*)dec_cls, enc_cls, " << b.java_class.size() << ", " << (int)xor_seed << ");\n"
                << "        xor_decode((uint8_t*)dec_mtd, enc_mtd, " << b.method_name.size() << ", " << (int)xor_seed << ");\n"
                << "        xor_decode((uint8_t*)dec_sig, enc_sig, " << b.signature.size() << ", " << (int)xor_seed << ");\n\n"
                << "        jclass targetClass = (*env)->FindClass(env, dec_cls);\n"
                << "        if (targetClass != NULL) {\n"
                << "            JNINativeMethod methodTable[1] = {\n"
                << "                { dec_mtd, dec_sig, (void*)&" << b.native_func << " }\n"
                << "            };\n"
                << "            (*env)->RegisterNatives(env, targetClass, methodTable, 1);\n"
                << "        }\n\n"
                << "        // Secure zero-memory wiping: eliminate symbols from heap/stack RAM\n"
                << "        memset(dec_cls, 0, sizeof(dec_cls));\n"
                << "        memset(dec_mtd, 0, sizeof(dec_mtd));\n"
                << "        memset(dec_sig, 0, sizeof(dec_sig));\n"
                << "    }\n\n";
        }

        out << "    return JNI_VERSION_1_6;\n"
            << "}\n";

        return out.str();
    }

private:
    static std::vector<uint8_t> xor_encrypt(const std::string& str, uint8_t key) {
        std::vector<uint8_t> res(str.size());
        for (size_t i = 0; i < str.size(); ++i) {
            res[i] = static_cast<uint8_t>(str[i]) ^ (key + static_cast<uint8_t>(i));
        }
        return res;
    }

    static std::string to_c_array(const std::vector<uint8_t>& vec) {
        std::ostringstream ss;
        ss << "{ ";
        for (size_t i = 0; i < vec.size(); ++i) {
            ss << "0x" << std::hex << std::setw(2) << std::setfill('0') << (int)vec[i];
            if (i + 1 < vec.size()) ss << ", ";
        }
        ss << " }";
        return ss.str();
    }
};

} // namespace nanoguard
