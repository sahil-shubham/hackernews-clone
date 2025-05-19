import { NextResponse } from "next/server";
import { getServerSideUser } from "@/lib/authUtils";
import { prisma } from "@/lib/prisma";

// POST /api/bookmarks/check - Check bookmark status for multiple posts
export async function POST(request: Request) {
  try {
    const user = await getServerSideUser();
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { postIds } = await request.json();
    if (!Array.isArray(postIds)) {
      return NextResponse.json(
        { error: "postIds must be an array" },
        { status: 400 }
      );
    }

    // Get all bookmarks for the given posts by the current user
    const bookmarks = await prisma.bookmark.findMany({
      where: {
        userId: user.id,
        postId: {
          in: postIds,
        },
      },
      select: {
        postId: true,
      },
    });

    // Create a map of postId -> isBookmarked
    const bookmarkMap = bookmarks.reduce((acc, bookmark) => {
      acc[bookmark.postId] = true;
      return acc;
    }, {} as Record<string, boolean>);

    // Return an object with bookmark status for each post
    const result = postIds.reduce((acc, postId) => {
      acc[postId] = !!bookmarkMap[postId];
      return acc;
    }, {} as Record<string, boolean>);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error checking bookmarks:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 