import bcrypt from 'bcrypt';

async function hashPassword(password: string) {
  const saltRounds = 10;
  const hash = await bcrypt.hash(password, saltRounds);
  console.log('Generated hash:', hash);
  return hash;
}

// Log the hash so we can verify it
hashPassword('admin123').then(hash => {
  console.log(`Use this SQL to create admin:
  INSERT INTO users (id, email, password_hash, role, created_at) 
  VALUES (
    gen_random_uuid(),
    'admin@swat.gov',
    '${hash}',
    'admin',
    CURRENT_TIMESTAMP
  );`);
});
