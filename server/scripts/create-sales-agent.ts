import { connectDB, disconnectDB } from '@/config/db';
import { User } from '@/features/auth/auth.model';

const [, , username, password, name, email] = process.argv;

if (!username || !password || !name || !email) {
  console.error(
    'Usage: tsx scripts/create-sales-agent.ts <username> <password> <name> <email>'
  );
  process.exit(1);
}

async function run() {
  const isConnected = await connectDB();
  if (!isConnected) {
    process.exit(1);
  }

  const normalizedUsername = username.toLowerCase().trim();
  const normalizedEmail = email.toLowerCase().trim();

  const existingUser = await User.findOne({
    $or: [{ username: normalizedUsername }, { email: normalizedEmail }],
  });

  if (existingUser) {
    console.error('User already exists with same username or email.');
    await disconnectDB();
    process.exit(1);
  }

  const user = new User({
    username: normalizedUsername,
    password,
    name: name.trim(),
    email: normalizedEmail,
    role: 'sales_agent',
    isActive: true,
  });

  await user.save();

  console.log('Sales agent created:', {
    id: user._id.toString(),
    username: user.username,
    name: user.name,
    email: user.email,
    role: user.role,
  });

  await disconnectDB();
}

run().catch(async (error) => {
  console.error('Failed to create sales agent:', error);
  await disconnectDB();
  process.exit(1);
});
