#!/usr/bin/env node
// Generates public/icon.icns — no dependencies, pure Node.js + macOS iconutil

const zlib = require('zlib')
const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

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

  function getPixel(x, y) {
    const cx = size / 2, cy = size / 2
    const nx = x - cx, ny = y - cy
    const dist = Math.sqrt(nx * nx + ny * ny)
    const radius = size * 0.47

    // Outside circle → transparent-ish (dark bg, macOS will mask)
    if (dist > radius) return [0x16, 0x16, 0x16]

    // Thin bright border ring
    if (dist > radius - size * 0.025) {
      const t = 1 - (radius - dist) / (size * 0.025)
      const v = Math.round(0x22 + t * 0x44)
      return [0, v, 0]
    }

    // Background with subtle radial gradient (darker at edges)
    const bgBase = Math.round(0x16 + (1 - dist / radius) * 0x0a)
    const bg = [bgBase, bgBase, bgBase]

    // 5 equalizer bars
    const numBars = 5
    const barW   = size * 0.09
    const gap    = size * 0.04
    const totalW = numBars * barW + (numBars - 1) * gap
    const startX = cx - totalW / 2
    const baseY  = size * 0.76
    // Heights vary: short, tall, medium-tall, tall, short (wave shape)
    const heights = [0.28, 0.50, 0.62, 0.44, 0.22].map(h => size * h)
    const maxH = size * 0.62

    for (let i = 0; i < numBars; i++) {
      const bx = startX + i * (barW + gap)
      if (x >= bx && x < bx + barW) {
        const bh = heights[i]
        const by = baseY - bh

        if (y >= by && y < baseY) {
          // Lit bar — gradient from bright green at top to slightly dimmer at base
          const progress = (y - by) / bh  // 0 at top, 1 at base
          const g = Math.round(0xee - progress * 0x44)
          // Slight glow spread to adjacent pixels
          return [0, g, 0]
        }
        // Dim track above each bar
        if (y >= baseY - maxH && y < by) return [0, 0x22, 0]
      }
    }

    // Subtle green tint on background near bars area
    if (y >= baseY - maxH && y < baseY) {
      return [bgBase, bgBase + 4, bgBase]
    }

    return bg
  }

  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8; ihdr[9] = 2 // 8-bit RGB

  const rows = []
  for (let y = 0; y < size; y++) {
    const row = Buffer.alloc(1 + size * 3)
    row[0] = 0
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

// Build iconset and convert to ICNS
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
