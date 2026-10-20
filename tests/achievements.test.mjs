import assert from 'node:assert/strict';
import {test} from 'node:test';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
function load(file,imports={}) {
 const code=ts.transpileModule(fs.readFileSync(new URL('../'+file,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const exports={};vm.runInNewContext(code,{exports,URL,require(name){if(name in imports)return imports[name];throw new Error(name);}});return exports;
}
const core=load('lib/achievements.ts');
test('saved ownership stays unlocked; unknown requirements never become eligible',()=>{
 assert.equal(core.awardState({unlocked_at:'2026-10-20',progress:0,requirement_value:10}),'unlocked');
 assert.equal(core.awardState({unlocked_at:null,progress:10,requirement_value:10}),'ready');
 assert.equal(core.awardState({unlocked_at:null,progress:null,requirement_value:10}),'locked');
 assert.equal(core.awardProgress('writing',{}),null);
 assert.equal(core.awardProgress('lessons_completed',{lessons_completed:0}),0);
});
const id='ace00001-0000-4000-8000-000000000001';
const request=(body,origin='http://localhost:3000')=>({url:'http://localhost:3000/api/achievements',headers:{get:()=>origin},json:async()=>body});
function api({signedIn=true,fail=false,duplicate=false}={}){
 const calls=[];const client={auth:{getUser:async()=>({data:{user:signedIn?{id:'owner'}:null},error:null})},rpc:async(name,args)=>{calls.push({name,args});return fail?{error:{message:'Not eligible'}}:{data:{already_claimed:duplicate,xp:duplicate?0:10,coins:duplicate?0:10}};}};
 return {...load('app/api/achievements/route.ts',{'next/server':{NextResponse:{json:(body,options)=>({body,status:options?.status??200})}},'@/lib/supabase/server':{createClient:async()=>client},'@/lib/achievements':core}),calls};
}
test('award collection requires authentication and same-origin writes',async()=>{
 assert.equal((await api({signedIn:false}).POST(request({achievementId:id}))).status,401);
 const routes=api();assert.equal((await routes.POST(request({achievementId:id},'https://other.example'))).status,403);assert.equal(routes.calls.length,0);
});
test('client-authored reward amounts are rejected; only the award ID reaches SQL',async()=>{
 const routes=api();assert.equal((await routes.POST(request({achievementId:id,xp:9999}))).status,400);
 const result=await routes.POST(request({achievementId:id}));assert.equal(result.body.xp,10);
 assert.equal(routes.calls.length,1);assert.equal(routes.calls[0].args.p_achievement,id);assert.equal(Object.keys(routes.calls[0].args).length,1);
});
test('duplicates return zero and failed eligibility produces no success response',async()=>{
 const duplicate=await api({duplicate:true}).POST(request({achievementId:id}));assert.equal(duplicate.body.already_claimed,true);assert.equal(duplicate.body.coins,0);
 const failure=await api({fail:true}).POST(request({achievementId:id}));assert.equal(failure.status,400);assert.equal(failure.body.xp,undefined);
});
