import bcrypt from "bcryptjs";

async function test() {
  try {
    const pass = "test123";
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(pass, salt);
    console.log("SALT:", salt);
    console.log("HASH:", hash);
    const isMatch = await bcrypt.compare(pass, hash);
    console.log("MATCH:", isMatch);
  } catch (err) {
    console.error("BCRYPT ERROR:", err);
  }
}

test();
