import { afterEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import app from "../../src/app.js";

afterEach(() => vi.unstubAllEnvs());

describe("Deployment origin configuration readiness", () => {
  it.each([
    "https://flora-connect-frontend-qemd.vercel.app/",
    "not-a-url",
    "https://user:private-value@example.test",
    "http://localhost:5173",
  ])(
    "keeps liveness available and fails closed with invalid hosted configuration %s",
    async (value) => {
      vi.stubEnv("NODE_ENV", "production");
      vi.stubEnv("FRONTEND_ORIGINS", value);
      const log = vi.spyOn(console, "error").mockImplementation(() => {});
      try {
        const health = await request(app).get("/api/health");
        expect(health.status).toBe(200);
        expect(health.headers["access-control-allow-origin"]).toBeUndefined();
        for (const path of [
          "/api/auth/login",
          "/api/admin/console/access-policy",
        ]) {
          const response = path.includes("login")
            ? await request(app)
                .post(path)
                .set("Origin", "https://flora-connect-frontend-qemd.vercel.app")
                .send({})
            : await request(app).get(path);
          expect(response.status).toBe(503);
          expect(response.body.code).toBe("ORIGIN_NOT_CONFIGURED");
          expect(response.headers["cache-control"]).toBe("no-store");
          expect(
            response.headers["access-control-allow-origin"],
          ).toBeUndefined();
          expect(JSON.stringify(response.body)).not.toContain("private-value");
        }
        expect(JSON.stringify(log.mock.calls)).not.toContain("private-value");
      } finally {
        log.mockRestore();
      }
    },
  );

  it.each([
    "https://flora-connect-frontend.vercel.app",
    "https://flora-connect-frontend-qemd.vercel.app",
  ])(
    "accepts the configured deployment origin %s without relaxing authentication",
    async (origin) => {
      vi.stubEnv("NODE_ENV", "production");
      vi.stubEnv(
        "FRONTEND_ORIGINS",
        "https://flora-connect-frontend.vercel.app,https://flora-connect-frontend-qemd.vercel.app",
      );
      const health = await request(app)
        .get("/api/health")
        .set("Origin", origin);
      expect(health.status).toBe(200);
      expect(health.headers["access-control-allow-origin"]).toBe(origin);
      const admin = await request(app)
        .get("/api/admin/console/access-policy")
        .set("Origin", origin);
      expect(admin.status).toBe(401);
      const hostile = await request(app)
        .post("/api/auth/login")
        .set("Origin", "https://untrusted.example")
        .send({});
      expect(hostile.status).toBe(403);
      expect(hostile.headers["access-control-allow-origin"]).toBeUndefined();
    },
  );
});
