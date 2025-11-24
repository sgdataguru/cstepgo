SELECT u.id, u.name, u.role, d.id as driver_id, d.status FROM "User" u LEFT JOIN "Driver" d ON u.id = d."userId" WHERE u.id = 'test-driver-123';
