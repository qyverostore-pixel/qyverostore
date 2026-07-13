import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

// Simple native parser for .env.local
const env: Record<string, string> = {};
try {
  const envContent = fs.readFileSync(path.resolve(process.cwd(), ".env.local"), "utf-8");
  envContent.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const separatorIdx = trimmed.indexOf("=");
    if (separatorIdx === -1) return;
    const key = trimmed.slice(0, separatorIdx).trim();
    let val = trimmed.slice(separatorIdx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    env[key] = val;
  });
} catch (err) {
  console.error("Failed to read .env.local:", err);
  process.exit(1);
}

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase environment variables in parsed .env.local", env);
  process.exit(1);
}

console.log("Supabase URL:", supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

async function runTest() {
  const email = `test_debug_${Math.floor(Math.random() * 1000000)}@gmail.com`;
  const password = "password12345";

  console.log(`[1] Attempting SignUp with: ${email}...`);
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name: "Test",
        last_name: "User",
        phone: "+201000000000",
      },
    },
  });

  if (signUpError) {
    console.error("SignUp failed:", signUpError);
    return;
  }

  console.log("SignUp successful! User ID:", signUpData.user?.id);

  let session = signUpData.session;
  let user = signUpData.user;

  if (!session) {
    console.log("[2] No session after SignUp. Attempting SignIn...");
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      console.error("SignIn failed:", signInError);
      return;
    }

    session = signInData.session;
    user = signInData.user;
    console.log("SignIn successful!");
  }

  console.log("[3] Fetching profile from 'profiles' table for user:", user?.id);
  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user?.id)
    .maybeSingle();

  if (profileError) {
    console.error("Profile fetch FAILED:", profileError);
  } else {
    console.log("Profile fetch SUCCESSFUL! Data:", profileData);
  }

  console.log("[4] Fetching active products under current session...");
  const { data: productsData, error: productsError } = await supabase
    .from("products")
    .select("id, name")
    .limit(1);

  if (productsError) {
    console.error("Products fetch FAILED:", productsError);
  } else {
    console.log("Products fetch SUCCESSFUL! Found:", productsData?.length, "products");
  }
}

runTest().catch((err) => console.error("Unhandled error in test:", err));
