// Test Unicode normalization
function normalizeTeamName(name: string): string {
  return name
    .normalize('NFD')            // Decompose Unicode (ã → a + combining tilde)
    .replace(/[\u0300-\u036f]/g, '') // Remove combining diacritical marks
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Remove remaining special chars
    .replace(/\s+/g, ' ')        // Normalize spaces
    .trim();
}

console.log('Test normalization:');
console.log('  Famalicão →', normalizeTeamName('Famalicão'));
console.log('  Famalicao →', normalizeTeamName('Famalicao'));
console.log('  Müller →', normalizeTeamName('Müller'));
console.log('  Atlético →', normalizeTeamName('Atlético'));
console.log('Match?:', normalizeTeamName('Famalicão') === normalizeTeamName('Famalicao'));
