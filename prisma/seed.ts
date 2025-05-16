import { PrismaClient, Prisma } from '@prisma/client';
import { hash } from 'bcryptjs';
import { fakerEN } from '@faker-js/faker';

const prisma = new PrismaClient();

// Configuration
const USERS_COUNT = Number(process.env.USERS_COUNT) || 500;
const POSTS_PER_USER = Number(process.env.POSTS_PER_USER) || 10;
const COMMENTS_PER_POST = Number(process.env.COMMENTS_PER_POST) || 15;
const MAX_REPLIES_PER_COMMENT = Number(process.env.MAX_REPLIES_PER_COMMENT) || 5;
const VOTES_PER_POST_TARGET = Number(process.env.VOTES_PER_POST_TARGET) || 250;
const SEED_MODE = process.env.SEED_MODE;

// Sanitize URLs to ensure they have https:// prefix
const sanitizeUrl = (url: string): string => {
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return `https://${url}`;
  }
  return url;
};

// Generate a realistic post title in English
const generatePostTitle = (): string => {
  const titleTypes = [
    // Tech news style titles
    () => `${fakerEN.company.buzzNoun()} launches new ${fakerEN.commerce.productName()}`,
    () => `How to build a ${fakerEN.hacker.adjective()} ${fakerEN.hacker.noun()} using ${fakerEN.hacker.verb()}`,
    () => `${fakerEN.company.name()} acquires ${fakerEN.company.name()} for $${(Math.random() * 1000).toFixed(0)} million`,
    () => `The future of ${fakerEN.hacker.noun()} is ${fakerEN.hacker.adjective()}`,
    () => `Why I switched from ${fakerEN.hacker.noun()} to ${fakerEN.hacker.noun()}`,
    // Question style titles
    () => `Ask HN: How do you ${fakerEN.hacker.verb()} your ${fakerEN.hacker.noun()}?`,
    () => `Ask HN: What's your favorite ${fakerEN.hacker.adjective()} tool for ${fakerEN.hacker.ingverb()}?`,
    // Show HN style titles
    () => `Show HN: I built a ${fakerEN.hacker.adjective()} ${fakerEN.hacker.noun()} with ${fakerEN.hacker.noun()}`,
    () => `Show HN: ${fakerEN.company.catchPhrase()} - My weekend project`,
    // General tech titles
    () => `${fakerEN.number.int(10)} things you should know about ${fakerEN.hacker.noun()}`,
    () => `${fakerEN.company.name()} announces ${fakerEN.commerce.productName()} at annual conference`,
  ];

  const randomTitle = titleTypes[Math.floor(Math.random() * titleTypes.length)]();
  return randomTitle.length > 100 ? randomTitle.substring(0, 97) + '...' : randomTitle;
};

