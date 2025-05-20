export const DEFAULT_GRAVITY = 1.8;

interface ScoreConfig {
  points: number;
  createdAt: Date | string; // Can accept Date object or ISO string
  gravity?: number;
}

/**
 * Calculates a ranking score for a post or comment.
 * Based on the Hacker News ranking algorithm: Score = (P - 1) / (T + 2)^G
 *
 * @param points - The number of points (e.g., upvotes - downvotes).
 * @param createdAt - The creation date/time of the item.
 * @param gravity - The gravity factor (controls how quickly score decays with time).
 * @returns The calculated score.
 */
export function calculateScore({
  points,
  createdAt,
  gravity = DEFAULT_GRAVITY,
}: ScoreConfig): number {
  const P = points;
  const T = (new Date().getTime() - new Date(createdAt).getTime()) / (1000 * 60 * 60); // Age in hours

  // Subtract 1 from points, but ensure it doesn't go below 0 for the numerator
  // This prevents negative scores if P is 0, though typically P should be >= 0
  const numerator = P > 0 ? P -1 : 0;
  
  // Ensure T is not negative (e.g. if item is from future, though unlikely)
  const ageInHours = Math.max(0, T);

  const denominator = Math.pow(ageInHours + 2, gravity);

  if (denominator === 0) {
    // Should not happen with T_hours + 2, unless gravity is such that it causes issues.
    // Return a very high score for brand new items if somehow denominator is 0,
    // or handle as an error/edge case. For now, let's give it a boost.
    return numerator > 0 ? Infinity : 0; 
  }

  return numerator / denominator;
}

// Example usage (can be removed or kept for testing):
const postScore = calculateScore({
  points: 100,
  createdAt: new Date(new Date().getTime() - 3 * 60 * 60 * 1000), // 3 hours ago
});
console.log("Example post score:", postScore);

const brandNewPostScore = calculateScore({
   points: 5,
   createdAt: new Date(), // Now
});
console.log("Example brand new post score:", brandNewPostScore);

const oldPostScore = calculateScore({
  points: 200,
  createdAt: new Date(new Date().getTime() - 72 * 60 * 60 * 1000), // 3 days ago
});
console.log("Example old post score:", oldPostScore); 