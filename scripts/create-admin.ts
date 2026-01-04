import { adminRepository } from "@/features/auth/repositories/admin.repository";

async function createAdmin() {
  const username = process.argv[2];
  const password = process.argv[3];

  if (!username || !password) {
    console.error(
      "Usage: ts-node scripts/create-admin.ts <username> <password>"
    );
    process.exit(1);
  }

  try {
    // Check if admin already exists
    const existing = await adminRepository.getByUsername(username);
    if (existing) {
      console.error(`Admin with username "${username}" already exists`);
      process.exit(1);
    }

    const admin = await adminRepository.create({
      username,
      password,
    });

    console.log(`Admin created successfully with ID: ${admin.id}`);
    console.log(`Username: ${admin.username}`);
  } catch (error) {
    console.error("Error creating admin:", error);
    process.exit(1);
  }
}

createAdmin();
