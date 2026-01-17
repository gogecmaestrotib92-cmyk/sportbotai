/**
 * AI Chat Tools
 * 
 * Function calling tools for the AI chat to retrieve data intelligently.
 * The LLM decides which tools to call based on the user's query.
 */

import { ChatCompletionTool } from 'openai/resources/chat/completions';

// ============================================
// TOOL DEFINITIONS
// ============================================

export const CHAT_TOOLS: ChatCompletionTool[] = [
    {
        type: 'function',
        function: {
            name: 'get_player_injury_status',
            description: 'Get current injury status and availability for a player',
            parameters: {
                type: 'object',
                properties: {
                    playerName: {
                        type: 'string',
                        description: 'Full name of the player (e.g., "Nikola Jokić", "LeBron James")',
                    },
                    team: {
                        type: 'string',
                        description: 'Team name (e.g., "Denver Nuggets", "LA Lakers")',
                    },
                    sport: {
                        type: 'string',
                        enum: ['basketball', 'soccer', 'american_football', 'hockey'],
                        description: 'Sport type',
                    },
                },
                required: ['playerName'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'get_player_stats',
            description: 'Get current season statistics for a player',
            parameters: {
                type: 'object',
                properties: {
                    playerName: {
                        type: 'string',
                        description: 'Full name of the player',
                    },
                    sport: {
                        type: 'string',
                        enum: ['basketball', 'soccer', 'american_football', 'hockey'],
                    },
                    season: {
                        type: 'string',
                        description: 'Season (e.g., "2025-26")',
                    },
                },
                required: ['playerName'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'get_match_prediction',
            description: 'Get SportBot AI prediction for an upcoming match',
            parameters: {
                type: 'object',
                properties: {
                    team1: {
                        type: 'string',
                        description: 'First team name',
                    },
                    team2: {
                        type: 'string',
                        description: 'Second team name',
                    },
                    sport: {
                        type: 'string',
                        enum: ['basketball', 'soccer', 'american_football', 'hockey'],
                    },
                },
                required: ['team1', 'team2'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'get_team_form',
            description: 'Get recent form and results for a team',
            parameters: {
                type: 'object',
                properties: {
                    teamName: {
                        type: 'string',
                        description: 'Team name',
                    },
                    sport: {
                        type: 'string',
                        enum: ['basketball', 'soccer', 'american_football', 'hockey'],
                    },
                },
                required: ['teamName'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'search_sports_news',
            description: 'Search for real-time sports news, transfers, trades, or updates',
            parameters: {
                type: 'object',
                properties: {
                    query: {
                        type: 'string',
                        description: 'Search query for sports news',
                    },
                    topic: {
                        type: 'string',
                        enum: ['injury', 'transfer', 'trade', 'general', 'breaking'],
                        description: 'Type of news to search for',
                    },
                },
                required: ['query'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'get_standings',
            description: 'Get current league standings/table',
            parameters: {
                type: 'object',
                properties: {
                    league: {
                        type: 'string',
                        description: 'League name (e.g., "NBA", "Premier League", "NFL")',
                    },
                    conference: {
                        type: 'string',
                        description: 'Conference for leagues that have them (e.g., "Eastern", "Western", "AFC", "NFC")',
                    },
                },
                required: ['league'],
            },
        },
    },
];

// ============================================
// TOOL EXECUTION
// ============================================

export type ToolResult = {
    toolName: string;
    result: string;
    success: boolean;
};

/**
 * Execute a tool call and return the result
 */
export async function executeTool(
    toolName: string,
    args: Record<string, unknown>,
    // Dependencies passed in to avoid circular imports
    deps: {
        searchNews: (query: string, topic?: string) => Promise<string>;
        getPlayerStats: (playerName: string, sport: string) => Promise<string>;
        getMatchPrediction: (team1: string, team2: string, sport: string) => Promise<string>;
        getTeamForm: (teamName: string, sport: string) => Promise<string>;
        getStandings: (league: string) => Promise<string>;
        getInjuryStatus: (playerName: string, team?: string) => Promise<string>;
    }
): Promise<ToolResult> {
    try {
        switch (toolName) {
            case 'get_player_injury_status': {
                const result = await deps.getInjuryStatus(
                    args.playerName as string,
                    args.team as string | undefined
                );
                return { toolName, result, success: true };
            }

            case 'get_player_stats': {
                const result = await deps.getPlayerStats(
                    args.playerName as string,
                    args.sport as string || 'basketball'
                );
                return { toolName, result, success: true };
            }

            case 'get_match_prediction': {
                const result = await deps.getMatchPrediction(
                    args.team1 as string,
                    args.team2 as string,
                    args.sport as string || 'soccer'
                );
                return { toolName, result, success: true };
            }

            case 'get_team_form': {
                const result = await deps.getTeamForm(
                    args.teamName as string,
                    args.sport as string || 'soccer'
                );
                return { toolName, result, success: true };
            }

            case 'search_sports_news': {
                const result = await deps.searchNews(
                    args.query as string,
                    args.topic as string | undefined
                );
                return { toolName, result, success: true };
            }

            case 'get_standings': {
                const result = await deps.getStandings(args.league as string);
                return { toolName, result, success: true };
            }

            default:
                return { toolName, result: `Unknown tool: ${toolName}`, success: false };
        }
    } catch (error) {
        console.error(`[ChatTools] Tool ${toolName} failed:`, error);
        return {
            toolName,
            result: `Tool execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            success: false
        };
    }
}

/**
 * Format tool results for the AI context
 */
export function formatToolResults(results: ToolResult[]): string {
    if (results.length === 0) return '';

    let formatted = '=== TOOL RESULTS ===\n\n';

    for (const result of results) {
        formatted += `[${result.toolName}]\n`;
        formatted += result.result;
        formatted += '\n\n';
    }

    return formatted;
}
