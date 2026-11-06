import { generateKeyPairSync, createHash } from "node:crypto";
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { resolve } from "node:path";

const dir = resolve(process.env.ACTIONSELF_KEY_DIR || (homedir() + "/.local/share/actionself"));
const privatePath = resolve(dir, "issuer-ed25519-private.pem");
const publicPath = resolve(dir, "issuer-ed25519-public.pem");
mkdirSync(dir, { recursive: true, mode: 0o700 });
if (existsSync(privatePath) || existsSync(publicPath)) {
  throw new Error("ACTIONSELF_ISSUER_KEYPAIR_ALREADY_EXISTS; refusing overwrite");
}
const { publicKey, privateKey } = generateKeyPairSync("ed25519", {
  publicKeyEncoding: { type: "spki", format: "pem" },
  privateKeyEncoding: { type: "pkcs8", format: "pem" }
});
writeFileSync(privatePath, privateKey, { flag: "wx", mode: 0o600 });
writeFileSync(publicPath, publicKey, { flag: "wx", mode: 0o644 });
const fingerprint = createHash("sha256").update(publicKey).digest("hex");
console.log(JSON.stringify({
  private_key_path: privatePath,
  private_key_mode: "0600",
  public_key_path: publicPath,
  public_key_fingerprint_sha256: fingerprint,
  private_key_emitted: false
}, null, 2));
