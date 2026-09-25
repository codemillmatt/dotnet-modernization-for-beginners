import assert from "node:assert/strict";
import { inflateRawSync } from "node:zlib";

export function zipEntries(bytes) {
  let end = bytes.length - 22;
  while (end >= Math.max(0, bytes.length - 65557) && bytes.readUInt32LE(end) !== 0x06054b50) end--;
  assert.ok(end >= 0, "ZIP end record exists");
  const count = bytes.readUInt16LE(end + 10);
  let offset = bytes.readUInt32LE(end + 16);
  const entries = new Map();
  for (let index = 0; index < count; index++) {
    assert.equal(bytes.readUInt32LE(offset), 0x02014b50, "ZIP central directory entry");
    const method = bytes.readUInt16LE(offset + 10);
    const size = bytes.readUInt32LE(offset + 20);
    const nameLength = bytes.readUInt16LE(offset + 28);
    const extraLength = bytes.readUInt16LE(offset + 30);
    const commentLength = bytes.readUInt16LE(offset + 32);
    const local = bytes.readUInt32LE(offset + 42);
    const name = bytes.subarray(offset + 46, offset + 46 + nameLength).toString("utf8");
    assert.equal(bytes.readUInt32LE(local), 0x04034b50, `ZIP local entry: ${name}`);
    const start = local + 30 + bytes.readUInt16LE(local + 26) + bytes.readUInt16LE(local + 28);
    const compressed = bytes.subarray(start, start + size);
    assert.ok([0, 8].includes(method), `Supported compression: ${name}`);
    const content = method === 8 ? inflateRawSync(compressed) : compressed;
    assert.equal(content.length, bytes.readUInt32LE(offset + 24), `ZIP file length: ${name}`);
    entries.set(name, content);
    offset += 46 + nameLength + extraLength + commentLength;
  }
  return entries;
}
