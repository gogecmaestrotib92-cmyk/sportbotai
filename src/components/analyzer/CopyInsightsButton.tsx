'use client'

import { useState, useCallback } from 'react'
import { AnalyzeResponse } from '@/types'
import { Copy, Check } from 'lucide-react'
import { useToast } from '@/components/ui'

interface CopyInsightsButtonProps {
  result: AnalyzeResponse
  variant?: 'default' | 'compact' | 'icon'
  className?: string
}

export default function CopyInsightsButton({ 
  result, 
  variant = 'default',
  className = '' 
}: CopyInsightsButtonProps) {
  const [copied, setCopied] = useState(false)
  const { showToast } = useToast()

  const { matchInfo, probabilities, valueAnalysis, riskAnalysis, momentumAndForm, tacticalAnalysis } = result

  // Derive verdict from probabilities
  const getVerdict = useCallback(() => {
    const home = probabilities.homeWin ?? 0
    const away = probabilities.awayWin ?? 0
    const draw = probabilities.draw ?? 0
    const max = Math.max(home, away, draw)
    const diff = Math.abs(home - away)
    
    if (max === draw && draw > 0) {
      return { headline: 'Draw Expected', prob: draw }
    }
    if (max === home) {
      const conf = diff > 25 ? 'Strong' : diff > 15 ? 'Moderate' : 'Slight'
      return { headline: `${conf} ${matchInfo.homeTeam} Edge`, prob: home }
    }
    const conf = diff > 25 ? 'Strong' : diff > 15 ? 'Moderate' : 'Slight'
    return { headline: `${conf} ${matchInfo.awayTeam} Edge`, prob: away }
  }, [probabilities, matchInfo])

  // Generate comprehensive analysis text
  const generateInsightsText = useCallback(() => {
    const sections: string[] = []
    const verdict = getVerdict()

    // Header
    sections.push(`🏆 ${matchInfo.homeTeam} vs ${matchInfo.awayTeam}`)
    sections.push(`📅 ${matchInfo.matchDate} • ${matchInfo.leagueName}`)
    sections.push('')

    // Verdict
    sections.push(`📊 VERDICT: ${verdict.headline}`)
    if (tacticalAnalysis.expertConclusionOneLiner) {
      sections.push(tacticalAnalysis.expertConclusionOneLiner)
    }
    sections.push('')

    // Key Factors
    if (tacticalAnalysis.keyMatchFactors && tacticalAnalysis.keyMatchFactors.length > 0) {
      sections.push('🔑 KEY FACTORS:')
      tacticalAnalysis.keyMatchFactors.slice(0, 4).forEach((factor, i) => {
        sections.push(`${i + 1}. ${factor}`)
      })
      sections.push('')
    }

    // Momentum
    if (momentumAndForm.homeMomentumScore !== null || momentumAndForm.awayMomentumScore !== null) {
      sections.push('📈 MOMENTUM:')
      if (momentumAndForm.homeMomentumScore !== null) {
        sections.push(`• ${matchInfo.homeTeam}: ${momentumAndForm.homeMomentumScore}/100 (${momentumAndForm.homeTrend})`)
      }
      if (momentumAndForm.awayMomentumScore !== null) {
        sections.push(`• ${matchInfo.awayTeam}: ${momentumAndForm.awayMomentumScore}/100 (${momentumAndForm.awayTrend})`)
      }
      sections.push('')
    }

    // Value Analysis
    if (valueAnalysis.bestValueSide !== 'NONE') {
      sections.push(`💰 BEST VALUE: ${valueAnalysis.bestValueSide}`)
      sections.push(valueAnalysis.valueCommentShort)
      sections.push('')
    }

    // Risk & Confidence
    sections.push(`⚠️ Risk Level: ${riskAnalysis.overallRiskLevel}`)
    sections.push(`🎯 Confidence: ${verdict.prob}%`)
    sections.push('')

    // Disclaimer
    sections.push('---')
    sections.push('🤖 Analysis by SportBot AI')
    sections.push('⚠️ For educational purposes only. Gamble responsibly.')
    sections.push('🔗 sportbotai.com')

    return sections.join('\n')
  }, [matchInfo, getVerdict, tacticalAnalysis, valueAnalysis, riskAnalysis, momentumAndForm])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generateInsightsText())
      setCopied(true)
      showToast('Analysis copied to clipboard!', 'success')
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
      showToast('Failed to copy. Please try again.', 'error')
    }
  }

  // Icon only variant
  if (variant === 'icon') {
    return (
      <button
        onClick={handleCopy}
        className={`p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors ${className}`}
        title="Copy analysis to clipboard"
      >
        {copied ? (
          <Check className="w-5 h-5 text-emerald-400" />
        ) : (
          <Copy className="w-5 h-5" />
        )}
      </button>
    )
  }

  // Compact variant
  if (variant === 'compact') {
    return (
      <button
        onClick={handleCopy}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors ${className}`}
      >
        {copied ? (
          <>
            <Check className="w-4 h-4 text-emerald-400" />
            <span className="text-emerald-400">Copied!</span>
          </>
        ) : (
          <>
            <Copy className="w-4 h-4" />
            <span>Copy</span>
          </>
        )}
      </button>
    )
  }

  // Default variant
  return (
    <button
      onClick={handleCopy}
      className={`flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors ${className}`}
    >
      {copied ? (
        <>
          <Check className="w-4 h-4 text-emerald-400" />
          Copied!
        </>
      ) : (
        <>
          <Copy className="w-4 h-4" />
          Copy Insights
        </>
      )}
    </button>
  )
}
