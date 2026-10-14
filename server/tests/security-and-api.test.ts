import assert from 'node:assert';
import { isPrivateOrReservedIP, isPrivateIPv4, isPrivateIPv6, validateTargetUrl } from '../services/security.service.js';
import { validateEmail } from '../services/lead.service.js';
import { dbOps } from '../db/index.js';

async function runTests() {
  console.log('--- 1. Testing SSRF Protection ---');

  // IPv4 Private & Reserved
  assert.strictEqual(isPrivateIPv4('127.0.0.1'), true, '127.0.0.1 should be private');
  assert.strictEqual(isPrivateIPv4('127.1.2.3'), true, '127.x should be private');
  assert.strictEqual(isPrivateIPv4('10.0.0.1'), true, '10.x should be private');
  assert.strictEqual(isPrivateIPv4('172.16.0.1'), true, '172.16.x should be private');
  assert.strictEqual(isPrivateIPv4('192.168.1.1'), true, '192.168.x should be private');
  assert.strictEqual(isPrivateIPv4('169.254.169.254'), true, 'Cloud metadata IP should be private');
  assert.strictEqual(isPrivateIPv4('0.0.0.0'), true, '0.0.0.0 should be private');
  assert.strictEqual(isPrivateIPv4('8.8.8.8'), false, '8.8.8.8 should be public');
  assert.strictEqual(isPrivateIPv4('1.1.1.1'), false, '1.1.1.1 should be public');

  // IPv6 Private & Mapped
  assert.strictEqual(isPrivateIPv6('::1'), true, '::1 should be private');
  assert.strictEqual(isPrivateIPv6('::'), true, ':: should be private');
  assert.strictEqual(isPrivateIPv6('fc00::1'), true, 'fc00:: should be private');
  assert.strictEqual(isPrivateIPv6('fe80::1'), true, 'fe80:: should be private');
  assert.strictEqual(isPrivateIPv6('::ffff:127.0.0.1'), true, 'IPv4-mapped 127.0.0.1 should be private');
  assert.strictEqual(isPrivateIPv6('::ffff:169.254.169.254'), true, 'IPv4-mapped metadata IP should be private');

  // URL Level validation
  const testLocalhost = await validateTargetUrl('http://localhost');
  assert.strictEqual(testLocalhost.valid, false, 'localhost must be rejected');

  const testMetadata = await validateTargetUrl('http://169.254.169.254/latest/meta-data');
  assert.strictEqual(testMetadata.valid, false, '169.254.169.254 must be rejected');

  const testInvalidScheme = await validateTargetUrl('ftp://example.com');
  assert.strictEqual(testInvalidScheme.valid, false, 'ftp must be rejected');

  const testBadPort = await validateTargetUrl('https://example.com:22');
  assert.strictEqual(testBadPort.valid, false, 'port 22 must be rejected');

  console.log('✅ SSRF Protection Tests passed');

  console.log('--- 2. Testing Lead & Email Validation ---');
  assert.strictEqual(validateEmail('test@example.com'), true);
  assert.strictEqual(validateEmail('invalid-email'), false);
  assert.strictEqual(validateEmail(''), false);
  console.log('✅ Lead & Email Validation Tests passed');

  console.log('--- 3. Testing Database CRUD & GDPR Deletion ---');
  const testEmail = 'gdpr-test-user@test-domain.fr';
  const testLeadId = 'test-lead-123';
  dbOps.createLead({
    id: testLeadId,
    email: testEmail,
    website_url: 'https://example.com',
    marketing_consent: 0,
    created_at: new Date().toISOString(),
  });

  const savedLead = dbOps.getLeadById(testLeadId);
  assert.ok(savedLead, 'Lead should be saved');
  assert.strictEqual(savedLead.email, testEmail);

  // Test GDPR right to erasure
  const deletedCount = dbOps.deleteLeadAndData(testEmail);
  assert.strictEqual(deletedCount, 1, 'One lead should be deleted');
  assert.strictEqual(dbOps.getLeadById(testLeadId), undefined, 'Lead must not exist after deletion');
  console.log('✅ Database & GDPR erasure Tests passed');

  console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY!');
}

runTests().catch(err => {
  console.error('Test failure:', err);
  process.exit(1);
});
