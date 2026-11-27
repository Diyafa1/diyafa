// Fails the build fast, with a clear message, when the database addresses are wrong.
// (A DIRECT_URL on port 6543 makes "prisma migrate deploy" hang forever.)
const problems = [];
for (const name of ["DATABASE_URL", "DIRECT_URL"]) {
  const v = (process.env[name] || "").trim();
  if (!v) { problems.push(`${name} est vide`); continue; }
  if (!/^postgres(ql)?:\/\//.test(v)) problems.push(`${name} doit commencer par postgresql://`);
}
const direct = process.env.DIRECT_URL || "";
if (/:6543\//.test(direct)) problems.push("DIRECT_URL utilise le port 6543 : il faut l'adresse avec :5432/postgres");
if (problems.length) {
  console.error("\n❌ Réglages de base de données incorrects dans Vercel :\n - " + problems.join("\n - ") + "\n");
  process.exit(1);
}
console.log("✔ Adresses de base de données OK");
