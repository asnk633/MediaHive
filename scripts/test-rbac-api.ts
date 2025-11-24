
import { spawn } from 'child_process';

async function runTest() {
    console.log('Starting RBAC API Tests...');

    const baseUrl = 'http://localhost:3000/api';

    // Mock Users (IDs should match seed data or we assume they exist)
    // Assuming: 1=Admin, 2=Team, 3=Guest (based on typical seed)
    // If not sure, we might need to create them or check DB. 
    // For now, let's assume ID 1 is Admin.
    const ADMIN_ID = '1';
    const TEAM_ID = '2'; // We might need to verify if this exists
    const GUEST_ID = '3'; // We might need to verify if this exists

    // Helper to make requests
    async function request(method: string, endpoint: string, userId: string, body?: any) {
        try {
            const res = await fetch(`${baseUrl}${endpoint}`, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-id': userId
                },
                body: body ? JSON.stringify(body) : undefined
            });
            return res;
        } catch (e) {
            console.error(`Request failed: ${method} ${endpoint}`, e);
            return null;
        }
    }

    // 1. Test Guest Restrictions
    console.log('\n[Test 1] Guest Access Control');

    // Guest trying to create via standard task endpoint (should fail or be restricted)
    // Actually, standard endpoint allows create:tasks, and Guest has create:tasks.
    // But logic in POST /api/tasks might restrict fields.
    const guestTaskRes = await request('POST', '/tasks', GUEST_ID, { title: 'Guest Task via Standard API' });
    console.log(`Guest POST /tasks: ${guestTaskRes?.status} (Expected 201 but with restrictions)`);

    // Guest trying to DELETE (should fail)
    const guestDeleteRes = await request('DELETE', '/tasks', GUEST_ID, { id: 9999 }); // ID doesn't matter for 403 check usually
    console.log(`Guest DELETE /tasks: ${guestDeleteRes?.status} (Expected 403)`);

    // Guest trying to create via Guest Endpoint (should succeed)
    const guestSpecialRes = await request('POST', '/guest-tasks/create', GUEST_ID, { title: 'Guest Task via Special API' });
    console.log(`Guest POST /guest-tasks/create: ${guestSpecialRes?.status} (Expected 201)`);


    // 2. Test Team Access
    console.log('\n[Test 2] Team Access Control');

    // Team creating task
    const teamTaskRes = await request('POST', '/tasks', TEAM_ID, { title: 'Team Task', priority: 'high' });
    console.log(`Team POST /tasks: ${teamTaskRes?.status} (Expected 201)`);

    // Team creating event (should succeed)
    const teamEventRes = await request('POST', '/events', TEAM_ID, { title: 'Team Event', startTime: new Date().toISOString(), endTime: new Date().toISOString() });
    console.log(`Team POST /events: ${teamEventRes?.status} (Expected 201)`);


    // 3. Test Admin Access
    console.log('\n[Test 3] Admin Access Control');

    // Admin delete (should succeed if task exists, or 404 if not, but not 403)
    // Let's try to delete a non-existent task to check auth passes
    const adminDeleteRes = await request('DELETE', '/tasks', ADMIN_ID, { id: 99999 });
    console.log(`Admin DELETE /tasks: ${adminDeleteRes?.status} (Expected 404 or 200, not 403)`);

    console.log('\nTests Completed.');
}

runTest();
