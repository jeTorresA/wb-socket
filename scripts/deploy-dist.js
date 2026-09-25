#!/usr/bin/env node
/**
 * Publica en la rama "dist" de origin todo lo necesario para correr en producción:
 *   - contenido de dist/ (src, db, ecosystem.config.js, ...)
 *   - client/
 *   - package.json, package-lock.json, index.html y .gitignore
 * La rama es huérfana (sin historial del repo) y cada deploy es un commit limpio.
 *
 * Uso: npm run deploy:dist   (equivale a: npm run build && node scripts/deploy-dist.js)
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const BRANCH = 'dist';
const WORKTREE = '.dist-deploy';
const ROOT = path.resolve(__dirname, '..');
const WORKTREE_PATH = path.join(ROOT, WORKTREE);

function run(cmd, options = {}) {
  return execSync(cmd, { cwd: ROOT, stdio: ['ignore', 'pipe', 'inherit'], ...options })
    .toString()
    .trim();
}

function createOrphanBranch() {
  console.log(`[deploy-dist] La rama "${BRANCH}" no existe en origin; creándola como rama huérfana...`);
  const tmpIndex = path.join(ROOT, '.git', 'deploy-dist-index');

  run('git read-tree --empty', { env: { ...process.env, GIT_INDEX_FILE: tmpIndex } });
  const treeSha = run('git write-tree', { env: { ...process.env, GIT_INDEX_FILE: tmpIndex } });
  const commitSha = run(`git commit-tree ${treeSha} -m "deploy: rama ${BRANCH} inicial"`);
  run(`git push origin ${commitSha}:refs/heads/${BRANCH}`);
  fs.rmSync(tmpIndex, { force: true });

  console.log(`[deploy-dist] Rama huérfana creada (${commitSha.slice(0, 7)}).`);
}

function cleanWorktree() {
  for (const entry of fs.readdirSync(WORKTREE_PATH)) {
    if (entry === '.git') continue;
    fs.rmSync(path.join(WORKTREE_PATH, entry), { recursive: true, force: true });
  }
}

function copyPayload() {
  fs.cpSync(path.join(ROOT, 'dist'), WORKTREE_PATH, { recursive: true });
  fs.cpSync(path.join(ROOT, 'client'), path.join(WORKTREE_PATH, 'client'), { recursive: true });
  for (const file of ['package.json', 'package-lock.json', 'index.html', '.gitignore']) {
    fs.copyFileSync(path.join(ROOT, file), path.join(WORKTREE_PATH, file));
  }
}

function removeWorktree() {
  try {
    run(`git worktree remove --force ${WORKTREE}`);
  } catch {
    try {
      fs.rmSync(WORKTREE_PATH, { recursive: true, force: true });
      run('git worktree prune');
    } catch {
      /* noop */
    }
  }
}

function main() {
  const distDir = path.join(ROOT, 'dist');
  if (!fs.existsSync(distDir) || fs.readdirSync(distDir).length === 0) {
    throw new Error('dist/ no existe o está vacío. Ejecuta "npm run build" primero.');
  }

  run('git remote get-url origin');

  const remoteBranch = run(`git ls-remote --heads origin ${BRANCH}`);
  if (!remoteBranch) {
    createOrphanBranch();
  }
  run('git fetch origin dist');

  try {
    run(`git worktree add --force -B ${BRANCH} ${WORKTREE} origin/${BRANCH}`);

    cleanWorktree();
    copyPayload();

    run(`git -C ${WORKTREE} add -A`);
    const status = run(`git -C ${WORKTREE} status --porcelain`);
    if (!status) {
      console.log('[deploy-dist] Sin cambios respecto al último deploy; no se creó commit.');
      return;
    }

    const headSha = run('git rev-parse --short HEAD');
    run(`git -C ${WORKTREE} commit -m "deploy: dist ${headSha}"`);
    run(`git -C ${WORKTREE} push origin ${BRANCH}`);
    console.log(`[deploy-dist] Publicado en origin/${BRANCH} (build de ${headSha}).`);
  } finally {
    removeWorktree();
  }
}

main();
