import type { QuizRecommendation, Subject } from "@organizer/shared";
import type { GeneratedQuizQuestion } from "../lib/openai";
import { prisma } from "../lib/prisma";

export type StaticQuestion = GeneratedQuizQuestion;

/**
 * Real, hand-written static question bank used as a fallback whenever OpenAI
 * is unavailable (no API key, network error, rate limit, malformed
 * response). Every question below is factually correct; each subject has 10
 * questions spanning easy/medium/hard difficulty.
 */
const QUESTION_BANK: Record<Subject, StaticQuestion[]> = {
  math: [
    {
      prompt: "What is 7 x 8?",
      choices: ["54", "56", "64", "49"],
      correctIndex: 1,
      explanation: "7 multiplied by 8 equals 56.",
      difficulty: "easy",
    },
    {
      prompt: "What is the value of pi rounded to two decimal places?",
      choices: ["3.12", "3.14", "3.16", "3.18"],
      correctIndex: 1,
      explanation: "Pi (π) is approximately 3.14159, which rounds to 3.14.",
      difficulty: "easy",
    },
    {
      prompt: "Solve: 15 - 9 = ?",
      choices: ["4", "5", "6", "7"],
      correctIndex: 2,
      explanation: "15 minus 9 equals 6.",
      difficulty: "easy",
    },
    {
      prompt: "What is the square root of 144?",
      choices: ["10", "11", "12", "14"],
      correctIndex: 2,
      explanation: "12 x 12 = 144, so the square root of 144 is 12.",
      difficulty: "medium",
    },
    {
      prompt: "Solve for x: 2x + 5 = 17",
      choices: ["5", "6", "7", "8"],
      correctIndex: 1,
      explanation: "2x = 12, so x = 6.",
      difficulty: "medium",
    },
    {
      prompt: "What is the area of a rectangle with length 8 and width 5?",
      choices: ["13", "35", "40", "45"],
      correctIndex: 2,
      explanation: "Area = length x width = 8 x 5 = 40.",
      difficulty: "medium",
    },
    {
      prompt: "What is the sum of the interior angles of a triangle?",
      choices: ["90 degrees", "180 degrees", "270 degrees", "360 degrees"],
      correctIndex: 1,
      explanation: "The interior angles of any triangle always sum to 180 degrees.",
      difficulty: "medium",
    },
    {
      prompt: "What is the derivative of x^2 with respect to x?",
      choices: ["x", "2x", "x^2", "2"],
      correctIndex: 1,
      explanation: "Using the power rule, d/dx(x^2) = 2x.",
      difficulty: "hard",
    },
    {
      prompt: "Simplify: 3^2 x 3^3 = 3^?",
      choices: ["3^5", "3^6", "3^8", "3^9"],
      correctIndex: 0,
      explanation: "When multiplying powers with the same base, add the exponents: 2 + 3 = 5.",
      difficulty: "hard",
    },
    {
      prompt: "What is the slope of the line y = 3x + 2?",
      choices: ["2", "3", "5", "1"],
      correctIndex: 1,
      explanation: "In slope-intercept form y = mx + b, m is the slope, which is 3 here.",
      difficulty: "hard",
    },
  ],
  science: [
    {
      prompt: "What planet is known as the Red Planet?",
      choices: ["Venus", "Mars", "Jupiter", "Saturn"],
      correctIndex: 1,
      explanation: "Mars appears red due to iron oxide (rust) on its surface.",
      difficulty: "easy",
    },
    {
      prompt: "What gas do plants absorb from the atmosphere for photosynthesis?",
      choices: ["Oxygen", "Nitrogen", "Carbon dioxide", "Hydrogen"],
      correctIndex: 2,
      explanation: "Plants absorb carbon dioxide and release oxygen during photosynthesis.",
      difficulty: "easy",
    },
    {
      prompt: "What is the chemical formula for water?",
      choices: ["O2", "H2O", "CO2", "NaCl"],
      correctIndex: 1,
      explanation: "Water is composed of two hydrogen atoms and one oxygen atom: H2O.",
      difficulty: "easy",
    },
    {
      prompt: "What is the powerhouse of the cell?",
      choices: ["Nucleus", "Ribosome", "Mitochondria", "Golgi apparatus"],
      correctIndex: 2,
      explanation: "Mitochondria generate most of the cell's ATP energy supply.",
      difficulty: "medium",
    },
    {
      prompt: "What force pulls objects toward the Earth?",
      choices: ["Magnetism", "Friction", "Gravity", "Tension"],
      correctIndex: 2,
      explanation: "Gravity is the force of attraction between objects with mass.",
      difficulty: "medium",
    },
    {
      prompt: "How many bones are in the adult human body?",
      choices: ["186", "206", "226", "246"],
      correctIndex: 1,
      explanation: "The adult human skeleton has 206 bones.",
      difficulty: "medium",
    },
    {
      prompt: "What is the boiling point of water at sea level in Celsius?",
      choices: ["90", "100", "110", "120"],
      correctIndex: 1,
      explanation: "At standard atmospheric pressure, water boils at 100 degrees Celsius.",
      difficulty: "medium",
    },
    {
      prompt: "Which subatomic particle has a negative charge?",
      choices: ["Proton", "Neutron", "Electron", "Positron"],
      correctIndex: 2,
      explanation: "Electrons carry a negative charge and orbit the atomic nucleus.",
      difficulty: "hard",
    },
    {
      prompt: "What is the process by which plants make food using sunlight called?",
      choices: ["Respiration", "Photosynthesis", "Fermentation", "Transpiration"],
      correctIndex: 1,
      explanation: "Photosynthesis converts light energy into chemical energy (glucose).",
      difficulty: "hard",
    },
    {
      prompt:
        "Which law states that for every action there is an equal and opposite reaction?",
      choices: [
        "Newton's First Law",
        "Newton's Second Law",
        "Newton's Third Law",
        "Law of Conservation of Energy",
      ],
      correctIndex: 2,
      explanation: "Newton's Third Law describes action-reaction force pairs.",
      difficulty: "hard",
    },
  ],
  english: [
    {
      prompt: 'Which word is a synonym for "happy"?',
      choices: ["Sad", "Joyful", "Angry", "Tired"],
      correctIndex: 1,
      explanation: '"Joyful" means feeling or expressing great happiness.',
      difficulty: "easy",
    },
    {
      prompt: 'What is the plural of "child"?',
      choices: ["Childs", "Childes", "Children", "Childrens"],
      correctIndex: 2,
      explanation: '"Child" has an irregular plural form: "children".',
      difficulty: "easy",
    },
    {
      prompt: 'Identify the noun in this sentence: "The dog ran quickly."',
      choices: ["ran", "quickly", "dog", "the"],
      correctIndex: 2,
      explanation: '"Dog" is the noun (a person, place, or thing) in the sentence.',
      difficulty: "easy",
    },
    {
      prompt: 'What is the past tense of "go"?',
      choices: ["Goed", "Gone", "Went", "Going"],
      correctIndex: 2,
      explanation: '"Go" is an irregular verb; its simple past tense is "went".',
      difficulty: "medium",
    },
    {
      prompt: "Which sentence uses correct punctuation?",
      choices: ["Its a sunny day.", "It's a sunny day.", "Its' a sunny day.", "Its a Sunny day"],
      correctIndex: 1,
      explanation: '"It\'s" is the correct contraction of "it is".',
      difficulty: "medium",
    },
    {
      prompt: "What type of word describes or modifies a noun?",
      choices: ["Verb", "Adverb", "Adjective", "Pronoun"],
      correctIndex: 2,
      explanation: "Adjectives describe qualities or attributes of nouns.",
      difficulty: "medium",
    },
    {
      prompt:
        "What do we call the central point an author is making in a piece of writing?",
      choices: ["Setting", "Main idea", "Climax", "Dialogue"],
      correctIndex: 1,
      explanation: "The main idea is the central point or message of a text.",
      difficulty: "medium",
    },
    {
      prompt: 'Which literary device compares two things using "like" or "as"?',
      choices: ["Metaphor", "Simile", "Personification", "Hyperbole"],
      correctIndex: 1,
      explanation: 'A simile explicitly compares using "like" or "as".',
      difficulty: "hard",
    },
    {
      prompt: "What is the term for a word that has the same meaning as another word?",
      choices: ["Antonym", "Synonym", "Homophone", "Homonym"],
      correctIndex: 1,
      explanation: "Synonyms are words with the same or similar meanings.",
      difficulty: "hard",
    },
    {
      prompt: 'In grammar, what is the subject of the sentence "Maria wrote a letter."?',
      choices: ["a letter", "wrote", "Maria", "letter"],
      correctIndex: 2,
      explanation: '"Maria" performs the action, making her the subject.',
      difficulty: "hard",
    },
  ],
  geography: [
    {
      prompt: "What is the largest continent by area?",
      choices: ["Africa", "Asia", "Europe", "North America"],
      correctIndex: 1,
      explanation: "Asia is the largest continent by both area and population.",
      difficulty: "easy",
    },
    {
      prompt: "What is the longest river in the world?",
      choices: ["Amazon", "Nile", "Yangtze", "Mississippi"],
      correctIndex: 1,
      explanation: "The Nile River in Africa is traditionally considered the longest river.",
      difficulty: "easy",
    },
    {
      prompt: "Which ocean is the largest?",
      choices: ["Atlantic", "Indian", "Arctic", "Pacific"],
      correctIndex: 3,
      explanation: "The Pacific Ocean is the largest and deepest of Earth's oceans.",
      difficulty: "easy",
    },
    {
      prompt: "What is the capital of France?",
      choices: ["Berlin", "Madrid", "Paris", "Rome"],
      correctIndex: 2,
      explanation: "Paris is the capital and most populous city of France.",
      difficulty: "medium",
    },
    {
      prompt: "Which desert is the largest hot desert in the world?",
      choices: ["Gobi", "Sahara", "Kalahari", "Mojave"],
      correctIndex: 1,
      explanation: "The Sahara in North Africa is the largest hot desert on Earth.",
      difficulty: "medium",
    },
    {
      prompt: "Mount Everest is located in which mountain range?",
      choices: ["Andes", "Alps", "Himalayas", "Rockies"],
      correctIndex: 2,
      explanation: "Mount Everest, the world's tallest peak, is part of the Himalayas.",
      difficulty: "medium",
    },
    {
      prompt: "What is the smallest country in the world by area?",
      choices: ["Monaco", "San Marino", "Vatican City", "Liechtenstein"],
      correctIndex: 2,
      explanation: "Vatican City covers about 0.49 square kilometers.",
      difficulty: "medium",
    },
    {
      prompt: "Which country has the most time zones (including territories)?",
      choices: ["Russia", "United States", "France", "China"],
      correctIndex: 2,
      explanation: "France spans 12 time zones counting its overseas territories.",
      difficulty: "hard",
    },
    {
      prompt: "What line of latitude divides the Earth into Northern and Southern Hemispheres?",
      choices: ["Prime Meridian", "Equator", "Tropic of Cancer", "Arctic Circle"],
      correctIndex: 1,
      explanation: "The Equator is the imaginary line at 0 degrees latitude.",
      difficulty: "hard",
    },
    {
      prompt: "Which African country was formerly known as Abyssinia?",
      choices: ["Egypt", "Ethiopia", "Sudan", "Kenya"],
      correctIndex: 1,
      explanation: "Ethiopia was historically referred to as Abyssinia.",
      difficulty: "hard",
    },
  ],
  history: [
    {
      prompt: "In what year did World War II end?",
      choices: ["1943", "1945", "1947", "1950"],
      correctIndex: 1,
      explanation: "World War II ended in 1945 with the surrender of Japan and Germany.",
      difficulty: "easy",
    },
    {
      prompt: "Who was the first President of the United States?",
      choices: ["Thomas Jefferson", "George Washington", "Abraham Lincoln", "John Adams"],
      correctIndex: 1,
      explanation: "George Washington served as the first U.S. President from 1789-1797.",
      difficulty: "easy",
    },
    {
      prompt: "Which ancient civilization built the pyramids of Giza?",
      choices: ["Romans", "Greeks", "Egyptians", "Mayans"],
      correctIndex: 2,
      explanation: "The ancient Egyptians built the Giza pyramid complex.",
      difficulty: "easy",
    },
    {
      prompt: "The French Revolution began in which year?",
      choices: ["1789", "1799", "1804", "1776"],
      correctIndex: 0,
      explanation: "The French Revolution began in 1789 with the storming of the Bastille.",
      difficulty: "medium",
    },
    {
      prompt: "Who primarily authored the Declaration of Independence?",
      choices: ["Benjamin Franklin", "Thomas Jefferson", "John Adams", "James Madison"],
      correctIndex: 1,
      explanation: "Thomas Jefferson was the principal author of the 1776 Declaration.",
      difficulty: "medium",
    },
    {
      prompt: "The Cold War was primarily between the United States and which country?",
      choices: ["China", "Soviet Union", "Germany", "Japan"],
      correctIndex: 1,
      explanation: "The Cold War (1947-1991) was a geopolitical standoff with the USSR.",
      difficulty: "medium",
    },
    {
      prompt: "Which empire was ruled by Julius Caesar?",
      choices: ["Ottoman Empire", "Roman Empire", "Persian Empire", "Byzantine Empire"],
      correctIndex: 1,
      explanation: "Julius Caesar was a dictator and general of the Roman Republic/Empire.",
      difficulty: "medium",
    },
    {
      prompt: "The Berlin Wall fell in what year?",
      choices: ["1987", "1989", "1991", "1993"],
      correctIndex: 1,
      explanation: "The Berlin Wall fell in November 1989, symbolizing the Cold War's end.",
      difficulty: "hard",
    },
    {
      prompt: "Which treaty formally ended World War I?",
      choices: ["Treaty of Versailles", "Treaty of Paris", "Treaty of Ghent", "Treaty of Tordesillas"],
      correctIndex: 0,
      explanation: "The Treaty of Versailles (1919) formally ended WWI.",
      difficulty: "hard",
    },
    {
      prompt: "Who was the leader of the Soviet Union during most of World War II?",
      choices: ["Lenin", "Stalin", "Khrushchev", "Gorbachev"],
      correctIndex: 1,
      explanation: "Joseph Stalin led the USSR throughout World War II.",
      difficulty: "hard",
    },
  ],
  computer_science: [
    {
      prompt: "What does CPU stand for?",
      choices: [
        "Central Process Unit",
        "Central Processing Unit",
        "Computer Personal Unit",
        "Central Processor Utility",
      ],
      correctIndex: 1,
      explanation: "CPU stands for Central Processing Unit, the computer's main processor.",
      difficulty: "easy",
    },
    {
      prompt: "Which language is primarily used for styling web pages?",
      choices: ["HTML", "CSS", "JavaScript", "Python"],
      correctIndex: 1,
      explanation: "CSS (Cascading Style Sheets) controls the visual styling of web pages.",
      difficulty: "easy",
    },
    {
      prompt: 'What does "www" stand for?',
      choices: ["World Wide Web", "World Web Wide", "Wide World Web", "Web World Wide"],
      correctIndex: 0,
      explanation: '"www" stands for World Wide Web.',
      difficulty: "easy",
    },
    {
      prompt: "Which data structure uses FIFO (first-in, first-out) ordering?",
      choices: ["Stack", "Queue", "Tree", "Graph"],
      correctIndex: 1,
      explanation: "A queue removes elements in the same order they were added (FIFO).",
      difficulty: "medium",
    },
    {
      prompt: 'What does "HTML" stand for?',
      choices: [
        "Hyper Text Markup Language",
        "High Tech Modern Language",
        "Hyperlink and Text Markup Language",
        "Home Tool Markup Language",
      ],
      correctIndex: 0,
      explanation: "HTML stands for Hyper Text Markup Language.",
      difficulty: "medium",
    },
    {
      prompt: "Which sorting algorithm has an average time complexity of O(n log n)?",
      choices: ["Bubble Sort", "Merge Sort", "Selection Sort", "Insertion Sort"],
      correctIndex: 1,
      explanation: "Merge sort divides and conquers, achieving O(n log n) average performance.",
      difficulty: "medium",
    },
    {
      prompt: "What is the binary representation of the decimal number 5?",
      choices: ["100", "101", "110", "111"],
      correctIndex: 1,
      explanation: "5 in binary is 101 (4 + 0 + 1).",
      difficulty: "medium",
    },
    {
      prompt: 'What does "SQL" stand for?',
      choices: [
        "Structured Query Language",
        "Sequential Query Language",
        "Simple Question Language",
        "Structured Question Logic",
      ],
      correctIndex: 0,
      explanation: "SQL stands for Structured Query Language, used to manage databases.",
      difficulty: "hard",
    },
    {
      prompt: "In Big-O notation, what is the time complexity of binary search?",
      choices: ["O(n)", "O(log n)", "O(n^2)", "O(1)"],
      correctIndex: 1,
      explanation: "Binary search halves the search space each step, giving O(log n).",
      difficulty: "hard",
    },
    {
      prompt: "Which of these is NOT a programming paradigm?",
      choices: ["Object-Oriented", "Functional", "Declarative", "Alphabetical"],
      correctIndex: 3,
      explanation: '"Alphabetical" is not a recognized programming paradigm.',
      difficulty: "hard",
    },
  ],
  business: [
    {
      prompt: 'What does "ROI" stand for?',
      choices: ["Rate of Interest", "Return on Investment", "Revenue of Income", "Ratio of Investment"],
      correctIndex: 1,
      explanation: "ROI measures the profitability of an investment relative to its cost.",
      difficulty: "easy",
    },
    {
      prompt: "What is a company's income statement primarily used to show?",
      choices: [
        "Assets and liabilities",
        "Revenue and expenses over a period",
        "Cash position at a point in time",
        "Shareholder list",
      ],
      correctIndex: 1,
      explanation: "An income statement reports revenues and expenses over a given period.",
      difficulty: "easy",
    },
    {
      prompt: "What term describes the money a business has left after paying all expenses?",
      choices: ["Revenue", "Profit", "Liability", "Equity"],
      correctIndex: 1,
      explanation: "Profit is revenue minus all expenses.",
      difficulty: "easy",
    },
    {
      prompt: 'What is a "break-even point"?',
      choices: [
        "When revenue equals total costs",
        "When profit is maximized",
        "When a company goes public",
        "When expenses exceed revenue",
      ],
      correctIndex: 0,
      explanation: "The break-even point is where total revenue equals total costs (zero profit).",
      difficulty: "medium",
    },
    {
      prompt: 'What does "B2B" stand for?',
      choices: ["Business to Business", "Back to Basics", "Business to Bank", "Buy to Build"],
      correctIndex: 0,
      explanation: "B2B describes commerce between businesses rather than consumers.",
      difficulty: "medium",
    },
    {
      prompt:
        "Which document outlines a company's mission, strategy, and financial forecasts to investors?",
      choices: ["Invoice", "Business plan", "Balance sheet", "Purchase order"],
      correctIndex: 1,
      explanation: "A business plan describes strategy, market analysis, and projections.",
      difficulty: "medium",
    },
    {
      prompt: 'What is "market segmentation"?',
      choices: [
        "Dividing a market into distinct groups of buyers",
        "Setting a fixed price for all customers",
        "Merging with a competitor",
        "Selling only one product",
      ],
      correctIndex: 0,
      explanation: "Market segmentation groups customers by shared needs or characteristics.",
      difficulty: "medium",
    },
    {
      prompt: 'What is a "SWOT analysis" used for?',
      choices: [
        "Tax filing",
        "Assessing Strengths, Weaknesses, Opportunities, and Threats",
        "Calculating payroll",
        "Measuring employee satisfaction",
      ],
      correctIndex: 1,
      explanation: "SWOT is a strategic planning framework for internal/external factors.",
      difficulty: "hard",
    },
    {
      prompt: 'What does "equity" represent on a balance sheet?',
      choices: [
        "Total liabilities",
        "Owner's residual claim on assets after liabilities",
        "Total revenue",
        "Operating expenses",
      ],
      correctIndex: 1,
      explanation: "Equity = Assets - Liabilities, the owners' stake in the company.",
      difficulty: "hard",
    },
    {
      prompt: "What pricing strategy sets an initially high price then lowers it over time?",
      choices: ["Penetration pricing", "Price skimming", "Cost-plus pricing", "Loss leader pricing"],
      correctIndex: 1,
      explanation: "Price skimming targets early adopters at a high price before lowering it.",
      difficulty: "hard",
    },
  ],
  economics: [
    {
      prompt: "What does GDP stand for?",
      choices: [
        "Gross Domestic Product",
        "General Domestic Profit",
        "Gross Domestic Profit",
        "General Direct Product",
      ],
      correctIndex: 0,
      explanation: "GDP is the total value of goods/services produced in a country in a year.",
      difficulty: "easy",
    },
    {
      prompt: 'What is "inflation"?',
      choices: [
        "A decrease in the general price level",
        "An increase in the general price level",
        "A rise in unemployment",
        "A decrease in GDP",
      ],
      correctIndex: 1,
      explanation: "Inflation is a sustained rise in the general price level over time.",
      difficulty: "easy",
    },
    {
      prompt: 'What does "supply and demand" describe?',
      choices: [
        "A model explaining price determination in a market",
        "A government tax policy",
        "A type of currency",
        "A banking regulation",
      ],
      correctIndex: 0,
      explanation: "Supply and demand explains how prices are set by buyers and sellers.",
      difficulty: "easy",
    },
    {
      prompt: 'What is "opportunity cost"?',
      choices: [
        "The cost of borrowing money",
        "The value of the next best alternative given up",
        "The price of a product",
        "The total cost of production",
      ],
      correctIndex: 1,
      explanation: "Opportunity cost is what you give up by choosing one option over another.",
      difficulty: "medium",
    },
    {
      prompt: "Which economic system is based on private ownership and free markets?",
      choices: ["Socialism", "Capitalism", "Communism", "Feudalism"],
      correctIndex: 1,
      explanation: "Capitalism relies on private property and market-based exchange.",
      difficulty: "medium",
    },
    {
      prompt: 'What does "monopoly" describe?',
      choices: [
        "Many sellers of the same good",
        "A single seller dominating a market",
        "Government control of all industries",
        "Zero competition tax",
      ],
      correctIndex: 1,
      explanation: "A monopoly exists when one firm dominates supply of a good or service.",
      difficulty: "medium",
    },
    {
      prompt: "What is the term for money paid by government to support a business or activity?",
      choices: ["Subsidy", "Tariff", "Tax", "Quota"],
      correctIndex: 0,
      explanation: "A subsidy is financial support given by government to lower costs.",
      difficulty: "medium",
    },
    {
      prompt: 'What does "fiscal policy" refer to?',
      choices: [
        "Central bank interest rate decisions",
        "Government spending and taxation decisions",
        "Currency exchange rates",
        "International trade agreements",
      ],
      correctIndex: 1,
      explanation: "Fiscal policy uses government spending and taxes to influence the economy.",
      difficulty: "hard",
    },
    {
      prompt: 'What is "elasticity of demand"?',
      choices: [
        "The tax rate on goods",
        "How much quantity demanded changes in response to price changes",
        "The rate of inflation",
        "The cost of production",
      ],
      correctIndex: 1,
      explanation: "Elasticity measures the responsiveness of demand to price changes.",
      difficulty: "hard",
    },
    {
      prompt: 'What does "monetary policy" typically control?',
      choices: ["Government spending", "Money supply and interest rates", "Trade tariffs", "Corporate taxes"],
      correctIndex: 1,
      explanation: "Central banks use monetary policy to manage money supply and interest rates.",
      difficulty: "hard",
    },
  ],
};

