import {storage} from "../config/storage";

async function seed() {
  console.log("Seeding database...");

  const existingAdmin = await storage.getUserByUsername("admin");

  if (!existingAdmin) {
    
    await storage.createUser({
      username: "admin",
      email: "admin@gmail.com",
      password: "admin123",
      role: "admin",
      isDeleted:false,
      createdBy:"System"
    });

    console.log("Admin user created:");
    console.log("  Username: admin");
    console.log("  Password: admin123");
    console.log("  Role: admin");
  } else {
    console.log("Admin user already exists, skipping...");
  }

  console.log("Seeding complete!");
  process.exit(0);
}

seed().catch((error) => {
  console.error("Seeding failed:", error);
  process.exit(1);
});
