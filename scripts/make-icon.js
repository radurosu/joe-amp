#!/usr/bin/env node
// Generates public/icon.icns — no dependencies, pure Node.js + macOS iconutil

const zlib = require('zlib')
const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

// --- PNG writer ---
function makePNG(size) {
  function crc32(buf) {
    let c = 0xFFFFFFFF
    for (const b of buf) {
      c ^= b
      for (let i = 0; i < 8; i++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1)
    }
    return (c ^ 0xFFFFFFFF) >>> 0
  }
  function chunk(type, data) {
    const t = Buffer.from(type)
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length)
    const crcInput = Buffer.concat([t, data])
    const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(crcInput))
    return Buffer.concat([len, t, data, crc])
  }

  const BG    = [0x16, 0x16, 0x16]
  const GREEN = [0x00, 0xee, 0x00]
  const DIM   = [0x00, 0x44, 0x00]

  // Draw equalizer bars
  const barW   = Math.round(size * 0.13)
  const gap    = Math.round(size * 0.06)
  const totalW = 3 * barW + 2 * gap
  const startX = Math.round((size - totalW) / 2)
  const baseY  = Math.round(size * 0.78)
  const barHeights = [
    Math.round(size * 0.38),
    Math.round(size * 0.56),
    Math.round(size * 0.28),
  ]
  // Dim "empty" part above each bar
  const maxH = Math.round(size * 0.62)

  function getPixel(x, y) {
    // Rounded corners mask
    const r = size * 0.18
    const cx = size / 2, cy = size / 2
    const dx = Math.abs(x - cx) - (size / 2 - r)
    const dy = Math.abs(y - cy) - (size / 2 - r)
    if (dx > 0 && dy > 0 && dx * dx + dy * dy > r * r) return BG

    for (let i = 0; i < 3; i++) {
      const bx = startX + i * (barW + gap)
      if (x >= bx && x < bx + barW) {
        const bh = barHeights[i]
        const by = baseY - bh
        if (y >= by && y < baseY) return GREEN
        // dim track above the bar
        if (y >= baseY - maxH && y < by) return DIM
      }
    }
    return BG
  }

  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8; ihdr[9] = 2 // 8-bit RGB

  const rows = []
  for (let y = 0; y < size; y++) {
    const row = Buffer.alloc(1 + size * 3)
    row[0] = 0 // filter: None
    for (let x = 0; x < size; x++) {
      const [r, g, b] = getPixel(x, y)
      row[1 + x * 3] = r
      row[2 + x * 3] = g
      row[3 + x * 3] = b
    }
    rows.push(row)
  }

  const compressed = zlib.deflateSync(Buffer.concat(rows))
  return Buffer.concat([
    Buffer.from('\x89PNG\r\n\x1a\n', 'binary'),
    chunk('IHDR', ihdr),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

// --- Build iconset and convert to ICNS ---
const iconsetDir = path.resolve(__dirname, '../public/icon.iconset')
fs.mkdirSync(iconsetDir, { recursive: true })

const sizes = [16, 32, 64, 128, 256, 512]
for (const s of sizes) {
  fs.writeFileSync(path.join(iconsetDir, `icon_${s}x${s}.png`), makePNG(s))
  fs.writeFileSync(path.join(iconsetDir, `icon_${s}x${s}@2x.png`), makePNG(s * 2))
}

const outPath = path.resolve(__dirname, '../public/icon.icns')
execSync(`iconutil -c icns "${iconsetDir}" -o "${outPath}"`)
fs.rmSync(iconsetDir, { recursive: true })

console.log('Icon written to public/icon.icns')
