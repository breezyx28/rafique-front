/**
 * Deploy dist/ to cPanel via FTP.
 * Set env vars (or use .env in project root):
 *   FTP_HOST, FTP_USER, FTP_PASSWORD
 * Optional: FTP_REMOTE_DIR (default: public_html/rafique-front)
 */

import { Client } from 'basic-ftp'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

// Use cwd so .env is found when run via "bun run deploy" or "npm run deploy" from project root
const root = process.cwd()

// Load .env if present (no extra dependency)
function loadEnv() {
  const envPath = join(root, '.env')
  if (!existsSync(envPath)) return
  try {
    let content = readFileSync(envPath, 'utf8')
    content = content.replace(/\uFEFF/g, '') // strip BOM
    for (const line of content.split(/\r?\n/)) {
      const m = line.match(/^([^#=]+)=(.*)$/)
      if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '')
    }
  } catch (_) {}
}

loadEnv()

const host = process.env.FTP_HOST || 'ftp.kat.sd'
const user = process.env.FTP_USER
const password = process.env.FTP_PASSWORD
const remoteDir = process.env.FTP_REMOTE_DIR || 'public_html/rafique-front'
const localDir = join(root, 'dist')

if (!user || !password) {
  console.error('Missing FTP credentials. Set FTP_USER and FTP_PASSWORD (or add them to .env).')
  process.exit(1)
}

const client = new Client(60_000)
client.ftp.verbose = false

async function deploy() {
  try {
    await client.access({
      host,
      user,
      password,
      port: 21,
      secure: false,
    })
    // If folder exists, remove it and its contents for a clean deploy
    try {
      await client.removeDir(remoteDir)
      console.log('Removed existing folder:', remoteDir)
    } catch (_) {
      // Folder may not exist on first deploy
    }
    // Create fresh folder and upload dist contents into it
    await client.ensureDir(remoteDir)
    await client.uploadFromDir(localDir, remoteDir)
    console.log('Deploy done: %s -> %s', localDir, remoteDir)
  } catch (err) {
    console.error('Deploy failed:', err.message)
    process.exit(1)
  } finally {
    client.close()
  }
}

deploy()
