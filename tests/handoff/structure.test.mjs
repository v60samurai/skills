import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, relative } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const skillRoot = resolve(root, 'skills/handoff');
const read = (path) => readFile(resolve(root, path), 'utf8');

async function files(directory) {
  const result = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) result.push(...await files(path));
    else result.push(path);
  }
  return result;
}

test('the explicitly invoked bundle has no unresolved local Markdown links', async () => {
  const skill = await read('skills/handoff/SKILL.md');
  assert.match(skill, /^---\nname: handoff\n/);
  assert.match(skill, /^disable-model-invocation: true$/m);
  assert.doesNotMatch(skill, /^allowed-tools:/m, 'do not retain the old read-only tool restriction');
  for (const path of await files(skillRoot)) {
    const body = await readFile(path, 'utf8');
    for (const match of body.matchAll(/\]\(([^)]+)\)/g)) {
      const link = match[1];
      if (/^https?:/.test(link) || link.startsWith('#')) continue;
      const target = resolve(dirname(path), link.split('#')[0]);
      assert.ok(!relative(root, target).startsWith('..'), `${path}: link escapes repository`);
      await readFile(target);
    }
  }
});

test('public skill bundle contains no machine-specific paths or V3 chain', async () => {
  for (const path of await files(skillRoot)) {
    const body = await readFile(path, 'utf8');
    assert.doesNotMatch(body, /\/Users\/|\/home\/[^<\s]+|agentic-rebuild-skills|v60samurai\/dotfiles/);
    assert.doesNotMatch(body, /and run Build Flow|Ready for Build Flow|EXECUTION\.md|reconcile-H\d/);
  }
});

const missionFields = ['Goal', 'Done check', 'Proof wanted', 'Known', 'Constraints'];
const sliceFields = ['Status', 'Depends on', 'Gate dependency', ...missionFields,
  'Observable after landing', 'Unit verification', 'Live verification',
  'Performance proof', 'PR boundary', 'Out of scope', 'Readiness evidence'];
const gateFields = ['Status', 'Question', 'Why human-owned', 'Recommended default',
  'Alternatives', 'Evidence', 'Consequences', 'Blocked slices', 'Unblocked work'];

function value(section, label) {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const matches = [...section.matchAll(new RegExp(`^${escaped}: (.+)$`, 'gm'))];
  assert.equal(matches.length, 1, `${label} must appear exactly once with content`);
  return matches[0][1];
}

test('worked BUILD has complete mission, gate, slice and matching index contracts', async () => {
  const body = await read('skills/handoff/references/build-example.md');
  const mission = body.split('## Mission\n')[1].split('\n## Canonical truth')[0];
  for (const field of missionFields) value(mission, field);
  const gate = body.split('### G01: Duplicate policy\n')[1].split('\n## Slice Index')[0];
  for (const field of gateFields) value(gate, field);
  assert.equal(value(gate, 'Status'), 'OPEN');
  const sections = [...body.matchAll(/^## (S\d+): (.+)\n([\s\S]*?)(?=^## S\d+: |$(?![\s\S]))/gm)];
  assert.equal(sections.length, 2);
  for (const [, id, title, section] of sections) {
    for (const field of sliceFields) value(section, field);
    const expectedRow = `| ${id} | ${title} | ${value(section, 'Status')} | ${value(section, 'Depends on')} | ${value(section, 'Gate dependency')} |`;
    assert.ok(body.includes(expectedRow), `index disagrees with ${id}`);
  }
  const first = sections[0][3];
  const second = sections[1][3];
  assert.equal(value(first, 'Status'), 'READY');
  assert.equal(value(first, 'Depends on'), 'none');
  assert.equal(value(first, 'Gate dependency'), 'none');
  assert.equal(value(second, 'Status'), 'BLOCKED');
  assert.equal(value(second, 'Depends on'), 'S01');
  assert.equal(value(second, 'Gate dependency'), 'G01');
  assert.equal(value(gate, 'Blocked slices'), 'S02');
  assert.equal(value(gate, 'Unblocked work'), 'S01');
});

test('BUILD example gives outcome/proof instead of prescribing engineering method', async () => {
  const body = await read('skills/handoff/references/build-example.md');
  assert.doesNotMatch(body, /\b(?:playbook|worktree|agent count|code model|arena|architect)\b/i);
  assert.match(body, /independent review/i);
  assert.match(body, /Do not merge/);
  assert.match(body, /G01 remains OPEN and S01 has no landing evidence/);
});

test('behavioral fixtures cover owners, negative controls, preservation and runtime boundaries', async () => {
  const data = JSON.parse(await read('tests/handoff/cases.json'));
  assert.equal(data.kind, 'behavioral-model-fixtures');
  assert.equal(data.structuralTestsAreModelProof, false);
  const ids = new Set();
  const coverage = new Set();
  for (const item of data.cases) {
    assert.ok(item.id && !ids.has(item.id));
    ids.add(item.id);
    assert.ok(item.prompt.length > 20);
    assert.ok(item.setup.length && item.expect.length);
    assert.ok(item.forbid.length);
    for (const tag of item.coverage) coverage.add(tag);
  }
  for (const tag of ['fact-router', 'intent', 'grilling', 'brainstorm-stack', 'design-stack',
    'Stacksmith', 'Jev Atlas', 'negative-control', 'wayfinder', 'html-plan',
    'delta-evidence', 'fresh-session', 'independent-review', 'pr-communication', 'no-merge']) {
    assert.ok(coverage.has(tag), `missing scenario for ${tag}`);
  }
  assert.ok(data.requiredRunEvidence.includes('actual owner source load trace'));
});

test('negative owners case is distinct from missing mandatory source and fog', async () => {
  const data = JSON.parse(await read('tests/handoff/cases.json'));
  const cases = Object.fromEntries(data.cases.map((item) => [item.id, item]));
  assert.equal(cases.mechanical.requiredOwners.length, 0);
  assert.ok(cases.unavailable.requiredOwners.includes('design-stack'));
  assert.ok(cases.unavailable.expect.some((line) => /BLOCKED/.test(line)));
  assert.ok(cases.fog.forbid.some((line) => /premature BUILD/.test(line)));
});
