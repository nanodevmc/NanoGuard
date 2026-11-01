package nanoguard;

import java.io.*;
import java.lang.reflect.Method;

public class NativeBridgeLoader {
    private static volatile boolean loaded = false;

    public static synchronized boolean load() {
        if (loaded) return true;

        String os = System.getProperty("os.name", "").toLowerCase();
        String arch = System.getProperty("os.arch", "").toLowerCase();

        boolean isWin = os.contains("win");
        boolean isLinux = os.contains("linux") || os.contains("unix");
        boolean is64 = arch.contains("64");

        if (!is64) {
            // 32-bit architecture - fallback to Pure JVM VM
            return false;
        }

        String libName = isWin ? "nanoguard_bridge.dll" : (isLinux ? "nanoguard_bridge.so" : null);
        if (libName == null) return false;

        InputStream in = NativeBridgeLoader.class.getResourceAsStream("/" + libName);
        if (in == null) {
            in = NativeBridgeLoader.class.getClassLoader().getResourceAsStream(libName);
        }

        if (in == null) {
            // Check current working directory
            File localDll = new File(libName);
            if (localDll.exists()) {
                try {
                    System.load(localDll.getAbsolutePath());
                    loaded = true;
                    return true;
                } catch (Throwable t) {}
            }
            return false;
        }

        try {
            File tempFile = File.createTempFile("ng_bridge_", isWin ? ".dll" : ".so");
            tempFile.deleteOnExit();

            FileOutputStream out = new FileOutputStream(tempFile);
            byte[] buf = new byte[8192];
            int r;
            while ((r = in.read(buf)) != -1) {
                out.write(buf, 0, r);
            }
            out.flush();
            out.close();
            in.close();

            System.load(tempFile.getAbsolutePath());
            loaded = true;
            return true;
        } catch (Throwable t) {
            return false;
        }
    }
}
