# Data Model: MediaHive Core Architecture

## Database Schemas

### 1. Tenants
Tracks isolated tenant organization profiles.
* `id`: UUID (Primary Key)
* `name`: Text
* `created_at`: Timestamp

### 2. Users
User accounts linked to a tenant with role definitions.
* `id`: UUID (Primary Key)
* `tenant_id`: UUID (Foreign Key references Tenants.id)
* `email`: Text
* `role`: Enum ('admin', 'manager', 'member', 'guest')

### 3. PresenceLogs
Logs field check-ins and NFC scan sessions.
* `id`: UUID (Primary Key)
* `tenant_id`: UUID (Foreign Key references Tenants.id)
* `user_id`: UUID (Foreign Key references Users.id)
* `scanned_tag`: Text
* `timestamp`: Timestamp

### 4. DeviceTokens
Tracks registered push tokens along with version states.
* `id`: UUID (Primary Key)
* `user_id`: UUID (Foreign Key references Users.id)
* `token`: Text
* `app_version`: Text
* `build_number`: Text
