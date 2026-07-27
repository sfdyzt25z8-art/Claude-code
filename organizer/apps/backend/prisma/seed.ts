/**
 * Seeds real reference content: badges, academy modules (with genuine
 * one-paragraph lessons), and a handful of courses/books. Safe to re-run -
 * every insert is an upsert keyed on a natural unique identifier.
 */
import { PrismaClient, type Academy, type Subject } from "@prisma/client";
import { BADGE_DEFINITIONS } from "../src/services/badges";

const prisma = new PrismaClient();

async function seedBadges() {
  for (const badge of BADGE_DEFINITIONS) {
    await prisma.badge.upsert({
      where: { key: badge.key },
      update: { name: badge.name, description: badge.description, icon: badge.icon },
      create: badge,
    });
  }
  console.log(`Seeded ${BADGE_DEFINITIONS.length} badges.`);
}

interface ModuleSeed {
  title: string;
  summary: string;
}

const ACADEMY_MODULES: Record<Academy, ModuleSeed[]> = {
  MARKETING: [
    {
      title: "Marketing Fundamentals",
      summary:
        "Marketing starts with understanding a specific customer's problem well enough that your " +
        "product feels like an obvious answer. The classic 4 Ps - Product, Price, Place, and " +
        "Promotion - are a useful checklist for making sure your offer, its cost, where people " +
        "find it, and how you talk about it all reinforce the same message. Before spending on " +
        "ads or content, write down who your customer is, what they currently do instead of " +
        "buying from you, and why your product is a meaningfully better choice.",
    },
    {
      title: "Digital Marketing Channels",
      summary:
        "Digital marketing channels - search (SEO/SEM), social media, email, and paid display - " +
        "each reach people at a different point in their decision process. Search captures people " +
        "already looking for a solution, so it tends to convert well but has limited volume. Social " +
        "and display can create demand from people who weren't looking yet, but usually need more " +
        "touches before they buy. Email is the highest-leverage channel you fully own: once someone " +
        "subscribes, every message is nearly free to send and you aren't at the mercy of a platform's algorithm.",
    },
    {
      title: "Content Marketing & Storytelling",
      summary:
        "Content marketing earns attention by being genuinely useful or entertaining first, with " +
        "the sale as a secondary outcome. The strongest content answers a real question your " +
        "audience is already asking (a how-to, a comparison, an explainer) rather than talking " +
        "about your product directly. Good storytelling follows a simple arc: a relatable " +
        "problem, the struggle to solve it, and a resolution - readers remember stories far " +
        "longer than they remember feature lists.",
    },
    {
      title: "Marketing Analytics & Metrics",
      summary:
        "You can't improve what you don't measure. Track a small set of metrics that map to your " +
        "funnel: reach/impressions (awareness), click-through rate (interest), conversion rate " +
        "(action), and customer acquisition cost versus lifetime value (sustainability). A " +
        "campaign that gets huge reach but a low conversion rate usually has a targeting or " +
        "message problem, not a budget problem - so always look at the ratio between funnel " +
        "stages, not just the top-line numbers.",
    },
  ],
  BRANDING: [
    {
      title: "What Is a Brand?",
      summary:
        "A brand is not your logo - it's the sum of every expectation a customer has formed about " +
        "you from every interaction they've had with your product, support, and marketing. Strong " +
        "brands make a promise (e.g. \"reliable,\" \"affordable,\" \"premium\") and then consistently " +
        "deliver on it, which is what earns trust and repeat business over time. Weak or " +
        "inconsistent experiences erode brand value even if the individual ads or designs look great.",
    },
    {
      title: "Brand Identity & Visual Design",
      summary:
        "Visual identity - your logo, color palette, typography, and imagery style - exists to make " +
        "your brand instantly recognizable and to signal a feeling (trustworthy, playful, premium) " +
        "before a customer reads a single word. Consistency matters more than cleverness: using the " +
        "same 2-3 colors and one or two fonts everywhere builds recognition faster than a beautiful " +
        "but constantly changing look.",
    },
    {
      title: "Brand Voice & Messaging",
      summary:
        "Brand voice is how you sound in writing - formal or casual, playful or serious, terse or " +
        "detailed - and it should stay consistent across your website, emails, and support replies " +
        "the same way a person's personality stays consistent across conversations. Define your " +
        "voice with a few adjectives (e.g. \"warm, direct, no jargon\") and a couple of do/don't " +
        "examples so anyone writing on behalf of the brand sounds like the same entity.",
    },
    {
      title: "Building Brand Loyalty",
      summary:
        "Loyalty is built less by discounts and more by consistently exceeding expectations at the " +
        "moments customers care about most - fast, honest support when something goes wrong is " +
        "often more memorable than the product working perfectly. Simple loyalty mechanics " +
        "(rewarding repeat purchases, remembering customer preferences, following up after a " +
        "problem is fixed) compound over time into customers who refer others without being asked.",
    },
  ],
  SALES: [
    {
      title: "Sales Fundamentals",
      summary:
        "Selling, at its core, is helping someone make a decision that is genuinely good for them - " +
        "if you're pushing a product that doesn't fit their situation, you'll win the sale and lose " +
        "the customer. The classic sales funnel (awareness, interest, decision, action) reminds you " +
        "that most people aren't ready to buy the moment they first hear from you, so the goal early " +
        "on is to earn trust and understand their needs, not to close immediately.",
    },
    {
      title: "Prospecting & Lead Generation",
      summary:
        "Prospecting is the disciplined process of identifying people who both need what you offer " +
        "and can realistically afford/decide to buy it - chasing unqualified leads wastes the most " +
        "precious sales resource, which is time. A simple qualification framework (does this person " +
        "have the problem, the budget, and the authority to decide) filters your pipeline so you " +
        "spend effort where it can actually convert.",
    },
    {
      title: "Handling Objections",
      summary:
        "Objections (\"it's too expensive,\" \"I need to think about it\") are rarely a hard no - " +
        "they're usually a request for more information or reassurance. The best response is to " +
        "acknowledge the concern without getting defensive, ask a clarifying question to find the " +
        "real hesitation, and then address that specific worry with a concrete answer rather than a " +
        "generic pitch.",
    },
    {
      title: "Closing Techniques",
      summary:
        "Closing isn't a single dramatic moment - it's a natural next step once you've confirmed the " +
        "prospect's need, budget, and timeline align with what you offer. Simple, low-pressure " +
        "closes (\"does it make sense to get started this week, or would next month work better for " +
        "you?\") tend to outperform aggressive tactics because they respect the buyer's autonomy " +
        "while still asking directly for the decision.",
    },
  ],
  LEADERSHIP: [
    {
      title: "Foundations of Leadership",
      summary:
        "Leadership is the ability to get a group of people to work toward a shared goal they " +
        "believe in - it's distinct from management, which is about coordinating tasks and " +
        "resources. Good leaders set clear direction, model the behavior they expect from others, " +
        "and take responsibility for outcomes (both successes and failures) rather than deflecting blame.",
    },
    {
      title: "Communication for Leaders",
      summary:
        "Clear communication means saying the hard thing directly but kindly, rather than hinting " +
        "at it or avoiding it - ambiguity from a leader creates anxiety and wasted effort as people " +
        "guess at what's actually expected. Active listening (repeating back what you heard before " +
        "responding) is just as important as speaking clearly, since it surfaces misunderstandings " +
        "before they become costly mistakes.",
    },
    {
      title: "Delegation & Team Building",
      summary:
        "Effective delegation means handing off the outcome and the authority to achieve it, not " +
        "just a list of tasks - micromanaging the how defeats the purpose of delegating in the " +
        "first place. Strong teams are built by matching people's strengths to the work that needs " +
        "doing, giving honest feedback quickly, and creating enough psychological safety that people " +
        "will admit mistakes early rather than hide them.",
    },
    {
      title: "Leading Through Change",
      summary:
        "Change (a pivot, a reorg, a market downturn) creates uncertainty, and uncertainty is what " +
        "actually causes stress - not the change itself. Leaders reduce that stress by over-" +
        "communicating what is known, what is still undecided, and when people can expect an " +
        "update, even if the update is \"we still don't know yet.\" Involving the team in shaping the " +
        "response (rather than only announcing decisions) also builds buy-in.",
    },
  ],
  INVESTING: [
    {
      title: "Investing Basics",
      summary:
        "Investing means putting money to work today with the expectation of more money later, in " +
        "exchange for taking on risk and giving up access to that cash in the meantime. The two " +
        "forces that matter most over the long run are compounding (returns generating their own " +
        "returns) and time in the market - starting small but early usually beats waiting to invest " +
        "a larger amount later.",
    },
    {
      title: "Understanding Risk & Diversification",
      summary:
        "Risk is the chance that an investment's actual return differs from what you expected - " +
        "including the chance of losing money. Diversification (spreading money across many " +
        "different assets, industries, or geographies) reduces the impact of any single investment " +
        "performing badly, which is why \"don't put all your eggs in one basket\" is one of the " +
        "oldest and most reliable pieces of investing advice.",
    },
    {
      title: "Stocks, Bonds & Funds",
      summary:
        "A stock represents partial ownership in a company and its value moves with the company's " +
        "performance and investor sentiment; a bond is a loan you make to a company or government " +
        "that pays you back with interest and is generally lower-risk than stocks. Index funds and " +
        "ETFs bundle many stocks or bonds together, giving you instant diversification and lower " +
        "fees than picking individual securities yourself.",
    },
    {
      title: "Long-Term Wealth Building",
      summary:
        "Building wealth reliably is less about picking the next big winner and more about " +
        "consistent habits: investing a fixed amount regularly regardless of market conditions " +
        "(dollar-cost averaging), keeping fees low, and resisting the urge to sell during downturns. " +
        "Historically, markets have recovered from downturns over long enough time horizons, which " +
        "is why patience is one of the biggest edges an individual investor has.",
    },
  ],
  APP_DEVELOPMENT_REPLIT: [
    {
      title: "Getting Started with Replit",
      summary:
        "Replit is a browser-based coding environment that lets you write, run, and share code " +
        "without installing anything locally - you create a \"Repl\" (a project), pick a language " +
        "or template, and start coding immediately in a pre-configured environment. This " +
        "removes the setup friction (installing runtimes, configuring editors) that often stops " +
        "beginners before they write their first line of real code.",
    },
    {
      title: "Building Your First App",
      summary:
        "A good first app does one thing well: pick a small, concrete idea (a to-do list, a unit " +
        "converter, a simple quiz) rather than something ambitious, and get a working version end-" +
        "to-end before adding features. Working in small steps - write a little code, run it, check " +
        "the output, repeat - catches mistakes early and keeps you from getting lost in a large " +
        "block of untested code.",
    },
    {
      title: "Databases & State in Replit Apps",
      summary:
        "Most real apps need to remember information between visits - a to-do list should still " +
        "have your items tomorrow. Replit offers built-in key-value storage (Replit DB) as a simple " +
        "way to persist data without setting up a separate database server, which is ideal for " +
        "learning the core idea of state: reading saved data when the app starts, and writing " +
        "updates back whenever something changes.",
    },
    {
      title: "Deploying & Sharing Your Replit Project",
      summary:
        "Once your app works, Replit lets you deploy it so it has a public URL others can visit - " +
        "turning a local experiment into something real people can use. Sharing your work early and " +
        "often (even an unfinished version) gets you feedback sooner, which is almost always more " +
        "valuable than continuing to build in isolation and hoping it's right.",
    },
  ],
  AI_APP_DEVELOPMENT: [
    {
      title: "Introduction to AI-Powered Apps",
      summary:
        "AI-powered apps typically send text (or images) to a large language model API and use the " +
        "generated response to power a feature - a chatbot, a summarizer, a content generator. " +
        "Unlike traditional deterministic code, LLM outputs are probabilistic: the same input can " +
        "produce slightly different outputs each time, so good AI apps are designed to handle " +
        "variability gracefully rather than assuming an exact response format.",
    },
    {
      title: "Working with LLM APIs",
      summary:
        "Calling an LLM API generally means sending a list of messages (a system instruction plus " +
        "the conversation so far) and receiving a generated reply, paying per token of input and " +
        "output. Always handle failure paths explicitly - rate limits, timeouts, and missing API " +
        "keys are common in production - so your app degrades gracefully (a fallback message or " +
        "cached content) instead of crashing when the AI provider has an issue.",
    },
    {
      title: "Designing AI Prompts",
      summary:
        "A good prompt gives the model a clear role, the relevant context it needs, and an explicit " +
        "description of the output format you want (e.g. \"respond only with JSON matching this " +
        "shape\"). Being specific dramatically improves reliability: vague prompts like \"write " +
        "something good\" produce inconsistent results, while prompts with examples of the desired " +
        "output (\"few-shot\" examples) tend to produce more consistent ones.",
    },
    {
      title: "Shipping an AI Feature Responsibly",
      summary:
        "Before shipping an AI feature, plan for its failure modes: what happens if the model " +
        "produces something wrong, offensive, or nonsensical? Practical safeguards include " +
        "validating structured outputs before using them, adding clear fallback content when the " +
        "AI is unavailable, being transparent with users that they're talking to an AI, and logging " +
        "usage so you can monitor cost and quality over time.",
    },
  ],
};