async function main() {
  console.log(`Starting seed in ${SEED_MODE} mode...`);
  
  // Clean database if in development mode
  if (SEED_MODE === 'development') {
    console.log('Cleaning database...');
    await prisma.vote.deleteMany({});
    await prisma.comment.deleteMany({});
    await prisma.post.deleteMany({});
    await prisma.user.deleteMany({});
  }
  
  // Create admin user (consistent in all environments)
  console.log('Creating admin user...');
  const hashedPassword = await hash('password123', 10);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: { password: hashedPassword },
    create: {
      email: 'admin@example.com',
      username: 'admin',
      password: hashedPassword,
    },
  });
  
  // Create regular users
  console.log(`Preparing ${USERS_COUNT - 1} regular users...`);
  const regularUsersDataForCreateMany: Prisma.UserCreateManyInput[] = [];
  for (let i = 0; i < USERS_COUNT - 1; i++) {
    const firstName = fakerEN.person.firstName();
    const lastName = fakerEN.person.lastName();
    regularUsersDataForCreateMany.push({
      email: fakerEN.internet.email({ firstName, lastName, allowSpecialCharacters: false }),
      username: fakerEN.internet.username({ firstName, lastName }).toLowerCase().slice(0,20) + fakerEN.string.alphanumeric(3),
      password: hashedPassword,
    });
  }
  if (regularUsersDataForCreateMany.length > 0) {
    await prisma.user.createMany({
      data: regularUsersDataForCreateMany,
      skipDuplicates: true,
    });
  }
  console.log(`${regularUsersDataForCreateMany.length} regular users created.`);

  // Fetch all users to get their IDs
  const allUsers = await prisma.user.findMany({ select: { id: true } });
  if (allUsers.length === 0) {
    console.log("No users found, exiting seed.");
    return;
  }
  
  // Create posts
  console.log(`Preparing posts...`);
  const postsData: Prisma.PostCreateManyInput[] = [];
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  for (const user of allUsers) {
    for (let i = 0; i < POSTS_PER_USER; i++) {
      const isLinkPost = Math.random() > 0.3;
      const createdAt = fakerEN.date.between({ from: thirtyDaysAgo, to: new Date() });
      postsData.push({
        title: generatePostTitle(),
        type: isLinkPost ? 'LINK' : 'TEXT',
        url: isLinkPost ? sanitizeUrl(fakerEN.internet.url()) : null,
        textContent: isLinkPost ? null : fakerEN.lorem.paragraphs(2),
        authorId: user.id,
        createdAt: createdAt,
      });
    }
  }
  if (postsData.length > 0) {
    await prisma.post.createMany({ data: postsData });
  }
  console.log(`${postsData.length} posts created.`);

  // Fetch all posts to get their IDs
  const allPosts = await prisma.post.findMany({ select: { id: true, createdAt: true } });
  if (allPosts.length === 0) {
    console.log("No posts found, exiting seed for comments/votes.");
    return;
  }
  
  // Create comments and votes
  console.log(`Preparing comments...`);
  const commentsData: Prisma.CommentCreateManyInput[] = [];
  
  for (const post of allPosts) {
    const postCreatedAt = new Date(post.createdAt);
    for (let i = 0; i < COMMENTS_PER_POST; i++) {
      const author = fakerEN.helpers.arrayElement(allUsers);
      const commentCreatedAt = fakerEN.date.soon({ days: 5, refDate: postCreatedAt });
      commentsData.push({
        textContent: fakerEN.lorem.paragraph(),
        authorId: author.id,
        postId: post.id,
        createdAt: commentCreatedAt,
      });
    }
  }

  if (commentsData.length > 0) {
    await prisma.comment.createMany({ data: commentsData });
  }
  console.log(`${commentsData.length} top-level comments prepared for creation.`);

  // Fetch top-level comments for replies
  const topLevelComments = await prisma.comment.findMany({
    where: { parentId: null },
    select: { id: true, createdAt: true, postId: true },
  });

  const repliesData: Prisma.CommentCreateManyInput[] = [];
  for (const parentComment of topLevelComments) {
    if (Math.random() > 0.5) {
      const replyCount = fakerEN.number.int({ min: 1, max: MAX_REPLIES_PER_COMMENT });
      const parentCommentCreatedAt = new Date(parentComment.createdAt);
      for (let j = 0; j < replyCount; j++) {
        const replyAuthor = fakerEN.helpers.arrayElement(allUsers);
        repliesData.push({
          textContent: fakerEN.lorem.sentence(),
          authorId: replyAuthor.id,
          postId: parentComment.postId,
          parentId: parentComment.id,
          createdAt: fakerEN.date.soon({ days: 2, refDate: parentCommentCreatedAt }),
        });
      }
    }
  }
  if (repliesData.length > 0) {
    await prisma.comment.createMany({ data: repliesData });
    console.log(`${repliesData.length} replies created.`);
  }

  // 5. Batch Create Votes
  console.log(`Preparing votes...`);
  const votesData: Prisma.VoteCreateManyInput[] = [];
  const voteUserPostPairs = new Set<string>();

  for (const post of allPosts) {
    const numVotesForThisPost = fakerEN.number.int({ min: 0, max: Math.min(VOTES_PER_POST_TARGET, allUsers.length) });
    const shuffledUsers = fakerEN.helpers.shuffle(allUsers);

    for (let i = 0; i < numVotesForThisPost; i++) {
      const voter = shuffledUsers[i];
      if (!voter) continue;

      const pairKey = `${voter.id}-${post.id}`;
      if (voteUserPostPairs.has(pairKey)) continue;

      votesData.push({
        voteType: Math.random() > 0.3 ? 'UPVOTE' : 'DOWNVOTE',
        userId: voter.id,
        postId: post.id,
      });
      voteUserPostPairs.add(pairKey);
    }
  }
  
  if (votesData.length > 0) {
    await prisma.vote.createMany({
      data: votesData,
      skipDuplicates: true,
    });
  }
  console.log(`${votesData.length} votes created.`);

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      console.error("Prisma Error Code:", e.code);
      console.error("Meta:", e.meta);
    }
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 