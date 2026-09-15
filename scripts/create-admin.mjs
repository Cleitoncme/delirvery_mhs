import { randomBytes, scryptSync } from "node:crypto";
import { Pool } from "pg";

const [slug, email, role = "OPERATOR"] = process.argv.slice(2);
if (!slug || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !["OPERATOR", "VIEWER"].includes(role)) {
  throw new Error("Uso: npm run admin:create -- <loja> <email> [OPERATOR|VIEWER]");
}
const password = process.env.ADMIN_PASSWORD || randomBytes(24).toString("base64url");
if (password.length < 16 || password.length > 256) throw new Error("ADMIN_PASSWORD deve conter entre 16 e 256 caracteres.");
const salt = randomBytes(16).toString("hex");
const hash = `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
const pool = new Pool({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 5000 });
try {
  const result = await pool.query(`INSERT INTO admin_users(tenant_id,email,password_hash,role)
    SELECT id,$2,$3,$4 FROM tenants WHERE slug=$1 RETURNING id`, [slug, email.toLowerCase(), hash, role]);
  if (!result.rowCount) throw new Error("Loja não encontrada.");
  console.log(`Administrador criado para ${slug}.`);
  if (!process.env.ADMIN_PASSWORD) console.log(`Senha gerada (guarde em um gerenciador): ${password}`);
} finally { await pool.end(); }
