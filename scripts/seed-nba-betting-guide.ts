/**
 * Seed script for NBA Betting Guide blog post
 * Optimized using competitor research headings and FAQs
 * 
 * Run with: npx tsx scripts/seed-nba-betting-guide.ts
 */

import { prisma } from '../src/lib/prisma';

const NBA_BETTING_GUIDE = {
    title: 'NBA Betting Odds: Complete Guide to Lines, Spreads & How to Bet',
    slug: 'nba-betting-guide',
    metaTitle: 'NBA Betting Odds Guide 2025: Lines, Spreads, Props & Futures',
    metaDescription: 'Your complete resource for NBA betting odds. Learn how to read NBA lines, point spreads, moneylines, totals, player props, and futures. Expert NBA betting tips.',
    excerpt: 'Master NBA betting with our comprehensive guide to odds, lines, and spreads. Learn how to read NBA betting odds, find value in player props, and bet on NBA futures.',
    featuredImage: '/sports/basketball.jpg',
    imageAlt: 'NBA basketball betting odds guide - basketball court action',
    category: 'Betting Guides',
    tags: ['NBA', 'betting guide', 'NBA odds', 'point spread', 'moneyline', 'player props', 'NBA betting', 'basketball betting'],
    content: `
<h2>Understanding NBA Betting Odds</h2>

<p>NBA betting odds represent the probability of outcomes in basketball games and determine your potential payout when you place a bet. Whether you're wagering on the Lakers, Celtics, or any team in the league, understanding how to read NBA odds is essential for making smart bets. Every sportsbook displays NBA betting lines for each game, showing the spread, moneyline, and total.</p>

<p>When you look at NBA odds, you'll see numbers like -110 or +150. The negative number indicates the favorite—the team expected to win. The positive number shows the underdog and the potential profit on a $100 wager. For example, if the Warriors are -150, you'd need to bet $150 to win $100. If the Rockets are +180, a $100 bet returns $180 in profit if they win.</p>

<p>NBA betting odds constantly change based on betting action, injury reports, and lineup announcements. Sharp bettors watch for line movement to identify where the smart money is going. Understanding these fundamentals helps you find value in the NBA betting market throughout the regular season and playoffs.</p>

<h2>How to Read NBA Point Spreads</h2>

<p>The NBA point spread is designed to level the playing field between two teams. When you see the Celtics -6.5 against the Knicks, Boston must win by 7 or more points for spread bettors to win. Conversely, the Knicks at +6.5 can lose by up to 6 points and still cover the spread. This handicap creates roughly 50/50 betting action on both sides.</p>

<p>Point spreads in NBA betting are typically priced at -110 odds on both sides. This means you'd risk $110 to win $100 regardless of which team you back. The half-point (like 6.5) eliminates the possibility of a push—the game can't land exactly on that number. When spreads are whole numbers like -7, the potential for a push exists.</p>

<p>Key numbers in NBA betting aren't as prominent as football, but margins of 3, 4, 5, and 7 points are common final score differences. Bettors track these patterns to find value when lines land on those numbers. The spread reflects what oddsmakers expect the margin of victory to be, adjusted for home-court advantage and team matchups.</p>

<h2>How Do NBA Moneylines Work?</h2>

<p>Moneyline betting is the simplest way to bet on an NBA game—you're picking which team will win outright. If the Bucks are -200 favorites, you need to wager $200 to win $100. If the underdog Hornets are +170, a $100 bet pays $170 in profit. Unlike spread betting, the margin of victory doesn't matter; your team just needs to win.</p>

<p>NBA moneylines offer different value propositions than spreads. Heavy favorites have expensive moneylines, making them less appealing for profit potential. But underdogs in the NBA win frequently—the league has significant parity, and any team can win on any night. This creates opportunities for bettors who target plus-money underdogs.</p>

<p>To calculate potential winnings with moneyline odds, use this formula: for favorites (-200), divide 100 by the odds to find profit per $100 risked. For underdogs (+170), the plus number shows profit on a $100 bet. Many bettors combine moneylines with spreads and totals in same-game parlays for larger potential payouts.</p>

<h2>What Is the Total (Over/Under) in Basketball?</h2>

<p>NBA totals betting—also called over/under—focuses on the combined score of both teams. If the total is set at 224.5 for Lakers vs. Clippers, you're betting whether the final combined score will be over or under that number. Totals are priced at -110 on each side, just like spreads.</p>

<p>NBA games typically have totals ranging from 210 to 240 points depending on the teams' pace and defensive efficiency. High-scoring teams like the Pacers push totals higher, while defensive-minded teams like the Knicks bring them down. Totals also fluctuate based on rest, travel, and back-to-back games.</p>

<p>Bettors analyze pace of play and points per possession when betting NBA totals. A fast-paced game between two run-and-gun teams will have a higher total than a grinding, defensive showdown. Weather doesn't affect indoor basketball, but fatigue, injuries to key scorers, and motivation (tanking teams) all impact totals.</p>

<h2>What Are NBA Player Props?</h2>

<p>NBA player props let you bet on individual player performance rather than game outcomes. Common props include: LeBron James over 27.5 points, Nikola Jokic over 11.5 rebounds, or Trae Young over 9.5 assists. Props add excitement and allow you to leverage your knowledge of specific players.</p>

<p>Player prop betting has exploded in popularity because you can bet on what you know. If you follow the Lakers closely and know LeBron tends to score 30+ against certain teams, that knowledge translates to betting value. Sportsbooks set prop lines based on season averages and matchups, creating opportunities when you spot discrepancies.</p>

<p>Prop odds are typically -110 to -120 on each side, though plus-money props exist for less likely outcomes. Same-game parlays often combine player props with game outcomes—like Celtics to win AND Jayson Tatum over 25.5 points. These parlays carry higher risk but offer significantly larger payouts.</p>

<h2>Popular NBA Futures Markets</h2>

<p>NBA futures bets are long-term wagers on outcomes determined later in the season. The most popular is betting on who will win the NBA Championship. Before the season starts, you might find the Celtics at +350, meaning a $100 bet pays $350 profit if they win the title. Futures odds change throughout the season based on performance.</p>

<p>Other popular NBA futures include division winners, conference champions, MVP, Rookie of the Year, and regular season win totals. You might bet that the Nuggets will win over 52.5 games, or that Luka Doncic will win MVP at +500. These bets tie up your money for months but offer substantial payout potential.</p>

<p>NBA Finals odds are available before and during the season, constantly adjusting. A team that starts 15-3 will see their championship odds shorten significantly from preseason prices. Smart futures bettors identify value early—betting on teams before they prove themselves and their odds drop.</p>

<h2>Can I Bet on NBA Games Live?</h2>

<p>Yes! Live betting (also called in-game betting) lets you place wagers while the NBA game is in progress. Sportsbooks offer live spreads, moneylines, and totals that update constantly based on the score, time remaining, and game momentum. If the Heat fall behind 15-2 early but you think they'll rally, live betting offers a better moneyline than pregame.</p>

<p>Live NBA betting requires quick decision-making as odds change every few seconds. During timeouts and quarter breaks, sportsbooks pause betting to adjust lines. The best live bettors watch games closely and react when they see momentum shifts before the odds catch up.</p>

<p>Quarter and half betting are popular live market options. You can bet on the first-quarter spread, first-half total, or who will win the second half. These markets let you target specific portions of the game where you see value based on how teams typically perform in different situations.</p>

<h2>How Do I Place Parlay Bets on NBA Games?</h2>

<p>Parlay betting combines multiple selections into one wager for a larger potential payout. Instead of betting $100 each on three separate NBA games, you can parlay all three picks together. If all three hit, your payout is significantly higher—but if even one loses, the entire parlay loses.</p>

<p>A 3-team NBA parlay at standard -110 odds per leg pays approximately 6-to-1. A 4-team parlay pays roughly 10-to-1. Sportsbooks offer parlay builders that show exact potential payouts as you add legs. Many bettors enjoy parlays for the excitement of bigger wins from smaller stakes.</p>

<p>Same-game parlays (SGPs) let you combine bets from a single NBA game. You might parlay Lakers moneyline + over 225.5 total + LeBron over 25.5 points. SGPs have correlated outcomes, so sportsbooks adjust odds accordingly. These are high-risk, high-reward wagers extremely popular among recreational bettors.</p>

<h2>Where Can I Bet on NBA Games?</h2>

<p>NBA betting is available at licensed sportsbooks in states where sports betting is legal. Major options include DraftKings, FanDuel, BetMGM, Caesars, and many state-specific operators. Each sportsbook offers NBA betting odds that may vary slightly, which is why shopping for the best lines matters.</p>

<p>Online sportsbooks and mobile betting apps make NBA wagering accessible from anywhere in legal states. You can place bets from home, at the arena, or anywhere your phone has signal. All reputable sportsbooks require age verification (21+ in most states) and geolocation to confirm you're in a legal betting state.</p>

<p>Before choosing a sportsbook, compare welcome bonuses, ongoing promotions, odds quality, and app usability. Many bettors maintain accounts at multiple sportsbooks to always access the best NBA odds available. Look for sportsbooks with competitive lines, fast payouts, and responsive customer service.</p>

<h2>Why Do NBA Betting Lines Move?</h2>

<p>NBA lines move for several reasons. When significant money comes in on one side, sportsbooks adjust the spread or moneyline to balance their liability. If the public hammers Lakers -3, the line might move to Lakers -4 to encourage betting on the other side. Sharp professional bettors often move lines early in the week.</p>

<p>Injury news causes dramatic NBA line movement. When a star like Giannis Antetokounmpo is ruled out, the spread might shift 5-7 points within minutes. Active bettors follow injury reports closely to either bet before lines move or capitalize on overreactions. NBA injury reporting rules require updates throughout the day.</p>

<p>Line movement provides information. If a line moves from Celtics -5 to Celtics -6 despite public money on the underdog, that suggests sharp action on Boston. Tracking line movement helps bettors understand where informed money is going. Some bettors specifically target "reverse line movement" situations.</p>

<h2>NBA Betting Tips for Success</h2>

<p>Successful NBA betting starts with bankroll management. Never bet more than 1-3% of your bankroll on a single game. The NBA regular season has 1,230 games across 30 teams—there's no need to overextend on any single matchup. Discipline separates profitable bettors from recreational ones.</p>

<p>Research matchups thoroughly. How do teams perform on back-to-backs? What's their record against the spread at home vs. away? How does a team's pace match up against their opponent? These factors matter more than just looking at which team is "better." Value betting means finding lines that don't accurately reflect true probabilities.</p>

<p>Shop for the best lines across multiple sportsbooks. Getting Bucks -3.5 instead of -4 doesn't seem like much, but over hundreds of bets, that half-point significantly impacts your results. Track your bets to identify strengths and weaknesses. Many profitable NBA bettors specialize in specific bet types, teams, or situations.</p>

<h2>Frequently Asked Questions About NBA Betting</h2>

<h3>What do the plus and minus signs mean in NBA odds?</h3>
<p>The minus sign (-) indicates the favorite and shows how much you must bet to win $100. The plus sign (+) indicates the underdog and shows how much profit you'd make on a $100 wager.</p>

<h3>What happens if the point spread results in a tie (push)?</h3>
<p>If the final margin exactly matches the spread (like a team favored by 5 wins by exactly 5), the bet is a push. Your original stake is refunded, with no win or loss recorded.</p>

<h3>Who's the favorite to win the NBA Championship?</h3>
<p>Championship favorites change throughout the season based on performance, injuries, and trades. Check current futures odds at sportsbooks for the latest favorites heading into the playoffs.</p>

<h3>Is NBA betting legal in my state?</h3>
<p>Sports betting legality varies by state. Over 30 states plus DC have legalized sports betting in some form. Check your state's gambling laws and use only licensed, legal sportsbooks.</p>

<h3>Which sportsbooks have the best NBA odds?</h3>
<p>NBA odds vary slightly between sportsbooks. Generally, DraftKings, FanDuel, Caesars, and BetMGM offer competitive odds. Smart bettors compare lines across multiple books before placing wagers.</p>

<h2>Key Takeaways: Mastering NBA Betting</h2>

<ul>
<li><strong>NBA betting odds</strong> show probability and potential payout—negative means favorite, positive means underdog</li>
<li><strong>Point spreads</strong> handicap games to create even betting action; typically priced at -110</li>
<li><strong>Moneylines</strong> are simple win bets; NBA underdogs offer value due to league parity</li>
<li><strong>Totals (over/under)</strong> focus on combined points; NBA games typically range 210-240</li>
<li><strong>Player props</strong> let you bet on individual stats like points, rebounds, and assists</li>
<li><strong>Futures</strong> offer big payouts on long-term bets like NBA Championship and MVP</li>
<li><strong>Live betting</strong> provides in-game wagering opportunities as odds constantly update</li>
<li><strong>Parlays</strong> combine multiple bets for larger payouts but higher risk</li>
<li><strong>Line shopping</strong> across sportsbooks helps maximize value on every bet</li>
<li><strong>Bankroll management</strong> and research are essential for long-term success</li>
</ul>

<p><em>If you or someone you know has a gambling problem, call 1-800-GAMBLER for help.</em></p>
`,
    status: 'PUBLISHED',
    publishedAt: new Date(),
};

async function seedNBABettingGuide() {
    console.log('Seeding NBA Betting Guide...');

    const existing = await prisma.blogPost.findUnique({
        where: { slug: NBA_BETTING_GUIDE.slug }
    });

    if (existing) {
        console.log('Post already exists, updating...');
        await prisma.blogPost.update({
            where: { slug: NBA_BETTING_GUIDE.slug },
            data: NBA_BETTING_GUIDE,
        });
    } else {
        console.log('Creating new post...');
        await prisma.blogPost.create({
            data: NBA_BETTING_GUIDE,
        });
    }

    console.log('✅ NBA Betting Guide created/updated successfully!');
    console.log(`   URL: /blog/${NBA_BETTING_GUIDE.slug}`);
}

seedNBABettingGuide()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
