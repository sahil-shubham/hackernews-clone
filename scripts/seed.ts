import { PrismaClient, Prisma } from '@prisma/client';
import { hash } from 'bcryptjs';
import { fakerEN } from '@faker-js/faker';

const prisma = new PrismaClient();

// Configuration
const USERS_COUNT = Number(process.env.USERS_COUNT) || 500;
const ACTIVE_POSTERS_PERCENTAGE = Number(process.env.ACTIVE_POSTERS_PERCENTAGE) || 0.2;
const POSTS_PER_ACTIVE_POSTER_AVG = Number(process.env.POSTS_PER_ACTIVE_POSTER_AVG) || 3;
const COMMENTS_PER_POST_AVG = Number(process.env.COMMENTS_PER_POST_AVG) || 20;
const MAX_REPLIES_PER_COMMENT_AVG = Number(process.env.MAX_REPLIES_PER_COMMENT_AVG) || 3;
const VOTES_PER_POST_TARGET_AVG = Number(process.env.VOTES_PER_POST_TARGET_AVG) || 40;
const EXAMPLE_USERS_COUNT = Number(process.env.EXAMPLE_USERS_COUNT) || 0;
const SEED_MODE = process.env.SEED_MODE;
const BATCH_SIZE = Number(process.env.BATCH_SIZE) || 500; // New: Batch size for createMany operations

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
    () => `${fakerEN.company.name()} acquires ${fakerEN.company.name()} for $${(Math.random() * 1000).toFixed(0)}M`,
    () => `The future of ${fakerEN.hacker.noun()} is ${fakerEN.hacker.adjective()}`,
    () => `Why I switched from ${fakerEN.hacker.noun()} to ${fakerEN.hacker.noun()}`,
    () => `Is ${fakerEN.commerce.productName()} the new ${fakerEN.commerce.productName()} killer?`,
    () => `Deep Dive: Understanding ${fakerEN.hacker.abbreviation()} and ${fakerEN.hacker.noun()}`,
    () => `Unpopular Opinion: ${fakerEN.hacker.noun()}s are overrated. Discuss.`,
    // Question style titles
    () => `Ask HN: How do you ${fakerEN.hacker.verb()} your ${fakerEN.hacker.noun()}?`,
    () => `Ask HN: What's your favorite ${fakerEN.hacker.adjective()} tool for ${fakerEN.hacker.ingverb()}?`,
    () => `Ask HN: Best resources for learning ${fakerEN.company.buzzNoun()} in ${new Date().getFullYear()}?`,
    // Show HN style titles
    () => `Show HN: I built a ${fakerEN.hacker.adjective()} ${fakerEN.hacker.noun()} with ${fakerEN.hacker.noun()}`,
    () => `Show HN: ${fakerEN.company.catchPhrase()} - My weekend project, now open source!`,
    () => `Show HN: A new ${fakerEN.hacker.verb()} tool for ${fakerEN.hacker.ingverb()} tasks.`,
    // General tech titles
    () => `${fakerEN.number.int(10)} things you should know about ${fakerEN.hacker.noun()}`,
    () => `${fakerEN.company.name()} announces ${fakerEN.commerce.productName()} at annual conference`,
    () => `The ethics of AI in ${fakerEN.commerce.department()}. What are your thoughts?`,
    () => `A personal journey: From ${fakerEN.person.jobTitle()} to ${fakerEN.person.jobTitle()} using ${fakerEN.hacker.noun()}`,
  ];

  const randomTitle = titleTypes[Math.floor(Math.random() * titleTypes.length)]();
  return randomTitle.length > 120 ? randomTitle.substring(0, 117) + '...' : randomTitle; // Slightly longer titles allowed
};

