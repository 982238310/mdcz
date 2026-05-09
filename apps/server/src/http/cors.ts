import type { FastifyReply, FastifyRequest } from "fastify";

const allowedCorsOrigins = new Set([
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
]);

export const applyCorsHeaders = (request: FastifyRequest, reply: FastifyReply): void => {
  const origin = request.headers.origin;
  if (!origin || !allowedCorsOrigins.has(origin)) {
    return;
  }

  reply.header("access-control-allow-origin", origin);
  reply.header("vary", "Origin");
  reply.header("access-control-allow-methods", "GET,POST,OPTIONS");
  reply.header("access-control-allow-headers", "content-type,authorization");
};
