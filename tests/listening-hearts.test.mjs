import assert from 'node:assert/strict';
import {test} from 'node:test';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const uuid='00000000-0000-4000-8000-000000000001';
const body={lessonId:uuid,questionId:uuid,answer:"hello"};
function api({signedIn=true,missing=false,fail=false,quiz=false}={}) {
 const calls=[];const client={auth:{getUser:async()=>({data:{user:signedIn?{id:uuid}:null},error:null})},rpc:async(name,args)=>{
  calls.push({name,args});return missing?{error:{code:'PGRST202'}}:fail?{error:{code:'XX000'}}:{data:{hearts:4,available:true,next_heart_at:'2026-10-20T01:10:00Z',server_now:'2026-10-20T01:00:00Z',correct:false,blocked:false}};
 },from(){return {select(){return this;},eq(){return this;},single:async()=>({data:{hearts:3},error:null})};}};
 const code=ts.transpileModule(fs.readFileSync(new URL(quiz?'../app/api/quiz/route.ts':'../app/api/hearts/route.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const exports={};vm.runInNewContext(code,{exports,URL,Date,require(name){if(name==='next/server')return {NextResponse:{json:(body,options)=>({body,status:options?.status??200})}};return {createClient:async()=>client};}});return {...exports,calls};
}
const request=(value=body,origin='http://localhost:3000')=>({url:'http://localhost:3000/api/hearts',headers:{get:()=>origin},json:async()=>value});
test('heart reads and submissions require sign-in; cross-site submissions are rejected',async()=>{
 assert.equal((await api({signedIn:false}).GET()).status,401);
 assert.equal((await api({signedIn:false,quiz:true}).POST(request())).status,401);
 const routes=api({quiz:true});assert.equal((await routes.POST(request(body,'https://elsewhere.example'))).status,403);assert.equal(routes.calls.length,0);
});
test('clients cannot author correctness, heart amounts or recovery timestamps',async()=>{
 const routes=api({quiz:true});assert.equal((await routes.POST(request({...body,correct:true}))).status,400);
 const result=await routes.POST(request());assert.equal(result.body.correct,false);assert.equal(result.body.hearts,4);
 assert.deepEqual(Object.keys(routes.calls[0].args).sort(),['p_answer','p_lesson','p_question']);
});
test('missing activation returns the saved balance without claiming recovery is active',async()=>{
 const result=await api({missing:true}).GET();assert.equal(result.body.available,false);assert.equal(result.body.hearts,3);assert.equal(result.body.next_heart_at,null);
 assert.equal((await api({missing:true,quiz:true}).POST(request())).status,400);
});
test('database failures remain errors instead of fake heart snapshots',async()=>{
 assert.equal((await api({fail:true}).GET()).status,500);assert.equal((await api({fail:true,quiz:true}).POST(request())).status,400);
});
