import { PrismaClient, Prisma, PostType } from "@prisma/client";
import { hash } from "bcryptjs"; // For creating dummy passwords for HN users

const prisma = new PrismaClient();

// --- Configuration ---
const NUM_POSTS_TO_FETCH = Number(process.env.NUM_POSTS_TO_FETCH) || 150;
// const BATCH_SIZE = Number(process.env.HN_FETCH_BATCH_SIZE) || 50; // Batch size for Prisma createMany - currently creating one-by-one
const HN_API_BASE_URL = "https://hacker-news.firebaseio.com/v0";
const CLEAN_DATABASE_MODE = true; // Hardcoded as per user's file
const MAX_CONCURRENT_POST_PROCESSING = 10; // Limit concurrency for processing entire posts
const MAX_CONCURRENT_COMMENT_FETCH = 20; // Limit concurrency for fetching comments at each level

// To keep track of users we've already processed/created to avoid duplicates
const processedUsernames = new Set<string>();
let defaultPasswordHashGlobal: string;

// Global counters for logging
let totalUsersCreated = 0;
let totalPostsCreated = 0;
let totalCommentsCreated = 0;

interface HNItem {
  id: number;
  deleted?: boolean;
  type?: "job" | "story" | "comment" | "poll" | "pollopt";
  by?: string;
  time?: number;
  text?: string;
  dead?: boolean;
  parent?: number;
  poll?: number;
  kids?: number[];
  url?: string;
  score?: number;
  title?: string;
  parts?: number[];
  descendants?: number;
}

async function fetchHNItem(id: number): Promise<HNItem | null> {
  try {
    const response = await fetch(`${HN_API_BASE_URL}/item/${id}.json`);
    if (!response.ok) {
      // console.error(`Error fetching HN item ${id}: ${response.status}`); // Reduced noise
      return null;
    }
    return (await response.json()) as HNItem;
  } catch (error) {
    // console.error(`Network error fetching HN item ${id}:`, error); // Reduced noise
    return null;
  }
}

async function fetchTopStoryIds(): Promise<number[]> {
  try {
    const response = await fetch(`${HN_API_BASE_URL}/topstories.json`);
    if (!response.ok) {
      console.error(`Error fetching top story IDs: ${response.status}`);
      return [];
    }
    const ids = (await response.json()) as number[];
    return ids.slice(0, NUM_POSTS_TO_FETCH);
  } catch (error) {
    console.error("Network error fetching top story IDs:", error);
    return [];
  }
}

async function cleanDatabase() {
  console.log("Cleaning database...");
  const mappedTableNames = [
    "notifications",
    "votes",
    "comments",
    "posts",
    "users",
  ];

  try {
    console.time("TruncateOperation");
    await prisma.$executeRawUnsafe(
      `TRUNCATE TABLE "${mappedTableNames.join(
        '", "'
      )}" RESTART IDENTITY CASCADE;`
    );
    console.timeEnd("TruncateOperation");
    console.log("Database cleaned successfully using TRUNCATE.");
  } catch (error) {
    console.error("Error during TRUNCATE operation:", error);
    console.warn("Falling back to deleteMany operations...");
    console.time("DeleteManyFallback");
    await prisma.notification.deleteMany({});
    await prisma.vote.deleteMany({});
    await prisma.comment.deleteMany({});
    await prisma.post.deleteMany({});
    await prisma.user.deleteMany({});
    console.timeEnd("DeleteManyFallback");
    console.log("Database cleaned successfully using deleteMany.");
  }
  processedUsernames.clear();
  totalUsersCreated = 0;
  totalPostsCreated = 0;
  totalCommentsCreated = 0;
}

