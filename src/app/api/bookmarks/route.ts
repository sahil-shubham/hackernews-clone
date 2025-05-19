import { NextResponse } from "next/server";
import { getServerSideUser } from "@/lib/authUtils";
import { prisma } from "@/lib/prisma";

// GET /api/bookmarks - Get all bookmarks for the current user
// GET /api/bookmarks?postId=xxx - Get bookmark for a specific post
export async function GET(request: Request) {
  try {
    const user = await getServerSideUser();
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('postId');

    if (postId) {
      // Get bookmark for specific post
      const bookmark = await prisma.bookmark.findFirst({
        where: {
          postId,
          userId: user.id,
        },
      });

      return NextResponse.json({ bookmark });
    } else {
      // Get all bookmarks
      const bookmarks = await prisma.bookmark.findMany({
        where: {
          userId: user.id,
        },
        include: {
          post: {
            include: {
              author: {
                select: {
                  id: true,
                  username: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return NextResponse.json(bookmarks);
    }
  } catch (error) {
    console.error("Error fetching bookmarks:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/bookmarks - Create a new bookmark
export async function POST(request: Request) {
  try {
    const user = await getServerSideUser();
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { postId } = body;

    if (!postId) {
      return NextResponse.json(
        { error: "Post ID is required" },
        { status: 400 }
      );
    }

    // Check if bookmark already exists
    const existingBookmark = await prisma.bookmark.findFirst({
      where: {
        postId,
        userId: user.id,
      },
    });

    if (existingBookmark) {
      return NextResponse.json(
        { error: "Bookmark already exists" },
        { status: 400 }
      );
    }

    // Create bookmark
    const bookmark = await prisma.bookmark.create({
      data: {
        postId,
        userId: user.id,
      },
    });

    return NextResponse.json({ bookmark });
  } catch (error) {
    console.error("Error creating bookmark:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 