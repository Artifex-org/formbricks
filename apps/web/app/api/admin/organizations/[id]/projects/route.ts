import { NextRequest } from "next/server";
import { prisma } from "@formbricks/database";
import { authenticateAdmin } from "../../../auth";

interface Context {
  params: Promise<{
    id: string;
  }>;
}

export const POST = async (request: NextRequest, props: Context): Promise<Response> => {
  if (!authenticateAdmin(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id: organizationId } = await props.params;
    const body = await request.json();

    if (!body.name || typeof body.name !== "string") {
      return Response.json({ error: "name is required and must be a string" }, { status: 400 });
    }

    // Verify the organization exists
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { id: true },
    });

    if (!organization) {
      return Response.json({ error: "Organization not found" }, { status: 404 });
    }

    // Create the project
    const project = await prisma.project.create({
      data: {
        name: body.name,
        organizationId,
        config: {
          channel: null,
          industry: null,
        },
      },
      select: {
        id: true,
        name: true,
        createdAt: true,
        organizationId: true,
      },
    });

    // Create development and production environments with default attribute keys
    const environmentData = [
      { type: "development" as const, projectId: project.id },
      { type: "production" as const, projectId: project.id },
    ];

    const defaultAttributeKeys = [
      { key: "userId", name: "User Id", description: "The user id of a contact", type: "default" as const, isUnique: true },
      { key: "email", name: "Email", description: "The email of a contact", type: "default" as const, isUnique: true },
      { key: "firstName", name: "First Name", description: "Your contact's first name", type: "default" as const },
      { key: "lastName", name: "Last Name", description: "Your contact's last name", type: "default" as const },
      { key: "language", name: "Language", description: "The language preference of a contact", type: "default" as const },
    ];

    const environments: { id: string; type: string; createdAt: Date }[] = [];
    for (const envData of environmentData) {
      const environment = await prisma.environment.create({
        data: {
          type: envData.type,
          project: { connect: { id: envData.projectId } },
          attributeKeys: {
            create: defaultAttributeKeys,
          },
        },
        select: {
          id: true,
          type: true,
          createdAt: true,
        },
      });
      environments.push(environment);
    }

    return Response.json(
      {
        data: {
          ...project,
          environments,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: "Failed to create project", details: message }, { status: 500 });
  }
};
