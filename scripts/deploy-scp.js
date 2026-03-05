/**
 * Deploy dist/ to server via SCP (SSH key only, no password).
 * Requires: scp and ssh in PATH (OpenSSH / Git for Windows).
 *
 * Optional .env:
 *   SSH_HOST=kat.sd
 *   SSH_USER=kattop
 *   SSH_KEY=/path/to/private/key   (optional, uses default key)
 *   REMOTE_DIR=public_html/rafique/frontend
 */

import { execSync } from 'child_process'
import { readFileSync, existsSync, unlinkSync } from 'fs'
import { join } from 'path'
import archiver from 'archiver'
import { createWriteStream } from 'fs'

const root = process.cwd()

function loadEnv() {
  const envPath = join(root, '.env')
  if (!existsSync(envPath)) return
  try {
    let content = readFileSync(envPath, 'utf8')
    content = content.replace(/\uFEFF/g, '')
    for (const line of content.split(/\r?\n/)) {
      const m = line.match(/^([^#=]+)=(.*)$/)
      if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '')
    }
  } catch (_) {}
}

loadEnv()

const host = process.env.SSH_HOST || 'kat.sd'
const user = process.env.SSH_USER || 'kattop'
const remoteDir = process.env.REMOTE_DIR || 'public_html/rafique/frontend'
const keyOpts = process.env.SSH_KEY ? `-i "${process.env.SSH_KEY}"` : ''
const sshTarget = `${user}@${host}`
const localDir = join(root, 'dist')
const zipPath = join(root, 'deploy-frontend.zip')

function run(cmd, opts = {}) {
  execSync(cmd, { stdio: 'inherit', ...opts })
}

async function createZip() {
  return new Promise((resolve, reject) => {
    const out = createWriteStream(zipPath)
    const archive = archiver('zip', { zlib: { level: 9 } })
    archive.on('error', reject)
    out.on('close', () => resolve())
    archive.pipe(out)
    archive.directory(localDir, false)
    archive.finalize()
  })
}

async function deploy() {
  try {
    console.log('Creating zip from dist/...')
    await createZip()

    console.log('Uploading zip via SCP...')
    run(`scp ${keyOpts} -o StrictHostKeyChecking=no "${zipPath}" "${sshTarget}:~/deploy-frontend.zip"`.replace(/\s{2,}/g, ' ').trim())

    console.log('Extracting on server and cleaning up...')
    const sshCmd = [
      `mkdir -p ${remoteDir}`,
      `cd ${remoteDir} && (rm -rf * .[!.]* 2>/dev/null; true)`,
      'unzip -o ~/deploy-frontend.zip -d .',
      'rm -f ~/deploy-frontend.zip',
    ].join(' && ')
    run(`ssh ${keyOpts} -o StrictHostKeyChecking=no "${sshTarget}" "${sshCmd}"`.replace(/\s{2,}/g, ' ').trim())

    unlinkSync(zipPath)
    console.log('Deploy done: dist/ -> %s@%s:%s', user, host, remoteDir)
  } catch (err) {
    if (existsSync(zipPath)) try { unlinkSync(zipPath) } catch (_) {}
    console.error('Deploy failed:', err.message)
    process.exit(1)
  }
}

deploy()