function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Returns `count` real questions from the static bank for a subject. If more
 * are requested than exist uniquely, the shuffled bank is cycled so we always
 * return exactly `count` valid questions (never crash/short-change a quiz).
 */
export function generateFallbackQuestions(subject: Subject, count: number): StaticQuestion[] {
  const bank = QUESTION_BANK[subject] ?? [];
  if (bank.length === 0 || count <= 0) return [];

  const result: StaticQuestion[] = [];
  while (result.length < count) {
    const remaining = count - result.length;
    const batch = shuffle(bank).slice(0, remaining);
    result.push(...batch);
  }
  return result;
}

export type AdaptiveDifficulty = "easy" | "medium" | "hard" | "mixed";

/**
 * Looks at the user's recent quiz history for this subject and picks a
 * difficulty bias for the next quiz: strong recent scores push toward
 * "hard", weak scores toward "easy", and no history (or middling scores)
 * stays "mixed".
 */
async function pickDifficulty(userId: string, subject: Subject): Promise<AdaptiveDifficulty> {
  const recent = await prisma.quizAttempt.findMany({
    where: { userId, quiz: { subject: subjectToPrisma(subject) } },
    orderBy: { completedAt: "desc" },
    take: 5,
    select: { score: true, totalQuestions: true },
  });

  if (recent.length === 0) return "mixed";

  const avgPercent =
    recent.reduce((sum, a) => sum + (a.totalQuestions > 0 ? a.score / a.totalQuestions : 0), 0) /
    recent.length;

  if (avgPercent >= 0.85) return "hard";
  if (avgPercent <= 0.45) return "easy";
  return "mixed";
}

