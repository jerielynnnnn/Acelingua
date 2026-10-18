import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import ts from 'typescript';

async function load(name) {
  const source = readFileSync(new URL(`../lib/writing/${name}.ts`, import.meta.url), 'utf8');
  const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 } }).outputText;
  return import(`data:text/javascript;base64,${Buffer.from(output).toString('base64')}`);
}
const { writingCourse } = await load('course-curriculum');
const { checkWritingAnswer } = await load('sentence-check');
const { advanceWorkbookProgress } = await load('workbook-progress');
const exercise = (lesson,slug) => writingCourse.find(l => l.slug === lesson).exercises.find(e => e.slug === slug);

test('workbook begins with an introduction and the first Hiragana before word and sentence lessons', () => {
  assert.equal(writingCourse[0].slug, 'writing-introduction');
  assert.equal(writingCourse[2].slug, 'hiragana-a');
  assert.equal(writingCourse.at(-1).slug, 'writing-review');
  assert.equal(new Set(writingCourse.map(l => l.slug)).size, writingCourse.length);
  for (const lesson of writingCourse) {
    assert.ok(lesson.blocks.length && lesson.exercises.length);
    assert.equal(new Set(lesson.exercises.map(e => e.slug)).size, lesson.exercises.length);
    for (const e of lesson.exercises) {
      assert.equal(checkWritingAnswer(e, e.answer).correct, true, `${lesson.slug}/${e.slug}`);
      for (const alternative of e.alternatives ?? []) assert.equal(checkWritingAnswer(e, alternative).correct, true, alternative);
      if (e.tiles) assert.equal(e.tiles.join('').length, e.answer.replace(/[。]/g,'').length);
    }
  }
});

test('sentence checks accept Japanese orthography, whitespace, punctuation and mixed Kana/Kanji', () => {
  const student = exercise('topic-wa','student');
  for (const value of ['私は学生です。','わたしは がくせい です！','わたしは学生です','私はがくせいです。']) assert.equal(checkWritingAnswer(student,value).correct, true,value);
  const book = exercise('everyday-sentences','read-book');
  assert.equal(checkWritingAnswer(book,'わたし は ほん を 読みます。').correct,true);
  assert.equal(checkWritingAnswer(exercise('likes','like-cats'),'猫がすきです').correct,true);
});

test('incorrect particles, missing endings, and inverted tile order receive useful feedback', () => {
  assert.match(checkWritingAnswer(exercise('topic-wa','student'),'私が学生です').feedback,/particle は/);
  assert.match(checkWritingAnswer(exercise('questions-ka','student-question'),'学生です').feedback,/particle か/);
  assert.match(checkWritingAnswer(exercise('objects-and-verbs','drink-water'),'水を飲む').feedback,/ending/);
  assert.equal(checkWritingAnswer(exercise('polite-statements','cat-statement'),'ですねこ').correct,false);
  assert.match(checkWritingAnswer(exercise('topic-wa','student'),'watashi wa gakusei desu').feedback,/IME/);
  assert.equal(checkWritingAnswer(exercise('dislikes','not-coffee'),'コーヒーが好きです').correct,false);
  assert.equal(checkWritingAnswer(exercise('word-formation','morning'),'あっさ').correct,false);
});

test('workbook progress is isolated, idempotent, and completes only after all activities', () => {
  const lesson=writingCourse[0];
  let progress=advanceWorkbookProgress(lesson,undefined,lesson.exercises[0].slug,false,'2026-10-18T00:00:00Z');
  assert.deepEqual(progress.completed_activities,[]);
  progress=advanceWorkbookProgress(lesson,progress,lesson.exercises[0].slug,true,'2026-10-18T00:00:01Z');
  assert.equal(progress.completed,false);
  progress=advanceWorkbookProgress(lesson,progress,lesson.exercises[0].slug,true,'2026-10-18T00:00:02Z');
  assert.equal(progress.completed_activities.length,1);
  progress=advanceWorkbookProgress(lesson,progress,lesson.exercises[1].slug,true,'2026-10-18T00:00:03Z');
  assert.equal(progress.completed,true);
  const other=advanceWorkbookProgress(writingCourse[1],progress,writingCourse[1].exercises[0].slug,true,'2026-10-18T00:00:04Z');
  assert.equal(other.completed,false);
  assert.equal(other.completed_activities.length,1);
  assert.throws(()=>advanceWorkbookProgress(lesson,progress,'ordinary-lesson-id',true,'now'));
});