async function ensureUserExists(
  username: string,
  hnTime?: number
): Promise<string | null> {
  if (!username) return null;
  if (!defaultPasswordHashGlobal) {
    console.error("Default password not initialized!");
    return null;
  }

  if (processedUsernames.has(username)) {
    const user = await prisma.user.findUnique({
      where: { username: username },
      select: { id: true },
    });
    return user ? user.id : null;
  }
  
  try {
    const userEmail = `${username.replace(
      /[^a-zA-Z0-9_.-]/g,
      ""
    )}@hackernews.example.com`;
    
    const existingUserCheck = await prisma.user.findFirst({
        where: { OR: [{ username }, { email: userEmail }] }
    });
    if(existingUserCheck) {
        processedUsernames.add(username);
        return existingUserCheck.id;
    }

    const newUser = await prisma.user.create({
      data: {
        username: username,
        email: userEmail,
        password: defaultPasswordHashGlobal,
        createdAt: hnTime ? new Date(hnTime * 1000) : new Date(),
      },
    });
    processedUsernames.add(username);
    totalUsersCreated++;
    // console.log(`Created user: ${username} (ID: ${newUser.id})`); // Reduced noise for batch operations
    return newUser.id;
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      // console.warn(`User ${username} (or email) already exists. Fetching existing.`); // Reduced noise
      const existing = await prisma.user.findUnique({ where: { username } });
      if (existing) {
        processedUsernames.add(username); // Ensure it's marked as processed
        return existing.id;
      }
    } else {
      console.error(`Error creating user ${username}:`, error);
    }
    return null;
  }
}

async function processCommentsRecursive(
  hnCommentIds: number[],
  dbPostId: string,
  dbParentCommentId: string | null,
  level: number
): Promise<void> {
  if (level > 10) {
    // console.log(`\nReached max comment recursion depth (10) for post ${dbPostId}.`); // Reduced noise
    return;
  }

  const childCommentProcessingPromises: Promise<void>[] = [];
  
  // Fetch details for all comments at this level in parallel (with concurrency limit)
  const commentItemsDetails: (HNItem | null)[] = [];
  for (let i = 0; i < hnCommentIds.length; i += MAX_CONCURRENT_COMMENT_FETCH) {
    const chunk = hnCommentIds.slice(i, i + MAX_CONCURRENT_COMMENT_FETCH);
    const results = await Promise.all(chunk.map(id => fetchHNItem(id)));
    commentItemsDetails.push(...results);
  }

  for (const commentItem of commentItemsDetails) {
    if (
      !commentItem || commentItem.deleted || commentItem.dead ||
      commentItem.type !== "comment" || !commentItem.by
    ) {
      continue;
    }

    const authorId = await ensureUserExists(commentItem.by, commentItem.time);
    if (!authorId) continue;

    let createdCommentDbId: string | null = null;
    try {
      const createdComment = await prisma.comment.create({
        data: {
          textContent: commentItem.text || "",
          author: { connect: { id: authorId } },
          post: { connect: { id: dbPostId } },
          parent: dbParentCommentId ? { connect: { id: dbParentCommentId } } : undefined,
          createdAt: commentItem.time ? new Date(commentItem.time * 1000) : new Date(),
        },
      });
      createdCommentDbId = createdComment.id;
      totalCommentsCreated++;
    } catch (commentError) {
      // console.error(`\nError creating comment for HN ID ${commentItem.id} on post ${dbPostId}:`, commentError); // Reduced noise
      continue;
    }

    if (commentItem.kids && commentItem.kids.length > 0 && createdCommentDbId) {
      childCommentProcessingPromises.push(
        processCommentsRecursive(commentItem.kids, dbPostId, createdCommentDbId, level + 1)
      );
    }
  }
  await Promise.all(childCommentProcessingPromises); // Process sub-trees in parallel
}

