import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';
import { fakerEN } from '@faker-js/faker';

const prisma = new PrismaClient();

// Configuration
const USERS_COUNT = process.env.SEED_USERS_COUNT ? parseInt(process.env.SEED_USERS_COUNT) : 20;
const POSTS_PER_USER = process.env.SEED_POSTS_PER_USER ? parseInt(process.env.SEED_POSTS_PER_USER) : 10;
const COMMENTS_PER_POST = process.env.SEED_COMMENTS_PER_POST ? parseInt(process.env.SEED_COMMENTS_PER_POST) : 10;
const VOTES_PER_POST = process.env.SEED_VOTES_PER_POST ? parseInt(process.env.SEED_VOTES_PER_POST) : 10;
const SEED_MODE = process.env.SEED_MODE || 'development'; // 'development' or 'production'

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
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      username: 'admin',
      password: await hash('password123', 10),
    },
  });
  
  // Create regular users
  console.log(`Creating ${USERS_COUNT} users...`);
  const users = [adminUser];
  
  for (let i = 0; i < USERS_COUNT; i++) {
    const firstName = fakerEN.person.firstName();
    const lastName = fakerEN.person.lastName();
    // Use updated API: username() instead of userName()
    const username = fakerEN.internet.username({ firstName, lastName }).toLowerCase();
    
    const user = await prisma.user.create({
      data: {
        email: fakerEN.internet.email({ firstName, lastName }),
        username,
        password: await hash('password123', 10),
      },
    });
    
    users.push(user);
  }
  
  // Create posts
  console.log(`Creating ${USERS_COUNT * POSTS_PER_USER} posts...`);
  const posts = [];
  
  for (const user of users) {
    for (let i = 0; i < POSTS_PER_USER; i++) {
      const isLinkPost = Math.random() > 0.3; // 70% link posts, 30% text posts
      
      const post = await prisma.post.create({
        data: {
          title: generatePostTitle(),
          type: isLinkPost ? 'LINK' : 'TEXT',
          url: isLinkPost ? sanitizeUrl(fakerEN.internet.url()) : null,
          textContent: isLinkPost ? null : fakerEN.lorem.paragraphs(2),
          author: {
            connect: { id: user.id },
          },
          createdAt: fakerEN.date.recent({ days: 30 }),
        },
      });
      
      posts.push(post);
    }
  }
  
  // Create comments and votes
  console.log(`Creating comments and votes for posts...`);
  
  for (const post of posts) {
    // Create top-level comments
    for (let i = 0; i < COMMENTS_PER_POST; i++) {
      const commentAuthor = users[Math.floor(Math.random() * users.length)];
      
      const comment = await prisma.comment.create({
        data: {
          textContent: fakerEN.lorem.paragraph(),
          author: {
            connect: { id: commentAuthor.id },
          },
          post: {
            connect: { id: post.id },
          },
          createdAt: fakerEN.date.recent({ days: 15 }),
        },
      });
      
      // Add replies to some comments (50% chance)
      if (Math.random() > 0.5) {
        const replyCount = Math.floor(Math.random() * 3) + 1; // 1-3 replies
        
        for (let j = 0; j < replyCount; j++) {
          const replyAuthor = users[Math.floor(Math.random() * users.length)];
          
          await prisma.comment.create({
            data: {
              textContent: fakerEN.lorem.paragraph(),
              author: {
                connect: { id: replyAuthor.id },
              },
              post: {
                connect: { id: post.id },
              },
              parent: {
                connect: { id: comment.id },
              },
              createdAt: fakerEN.date.recent({ days: 10 }),
            },
          });
        }
      }
    }
    
    // Create votes for posts
    for (let i = 0; i < VOTES_PER_POST; i++) {
      const voter = users[Math.floor(Math.random() * users.length)];
      const voteType = Math.random() > 0.3 ? 'UPVOTE' : 'DOWNVOTE'; // 70% upvotes
      
      // Skip if user already voted on this post
      const existingVote = await prisma.vote.findFirst({
        where: {
          userId: voter.id,
          postId: post.id,
        },
      });
      
      if (!existingVote) {
        await prisma.vote.create({
          data: {
            voteType,
            user: {
              connect: { id: voter.id },
            },
            post: {
              connect: { id: post.id },
            },
          },
        });
      }
    }
  }
  
  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 