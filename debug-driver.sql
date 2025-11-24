-- Simple driver verification and debug
SELECT 
    'User Check' as check_type,
    COUNT(*) as count
FROM "User" 
WHERE id = 'test-driver-123'

UNION ALL

SELECT 
    'Driver Check' as check_type,
    COUNT(*) as count
FROM "Driver" 
WHERE id = 'test-driver-123'

UNION ALL

SELECT 
    'Driver with User Check' as check_type,
    COUNT(*) as count
FROM "Driver" d
JOIN "User" u ON d."userId" = u.id
WHERE d.id = 'test-driver-123';