function subjectToPrisma(subject: Subject): import("@prisma/client").Subject {
  return subject.toUpperCase() as import("@prisma/client").Subject;
}

/**
 * Assembles a 15-question adaptive quiz for `subject`: biases difficulty
 * from the user's recent attempt history, prefers OpenAI-generated questions,
 * and pads/falls back to the static bank so the quiz always has exactly 15
 * questions even if OpenAI is unavailable or returns fewer than requested.
 */
export async function assembleAdaptiveQuiz(
  userId: string,
  subject: Subject,
  size = 15
): Promise<StaticQuestion[]> {
  const difficulty = await pickDifficulty(userId, subject);

  // Lazily require to keep the openai<->quizBank cycle resolved at call time.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { generateQuizQuestions } = require("../lib/openai") as typeof import("../lib/openai");

  const generated = await generateQuizQuestions(subject, size, difficulty);

  const seenPrompts = new Set<string>();
  const deduped: StaticQuestion[] = [];
  for (const q of generated) {
    const key = q.prompt.trim().toLowerCase();
    if (seenPrompts.has(key)) continue;
    seenPrompts.add(key);
    deduped.push(q);
  }

  if (deduped.length >= size) return deduped.slice(0, size);

  const padding = generateFallbackQuestions(subject, size - deduped.length);
  return [...deduped, ...padding].slice(0, size);
}

