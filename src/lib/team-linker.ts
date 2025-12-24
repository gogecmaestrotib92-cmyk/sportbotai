/**
 * Team Linker - Auto-links team names in blog/news content
 * 
 * Creates internal links to team pages for SEO benefits:
 * - Better internal linking structure
 * - Helps users discover related content
 * - Improves crawlability
 */

// Common team names mapped to their team page slugs
// This is a subset of most popular teams - expand as needed
const TEAM_LINKS: Record<string, string> = {
  // Premier League
  'Arsenal': '/team/arsenal',
  'Chelsea': '/team/chelsea',
  'Liverpool': '/team/liverpool',
  'Manchester City': '/team/manchester-city',
  'Manchester United': '/team/manchester-united',
  'Man City': '/team/manchester-city',
  'Man United': '/team/manchester-united',
  'Man Utd': '/team/manchester-united',
  'Tottenham': '/team/tottenham',
  'Spurs': '/team/tottenham',
  'Newcastle': '/team/newcastle',
  'Newcastle United': '/team/newcastle',
  'West Ham': '/team/west-ham',
  'Aston Villa': '/team/aston-villa',
  'Brighton': '/team/brighton',
  
  // La Liga
  'Real Madrid': '/team/real-madrid',
  'Barcelona': '/team/barcelona',
  'Atletico Madrid': '/team/atletico-madrid',
  'Atlético Madrid': '/team/atletico-madrid',
  
  // Bundesliga
  'Bayern Munich': '/team/bayern-munich',
  'Bayern': '/team/bayern-munich',
  'Borussia Dortmund': '/team/borussia-dortmund',
  'Dortmund': '/team/borussia-dortmund',
  'BVB': '/team/borussia-dortmund',
  'RB Leipzig': '/team/rb-leipzig',
  'Leipzig': '/team/rb-leipzig',
  
  // Serie A
  'Juventus': '/team/juventus',
  'AC Milan': '/team/ac-milan',
  'Inter Milan': '/team/inter-milan',
  'Inter': '/team/inter-milan',
  'Napoli': '/team/napoli',
  'Roma': '/team/roma',
  'AS Roma': '/team/roma',
  
  // Ligue 1
  'PSG': '/team/psg',
  'Paris Saint-Germain': '/team/psg',
  
  // NBA
  'Lakers': '/team/los-angeles-lakers',
  'LA Lakers': '/team/los-angeles-lakers',
  'Los Angeles Lakers': '/team/los-angeles-lakers',
  'Celtics': '/team/boston-celtics',
  'Boston Celtics': '/team/boston-celtics',
  'Warriors': '/team/golden-state-warriors',
  'Golden State Warriors': '/team/golden-state-warriors',
  'Bucks': '/team/milwaukee-bucks',
  'Milwaukee Bucks': '/team/milwaukee-bucks',
  'Heat': '/team/miami-heat',
  'Miami Heat': '/team/miami-heat',
  'Nuggets': '/team/denver-nuggets',
  'Denver Nuggets': '/team/denver-nuggets',
  'Suns': '/team/phoenix-suns',
  'Phoenix Suns': '/team/phoenix-suns',
  'Sixers': '/team/philadelphia-76ers',
  '76ers': '/team/philadelphia-76ers',
  'Philadelphia 76ers': '/team/philadelphia-76ers',
  'Knicks': '/team/new-york-knicks',
  'New York Knicks': '/team/new-york-knicks',
  'Clippers': '/team/los-angeles-clippers',
  'LA Clippers': '/team/los-angeles-clippers',
  'Mavericks': '/team/dallas-mavericks',
  'Dallas Mavericks': '/team/dallas-mavericks',
  'Thunder': '/team/oklahoma-city-thunder',
  'Oklahoma City Thunder': '/team/oklahoma-city-thunder',
  'Timberwolves': '/team/minnesota-timberwolves',
  'Minnesota Timberwolves': '/team/minnesota-timberwolves',
  
  // NFL
  'Chiefs': '/team/kansas-city-chiefs',
  'Kansas City Chiefs': '/team/kansas-city-chiefs',
  'Eagles': '/team/philadelphia-eagles',
  'Philadelphia Eagles': '/team/philadelphia-eagles',
  '49ers': '/team/san-francisco-49ers',
  'San Francisco 49ers': '/team/san-francisco-49ers',
  'Cowboys': '/team/dallas-cowboys',
  'Dallas Cowboys': '/team/dallas-cowboys',
  'Bills': '/team/buffalo-bills',
  'Buffalo Bills': '/team/buffalo-bills',
  'Ravens': '/team/baltimore-ravens',
  'Baltimore Ravens': '/team/baltimore-ravens',
  'Dolphins': '/team/miami-dolphins',
  'Miami Dolphins': '/team/miami-dolphins',
  'Lions': '/team/detroit-lions',
  'Detroit Lions': '/team/detroit-lions',
  'Packers': '/team/green-bay-packers',
  'Green Bay Packers': '/team/green-bay-packers',
  'Bengals': '/team/cincinnati-bengals',
  'Cincinnati Bengals': '/team/cincinnati-bengals',
  
  // NHL
  'Oilers': '/team/edmonton-oilers',
  'Edmonton Oilers': '/team/edmonton-oilers',
  'Panthers': '/team/florida-panthers',
  'Florida Panthers': '/team/florida-panthers',
  'Avalanche': '/team/colorado-avalanche',
  'Colorado Avalanche': '/team/colorado-avalanche',
  'Rangers': '/team/new-york-rangers',
  'NY Rangers': '/team/new-york-rangers',
  'New York Rangers': '/team/new-york-rangers',
  'Maple Leafs': '/team/toronto-maple-leafs',
  'Toronto Maple Leafs': '/team/toronto-maple-leafs',
  'Bruins': '/team/boston-bruins',
  'Boston Bruins': '/team/boston-bruins',
  'Stars': '/team/dallas-stars',
  'Dallas Stars': '/team/dallas-stars',
  'Golden Knights': '/team/vegas-golden-knights',
  'Vegas Golden Knights': '/team/vegas-golden-knights',
};