// Generate realistic comment text
const generateCommentText = (postTitle?: string): string => {
  const commentStyles = [
    () => fakerEN.lorem.sentence(),
    () => fakerEN.lorem.sentences(fakerEN.number.int({ min: 1, max: 3 })),
    () => `This is a great point. I've always thought about ${fakerEN.hacker.noun()} in this way.`,
    () => `I partially agree, but what about the impact on ${fakerEN.commerce.department()}?`,
    () => `Could you elaborate on the part about "${fakerEN.hacker.verb()}ing the ${fakerEN.hacker.noun()}"?`,
    () => `Interesting take. I recently read an article on ${fakerEN.internet.domainName()} that had a similar perspective.`,
    () => `${fakerEN.hacker.phrase()}`,
    () => `Thanks for sharing! This is very ${fakerEN.word.adjective()}.`,
    () => `I'm not sure I follow. How does this relate to ${fakerEN.company.buzzNoun()}?`,
    () => `Has anyone tried using ${fakerEN.commerce.productName()} for this? Curious about results.`,
    () => `LOL, reminds me of the time I tried to ${fakerEN.hacker.verb()} a ${fakerEN.hacker.noun()} with a ${fakerEN.animal.type()}.`,
    () => `Source? I'd love to read more about this topic.`,
    () => `This is exactly what I was looking for. Thanks!`, 
    () => `Hmm, I have a different experience. For me, ${fakerEN.hacker.noun()} was more ${fakerEN.word.adjective()}.`
  ];

  // Attempt to make comment slightly relevant if postTitle is provided (simple keyword check)
  // This is a very naive approach and not true NLP.
  if (postTitle) {
    const keywords = ['build', 'future', 'tool', 'AI', 'new', 'problem', 'solution'];
    const titleLower = postTitle.toLowerCase();
    if (keywords.some(kw => titleLower.includes(kw))) {
      commentStyles.push(() => `Regarding the ${fakerEN.hacker.noun()} mentioned in the title, I think it's ${fakerEN.word.adjective()}.`);
      commentStyles.push(() => `The discussion around "${titleLower.substring(0,20)}..." is fascinating. My two cents: ${fakerEN.lorem.sentence()}`);
    }
  }

  return commentStyles[Math.floor(Math.random() * commentStyles.length)]();
};

