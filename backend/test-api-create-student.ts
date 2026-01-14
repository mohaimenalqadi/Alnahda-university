// Test script to call the API endpoint directly
// Run with: npx ts-node test-api-create-student.ts

async function testCreateStudent() {
    console.log('Testing student creation via API...\n');

    // First, login as admin to get cookies
    const loginResponse = await fetch('http://localhost:4000/api/v1/auth/admin/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': '1',
        },
        body: JSON.stringify({
            email: 'admin@alnahda.edu.ly',
            password: 'Admin@123456',
        }),
    });

    if (!loginResponse.ok) {
        console.log('❌ Login failed:', await loginResponse.text());
        return;
    }

    const cookies = loginResponse.headers.get('set-cookie');
    console.log('✅ Login successful');
    console.log('Cookies:', cookies?.substring(0, 100) + '...\n');

    // Get departments
    const deptResponse = await fetch('http://localhost:4000/api/v1/admin/departments', {
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': '1',
            'Cookie': cookies || '',
        },
    });

    if (!deptResponse.ok) {
        console.log('❌ Get departments failed:', await deptResponse.text());
        return;
    }

    const departments = await deptResponse.json();
    console.log('✅ Got departments:', departments.length);

    if (departments.length === 0) {
        console.log('❌ No departments found');
        return;
    }

    const departmentId = departments[0].id;
    console.log('Using department:', departmentId, '\n');

    // Create student
    const studentData = {
        fullNameAr: 'طالب اختبار API',
        fullNameEn: 'API Test Student',
        email: 'api-test-' + Date.now() + '@example.com',
        registrationNumber: 'API-TEST-' + Date.now(),
        dateOfBirth: '2000-01-15',
        academicYear: 2024,
        semesterLevel: 1,
        departmentId: departmentId,
    };

    console.log('Creating student with data:', JSON.stringify(studentData, null, 2));

    const createResponse = await fetch('http://localhost:4000/api/v1/admin/students', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': '1',
            'Cookie': cookies || '',
        },
        body: JSON.stringify(studentData),
    });

    console.log('\nResponse status:', createResponse.status, createResponse.statusText);

    const responseBody = await createResponse.text();
    try {
        const json = JSON.parse(responseBody);
        console.log('Response body:', JSON.stringify(json, null, 2));
    } catch {
        console.log('Response body (raw):', responseBody);
    }

    if (createResponse.ok) {
        console.log('\n✅ Student created successfully!');
    } else {
        console.log('\n❌ Student creation failed!');
    }
}

testCreateStudent().catch(console.error);
