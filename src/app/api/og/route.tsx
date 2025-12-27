import { ImageResponse } from '@vercel/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Get parameters from URL
    const homeTeam = searchParams.get('home') || 'Home Team'
    const awayTeam = searchParams.get('away') || 'Away Team'
    const league = searchParams.get('league') || 'Match Analysis'
    const verdict = searchParams.get('verdict') || 'AI Analysis Ready'
    const risk = searchParams.get('risk') || 'MEDIUM'
    const confidence = parseInt(searchParams.get('confidence') || '75')
    const bestValue = searchParams.get('value') || ''
    const modelHome = parseInt(searchParams.get('modelHome') || '0')
    const modelAway = parseInt(searchParams.get('modelAway') || '0')
    const marketHome = parseInt(searchParams.get('marketHome') || '0')
    const marketAway = parseInt(searchParams.get('marketAway') || '0')
    const edgePercent = searchParams.get('edge') || ''

    // Value edge colors
    const hasValue = bestValue && bestValue !== 'NONE'
    const valueColor = hasValue ? '#10b981' : '#6b7280'
    
    // Risk colors
    const riskColors: Record<string, { bg: string; text: string }> = {
      LOW: { bg: 'rgba(16, 185, 129, 0.25)', text: '#10b981' },
      MEDIUM: { bg: 'rgba(245, 158, 11, 0.25)', text: '#f59e0b' },
      HIGH: { bg: 'rgba(239, 68, 68, 0.25)', text: '#ef4444' }
    }
    const riskStyle = riskColors[risk] || riskColors.MEDIUM

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#0a1a0a',
            padding: '40px 50px',
            fontFamily: 'Inter, system-ui, sans-serif',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '24px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  backgroundColor: '#10b981',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span style={{ color: '#0a1a0a', fontSize: '20px', fontWeight: 'bold' }}>S</span>
              </div>
              <span style={{ color: 'white', fontSize: '22px', fontWeight: '600' }}>
                Market Edge
              </span>
            </div>
            <span style={{ color: '#6b7280', fontSize: '16px' }}>{league}</span>
          </div>

          {/* Match Teams */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '24px',
              marginBottom: '30px',
            }}
          >
            <span style={{ color: 'white', fontSize: '36px', fontWeight: '700' }}>
              {homeTeam}
            </span>
            <span style={{ color: '#374151', fontSize: '28px' }}>vs</span>
            <span style={{ color: 'white', fontSize: '36px', fontWeight: '700' }}>
              {awayTeam}
            </span>
          </div>

          {/* Value Edge Badge */}
          {hasValue && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                marginBottom: '24px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: 'rgba(16, 185, 129, 0.2)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  padding: '10px 20px',
                  borderRadius: '30px',
                }}
              >
                <div
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    backgroundColor: '#10b981',
                  }}
                />
                <span style={{ color: '#10b981', fontSize: '18px', fontWeight: '600' }}>
                  {edgePercent ? `+${edgePercent}% Value on ${bestValue}` : `Value: ${bestValue}`}
                </span>
              </div>
            </div>
          )}

          {/* Model vs Market Section */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: 'rgba(26, 42, 26, 0.5)',
              border: '1px solid rgba(26, 58, 26, 0.8)',
              borderRadius: '16px',
              padding: '24px',
              gap: '20px',
            }}
          >
            {/* Section Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px' }}>📊</span>
              <span style={{ color: '#9ca3af', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Model vs Market
              </span>
            </div>

            {/* Probability Bars */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Home Team */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#9ca3af', fontSize: '16px' }}>{homeTeam}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <span style={{ color: '#6b7280', fontSize: '14px' }}>
                      Market: {marketHome || Math.round(100 - confidence)}%
                    </span>
                    <span style={{ color: modelHome > marketHome ? '#10b981' : 'white', fontSize: '16px', fontWeight: '600' }}>
                      Model: {modelHome || confidence}%
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', height: '8px', backgroundColor: '#1a2a1a', borderRadius: '4px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${modelHome || confidence}%`,
                      height: '100%',
                      backgroundColor: modelHome > marketHome ? '#10b981' : '#3b82f6',
                      borderRadius: '4px',
                    }}
                  />
                </div>
              </div>

              {/* Away Team */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#9ca3af', fontSize: '16px' }}>{awayTeam}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <span style={{ color: '#6b7280', fontSize: '14px' }}>
                      Market: {marketAway || Math.round(100 - confidence - 10)}%
                    </span>
                    <span style={{ color: modelAway > marketAway ? '#10b981' : 'white', fontSize: '16px', fontWeight: '600' }}>
                      Model: {modelAway || (100 - confidence - 10)}%
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', height: '8px', backgroundColor: '#1a2a1a', borderRadius: '4px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${modelAway || (100 - confidence - 10)}%`,
                      height: '100%',
                      backgroundColor: modelAway > marketAway ? '#10b981' : '#3b82f6',
                      borderRadius: '4px',
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Stats Row */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-around',
                paddingTop: '16px',
                borderTop: '1px solid rgba(26, 58, 26, 0.8)',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ color: '#6b7280', fontSize: '12px', textTransform: 'uppercase' }}>
                  Risk Level
                </span>
                <div
                  style={{
                    backgroundColor: riskStyle.bg,
                    color: riskStyle.text,
                    padding: '4px 14px',
                    borderRadius: '6px',
                    fontSize: '16px',
                    fontWeight: '600',
                    marginTop: '4px',
                  }}
                >
                  {risk}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ color: '#6b7280', fontSize: '12px', textTransform: 'uppercase' }}>
                  Confidence
                </span>
                <span style={{ color: '#60a5fa', fontSize: '22px', fontWeight: '600', marginTop: '4px' }}>
                  {confidence}%
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ color: '#6b7280', fontSize: '12px', textTransform: 'uppercase' }}>
                  Verdict
                </span>
                <span style={{ color: valueColor, fontSize: '16px', fontWeight: '600', marginTop: '4px' }}>
                  {hasValue ? 'Value Found' : 'Fair Price'}
                </span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              marginTop: 'auto',
              paddingTop: '20px',
            }}
          >
            <span style={{ color: '#374151', fontSize: '14px' }}>
              sportbotai.com • AI Match Intelligence
            </span>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        headers: {
          'Cache-Control': 'public, max-age=86400, s-maxage=86400',
        },
      }
    )
  } catch (error) {
    console.error('OG Image generation error:', error)
    return new Response('Failed to generate image', { status: 500 })
  }
}