async function seedAcademyModules() {
  let count = 0;
  const entries = Object.entries(ACADEMY_MODULES) as [Academy, ModuleSeed[]][];
  for (const [academy, modules] of entries) {
    for (let i = 0; i < modules.length; i += 1) {
      const mod = modules[i];
      const existing = await prisma.academyModule.findFirst({
        where: { academy, title: mod.title },
      });
      if (existing) {
        await prisma.academyModule.update({
          where: { id: existing.id },
          data: { summary: mod.summary, order: i },
        });
      } else {
        await prisma.academyModule.create({
          data: { academy, title: mod.title, summary: mod.summary, order: i },
        });
      }
      count += 1;
    }
  }
  console.log(`Seeded ${count} academy modules across ${entries.length} academies.`);
}

const COURSES: { title: string; academy?: Academy; subject?: Subject; description: string }[] = [
  {
    title: "Algebra Foundations",
    subject: "MATH",
    description: "Core algebra skills: variables, equations, and graphing linear relationships.",
  },
  {
    title: "World History Overview",
    subject: "HISTORY",
    description: "A survey of major civilizations, revolutions, and turning points in world history.",
  },
  {
    title: "Intro to Programming",
    subject: "COMPUTER_SCIENCE",
    description: "Programming fundamentals: variables, control flow, functions, and basic data structures.",
  },
  {
    title: "Grammar Essentials",
    subject: "ENGLISH",
    description: "Sentence structure, punctuation, and common grammar rules for clearer writing.",
  },
  {
    title: "Microeconomics Basics",
    subject: "ECONOMICS",
    description: "Supply, demand, market structures, and how individual choices shape markets.",
  },
  {
    title: "Business Fundamentals",
    subject: "BUSINESS",
    description: "An introduction to business models, operations, and financial basics.",
  },
  {
    title: "Marketing Fundamentals",
    academy: "MARKETING",
    description: "Core marketing concepts: the 4 Ps, target audiences, and campaign basics.",
  },
  {
    title: "Leadership Essentials",
    academy: "LEADERSHIP",
    description: "Foundational leadership skills: communication, delegation, and leading change.",
  },
];

