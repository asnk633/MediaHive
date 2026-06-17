sed -i 's/localStorage.clear();/ /g' e2e/playwright/helpers/auth.ts
sed -i 's/sessionStorage.clear();/ /g' e2e/playwright/helpers/auth.ts
sed -i 's/${role}/'"'"' + role + '"'"'/g' e2e/playwright/helpers/auth.ts