/**
 * Small static map of weak-subject follow-up recommendations, biased by the
 * score the user just got. No AI call needed for this - simple heuristics.
 */
const SUBJECT_RESOURCES: Record<Subject, QuizRecommendation> = {
  math: {
    books: ["The Art of Problem Solving", "How to Solve It (Polya)"],
    courses: ["Algebra Foundations", "Geometry Essentials"],
    studyPlans: ["20 minutes of daily practice problems", "Weekly timed mock tests"],
    practiceExercises: ["Extra algebra drills", "Word problem practice set"],
  },
  science: {
    books: ["A Short History of Nearly Everything", "The Science Book"],
    courses: ["Intro to Biology", "Physics Fundamentals"],
    studyPlans: ["Flashcard review of key vocabulary", "Weekly lab-concept recap"],
    practiceExercises: ["Diagram labeling practice", "Concept-mapping exercise"],
  },
  english: {
    books: ["The Elements of Style", "Reading Like a Writer"],
    courses: ["Grammar Essentials", "Essay Writing Workshop"],
    studyPlans: ["Read 15 minutes daily", "Weekly vocabulary list review"],
    practiceExercises: ["Sentence correction drills", "Short essay practice"],
  },
  geography: {
    books: ["Prisoners of Geography", "The Times Atlas of the World"],
    courses: ["World Geography Basics", "Physical Geography 101"],
    studyPlans: ["Weekly map-labeling practice", "Capital cities flashcards"],
    practiceExercises: ["Blank map quiz", "Landmark identification set"],
  },
  history: {
    books: ["A People's History", "Sapiens"],
    courses: ["World History Overview", "20th Century History"],
    studyPlans: ["Timeline-building exercise weekly", "Primary-source reading practice"],
    practiceExercises: ["Timeline sequencing drills", "Cause-and-effect essay practice"],
  },
  computer_science: {
    books: ["Grokking Algorithms", "Clean Code"],
    courses: ["Intro to Programming", "Data Structures & Algorithms"],
    studyPlans: ["Solve 1 coding problem daily", "Weekly project mini-build"],
    practiceExercises: ["Algorithm tracing drills", "Debugging practice set"],
  },
  business: {
    books: ["The Lean Startup", "Zero to One"],
    courses: ["Business Fundamentals", "Marketing 101"],
    studyPlans: ["Weekly case-study review", "Business plan drafting practice"],
    practiceExercises: ["Break-even calculation drills", "SWOT analysis practice"],
  },
  economics: {
    books: ["Freakonomics", "Basic Economics (Sowell)"],
    courses: ["Microeconomics Basics", "Macroeconomics Basics"],
    studyPlans: ["Weekly economic news summary", "Supply/demand graphing practice"],
    practiceExercises: ["Elasticity calculation drills", "Fiscal vs monetary policy quiz"],
  },
};

export function buildQuizRecommendation(subject: Subject, scorePercent: number): QuizRecommendation {
  const base = SUBJECT_RESOURCES[subject];
  if (scorePercent >= 80) {
    return {
      books: base.books.slice(0, 1),
      courses: base.courses.slice(0, 1),
      studyPlans: ["Keep your current pace - try a harder quiz next time."],
      practiceExercises: base.practiceExercises.slice(0, 1),
    };
  }
  return base;
}
