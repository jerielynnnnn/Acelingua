import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import ts from 'typescript';

const content = JSON.parse(readFileSync(new URL('../lib/writing/content.json', import.meta.url), 'utf8'));
const types = ts.transpileModule(readFileSync(new URL('../lib/writing/types.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.ES2022 } }).outputText;
const { safeWritingReturn, writingSummary } = await import(`data:text/javascript;base64,${Buffer.from(types).toString('base64')}`);

test('writing return preserves course context and rejects external or unrelated destinations', () => {
  assert.equal(safeWritingReturn('/learn?course=abc', 'other'), '/learn?course=abc');
  assert.equal(safeWritingReturn('/dashboard', 'abc'), '/dashboard');
  for (const bad of ['https://evil.test', '//evil.test', '/\\evil.test', '/register', '/dashboard/../register', '/learn\r\nLocation:bad']) {
    assert.equal(safeWritingReturn(bad, 'abc'), '/learn?course=abc');
  }
  assert.equal(safeWritingReturn(null, null), '/dashboard');
});

test('mastery and learned counts include only characters in the chosen writing system', () => {
  const characters = [{ id: 'a' }, { id: 'b' }];
  const progress = [
    { character_id: 'a', status: 'learned', mastery_score: 25 },
    { character_id: 'b', status: 'learning', mastery_score: 0 },
    { character_id: 'foreign', status: 'mastered', mastery_score: 100 },
  ];
  assert.deepEqual(writingSummary(characters, progress), { learned: 1, mastery: 13 });
  assert.deepEqual(writingSummary([], progress), { learned: 0, mastery: 0 });
});

test('catalog covers Japanese categories and leaves future-language content unclaimed', () => {
  assert.equal(content.characters.length, 241);
  assert.equal(new Set(content.characters.map(c => c.id)).size, 241);
  for (const slug of ['hiragana', 'katakana', 'kanji']) {
    const system = content.systems.find(s => s.language === 'ja' && s.slug === slug);
    assert.ok(system);
    const characters = content.characters.filter(c => c.writing_system_id === system.id);
    assert.ok(characters.length > 20);
    assert.equal(new Set(characters.map(c => c.slug)).size, characters.length);
  }
  assert.equal(content.systems.filter(s => s.language === 'ko').length, 3);
  assert.equal(content.systems.filter(s => s.language === 'es').length, 3);
  assert.ok(content.characters.every(c => c.audio_url === null));
});

test('every demonstration retains the exact stroke paths and order of its source glyphs', () => {
  for (const character of content.characters) {
    assert.ok(character.stroke_data, character.character);
    const expected = [...character.character].flatMap((glyph, i) => {
      const hex = glyph.codePointAt(0).toString(16).padStart(5, '0');
      const svg = readFileSync(new URL(`../public/writing/kanjivg/${hex}.svg`, import.meta.url), 'utf8');
      assert.match(svg, /Attribution-Share Alike 3.0/);
      return [...svg.matchAll(/<path\b[^>]*\bid="kvg:[^"]+-s(\d+)"[^>]*\bd="([^"]+)"/g)].map((m,index) => {
        assert.equal(Number(m[1]), index + 1);
        return { d: m[2], x: i * 109 };
      });
    });
    assert.deepEqual(character.stroke_data.paths, expected, character.character);
    assert.equal(character.stroke_count, expected.length);
  }
  assert.equal(content.characters.find(c => c.character === 'あ').stroke_count, 3);
});
