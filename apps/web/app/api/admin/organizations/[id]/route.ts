import { NextRequest } from "next/server";
import { prisma } from "@formbricks/database";
import { authenticateAdmin } from "../../auth";

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
    const { id } = await props.params;

    const organization = await prisma.organization.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        createdAt: true,
        updatedAt: true,
        projects: {
          select: {
            id: true,
            name: true,
            createdAt: true,
            environments: {
              select: {
                id: true,
                type: true,
              },
            },
          },
        },
      },
    });

    if (!organization) {
      return Response.json({ error: "Organization not found" }, { status: 404 });
    }

    return Response.json({ data: organization });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: "Failed to fetch organization", details: message }, { status: 500 });
  }
};

export const DELETE = async (request: NextRequest, props: Context): Promise<Response> => {
  if (!authenticateAdmin(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await props.params;

    // Check existence first
    const existing = await prisma.organization.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      return Response.json({ error: "Organization not found" }, { status: 404 });
    }

    await prisma.organization.delete({
      where: { id },
    });

    return Response.json({ data: { success: true } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: "Failed to delete organization", details: message }, { status: 500 });
  }
};