async function seedCourses() {
  for (const course of COURSES) {
    const existing = await prisma.course.findFirst({ where: { title: course.title } });
    if (existing) continue;
    await prisma.course.create({
      data: {
        title: course.title,
        academy: course.academy ?? null,
        subject: course.subject ?? null,
        description: course.description,
        published: true,
      },
    });
  }
  console.log(`Seeded ${COURSES.length} courses (skipping any that already exist).`);
}

const BOOKS: { title: string; author: string; subject?: Subject }[] = [
  { title: "The Art of Problem Solving", author: "Richard Rusczyk", subject: "MATH" },
  { title: "A Short History of Nearly Everything", author: "Bill Bryson", subject: "SCIENCE" },
  { title: "The Elements of Style", author: "William Strunk Jr. & E.B. White", subject: "ENGLISH" },
  { title: "Sapiens: A Brief History of Humankind", author: "Yuval Noah Harari", subject: "HISTORY" },
  { title: "Prisoners of Geography", author: "Tim Marshall", subject: "GEOGRAPHY" },
  { title: "Clean Code", author: "Robert C. Martin", subject: "COMPUTER_SCIENCE" },
  { title: "Zero to One", author: "Peter Thiel", subject: "BUSINESS" },
  { title: "Freakonomics", author: "Steven D. Levitt & Stephen J. Dubner", subject: "ECONOMICS" },
];

async function seedBooks() {
  for (const book of BOOKS) {
    const existing = await prisma.book.findFirst({ where: { title: book.title } });
    if (existing) continue;
    await prisma.book.create({
      data: {
        title: book.title,
        author: book.author,
        subject: book.subject ?? null,
        published: true,
      },
    });
  }
  console.log(`Seeded ${BOOKS.length} books (skipping any that already exist).`);
}

async function main() {
  await seedBadges();
  await seedAcademyModules();
  await seedCourses();
  await seedBooks();
}

main()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
