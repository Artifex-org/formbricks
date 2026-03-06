import { NextRequest } from "next/server";
import { prisma } from "@formbricks/database";
import { BILLING_LIMITS, PROJECT_FEATURE_KEYS } from "@/lib/constants";
import { authenticateAdmin } from "../auth";

export const POST = async (request: NextRequest): Promise<Response> => {
  if (!authenticateAdmin(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();

    if (!body.name || typeof body.name !== "string") {
      return Response.json({ error: "name is required and must be a string" }, { status: 400 });
    }

    const organization = await prisma.organization.create({
      data: {
        name: body.name,
        billing: {
          plan: PROJECT_FEATURE_KEYS.FREE,
          limits: {
            projects: BILLING_LIMITS.FREE.PROJECTS,
            monthly: {
              responses: BILLING_LIMITS.FREE.RESPONSES,
              miu: BILLING_LIMITS.FREE.MIU,
            },
          },
          stripeCustomerId: null,
          periodStart: new Date(),
          period: "monthly",
        },
      },
      select: {
        id: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return Response.json({ data: organization }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: "Failed to create organization", details: message }, { status: 500 });
  }
};
