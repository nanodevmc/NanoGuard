import zipfile, struct

def make_utf8(s):
    encoded = s.encode('utf-8')
    return b'\x01' + struct.pack('>H', len(encoded)) + encoded

def make_class(name_idx):
    return b'\x07' + struct.pack('>H', name_idx)

# CP items:
# 1: Class (2)
# 2: Utf8 (com/evil/Payload)
# 3: Class (4)
# 4: Utf8 (java/lang/Object)
# 5: Utf8 (.minecraft/launcher_accounts.json)
# 6: Utf8 (getCommandMap)
# 7: Utf8 (org/apache/logging/log4j/core/lookup/JndiLookup)

cp = [
    b'', # 0 unused
    make_class(2),
    make_utf8('com/evil/Payload'),
    make_class(4),
    make_utf8('java/lang/Object'),
    make_utf8('.minecraft/launcher_accounts.json'),
    make_utf8('getCommandMap'),
    make_utf8('org/apache/logging/log4j/core/lookup/JndiLookup')
]

cp_data = b''.join(cp[1:])
header = struct.pack('>IHHH', 0xCAFEBABE, 0, 52, len(cp))
cls_body = struct.pack('>HHHHHH', 0x0021, 1, 3, 0, 0, 0) # access, this, super, interfaces, fields, methods
cls_data = header + cp_data + cls_body + struct.pack('>H', 0) # 0 attributes

with zipfile.ZipFile('test_vuln.jar', 'w') as z:
    z.writestr('plugin.yml', 'name: VulnPlugin\nmain: com.evil.Payload\n')
    z.writestr('com/evil/Payload.class', cls_data)

print('CREATED_VALID_TEST_VULN_JAR')
