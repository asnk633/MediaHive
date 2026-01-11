
> thaiba-garden-media-manager@0.1.1 build
> next build

   Γû▓ Next.js 16.0.7 (Turbopack)
   - Environments: .env.local, .env
   - Experiments (use with caution):
     Γ¿» clientRouterFilter
     ┬╖ optimizePackageImports
     ┬╖ proxyClientMaxBodySize: "10gb"
     ┬╖ serverActions

npm :  ΓÜá The 
"middleware" file 
convention is 
deprecated. Please 
use "proxy" instead. 
Learn more: https://n
extjs.org/docs/messag
es/middleware-to-prox
y
At line:1 char:1
+ npm run build 2>&1 
| Out-File -Encoding 
utf8 -FilePath 
build_log_utf8 ...
+ ~~~~~~~~~~~~~~~~~~
    + CategoryInfo   
           : NotSpe  
  cified: ( ΓÜá Th   
 e "middl...lewar    
e-to-proxy:Strin    
g) [], RemoteExc    
eption
    + FullyQualified 
   ErrorId : Native  
  CommandError
 
   Creating an optimized production build ...
 Γ£ô Compiled successfully in 13.9s
   Running TypeScript ...
Failed to compile.

./src/app/(shell)/tas
ks/new/page.tsx:406:6
6
Type error: This 
comparison appears 
to be unintentional 
because the types 
'string' and 
'number' have no 
overlap.

[0m [90m 404 
|[39m               
          
[36mif[39m (val[33
m.[39mstartsWith([3
2m'dept_'[39m)) {
 [90m 405 |[39m    
                     
  [36mconst[39m id 
[33m=[39m parseInt(
val[33m.[39msplit(
[32m'_'[39m)[[35m1
[39m])[33m;[39m
[31m[1m>[22m[39m
[90m 406 |[39m      
                     
[36mconst[39m dept 
[33m=[39m departmen
tsList[33m.[39mfind
(d [33m=>[39m 
d[33m.[39mid 
[33m===[39m 
id)[33m;[39m
 [90m     |[39m    
                     
                     
                    
[31m[1m^[22m[39m
 [90m 407 |[39m    
                     
  [36mif[39m 
(dept) setSelectedOrg
(dept[33m.[39mname)
[33m;[39m
 [90m 408 |[39m    
                     
} [36melse[39m 
[36mif[39m (val[33
m.[39mstartsWith([3
2m'inst_'[39m)) {
 [90m 409 |[39m    
                     
  [36mconst[39m id 
[33m=[39m parseInt(
val[33m.[39msplit(
[32m'_'[39m)[[35m1
[39m])[33m;[39m[0m
Next.js build worker 
exited with code: 1 
and signal: null
