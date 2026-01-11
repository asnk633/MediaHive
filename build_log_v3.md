
> thaiba-garden-media-manager@0.1.1 build
> next build

npm :  ΓÜá `eslint` 
configuration in 
next.config.mjs is 
no longer supported. 
See more info here: h
ttps://nextjs.org/doc
s/app/api-reference/c
li/next#next-lint-opt
ions
At line:1 char:1
+ npm run build 2>&1 
| Out-File -Encoding 
utf8 -FilePath 
build_log_v3.m ...
+ ~~~~~~~~~~~~~~~~~~
    + CategoryInfo   
           : NotSpe  
  cified: ( ΓÜá `e   
 slint` c...xt-li    
nt-options:Strin    
g) [], RemoteExc    
eption
    + FullyQualified 
   ErrorId : Native  
  CommandError
 
 ΓÜá Invalid 
next.config.mjs 
options detected: 
 ΓÜá     
Unrecognized key(s) 
in object: 'eslint'
 ΓÜá See more info 
here: https://nextjs.
org/docs/messages/inv
alid-next-config
   Γû▓ Next.js 16.0.7 (Turbopack)
   - Environments: .env.local, .env
   - Experiments (use with caution):
     Γ¿» clientRouterFilter
     ┬╖ optimizePackageImports
     ┬╖ proxyClientMaxBodySize: "10gb"
     ┬╖ serverActions

 ΓÜá The 
"middleware" file 
convention is 
deprecated. Please 
use "proxy" instead. 
Learn more: https://n
extjs.org/docs/messag
es/middleware-to-prox
y
   Creating an optimized production build ...
 Γ£ô Compiled successfully in 13.4s
   Running TypeScript ...
Failed to compile.

./src/app/api/tasks/[
id]/attachments/route
.ts:113:17
Type error: Type 
'string | undefined' 
is not assignable to 
type 'string'.
  Type 'undefined' 
is not assignable to 
type 'string'.

[0m [90m 111 
|[39m               
  uid[33m:[39m user
[33m.[39muid[33m,
[39m
 [90m 112 |[39m    
             
name[33m:[39m 
user[33m.[39mname 
[33m||[39m 
user[33m.[39memail 
[33m||[39m [32m'Un
known'[39m[33m,[39
m
[31m[1m>[22m[39m
[90m 113 |[39m      
           
role[33m:[39m 
user[33m.[39mrole
 [90m     |[39m    
             
[31m[1m^[22m[39m
 [90m 114 |[39m    
         }[33m,[39m
 [90m 115 |[39m    
         uploadedAt[
33m:[39m 
[36mnew[39m [33mDa
te[39m()[33m.[39mt
oISOString()
 [90m 116 |[39m    
     }[33m;[39m[0m
Next.js build worker 
exited with code: 1 
and signal: null
