
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
build_log_v9.m ...
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
 Γ£ô Compiled successfully in 13.5s
   Running TypeScript ...
Failed to compile.

./src/components/task
s/AttachmentActivityL
og.tsx:108:34
Type error: Cannot 
find name 'Clock'. 
Did you mean 'Lock'?

[0m [90m 106 
|[39m               
              [33m<
[39m[33m/[39m[33md
iv[39m[33m>[39m
 [90m 107 |[39m    
                     
    [33m<[39m[33md
iv[39m className[33
m=[39m[32m"text-[10
px] text-slate-600 
mt-1 flex 
items-center gap-2"[
39m[33m>[39m
[31m[1m>[22m[39m
[90m 108 |[39m      
                     
      [33m<[39m[33
mClock[39m size[33m
=[39m{[35m10[39m} 
[33m/[39m[33m>[39
m
 [90m     |[39m    
                     
         
[31m[1m^[22m[39m
 [90m 109 |[39m    
                     
        {format([36m
new[39m [33mDate[3
9m(log[33m.[39mtime
stamp)[33m,[39m 
[32m'MMM dd, h:mm 
a'[39m)}
 [90m 110 |[39m    
                     
    [33m<[39m[33m/
[39m[33mdiv[39m[3
3m>[39m
 [90m 111 |[39m    
                     
[33m<[39m[33m/[39
m[33mdiv[39m[33m>
[39m[0m
Next.js build worker 
exited with code: 1 
and signal: null
