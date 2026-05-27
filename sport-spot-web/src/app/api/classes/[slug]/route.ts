import { NextResponse } from "next/server";

import { getClassDetailsBySlug } from "@/app/api/classes/details";
import { authenticateRequest, isAuthResponse } from "@/lib/api-auth";

type ClassDetailsContext = {
  params: Promise<{ slug: string }>;
};

export const GET = async (
  request: Request,
  { params }: ClassDetailsContext
) => {
  const viewer = await authenticateRequest(request);
  if (isAuthResponse(viewer)) {
    return viewer;
  }

  const { slug: slugParam } = await params;
  const slug = decodeURIComponent(slugParam).trim();
  if (!slug) {
    return NextResponse.json(
      { success: false, error: "Invalid class slug" },
      { status: 400 }
    );
  }

  const session = await getClassDetailsBySlug(slug, viewer);
  if (!session) {
    return NextResponse.json(
      { success: false, error: "Class not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    ...session,
    session,
  });
};
