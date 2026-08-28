import 'dotenv/config';
import { prisma } from '../src/prisma';
import { passwordUtils } from '../src/shared/utils/password.utils';

type UserRoleInput = 'ADMIN' | 'OFFICER';

interface CliOptions {
  email: string;
  password: string;
  name: string;
  role: UserRoleInput;
}

function printHelp(): void {
  console.log(`Usage: npm run create:admin -- [options]\n\nOptions:\n  --email, -e    Email address for the admin user\n  --password, -p Password for the admin user\n  --name, -n     Display name for the admin user\n  --role         Role to assign (ADMIN, OFFICER)\n  --help, -h     Show this help message`);
}

function parseArgs(): CliOptions {
  const args = process.argv.slice(2);
  const options: Partial<CliOptions> = {};

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    }

    if (arg.startsWith('--email=')) {
      options.email = arg.split('=')[1];
      continue;
    }

    if (arg.startsWith('-e=')) {
      options.email = arg.slice(3);
      continue;
    }

    if (arg === '--email' || arg === '-e') {
      options.email = args[index + 1];
      index += 1;
      continue;
    }

    if (arg.startsWith('--password=')) {
      options.password = arg.split('=')[1];
      continue;
    }

    if (arg.startsWith('-p=')) {
      options.password = arg.slice(3);
      continue;
    }

    if (arg === '--password' || arg === '-p') {
      options.password = args[index + 1];
      index += 1;
      continue;
    }

    if (arg.startsWith('--name=')) {
      options.name = arg.split('=')[1];
      continue;
    }

    if (arg.startsWith('-n=')) {
      options.name = arg.slice(3);
      continue;
    }

    if (arg === '--name' || arg === '-n') {
      options.name = args[index + 1];
      index += 1;
      continue;
    }

    if (arg.startsWith('--role=')) {
      options.role = arg.split('=')[1] as UserRoleInput;
      continue;
    }

    if (arg === '--role') {
      options.role = args[index + 1] as UserRoleInput;
      index += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  const role = (options.role ?? process.env.ADMIN_ROLE ?? 'ADMIN').toUpperCase();
  if (!['ADMIN', 'OFFICER'].includes(role)) {
    throw new Error(`Invalid role: ${role}`);
  }

  return {
    email: options.email ?? process.env.ADMIN_EMAIL ?? 'admin@gmail.com',
    password: options.password ?? process.env.ADMIN_PASSWORD ?? 'admin12345',
    name: options.name ?? process.env.ADMIN_NAME ?? 'System Admin',
    role: role as UserRoleInput,
  };
}

async function main(): Promise<void> {
  const { email, password, name, role } = parseArgs();

  if (!password.trim()) {
    throw new Error('Password cannot be empty');
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  const hashedPassword = await passwordUtils.hashPassword(password);

  if (existingUser) {
    const updatedUser = await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        name,
        password: hashedPassword,
        role,
        isActive: true,
      },
    });

    console.log('Admin user already existed. Updated successfully.');
    console.log(JSON.stringify({
      id: updatedUser.id,
      email: updatedUser.email,
      role: updatedUser.role,
    }, null, 2));
    return;
  }

  const createdUser = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role,
      isActive: true,
    },
  });

  console.log('Admin user created successfully.');
  console.log(JSON.stringify({
    id: createdUser.id,
    email: createdUser.email,
    role: createdUser.role,
  }, null, 2));
}

main()
  .catch((error) => {
    console.error('Failed to create admin user:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
