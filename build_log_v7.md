
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
build_log_v7.m ...
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
 Γ£ô Compiled successfully in 13.4s
   Running TypeScript ...
Failed to compile.

./src/services/events
.ts:167:43
Type error: Argument 
of type '{ title: 
string; description: 
string; status: 
"todo"; priority: 
"medium"; 
department: string | 
undefined; dueDate: 
any; assignedTo: 
never[]; assignedBy: 
{ uid: string; name: 
string; role: 
string; }; 
createdBy: { ...; }; 
eventId: any; files: 
never[]; ratedAt: 
null; }' is not 
assignable to 
parameter of type 
'Omit<Task, "id" | 
"createdAt">'.
  Types of property 
'department' are 
incompatible.
    Type 'string | 
undefined' is not 
assignable to type 
'string'.
      Type 
'undefined' is not 
assignable to type 
'string'.

[0m [90m 165 
|[39m               
  }[33m;[39m
 [90m 166 |[39m
[31m[1m>[22m[39m
[90m 167 |[39m      
           
[36mawait[39m [33m
TaskService[39m[33m
.[39maddTask(mediaTa
sk)[33m;[39m
 [90m     |[39m    
                     
                  
[31m[1m^[22m[39m
 [90m 168 |[39m    
         }
 [90m 169 |[39m
 [90m 170 |[39m    
         
[36mreturn[39m resp
onse[33m.[39mdata[
33m;[39m[0m
Next.js build worker 
exited with code: 1 
and signal: null
