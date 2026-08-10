import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

const root = process.cwd();
const output = join(root, 'public');
const apps = [
  ['Frontend/Startups', 'startups'],
  ['Frontend/investor', 'investor'],
  ['Frontend/schemes', 'schemes'],
  ['Frontend/profile', 'profile'],
];

rmSync(output, { recursive: true, force: true });
mkdirSync(output, { recursive: true });

cpSync(join(root, 'Frontend/starting page'), output, { recursive: true });
cpSync(join(root, 'Frontend/Home_Page'), join(output, 'Home_Page'), { recursive: true });

for (const [source, mount] of apps) {
  const directory = join(root, source);
  execFileSync('npm', ['ci', '--prefix', directory], { stdio: 'inherit', shell: process.platform === 'win32' });
  execFileSync('npm', ['run', 'build', '--prefix', directory], { stdio: 'inherit', shell: process.platform === 'win32' });
  cpSync(join(directory, 'dist'), join(output, mount), { recursive: true });
}

for (const file of ['interview_dashboard.html', 'bg_img.png']) {
  const source = join(root, 'Agent', file);
  if (existsSync(source)) cpSync(source, join(output, file));
}
