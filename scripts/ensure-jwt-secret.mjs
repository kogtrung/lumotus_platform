#!/usr/bin/env node
/**
 * Tự sinh JWT_SECRET nếu .env còn placeholder (hoặc thiếu).
 * Chạy trước spring-boot:run — không ghi đè secret đã có sẵn.
 *
 * Usage: node scripts/ensure-jwt-secret.mjs [--force]
 */

import { randomBytes } from 'node:crypto'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const PLACEHOLDERS = new Set([
  '',
  'change-this-secret-key-at-least-256-bits-long-please-replace-me',
  'change-this-secret-key-at-least-256-bits-long',
  'change-this-to-a-256-bit-random-string',
])

const force = process.argv.includes('--force')
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const envPath = resolve(root, '.env')

if (!existsSync(envPath)) {
  console.error('[ensure-jwt-secret] Không tìm thấy .env — copy từ .env.example trước.')
  process.exit(1)
}

const lines = readFileSync(envPath, 'utf8').split(/\r?\n/)
let jwtLineIndex = -1
let currentValue = ''

for (let i = 0; i < lines.length; i++) {
  const match = lines[i].match(/^JWT_SECRET\s*=\s*(.*)$/)
  if (match) {
    jwtLineIndex = i
    currentValue = match[1].trim().replace(/^["']|["']$/g, '')
    break
  }
}

if (jwtLineIndex === -1) {
  console.error('[ensure-jwt-secret] .env thiếu dòng JWT_SECRET=')
  process.exit(1)
}

const needsNew = force || PLACEHOLDERS.has(currentValue)

if (!needsNew) {
  console.log('[ensure-jwt-secret] JWT_SECRET đã có — giữ nguyên.')
  process.exit(0)
}

const secret = randomBytes(64).toString('base64')
lines[jwtLineIndex] = `JWT_SECRET=${secret}`
writeFileSync(envPath, lines.join('\n'), 'utf8')
console.log('[ensure-jwt-secret] Đã sinh JWT_SECRET mới và ghi vào .env')
