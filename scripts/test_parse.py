import zipfile, struct

z = zipfile.ZipFile('test_vuln.jar')
data = z.read('com/evil/Payload.class')
magic, minor, major, cp_count = struct.unpack('>IHHH', data[:10])
print(f'Magic: {hex(magic)}, Major: {major}, CP Count: {cp_count}')
idx = 10
for i in range(1, cp_count):
    tag = data[idx]
    idx += 1
    if tag == 1:
        length = struct.unpack('>H', data[idx:idx+2])[0]
        idx += 2
        val = data[idx:idx+length]
        idx += length
        print(f'CP[{i}] Utf8: {val}')
    elif tag == 7:
        cidx = struct.unpack('>H', data[idx:idx+2])[0]
        idx += 2
        print(f'CP[{i}] Class: {cidx}')
