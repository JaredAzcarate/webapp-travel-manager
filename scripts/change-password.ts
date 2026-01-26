import { adminRepositoryServer } from "@/features/auth/repositories/admin.repository.server";

async function changePassword() {
  const username = process.argv[2];
  const newPassword = process.argv[3] || "alma3737";

  if (!username) {
    console.error(
      "Usage: ts-node scripts/change-password.ts <username> [newPassword]"
    );
    console.error(
      "Example: ts-node scripts/change-password.ts admin alma3737"
    );
    process.exit(1);
  }

  try {
    // Find admin by username
    const admin = await adminRepositoryServer.getByUsername(username);
    if (!admin) {
      console.error(`Admin with username "${username}" not found`);
      process.exit(1);
    }

    // Update password
    await adminRepositoryServer.updatePassword(admin.id, newPassword);

    console.log(`Password updated successfully for admin: ${admin.username}`);
    console.log(`New password: ${newPassword}`);
  } catch (error) {
    console.error("Error updating password:", error);
    process.exit(1);
  }
}

changePassword();
