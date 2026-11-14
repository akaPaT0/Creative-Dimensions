import {readFile, writeFile, mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
const apply=process.argv.includes('--apply');
const updates=JSON.parse(await readFile(new URL('../catalog/christmas-personalization-2026.json',import.meta.url),'utf8'));
const base=process.env.NEXT_PUBLIC_SUPABASE_URL;
assert.equal(new URL(base).hostname,'ypevaawhxhupjxjgkwdp.supabase.co');
const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
const headers={apikey:key,Authorization:`Bearer ${key}`};
async function request(path,options={}) {const r=await fetch(base+path,{...options,headers:{...headers,...options.headers}});assert(r.ok,`Product request failed: ${r.status}`);return r;}
const before=await (await request('/rest/v1/products?select=*&limit=1000')).json();
for(const u of updates){const rows=before.filter(p=>p.SKU===u.SKU);assert.equal(rows.length,1);assert([u.originalDescription,u.description].includes(rows[0].description));if(rows[0].personalization!=null)assert.deepEqual(rows[0].personalization,u.personalization);}
if(apply){
 await mkdir('.vercel/christmas-release',{recursive:true});await writeFile('.vercel/christmas-release/before-personalization.json',JSON.stringify(before,null,2));
 for(const u of updates){const current=before.find(p=>p.SKU===u.SKU);const query=new URLSearchParams({SKU:`eq.${u.SKU}`,description:`eq.${current.description}`});const rows=await(await request('/rest/v1/products?'+query,{method:'PATCH',headers:{'Content-Type':'application/json',Prefer:'return=representation'},body:JSON.stringify({description:u.description,personalization:u.personalization})})).json();assert.equal(rows.length,1);}
 const after=await(await request('/rest/v1/products?select=*&limit=1000')).json();
 for(const p of before){const actual=after.find(a=>a.SKU===p.SKU);const u=updates.find(u=>u.SKU===p.SKU);assert.deepEqual(actual,u?{...p,description:u.description,personalization:u.personalization}:p);}
 console.log('Enabled names on eight Christmas listings; every other field and product unchanged.');
}else console.log('Dry run: eight name-based Christmas listings validated.');