async function main() {
  console.log(`Starting seed in ${SEED_MODE} mode...`);
  console.log(`Using BATCH_SIZE: ${BATCH_SIZE}`);
  
  // Clean database if in development mode
  if (SEED_MODE === 'development') {
    console.log('Cleaning database using TRUNCATE...');
    // List your table names as they appear in the database
    // These are typically the pluralized versions of your model names or @@map values
    const tableNames = [
      'notifications',
      'votes',
      'comments',
      'posts',
      'users'
      // Add any other tables managed by Prisma that need cleaning
    ];

    try {
      // Using $executeRawUnsafe because table names are part of a joined string.
      // Ensure tableNames are controlled and not from user input in other contexts.
      console.time('TruncateOperation');
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${tableNames.join('", "')}" RESTART IDENTITY CASCADE;`);
      console.timeEnd('TruncateOperation');
      console.log('Database cleaned successfully using TRUNCATE.');
    } catch (error) {
      console.error('Error during TRUNCATE operation:', error);
      console.warn('Falling back to deleteMany operations...');
      // Fallback to deleteMany if TRUNCATE fails (e.g., permissions)
      // This is the original slower method
      console.time('DeleteManyFallback');
      const deleted = await prisma.$transaction([
        prisma.notification.deleteMany(),
        prisma.vote.deleteMany(),
        prisma.comment.deleteMany(),
        prisma.post.deleteMany(),
        prisma.user.deleteMany()
      ]);
      console.timeEnd('DeleteManyFallback');
      console.log('Database cleaned successfully using deleteMany:');
      console.log(`Deleted ${deleted[0].count} notifications`);
      console.log(`Deleted ${deleted[1].count} votes`);
      console.log(`Deleted ${deleted[2].count} comments`);
      console.log(`Deleted ${deleted[3].count} posts`);
      console.log(`Deleted ${deleted[4].count} users`);
    }
  }
  
  // const hashedPassword = await hash('DemoUserPass123!', 10); // No longer a single shared password
  
  // Create regular users
  console.log(`Preparing ${USERS_COUNT} regular users...`);
  console.time('UserCreation');
  const regularUsersDataForCreateMany: Prisma.UserCreateManyInput[] = [];
  const exampleUserCredentials: {username: string, email: string, plainPassword?: string}[] = [];

  for (let i = 0; i < USERS_COUNT; i++) {
    const firstName = fakerEN.person.firstName();
    const lastName = fakerEN.person.lastName();
    const username = fakerEN.internet.username({ firstName, lastName }).toLowerCase().slice(0,20) + fakerEN.string.alphanumeric(3);
    const email = fakerEN.internet.email({ firstName, lastName, allowSpecialCharacters: false });
    
    let plainPassword = '';
    if (SEED_MODE === 'development' && i < 5) { // Generate and store plain password for the first 5 users in dev mode
        plainPassword = fakerEN.internet.password({ length: 12, memorable: false, prefix: 'Dev@' });
    }
    // For users beyond the first 5 in dev mode, or for all users in other modes, generate password but don't store plain text unless needed for logging.
    // For simplicity in this step, we will re-generate if not already set for dev logging. Production should never log plain passwords.
    const passwordToHash = plainPassword || fakerEN.internet.password({ length: 12, memorable: false, prefix: 'Pwd@' });
    
    const hashedPasswordForUser = await hash(passwordToHash, 10);

    regularUsersDataForCreateMany.push({
      email: email,
      username: username,
      password: hashedPasswordForUser,
    });

    if (SEED_MODE === 'development' && i < EXAMPLE_USERS_COUNT) {
      exampleUserCredentials.push({ username, email, plainPassword: passwordToHash });
    }
  }

  if (regularUsersDataForCreateMany.length > 0) {
    for (let i = 0; i < regularUsersDataForCreateMany.length; i += BATCH_SIZE) {
      const batch = regularUsersDataForCreateMany.slice(i, i + BATCH_SIZE);
      await prisma.user.createMany({
        data: batch,
        skipDuplicates: true,
      });
      process.stdout.write(`\rCreating users: ${i + batch.length}/${regularUsersDataForCreateMany.length} processed... `);
    }
    process.stdout.write(`\rCreating users: ${regularUsersDataForCreateMany.length}/${regularUsersDataForCreateMany.length} processed... Done.\n`);
  }
  console.timeEnd('UserCreation');
  console.log(`${regularUsersDataForCreateMany.length} regular users creation process finished.`);

  if (SEED_MODE === 'development' && exampleUserCredentials.length > 0) {
    console.log('\n--- Example Development User Credentials ---');
    exampleUserCredentials.forEach(cred => {
      console.log(`Username: ${cred.username} | Email: ${cred.email} | Password: ${cred.plainPassword}`);
    });
    console.log('----------------------------------------\n');
  }

  // Fetch all users to get their IDs
  console.time('FetchAllUsers');
  const allUsers = await prisma.user.findMany({ select: { id: true } });
  console.timeEnd('FetchAllUsers');
  if (allUsers.length === 0) {
    console.log("No users found, exiting seed.");
    return;
  }
  
  // Create posts
  console.log(`Preparing posts...`);
  console.time('PostCreation');
  const postsData: Prisma.PostCreateManyInput[] = [];
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Select active posters
  const numberOfActivePosters = Math.floor(allUsers.length * ACTIVE_POSTERS_PERCENTAGE);
  const activePosters = fakerEN.helpers.arrayElements(allUsers, Math.max(1, numberOfActivePosters)); // Ensure at least one active poster
  console.log(`${activePosters.length} users selected as active posters.`);
  
  for (const user of activePosters) { // Iterate over active posters only
    const numPostsForThisUser = fakerEN.number.int({ min: 1, max: POSTS_PER_ACTIVE_POSTER_AVG + 2 }); // Add some variability
    for (let i = 0; i < numPostsForThisUser; i++) {
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
    for (let i = 0; i < postsData.length; i += BATCH_SIZE) {
      const batch = postsData.slice(i, i + BATCH_SIZE);
      await prisma.post.createMany({ data: batch });
      process.stdout.write(`\rCreating posts: ${i + batch.length}/${postsData.length} processed... `);
    }
    process.stdout.write(`\rCreating posts: ${postsData.length}/${postsData.length} processed... Done.\n`);
  }
  console.timeEnd('PostCreation');
  console.log(`${postsData.length} posts creation process finished.`);

  // Fetch all posts to get their IDs
  console.time('FetchAllPosts');
  const allPosts = await prisma.post.findMany({ select: { id: true, createdAt: true, title: true } });
  console.timeEnd('FetchAllPosts');
  if (allPosts.length === 0) {
    console.log("No posts found, exiting seed for comments/votes.");
    return;
  }
  
  // Create comments and votes
  console.log(`Preparing comments...`);
  console.time('TopLevelCommentCreation');
  const commentsData: Prisma.CommentCreateManyInput[] = [];
  
  for (const post of allPosts) {
    const postCreatedAt = new Date(post.createdAt);
    const numCommentsForThisPost = fakerEN.number.int({ min: 0, max: COMMENTS_PER_POST_AVG });
    const now = new Date(); // Get current time once for this loop iteration
    for (let i = 0; i < numCommentsForThisPost; i++) {
      const author = fakerEN.helpers.arrayElement(allUsers);
      // Ensure commentCreatedAt is between post's creation and now
      let commentCreatedAt;
      if (postCreatedAt.getTime() >= now.getTime()) {
        commentCreatedAt = new Date(postCreatedAt.getTime() + 1); // Ensure it's at least 1ms after post
      } else {
        commentCreatedAt = fakerEN.date.between({ from: postCreatedAt, to: now });
      }
      commentsData.push({
        textContent: generateCommentText(post.title), // Use new generator, pass post title
        authorId: author.id,
        postId: post.id,
        createdAt: commentCreatedAt,
      });
    }
  }

  if (commentsData.length > 0) {
    for (let i = 0; i < commentsData.length; i += BATCH_SIZE) {
      const batch = commentsData.slice(i, i + BATCH_SIZE);
      await prisma.comment.createMany({ data: batch });
      process.stdout.write(`\rCreating top-level comments: ${i + batch.length}/${commentsData.length} processed... `);
    }
    process.stdout.write(`\rCreating top-level comments: ${commentsData.length}/${commentsData.length} processed... Done.\n`);
  }
  console.timeEnd('TopLevelCommentCreation');
  console.log(`${commentsData.length} top-level comments prepared for creation.`);

  // Fetch top-level comments for replies
  console.time('FetchTopLevelComments');
  const topLevelComments = await prisma.comment.findMany({
    where: { parentId: null },
    select: { id: true, createdAt: true, postId: true },
  });
  console.timeEnd('FetchTopLevelComments');

  console.time('ReplyCreation');
  const repliesData: Prisma.CommentCreateManyInput[] = [];
  for (const parentComment of topLevelComments) {
    if (Math.random() > 0.7) {
      const replyCount = fakerEN.number.int({ min: 1, max: MAX_REPLIES_PER_COMMENT_AVG });
      const parentCommentCreatedAt = new Date(parentComment.createdAt);
      const now = new Date(); // Get current time once for this loop iteration
      for (let j = 0; j < replyCount; j++) {
        const replyAuthor = fakerEN.helpers.arrayElement(allUsers);
        // Ensure replyCreatedAt is between parent comment's creation and now
        let replyCreatedAt;
        if (parentCommentCreatedAt.getTime() >= now.getTime()) {
          replyCreatedAt = new Date(parentCommentCreatedAt.getTime() + 1); // Ensure it's at least 1ms after parent
        } else {
          replyCreatedAt = fakerEN.date.between({ from: parentCommentCreatedAt, to: now });
        }
        repliesData.push({
          textContent: generateCommentText(), // Use new generator for replies (no title context needed here)
          authorId: replyAuthor.id,
          postId: parentComment.postId,
          parentId: parentComment.id,
          createdAt: replyCreatedAt,
        });
      }
    }
  }
  if (repliesData.length > 0) {
    for (let i = 0; i < repliesData.length; i += BATCH_SIZE) {
      const batch = repliesData.slice(i, i + BATCH_SIZE);
      await prisma.comment.createMany({ data: batch });
      process.stdout.write(`\rCreating replies: ${i + batch.length}/${repliesData.length} processed... `);
    }
    process.stdout.write(`\rCreating replies: ${repliesData.length}/${repliesData.length} processed... Done.\n`);
  } else {
    process.stdout.write("\rCreating replies: 0/0 processed... Done.\n");
  }
  console.timeEnd('ReplyCreation');

  // --- Notification Seeding Logic ---
  console.log('Preparing notifications based on seeded comments...');
  console.time('FetchAllSeededCommentsForNotifications');
  const allSeededComments = await prisma.comment.findMany({
    include: {
      post: { select: { authorId: true, id: true } },     // Get post author
      parent: { select: { authorId: true } }, // Get parent comment author
      // authorId is already on comment, no need to include author object just for id
    },
  });
  console.timeEnd('FetchAllSeededCommentsForNotifications');

  console.time('NotificationCreation');
  const notificationsToCreate: Prisma.NotificationCreateManyInput[] = [];
  const thirtyDaysAgoForNotifs = new Date(); // For notification createdAt
  thirtyDaysAgoForNotifs.setDate(thirtyDaysAgoForNotifs.getDate() - 30);

  for (const comment of allSeededComments) {
    const commenterId = comment.authorId;
    // Ensure createdAt for notification is after the comment itself, with a small random delay
    const baseDate = new Date(comment.createdAt);
    const now = new Date(); // Get current time once for this loop iteration
    // Ensure notificationCreatedAt is between comment's creation and now
    let notificationCreatedAt;
    if (baseDate.getTime() >= now.getTime()) {
      notificationCreatedAt = new Date(baseDate.getTime() + 1); // Ensure it's at least 1ms after comment
    } else {
      notificationCreatedAt = fakerEN.date.between({ from: baseDate, to: now });
    }

    if (comment.parentId && comment.parent) { // It's a reply
      const parentCommentAuthorId = comment.parent.authorId;
      if (parentCommentAuthorId !== commenterId) {
        notificationsToCreate.push({
          type: 'REPLY_TO_COMMENT',
          recipientId: parentCommentAuthorId,
          triggeringUserId: commenterId,
          postId: comment.postId,
          commentId: comment.id,
          createdAt: notificationCreatedAt,
          read: Math.random() > 0.5, // Make some notifications read (50/50)
        });
      }
    } else if (comment.post) { // It's a direct comment on a post
      const postAuthorId = comment.post.authorId;
      if (postAuthorId !== commenterId) {
        notificationsToCreate.push({
          type: 'NEW_COMMENT_ON_POST',
          recipientId: postAuthorId,
          triggeringUserId: commenterId,
          postId: comment.postId,
          commentId: comment.id,
          createdAt: notificationCreatedAt,
          read: Math.random() > 0.5, // Make some notifications read (50/50)
        });
      }
    }
  }

  if (notificationsToCreate.length > 0) {
    for (let i = 0; i < notificationsToCreate.length; i += BATCH_SIZE) {
      const batch = notificationsToCreate.slice(i, i + BATCH_SIZE);
      await prisma.notification.createMany({
        data: batch,
        skipDuplicates: true,
      });
      process.stdout.write(`\rCreating notifications: ${i + batch.length}/${notificationsToCreate.length} processed... `);
    }
    process.stdout.write(`\rCreating notifications: ${notificationsToCreate.length}/${notificationsToCreate.length} processed... Done.\n`);
  } else {
    process.stdout.write("\rCreating notifications: 0/0 processed... Done.\n");
  }
  console.timeEnd('NotificationCreation');
  // --- End Notification Seeding Logic ---

  // 5. Batch Create Votes
  console.log(`Preparing votes...`);
  console.time('VoteCreation');
  const votesData: Prisma.VoteCreateManyInput[] = [];
  const voteUserPostPairs = new Set<string>();

  for (const post of allPosts) {
    const numVotesForThisPost = fakerEN.number.int({ min: 0, max: Math.min(VOTES_PER_POST_TARGET_AVG, allUsers.length) });
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
    for (let i = 0; i < votesData.length; i += BATCH_SIZE) {
      const batch = votesData.slice(i, i + BATCH_SIZE);
      await prisma.vote.createMany({
        data: batch,
        skipDuplicates: true,
      });
      process.stdout.write(`\rCreating votes: ${i + batch.length}/${votesData.length} processed... `);
    }
    process.stdout.write(`\rCreating votes: ${votesData.length}/${votesData.length} processed... Done.\n`);
  } else {
    process.stdout.write("\rCreating votes: 0/0 processed... Done.\n");
  }
  console.timeEnd('VoteCreation');
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