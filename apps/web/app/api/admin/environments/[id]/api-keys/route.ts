import { NextRequest } from "next/server";
import { randomBytes } from "node:crypto";
import { prisma } from "@formbricks/database";
import { hashSecret, hashSha256 } from "@/lib/crypto";
import { authenticateAdmin } from "../../../auth";

interface Context {
  params: Promise<{
    id: string;
  }>;
}

export const GET = async (request: NextRequest, props: Context): Promise<Response> => {
  if (!authenticateAdmin(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id: environmentId } = await props.params;

    // Verify the environment exists
    const environment = await prisma.environment.findUnique({
      where: { id: environmentId },
      select: { id: true },
    });

    if (!environment) {
      return Response.json({ error: "Environment not found" }, { status: 404 });
    }

    const apiKeys = await prisma.apiKeyEnvironment.findMany({
      where: { environmentId },
      select: {
        id: true,
        permission: true,
        createdAt: true,
        apiKey: {
          select: {
            id: true,
            label: true,
            createdAt: true,
            lastUsedAt: true,
          },
        },
      },
    });

    return Response.json({ data: apiKeys });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: "Failed to list API keys", details: message }, { status: 500 });
  }
};

export const POST = async (request: NextRequest, props: Context): Promise<Response> => {
  if (!authenticateAdmin(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id: environmentId } = await props.params;
    const body = await request.json();

    const label = body.label || "Admin-provisioned key";
    const permission = body.permission || "manage";

    // Validate permission value
    if (!["read", "write", "manage"].includes(permission)) {
      return Response.json(
        { error: "permission must be one of: read, write, manage" },
        { status: 400 }
      );
    }

    // Verify the environment exists and get the organization
    const environment = await prisma.environment.findUnique({
      where: { id: environmentId },
      include: {
        project: {
          select: {
            organizationId: true,
          },
        },
      },
    });

    if (!environment) {
      return Response.json({ error: "Environment not found" }, { status: 404 });
    }

    const organizationId = environment.project.organizationId;

    // Generate a secure random secret (32 bytes base64url), matching the existing pattern
    const secret = randomBytes(32).toString("base64url");

    // Hybrid approach: SHA-256 for fast lookup, bcrypt for security verification
    const lookupHash = hashSha256(secret);
    const hashedKey = await hashSecret(secret, 12);

    // Create the API key with environment permission
    const apiKey = await prisma.apiKey.create({
      data: {
        label,
        hashedKey,
        lookupHash,
        organization: { connect: { id: organizationId } },
        organizationAccess: {},
        apiKeyEnvironments: {
          create: {
            environmentId,
            permission,
          },
        },
      },
      select: {
        id: true,
        label: true,
        createdAt: true,
        apiKeyEnvironments: {
          select: {
            id: true,
            environmentId: true,
            permission: true,
          },
        },
      },
    });

    // Return the actual key in v2 format (fbk_{secret}) — only shown once
    return Response.json(
      {
        data: {
          ...apiKey,
          actualKey: `fbk_${secret}`,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: "Failed to create API key", details: message }, { status: 500 });
  }
};
