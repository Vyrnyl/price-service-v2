import { jwtVerify } from "jose";

const secret = process.env.JWT_SECRET
  ? new TextEncoder().encode(process.env.JWT_SECRET)
  : null;

export async function verifyToken(token: string) {
  if (!secret) {
    throw new Error("JWT_SECRET must be defined in environment variables");
  }

  const { payload } = await jwtVerify(token, secret);

  return payload;
}