async function processStoryAndItsComments(storyItem: HNItem | null, index: number, totalStories: number): Promise<void> {
  if (!storyItem || storyItem.deleted || storyItem.dead || storyItem.type !== 'story' || !storyItem.by) {
    // console.log(`\nSkipping item ${storyItem?.id} (not a valid story, deleted, dead, or no author).`); // Reduced noise
    return;
  }

  const authorId = await ensureUserExists(storyItem.by, storyItem.time);
  if (!authorId) {
    // console.log(`\nCould not ensure author ${storyItem.by} for story ${storyItem.id}. Skipping post.`); // Reduced noise
    return;
  }

  try {
    const postType: PostType = storyItem.url ? "LINK" : "TEXT";
    const createdPost = await prisma.post.create({
      data: {
        title: storyItem.title || "[No Title]",
        type: postType,
        url: storyItem.url,
        textContent: postType === "TEXT" ? storyItem.text || "" : null,
        author: { connect: { id: authorId } },
        createdAt: storyItem.time ? new Date(storyItem.time * 1000) : new Date(),
        // score: storyItem.score || 0,
      },
    });
    totalPostsCreated++;
    const currentProgress = `Posts: ${totalPostsCreated}, Users: ${totalUsersCreated}, Comments: ${totalCommentsCreated}`;
    process.stdout.write(
      `\r(${index + 1}/${totalStories}) Processed Post ID ${storyItem.id} (${storyItem.title?.substring(0,20)}...). ${currentProgress}`
    );

    if (storyItem.kids && storyItem.kids.length > 0) {
      await processCommentsRecursive(storyItem.kids, createdPost.id, null, 0);
    }
  } catch (postError) {
    // console.error(`\nError creating post ${storyItem.title}:`, postError); // Reduced noise
  }
}

async function main() {
  console.log("Starting Hacker News data fetcher...");
  const overallStartTime = Date.now();
  defaultPasswordHashGlobal = await hash("password123", 10);

  console.log(`Fetching up to ${NUM_POSTS_TO_FETCH} posts.`);
  console.log(`Database cleaning mode: ${CLEAN_DATABASE_MODE}`);
  // console.log(`Prisma batch size: ${BATCH_SIZE}`); // Not batching creates yet

  if (CLEAN_DATABASE_MODE) {
    await cleanDatabase();
  }

  const topStoryIds = await fetchTopStoryIds();
  if (topStoryIds.length === 0) {
    console.log("No top story IDs fetched. Exiting.");
    return;
  }
  console.log(`Fetched ${topStoryIds.length} top story IDs. Now fetching full story details...`);

  const storyItemsPromises: Promise<HNItem | null>[] = topStoryIds.map(id => fetchHNItem(id));
  const fetchedStoryItems = (await Promise.all(storyItemsPromises)).filter(item => item !== null) as HNItem[];
  
  console.log(`Successfully fetched details for ${fetchedStoryItems.length} stories. Processing them...`);

  // Process stories with controlled concurrency
  const storyProcessingPromises: Promise<void>[] = [];
  for (let i = 0; i < fetchedStoryItems.length; i += MAX_CONCURRENT_POST_PROCESSING) {
    const chunk = fetchedStoryItems.slice(i, i + MAX_CONCURRENT_POST_PROCESSING);
    await Promise.all(chunk.map((storyItem, idx) => processStoryAndItsComments(storyItem, i + idx, fetchedStoryItems.length)));
  }
  
  process.stdout.write("\n"); // New line after progress updates

  const overallEndTime = Date.now();
  const totalTimeSeconds = (overallEndTime - overallStartTime) / 1000;

  console.log("--- Hacker News Data Fetch Completed ---");
  console.log(`Total Time Taken: ${totalTimeSeconds.toFixed(2)} seconds`);
  console.log(`Total Users Created: ${totalUsersCreated}`);
  console.log(`Total Posts Created: ${totalPostsCreated}`);
  console.log(`Total Comments Created: ${totalCommentsCreated}`);
  console.log("----------------------------------------");
}

main()
  .catch(async (e) => {
    console.error("Error in main execution:", e);
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      console.error("Prisma Error Code:", e.code);
      if (e.meta) console.error("Meta:", e.meta);
    }
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
