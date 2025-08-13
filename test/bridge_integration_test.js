/**
 * Integration Test for Bridge.getUsuariosParaSync function
 * Tests the parameter handling and return structure
 */

console.log('Testing Bridge.getUsuariosParaSync function integration...\n');

// Mock the database config to avoid connection errors
const originalDb = require('../config/config');

// Create a mock database that simulates the corrected behavior
const mockDb = {
  manyOrNone: async (query, params) => {
    console.log('Mock DB Query executed with parameters:', params);
    console.log('Query includes compound cursor logic:', 
      query.includes('> $3::timestamp') && 
      query.includes('= $3::timestamp') && 
      query.includes('u.id > $4::int'));
    
    // Simulate data that demonstrates the pagination fix
    const [updated_since, limit, after_last_update, after_last_id] = params;
    
    // Mock response showing proper pagination behavior
    if (after_last_update === null) {
      // First page
      return [
        { id: 1, matricula: 'A001', nombre: 'User1', last_update: '2025-08-12T22:43:32.124Z' },
        { id: 2, matricula: 'A002', nombre: 'User2', last_update: '2025-08-12T22:43:32.124Z' },
      ];
    } else if (after_last_update === '2025-08-12T22:43:32.124Z' && after_last_id === 2) {
      // Second page - this demonstrates the fix working
      return [
        { id: 3, matricula: 'A003', nombre: 'User3', last_update: '2025-08-12T22:43:32.124Z' },
        { id: 4, matricula: 'A004', nombre: 'User4', last_update: '2025-08-12T22:43:32.124Z' },
      ];
    }
    
    return [];
  }
};

// Temporarily override the db module
require.cache[require.resolve('../config/config')] = {
  exports: mockDb
};

// Now test the Bridge function
const Bridge = require('../models/bridge');

async function testPagination() {
  try {
    console.log('Test 1: First page (no cursor)');
    const page1 = await Bridge.getUsuariosParaSync('2025-08-12T00:00:00.000Z', 2);
    console.log('Page 1 result:', {
      usuarios_count: page1.usuarios.length,
      has_more: page1.has_more,
      next_last_update: page1.next_last_update,
      next_last_id: page1.next_last_id,
      user_ids: page1.usuarios.map(u => u.id)
    });
    
    console.log('\nTest 2: Second page (using cursor from page 1)');
    const page2 = await Bridge.getUsuariosParaSync(
      '2025-08-12T00:00:00.000Z', 
      2, 
      page1.next_last_update, 
      page1.next_last_id
    );
    console.log('Page 2 result:', {
      usuarios_count: page2.usuarios.length,
      has_more: page2.has_more,
      next_last_update: page2.next_last_update,
      next_last_id: page2.next_last_id,
      user_ids: page2.usuarios.map(u => u.id)
    });
    
    // Validate that pagination advances correctly
    const page1Ids = page1.usuarios.map(u => u.id);
    const page2Ids = page2.usuarios.map(u => u.id);
    
    console.log('\n✓ Validation:');
    console.log('Page 1 user IDs:', page1Ids);
    console.log('Page 2 user IDs:', page2Ids);
    
    // Check that there's no overlap between pages
    const hasOverlap = page1Ids.some(id => page2Ids.includes(id));
    console.log('No overlap between pages:', !hasOverlap ? '✓' : '✗');
    
    // Check that page 2 has higher IDs (since timestamps are the same)
    const page2HasHigherIds = page2Ids.every(id => id > Math.max(...page1Ids));
    console.log('Page 2 has higher IDs than page 1:', page2HasHigherIds ? '✓' : '✗');
    
    if (!hasOverlap && page2HasHigherIds) {
      console.log('\n✓ SUCCESS: Pagination fix works correctly!');
      console.log('✓ Users with identical timestamps are properly paginated using ID as tiebreaker');
    } else {
      console.log('\n✗ FAILURE: Pagination issue not resolved');
    }
    
  } catch (error) {
    console.error('Test error:', error.message);
  }
}

// Run the test
testPagination();