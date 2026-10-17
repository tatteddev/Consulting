import assert from "node:assert/strict";
import test from "node:test";
import { createContactHandler } from "../server/contact.mjs";
const origin="http://127.0.0.1:4173";
const env={RESEND_API_KEY:"test-only-key",CONTACT_FROM_EMAIL:"Consulting <inquiries@mail.example.test>",CONTACT_ORIGIN:origin};
const values={name:"Alex Example",email:"alex@example.test",topic:"Practical AI workflows",message:"Please review our current engineering workflows.",website:"",requestId:"2c6700b6-77ae-4cb2-9ac3-329d7afbfba5"};
function request(changes={}, headers={}) {return new Request(origin+"/api/contact",{method:"POST",headers:{"Content-Type":"application/json",Origin:origin,...headers},body:JSON.stringify({...values,...changes})});}
const accepted=()=>Promise.resolve(Response.json({id:"provider-message-id"}));
test("provider-backed send fixes recipient, uses reply-to, and sends plain text",async()=>{
 let payload,options;
 const send=createContactHandler({env,fetchEmail:async(url,init)=>{assert.equal(url,"https://api.resend.com/emails");options=init;payload=JSON.parse(init.body);return accepted();}});
 const response=await send(request({to:"attacker@example.test",message:"A <script> is literal text in this inquiry, not HTML."}));
 assert.equal(response.status,200);assert.deepEqual(payload.to,["oleg.novoselskyy@gmail.com"]);assert.equal(payload.reply_to,values.email);assert.equal(payload.html,undefined);assert.match(payload.text,/<script>/);assert.match(options.headers.Authorization,/^Bearer /);
});
test("duplicate retry preserves provider idempotency key; edited message changes it",async()=>{
 const keys=[];const send=createContactHandler({env,fetchEmail:async(_url,init)=>{keys.push(init.headers["Idempotency-Key"]);return accepted();}});
 await send(request());await send(request());await send(request({message:"A materially different consulting request for review."}));
 assert.equal(keys[0],keys[1]);assert.notEqual(keys[1],keys[2]);
});
test("cross-origin requests cannot trigger email",async()=>{
 const send=createContactHandler({env,fetchEmail:()=>assert.fail("must not send")});
 assert.equal((await send(request({}, {Origin:"https://other.test"}))).status,403);
});
test("invalid fields and honeypot are rejected without sending",async()=>{
 const send=createContactHandler({env,fetchEmail:()=>assert.fail("must not send")});
 for(const change of [{name:"   "},{name:"Alex\r\nBcc: other@example.test"},{email:"not-an-email"},{message:" ".repeat(20)},{message:"x".repeat(2501)},{topic:"Unknown"},{website:"spam"},{requestId:"invalid"}]) assert.equal((await send(request(change))).status,400);
});
test("bounded payload rejects oversized bodies",async()=>{
 const send=createContactHandler({env,fetchEmail:()=>assert.fail("must not send")});
 assert.equal((await send(request({message:"x".repeat(17000)}))).status,413);
});
test("unconfigured provider fails honestly",async()=>{
 const send=createContactHandler({env:{CONTACT_ORIGIN:origin},fetchEmail:()=>assert.fail("must not send")});
 const response=await send(request());assert.equal(response.status,503);assert.equal((await response.json()).ok,undefined);
});
test("provider rejection or malformed success never claims success",async()=>{
 for(const response of [Response.json({error:"private provider detail"},{status:403}),Response.json({})]) {
 const send=createContactHandler({env,fetchEmail:async()=>response});const result=await send(request());assert.equal(result.status,502);assert.doesNotMatch(await result.text(),/private provider detail/);
 }
});
test("ambiguous network failure gives a retryable error",async()=>{
 const send=createContactHandler({env,fetchEmail:async()=>{throw Error("secret provider connection details");}});
 const response=await send(request());assert.equal(response.status,502);assert.doesNotMatch(await response.text(),/secret/);
});
test("rate limit blocks a sixth request and expires",async()=>{
 let time=1;let sent=0;const send=createContactHandler({env,now:()=>time,fetchEmail:()=>{sent++;return accepted();}});
 for(let i=0;i<5;i++) assert.equal((await send(request(),{ip:"test-client"})).status,200);
 assert.equal((await send(request(),{ip:"test-client"})).status,429);assert.equal(sent,5);
 time+=3_600_001;assert.equal((await send(request(),{ip:"test-client"})).status,200);
});
test("non-POST and wrong content type are rejected",async()=>{
 const send=createContactHandler({env,fetchEmail:()=>assert.fail("must not send")});
 assert.equal((await send(new Request(origin+"/api/contact"))).status,405);
 assert.equal((await send(request({},{"Content-Type":"text/plain"}))).status,415);
});
