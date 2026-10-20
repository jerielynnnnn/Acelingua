import assert from 'node:assert/strict';
import {test} from 'node:test';
import {startVoiceRecording} from '../lib/voice-recording.ts';
function harness({failStart=false,empty=false,delayed=false}={}) {
 let released=0,engine;const clips=[],errors=[];
 const stream={getTracks:()=>[{stop(){released++;}}]};
 class Recorder {
  constructor(){engine=this;this.state='inactive';this.mimeType='audio/webm';}
  start(){if(failStart)throw new Error('capture failed');this.state='recording';}
  stop(){this.state='inactive';if(!delayed)this.complete();}
  complete(){this.ondataavailable?.({data:new Blob(empty?[]:['real audio bytes'],{type:this.mimeType})});this.onstop?.();}
 }
 const start=()=>startVoiceRecording(stream,{onReady:clip=>clips.push(clip),onError:()=>errors.push('error')},Recorder);
 return {start,clips,errors,get engine(){return engine;},get released(){return released;}};
}
test('finishing produces a playable audio blob and releases the microphone',()=>{
 const h=harness();const capture=h.start();capture.finish();
 assert.equal(h.clips.length,1);assert.equal(h.clips[0].type,'audio/webm');assert.ok(h.clips[0].size>0);assert.ok(h.released>0);
});
test('cancel discards audio rather than publishing a playback clip',()=>{
 const h=harness();const capture=h.start();capture.cancel();assert.equal(h.clips.length,0);assert.equal(h.errors.length,0);assert.ok(h.released>0);
});
test('late stop events from a cancelled capture never publish a clip',()=>{
 const h=harness({delayed:true});const capture=h.start();capture.finish();capture.cancel();h.engine.complete();assert.equal(h.clips.length,0);
});
test('empty recordings are reported and startup failures release the microphone',()=>{
 const empty=harness({empty:true});empty.start().finish();assert.equal(empty.clips.length,0);assert.equal(empty.errors.length,1);
 const fail=harness({failStart:true});assert.throws(fail.start,/could not start/);assert.ok(fail.released>0);
});