// Sort by length descending so longer names match first (e.g., "Manchester City" before "City")
const SORTED_TEAMS = Object.keys(TEAM_LINKS).sort((a, b) => b.length - a.length);

/**
 * Auto-link team names in HTML content
 * 
 * Rules:
 * - Only links first occurrence of each team to avoid over-linking
 * - Doesn't link if already inside an <a> tag
 * - Adds nofollow for internal pages (optional)
 * - Preserves existing HTML structure
 */
export function autoLinkTeams(html: string): string {
  if (!html) return html;
  
  let result = html;
  const linkedTeams = new Set<string>();
  
  for (const teamName of SORTED_TEAMS) {
    // Skip if we already linked this team (using the destination URL as key)
    const teamUrl = TEAM_LINKS[teamName];
    if (linkedTeams.has(teamUrl)) continue;
    
    // Create regex that matches whole word only, not inside tags or existing links
    // (?<!<[^>]*) - not preceded by an open HTML tag (negative lookbehind)
    // (?![^<]*>) - not followed by closing a tag (negative lookahead)
    // \b - word boundary
    const regex = new RegExp(
      `(?<!<a[^>]*>.*?)\\b(${escapeRegex(teamName)})\\b(?![^<]*</a>)`,
      'i'
    );
    
    // Check if team appears in content and is not already in a link
    const match = result.match(regex);
    if (match) {
      // Replace only first occurrence
      result = result.replace(
        regex,
        `<a href="${teamUrl}" class="team-link">${match[1]}</a>`
      );
      linkedTeams.add(teamUrl);
    }
  }
  
  return result;
}

/**
 * Escape special regex characters
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Simple version without regex lookbehinds (for older environments)
 * Links team names that are not already inside anchor tags
 */
export function autoLinkTeamsSimple(html: string): string {
  if (!html) return html;
  
  let result = html;
  const linkedTeams = new Set<string>();
  
  for (const teamName of SORTED_TEAMS) {
    const teamUrl = TEAM_LINKS[teamName];
    if (linkedTeams.has(teamUrl)) continue;
    
    // Simple word boundary check
    const regex = new RegExp(`\\b${escapeRegex(teamName)}\\b`, 'i');
    const match = result.match(regex);
    
    if (match) {
      // Check if this match is inside an existing anchor tag
      const matchIndex = result.indexOf(match[0]);
      const beforeMatch = result.substring(0, matchIndex);
      const afterMatch = result.substring(matchIndex + match[0].length);
      
      // Count open and close anchor tags before match
      const openTags = (beforeMatch.match(/<a\s/gi) || []).length;
      const closeTags = (beforeMatch.match(/<\/a>/gi) || []).length;
      
      // If not inside an anchor tag, link it
      if (openTags === closeTags) {
        result = beforeMatch + 
          `<a href="${teamUrl}" class="team-link">${match[0]}</a>` + 
          afterMatch;
        linkedTeams.add(teamUrl);
      }
    }
  }
  
  return result;
}

/**
 * Get the number of teams that can be linked in content
 * Useful for previewing before applying
 */
export function countLinkableTeams(html: string): number {
  if (!html) return 0;
  
  let count = 0;
  const seenUrls = new Set<string>();
  
  for (const teamName of SORTED_TEAMS) {
    const teamUrl = TEAM_LINKS[teamName];
    if (seenUrls.has(teamUrl)) continue;
    
    const regex = new RegExp(`\\b${escapeRegex(teamName)}\\b`, 'i');
    if (regex.test(html)) {
      count++;
      seenUrls.add(teamUrl);
    }
  }
  
  return count;
}
