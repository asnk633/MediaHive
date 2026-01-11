
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
build_log_v8.m ...
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

./src/app/api/tasks/[
id]/attachments/route
.ts:6:43
Type error: Module 
'"@/types/task"' has 
no exported member 
'AttachmentLog'.

[0m [90m 4 |[39m 
[36mimport[39m 
[33m*[39m 
[36mas[39m admin 
[36mfrom[39m [32m'
firebase-admin'[39m
[33m;[39m
 [90m 5 |[39m 
[36mimport[39m { ge
tDriveClient[33m,[3
9m ensureFolderPath[
33m,[39m makeFilePub
lic[33m,[39m makeFi
lePrivate[33m,[39m 
[33mDRIVE_CONFIG[39
m } [36mfrom[39m [
32m'@/lib/drive'[39m
[33m;[39m
[31m[1m>[22m[39m
[90m 6 |[39m 
[36mimport[39m { [
33mTask[39m[33m,[3
9m [33mTaskFile[39m
[33m,[39m [33mTask
FileSection[39m[33m
,[39m [33mAttachmen
tLog[39m } 
[36mfrom[39m [32m'
@/types/task'[39m[3
3m;[39m
 [90m   |[39m      
                     
                
[31m[1m^[22m[39m
 [90m 7 |[39m 
[36mimport[39m { 
[33mReadable[39m } 
[36mfrom[39m [32m'
stream'[39m[33m;[3
9m
 [90m 8 |[39m 
[36mimport[39m { 
randomUUID } 
[36mfrom[39m [32m'
crypto'[39m[33m;[3
9m
 [90m 9 |[39m[0m
Next.js build worker 
exited with code: 1 
and signal: null
