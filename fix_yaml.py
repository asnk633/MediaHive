with open(".github/workflows/e2e-mocked-ui.yml", "r") as f:
    content = f.read()

new_content = content.replace(
    '  NEXT_PUBLIC_FIREBASE_APP_ID: "1:123:web:ci_dummy"',
    '''  NEXT_PUBLIC_FIREBASE_APP_ID: "1:123:web:ci_dummy"

  E2E_ADMIN_EMAIL: "admin@example.com"
  E2E_ADMIN_PASSWORD: "password"
  E2E_GUEST_EMAIL: "guest@example.com"
  E2E_GUEST_PASSWORD: "password"
  E2E_MEMBER_EMAIL: "member@example.com"
  E2E_MEMBER_PASSWORD: "password"
  SUPABASE_URL: "http://localhost:54321"
  SUPABASE_SERVICE_ROLE_KEY: "dummy"'''
)

with open(".github/workflows/e2e-mocked-ui.yml", "w") as f:
    f.write(new_content)
