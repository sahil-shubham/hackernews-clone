import { NextResponse } from "next/server";
import { getServerSideUser } from "@/lib/authUtils";
import { prisma } from "@/lib/prisma";

// DELETE /api/bookmarks/[id] - Delete a bookmark
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getServerSideUser();
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { error: "Bookmark ID is required" },
        { status: 400 }
      );
    }

    // Check if bookmark exists and belongs to the user
    const bookmark = await prisma.bookmark.findUnique({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!bookmark) {
      return NextResponse.json(
        { error: "Bookmark not found" },
        { status: 404 }
      );
    }

    // Delete bookmark
    await prisma.bookmark.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting bookmark:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 