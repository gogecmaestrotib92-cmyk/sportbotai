/**
 * Translations for SportBot AI
 * 
 * Supports: English (en), Serbian (sr)
 */

export type Locale = 'en' | 'sr';

export const translations = {
  en: {
    // Header
    header: {
      home: 'Home',
      picks: 'Picks',
      analyze: 'Analyze',
      aiDesk: 'AI Desk',
      alerts: 'Alerts',
      pricing: 'Pricing',
      news: 'News',
      blog: 'Blog',
      premium: 'PREMIUM',
      signIn: 'Sign In',
      myTeams: 'My Teams',
      history: 'History',
      marketAlerts: 'Market Alerts',
      accountSettings: 'Account Settings',
      account: 'Account',
      admin: 'Admin',
      adminDashboard: 'Admin Dashboard',
      more: 'More',
      responsibleGaming: 'Responsible Gaming',
      analyzeMatch: 'Analyze Match',
      yourAccount: 'Your Account',
      tools: 'Tools',
    },

    // Hero Section
    hero: {
      badge: '2 hours of research → 60 seconds',

      title: 'Find Where',
      titleHighlight: 'The Market Is Wrong',
      subtitle: 'Stop spending hours on research that still leaves you guessing.',
      subtitleHighlight: ' Soccer, NBA, NFL, NHL & UFC—analyzed in 60 seconds.',
      ctaPrimary: 'Get Free Match Analysis',
      ctaSecondary: 'Ask Any Sports Question',
      trust: {
        headlines: 'Match Headlines',
        form: 'Form & H2H',
        ai: 'AI Briefings',
        share: 'Share Cards',
      },
      analysesCompleted: 'analyses completed',
    },

    // Stats Strip
    stats: {
      sportsCovered: 'Sports Covered',
      analysesRun: 'Analyses Run',
      perAnalysis: 'Per Analysis',
      liveData: 'Live Data',
    },

    // How It Works
    howItWorks: {
      label: 'How It Works',
      title: 'Four simple steps to smarter analysis',
      subtitle: 'From match selection to AI-powered insights in seconds.',
      steps: [
        {
          number: '01',
          title: 'Choose Your Match',
          description: 'Pick from trending matches or search any fixture across 4 major sports.',
        },
        {
          number: '02',
          title: 'AI Analyzes Everything',
          description: 'Live odds, team form, injuries, and head-to-head stats—processed in seconds.',
        },
        {
          number: '03',
          title: 'Get Your 60s Briefing',
          description: 'Quick summary at the top—read or listen to understand the match instantly.',
        },
        {
          number: '04',
          title: 'Share or Save',
          description: 'Generate share cards for social, copy insights, or save teams to track.',
        },
      ],
    },

    // Why SportBot AI
    whyNotTipster: {
      label: 'Why SportBot AI',
      title: 'Analysis, not tips',
      subtitle: 'We provide data-driven insights to help you understand the numbers. No guarantees, no "sure things"—just transparent analysis.',
      features: [
        {
          title: 'AI-Powered Analysis',
          description: 'Advanced algorithms process odds, form, and statistics to generate probability estimates.',
        },
        {
          title: 'Value & Risk Transparency',
          description: 'Clear visualization of value opportunities and risk levels—no hidden information.',
        },
        {
          title: 'Responsible Approach',
          description: 'Every analysis includes risk warnings and promotes responsible decision-making.',
        },
      ],
      whatWeAre: {
        title: 'What we are',
        items: [
          'AI-based analytical tool',
          'Educational resource for understanding odds',
          'Transparent about limitations',
        ],
      },
      whatWeAreNot: {
        title: 'What we are not',
        items: [
          'Tipster service with "sure tips"',
          'Source of insider information',
          'Guarantee of winnings',
        ],
      },
    },

    // Features
    features: {
      label: 'Features',
      title: 'Everything you need for smarter analysis',
      subtitle: 'Professional-grade analytics tools designed for informed decision-making.',
      items: [
        {
          title: 'Multi-Sport Coverage',
          description: 'Soccer, NBA, NFL, NHL, MMA/UFC—all in one platform with real-time data.',
          badge: '4 Sports',
        },
        {
          title: 'Team Intelligence',
          description: 'Deep team profiles with form trends, injury reports, and historical performance.',
          badge: 'Pro',
        },
        {
          title: 'Value Detection',
          description: 'Compare AI probabilities with bookmaker odds to spot potential discrepancies.',
          badge: 'AI Powered',
        },
        {
          title: 'AI Sports Desk',
          description: 'Chat with our AI assistant about any match, team, or player. Get instant insights.',
          badge: 'Chat',
        },
        {
          title: 'Market Alerts',
          description: 'Get notified when odds shift significantly or value edges appear.',
          badge: 'Premium',
        },
        {
          title: 'Analysis History',
          description: 'Access your past analyses anytime. Track your research and decisions.',
          badge: 'Pro',
        },
      ],
    },

    // Pricing Teaser
    pricing: {
      label: 'Pricing',
      title: 'Smarter analysis for less than a coffee',
      subtitle: 'One bad decision costs more than a year of Pro. Start free, upgrade when you see the edge.',
      monthly: 'Monthly',
      yearly: 'Yearly',
      saveUpTo: 'Save up to 52%',
      free: 'Free',
      perMonth: '/month',
      freeFeatures: [
        '3 analyses per day',
        '5 AI chat messages per day',
        'Soccer, NBA, NFL & NHL',
        'Basic AI briefings',
        'Limited history (7 days)',
      ],
      getStarted: 'Get Started Free',
      pro: {
        name: 'Pro',
        description: 'Analysis + Edge Detection',
        yearlyDescription: 'Save $90/year',
        features: [
          '10 matches analyzed daily — cover your whole weekend slate',
          '50 AI questions/day — ask anything about any match',
          'Soccer, NBA, NFL & NHL covered',
          'Advanced edge detection — see what the market misses',
          'Form streaks & injury alerts before kickoff',
          'Priority support — real humans, fast replies',
          '30-day analysis history — track your research',
          'My Teams — one click to your favorite clubs',
        ],
        buttonText: 'Start Finding Edges',
      },
      premium: {
        name: 'Premium',
        description: 'Unlimited Analysis + Edge Alerts',
        yearlyDescription: 'Save $310/year (52% off)',
        features: [
          'Unlimited analyses — no daily cap, ever',
          'Unlimited AI chat — deep-dive any match or player',
          'Soccer, NBA, NFL & NHL covered',
          'Edge Alerts — get notified when value appears',
          'Advanced stats & trend tracking',
          'Full analysis history — your complete research log',
          'My Teams — instant updates on clubs you follow',
          '24/7 priority support',
        ],
        buttonText: 'Go Premium',
      },
      viewAll: 'View all pricing options',
    },

    // Responsible Gambling
    responsibleGambling: {
      title: 'Bet responsibly',
      description: 'Sports betting should be entertainment, not a source of income. Set limits, stick to your budget, and never chase losses.',
      ageRestriction: '18+ only.',
      ctaButton: 'Responsible gambling guide',
      tips: {
        time: 'Set time limits',
        budget: 'Set a budget',
        help: 'Need help?',
      },
    },

    // Trust Badges
    trustBadges: {
      ssl: 'SSL Secured',
      gdpr: 'GDPR Compliant',
      age: '18+ Only',
      responsible: 'Responsible Gambling',
    },

    // Testimonials
    testimonials: {
      label: 'Testimonials',
      title: 'What our users say',
    },

    // Language
    language: {
      english: 'English',
      serbian: 'Srpski',
    },

    // Matches Browser
    matches: {
      pageTitle: 'Browse Matches',
      pageSubtitle: 'Select any upcoming match to get your pre-match intelligence briefing.',
      pageDescription: 'Live data from 4 major sports',
      leagues: 'Leagues',
      loadingMatches: 'Loading matches...',
      upcomingMatches: 'upcoming matches',
      connectionIssue: 'Connection Issue',
      connectionError: "We couldn't load matches from",
      temporaryIssue: 'This might be a temporary issue.',
      tryAgain: 'Try Again',
      competitionOnBreak: 'Competition on Break',
      noUpcomingMatches: 'No Upcoming Matches',
      betweenMatchdays: 'is currently between matchdays. Next fixtures will appear once scheduled.',
      noScheduledMatches: 'There are no scheduled matches in',
      atTheMoment: 'at the moment.',
      exploreOtherLeagues: 'Explore other leagues with live matches',
      checkBackLater: 'Check back later or explore other leagues',
      showingOf: 'Showing',
      of: 'of',
      matchesText: 'matches',
      trendingNow: 'Trending Now',
      matchesCount: 'matches',
      noMatches: 'No matches',
      noUpcoming: 'No upcoming',
      leaguesCount: 'leagues',
      // New AI Picks translations
      aiPicks: 'AI Picks',
      allMatches: 'All Matches',
      today: 'Today',
      tomorrow: 'Tomorrow',
      later: 'Later',
      aiFlaggedMatches: 'AI-flagged matches',
      noAiPicksForTimeframe: 'No AI Picks for this timeframe',
      noMatchesFound: 'No matches found',
      viewAllMatches: 'View All Matches',
      checkTomorrow: 'Check Tomorrow',
      hotIn: 'Hot in',
      signals: 'signals',
      aiFlagged: 'AI Flagged',
      sports: {
        soccer: 'Soccer',
        basketball: 'Basketball',
        americanFootball: 'American Football',
        hockey: 'Hockey',
      },
    },

    // AI Desk
    aiDesk: {
      pageTitle: 'AI Sports Desk',
      pageSubtitle: 'Your AI-powered sports intelligence hub',
      realTimeData: 'Real-Time Data',
      gptPerplexity: 'GPT-4 + Perplexity',
      autoIntelFeed: 'Auto Intel Feed',
      unlockTitle: 'Unlock AI Sports Desk',
      unlockDescription: 'Create a free account to chat with our AI about any sport, get real-time intelligence, and access the live intel feed.',
      askAnything: 'Ask Anything',
      realTime: 'Real-Time',
      liveIntel: 'Live Intel',
      createFreeAccount: 'Create Free Account',
      alreadyHaveAccount: 'Already have an account?',
      signIn: 'Sign in',
      disclaimer: 'AI-generated content for informational purposes only. This is not betting advice. Please gamble responsibly.',
    },

    // Pricing Page
    pricingPage: {
      title: 'Simple Pricing',
      subtitle: "No hidden fees. Cancel anytime. Start free and upgrade when you're ready.",
      faqTitle: 'Frequently Asked Questions',
      faq: {
        cancel: {
          question: 'Can I cancel my subscription?',
          answer: 'Yes, you can cancel your subscription at any time. There are no fixed-term contracts. Access remains active until the end of the paid period.',
        },
        payment: {
          question: 'What payment methods are supported?',
          answer: 'We accept all major cards (Visa, Mastercard, Amex) through the secure Stripe payment system.',
        },
        guarantee: {
          question: 'Are analyses a guarantee of winnings?',
          answer: 'No. SportBot AI is an analytical tool that provides estimates based on available data. Sports betting always carries risk and we cannot guarantee any outcome.',
        },
        freePlan: {
          question: 'What do I get with the Free plan?',
          answer: 'The Free plan includes 1 match analysis and 1 AI chat message to try out the platform before deciding to upgrade.',
        },
      },
      disclaimer: 'Payment for SportBot AI does not guarantee winnings. Our tool is purely analytical and educational. Bet responsibly and only with money you can afford to lose.',
      note: 'Note:',
    },

    // Auth Pages
    auth: {
      welcomeBack: 'Welcome back',
      signInToAccess: 'Sign in to access your analyzer',
      continueWithGoogle: 'Continue with Google',
      orContinueWithEmail: 'or continue with email',
      email: 'Email',
      password: 'Password',
      signingIn: 'Signing in...',
      signIn: 'Sign in',
      dontHaveAccount: "Don't have an account?",
      signUp: 'Sign up',
      createAccount: 'Create your account',
      startAnalyzing: 'Start analyzing matches in seconds',
      creatingAccount: 'Creating account...',
      alreadyHaveAccount: 'Already have an account?',
      errorOccurred: 'An error occurred. Please try again.',
    },

    // Analysis Page
    analysis: {
      // Error state
      analysisFailed: 'Analysis Failed',

      // Match info
      home: 'Home',
      away: 'Away',
      vs: 'vs',

      // Verdict
      aiVerdict: 'AI Verdict',
      probability: 'probability',

      // Badges
      strongFavorite: 'Strong Favorite',
      moderateFavorite: 'Moderate Favorite',
      slightFavorite: 'Slight Favorite',
      lowRisk: 'LOW Risk',
      mediumRisk: 'MEDIUM Risk',
      highRisk: 'HIGH Risk',
      valueOn: 'Value on',
      upsetAlert: 'Upset Alert',

      // Sections
      whyThisCall: 'Why This Call?',
      deepDive: 'Deep Dive',

      // Tabs
      formStats: 'Form & Stats',
      injuries: 'Injuries',
      valueAnalysis: 'Value Analysis',
      fullAnalysis: 'Full Analysis',

      // Form
      rising: 'Rising',
      falling: 'Falling',
      stable: 'Stable',
      noFormData: 'No form data available',
      keyFactors: 'Key Factors',

      // Injuries
      noInjuryData: 'No injury data available for this match.',
      out: 'out',
      unavailable: 'Unavailable',
      noReportedInjuries: 'No reported injuries',
      more: 'more',

      // Value
      fairOdds: 'Fair odds',
      smallEdge: 'Small edge',
      valueFound: 'Value found',
      strongValue: 'Strong value',
      bestValue: 'Best Value',

      // Full Analysis
      riskAssessment: 'Risk Assessment',
      bankrollImpact: 'Bankroll impact',
      upsetPotential: 'Upset Potential',
      matchNarrative: 'Match Narrative',

      // Pro upsell
      goProForMore: 'Go Pro for More',
      proDescription: '30 analyses/day, team profiles, full history, and advanced value detection.',
      upgradeToPro: 'Upgrade to Pro',

      // Disclaimer
      defaultDisclaimer: 'This analysis is for educational purposes only. Past performance does not guarantee future results. Please gamble responsibly. 18+ only.',
    },
  },

  sr: {
    // Header
    header: {
      home: 'Početna',
      picks: 'Pikovi',
      analyze: 'Analiza',
      aiDesk: 'AI Pomoćnik',
      alerts: 'Alarmi',
      pricing: 'Cene',
      news: 'Vesti',
      blog: 'Blog',
      premium: 'PREMIUM',
      signIn: 'Prijava',
      myTeams: 'Moji Timovi',
      history: 'Istorija',
      marketAlerts: 'Tržišni Alarmi',
      accountSettings: 'Podešavanja Naloga',
      account: 'Nalog',
      admin: 'Admin',
      adminDashboard: 'Admin Panel',
      more: 'Više',
      responsibleGaming: 'Odgovorno Klađenje',
      analyzeMatch: 'Analiziraj Meč',
      yourAccount: 'Tvoj Nalog',
      tools: 'Alati',
    },

    // Hero Section
    hero: {
      badge: '2 sata istraživanja → 60 sekundi',
      title: 'Pronađi Gde',
      titleHighlight: 'Tržište Greši',
      subtitle: 'Prestani da gubis sate na istraživanje koje te i dalje ostavlja u nedoumici.',
      subtitleHighlight: ' Fudbal, NBA, NFL, NHL i UFC—analizirano za 60 sekundi.',
      ctaPrimary: 'Besplatna Analiza Meča',
      ctaSecondary: 'Pitaj Bilo Šta o Sportu',
      trust: {
        headlines: 'Naslovi Mečeva',
        form: 'Forma i H2H',
        ai: 'AI Brifing',
        share: 'Kartice za Deljenje',
      },
      analysesCompleted: 'završenih analiza',
    },

    // Stats Strip
    stats: {
      sportsCovered: 'Pokrivenih Sportova',
      analysesRun: 'Urađenih Analiza',
      perAnalysis: 'Po Analizi',
      liveData: 'Podaci Uživo',
    },

    // How It Works
    howItWorks: {
      label: 'Kako Funkcioniše',
      title: 'Četiri jednostavna koraka do pametnije analize',
      subtitle: 'Od izbora meča do AI uvida za par sekundi.',
      steps: [
        {
          number: '01',
          title: 'Izaberi Svoj Meč',
          description: 'Izaberi iz trending mečeva ili pretraži bilo koji meč iz 4 glavna sporta.',
        },
        {
          number: '02',
          title: 'AI Analizira Sve',
          description: 'Kvote uživo, forma timova, povrede i H2H statistika—obrađeno za sekunde.',
        },
        {
          number: '03',
          title: 'Dobij 60s Brifing',
          description: 'Brzi rezime na vrhu—pročitaj ili poslušaj da razumeš meč instantno.',
        },
        {
          number: '04',
          title: 'Podeli ili Sačuvaj',
          description: 'Generiši kartice za društvene mreže, kopiraj uvide ili sačuvaj timove.',
        },
      ],
    },

    // Why SportBot AI
    whyNotTipster: {
      label: 'Zašto SportBot AI',
      title: 'Analiza, ne tipovi',
      subtitle: 'Pružamo uvide bazirane na podacima koji ti pomažu da razumeš brojke. Bez garancija, bez "sigurnih stvari"—samo transparentna analiza.',
      features: [
        {
          title: 'AI Analiza',
          description: 'Napredni algoritmi obrađuju kvote, formu i statistiku za generisanje procena verovatnoće.',
        },
        {
          title: 'Vrednost i Transparentnost Rizika',
          description: 'Jasna vizualizacija vrednosnih prilika i nivoa rizika—bez skrivenih informacija.',
        },
        {
          title: 'Odgovoran Pristup',
          description: 'Svaka analiza uključuje upozorenja o riziku i promoviše odgovorno odlučivanje.',
        },
      ],
      whatWeAre: {
        title: 'Šta mi jesmo',
        items: [
          'AI analitički alat',
          'Edukativni resurs za razumevanje kvota',
          'Transparentni o ograničenjima',
        ],
      },
      whatWeAreNot: {
        title: 'Šta mi nismo',
        items: [
          'Tipsterski servis sa "sigurnim tipovima"',
          'Izvor insajderskih informacija',
          'Garancija dobitka',
        ],
      },
    },

    // Features
    features: {
      label: 'Funkcije',
      title: 'Sve što ti treba za pametniju analizu',
      subtitle: 'Profesionalni analitički alati dizajnirani za informisano odlučivanje.',
      items: [
        {
          title: 'Višesportska Pokrivenost',
          description: 'Fudbal, NBA, NFL, NHL, MMA/UFC—sve na jednoj platformi sa podacima u realnom vremenu.',
          badge: '4 Sporta',
        },
        {
          title: 'Inteligencija Timova',
          description: 'Detaljni profili timova sa trendovima forme, izveštajima o povredama i istorijskim performansama.',
          badge: 'Pro',
        },
        {
          title: 'Detekcija Vrednosti',
          description: 'Uporedi AI verovatnoće sa kvotama kladionica da uočiš potencijalne nesrazmere.',
          badge: 'AI',
        },
        {
          title: 'AI Sportski Desk',
          description: 'Četiraj sa našim AI asistentom o bilo kom meču, timu ili igraču. Dobij instantne uvide.',
          badge: 'Chat',
        },
        {
          title: 'Tržišni Alarmi',
          description: 'Budi obavešten kada se kvote značajno pomere ili se pojave vrednosne prilike.',
          badge: 'Premium',
        },
        {
          title: 'Istorija Analiza',
          description: 'Pristupi svojim prošlim analizama bilo kada. Prati svoja istraživanja i odluke.',
          badge: 'Pro',
        },
      ],
    },

    // Pricing Teaser
    pricing: {
      label: 'Cene',
      title: 'Pametnija analiza jeftinije od kafe',
      subtitle: 'Jedna loša odluka košta više od godinu dana Pro plana. Počni besplatno, nadogradi kad vidiš prednost.',
      monthly: 'Mesečno',
      yearly: 'Godišnje',
      saveUpTo: 'Uštedi do 52%',
      free: 'Besplatno',
      perMonth: '/mesečno',
      freeFeatures: [
        '3 analize dnevno',
        '5 AI chat poruka dnevno',
        'Fudbal, NBA, NFL i NHL',
        'Osnovni AI brifing',
        'Ograničena istorija (7 dana)',
      ],
      getStarted: 'Počni Besplatno',
      pro: {
        name: 'Pro',
        description: 'Analiza + Detekcija Prednosti',
        yearlyDescription: 'Uštedi $90/godišnje',
        features: [
          '10 mečeva dnevno — pokrij ceo vikend',
          '50 AI pitanja/dan — pitaj šta hoćeš o meču',
          'Fudbal, NBA, NFL i NHL pokriveni',
          'Napredna detekcija prednosti — vidi šta tržište propušta',
          'Forme i povrede pre starta',
          'Prioritetna podrška — pravi ljudi, brzi odgovori',
          'Istorija analiza 30 dana — prati svoja istraživanja',
          'Moji Timovi — jedan klik do omiljenih klubova',
        ],
        buttonText: 'Počni da Pronalaziš Prednosti',
      },
      premium: {
        name: 'Premium',
        description: 'Neograničene Analize + Alarmi',
        yearlyDescription: 'Uštedi $310/godišnje (52% popusta)',
        features: [
          'Neograničene analize — bez dnevnog limita',
          'Neograničen AI chat — dubinska analiza svakog meča',
          'Fudbal, NBA, NFL i NHL pokriveni',
          'Alarmi za Prednosti — dobij obaveštenje kad se pojavi vrednost',
          'Napredna statistika i praćenje trendova',
          'Kompletna istorija analiza — tvoj kompletan istraživački log',
          'Moji Timovi — instant ažuriranja za klubove koje pratiš',
          'Prioritetna podrška 24/7',
        ],
        buttonText: 'Pređi na Premium',
      },
      viewAll: 'Pogledaj sve opcije',
    },

    // Responsible Gambling
    responsibleGambling: {
      title: 'Kladi se odgovorno',
      description: 'Sportsko klađenje treba da bude zabava, ne izvor prihoda. Postavi limite, drži se budžeta i nikad ne juri gubitke.',
      ageRestriction: 'Samo 18+.',
      ctaButton: 'Vodič za odgovorno klađenje',
      tips: {
        time: 'Postavi vremenske limite',
        budget: 'Postavi budžet',
        help: 'Treba ti pomoć?',
      },
    },

    // Trust Badges
    trustBadges: {
      ssl: 'SSL Zaštićeno',
      gdpr: 'GDPR Usklađeno',
      age: 'Samo 18+',
      responsible: 'Odgovorno Klađenje',
    },

    // Testimonials
    testimonials: {
      label: 'Iskustva Korisnika',
      title: 'Šta naši korisnici kažu',
    },

    // Language
    language: {
      english: 'English',
      serbian: 'Srpski',
    },

    // Matches Browser
    matches: {
      pageTitle: 'Pregledaj Mečeve',
      pageSubtitle: 'Izaberi bilo koji predstojeći meč da dobiješ pred-utakmični obaveštajni brifing.',
      pageDescription: 'Podaci uživo iz 4 glavna sporta',
      leagues: 'Lige',
      loadingMatches: 'Učitavanje mečeva...',
      upcomingMatches: 'predstojećih mečeva',
      connectionIssue: 'Problem sa Konekcijom',
      connectionError: 'Nismo mogli učitati mečeve iz',
      temporaryIssue: 'Ovo može biti privremeni problem.',
      tryAgain: 'Pokušaj Ponovo',
      competitionOnBreak: 'Takmičenje na Pauzi',
      noUpcomingMatches: 'Nema Predstojećih Mečeva',
      betweenMatchdays: 'je trenutno između kola. Sledeći mečevi će se pojaviti kada budu zakazani.',
      noScheduledMatches: 'Nema zakazanih mečeva u',
      atTheMoment: 'trenutno.',
      exploreOtherLeagues: 'Istraži druge lige sa mečevima uživo',
      checkBackLater: 'Proveri kasnije ili istraži druge lige',
      showingOf: 'Prikazano',
      of: 'od',
      matchesText: 'mečeva',
      trendingNow: 'U Trendu',
      matchesCount: 'mečeva',
      noMatches: 'Nema mečeva',
      noUpcoming: 'Nema predstojećih',
      leaguesCount: 'liga',
      // New AI Picks translations
      aiPicks: 'AI Izbori',
      allMatches: 'Svi Mečevi',
      today: 'Danas',
      tomorrow: 'Sutra',
      later: 'Kasnije',
      aiFlaggedMatches: 'AI-označenih mečeva',
      noAiPicksForTimeframe: 'Nema AI izbora za ovaj period',
      noMatchesFound: 'Mečevi nisu pronađeni',
      viewAllMatches: 'Prikaži Sve Mečeve',
      checkTomorrow: 'Proveri Sutra',
      hotIn: 'Popularno u',
      signals: 'signala',
      aiFlagged: 'AI Označeno',
      sports: {
        soccer: 'Fudbal',
        basketball: 'Košarka',
        americanFootball: 'Američki Fudbal',
        hockey: 'Hokej',
      },
    },

    // AI Desk
    aiDesk: {
      pageTitle: 'AI Sportski Desk',
      pageSubtitle: 'Tvoj AI centar za sportsku inteligenciju',
      realTimeData: 'Podaci Uživo',
      gptPerplexity: 'GPT-4 + Perplexity',
      autoIntelFeed: 'Auto Intel Feed',
      unlockTitle: 'Otključaj AI Sportski Desk',
      unlockDescription: 'Napravi besplatan nalog da četiraš sa našim AI o bilo kom sportu, dobiješ inteligenciju u realnom vremenu i pristupiš live intel feed-u.',
      askAnything: 'Pitaj Bilo Šta',
      realTime: 'U Realnom Vremenu',
      liveIntel: 'Live Intel',
      createFreeAccount: 'Napravi Besplatan Nalog',
      alreadyHaveAccount: 'Već imaš nalog?',
      signIn: 'Prijavi se',
      disclaimer: 'AI-generisan sadržaj samo u informativne svrhe. Ovo nije savet za klađenje. Molimo kladi se odgovorno.',
    },

    // Pricing Page
    pricingPage: {
      title: 'Jednostavne Cene',
      subtitle: 'Bez skrivenih troškova. Otkaži bilo kada. Počni besplatno i nadogradi kad budeš spreman.',
      faqTitle: 'Često Postavljana Pitanja',
      faq: {
        cancel: {
          question: 'Mogu li otkazati pretplatu?',
          answer: 'Da, možeš otkazati pretplatu u bilo kom trenutku. Nema ugovora na određeno vreme. Pristup ostaje aktivan do kraja plaćenog perioda.',
        },
        payment: {
          question: 'Koji načini plaćanja su podržani?',
          answer: 'Prihvatamo sve glavne kartice (Visa, Mastercard, Amex) putem sigurnog Stripe sistema za plaćanje.',
        },
        guarantee: {
          question: 'Da li analize garantuju dobitak?',
          answer: 'Ne. SportBot AI je analitički alat koji pruža procene na osnovu dostupnih podataka. Sportsko klađenje uvek nosi rizik i ne možemo garantovati nikakav ishod.',
        },
        freePlan: {
          question: 'Šta dobijam sa Besplatnim planom?',
          answer: 'Besplatni plan uključuje 1 analizu meča i 1 AI chat poruku da isprobaš platformu pre nego što odlučiš da nadogradiš.',
        },
      },
      disclaimer: 'Plaćanje SportBot AI ne garantuje dobitak. Naš alat je čisto analitički i edukativni. Kladi se odgovorno i samo sa novcem koji možeš priuštiti da izgubiš.',
      note: 'Napomena:',
    },

    // Auth Pages
    auth: {
      welcomeBack: 'Dobro Došao Nazad',
      signInToAccess: 'Prijavi se da pristupiš analizatoru',
      continueWithGoogle: 'Nastavi sa Google',
      orContinueWithEmail: 'ili nastavi sa emailom',
      email: 'Email',
      password: 'Lozinka',
      signingIn: 'Prijava...',
      signIn: 'Prijavi se',
      dontHaveAccount: 'Nemaš nalog?',
      signUp: 'Registruj se',
      createAccount: 'Napravi svoj nalog',
      startAnalyzing: 'Počni analizirati mečeve za par sekundi',
      creatingAccount: 'Kreiranje naloga...',
      alreadyHaveAccount: 'Već imaš nalog?',
      errorOccurred: 'Došlo je do greške. Molimo pokušaj ponovo.',
    },

    // Analysis Page
    analysis: {
      // Error state
      analysisFailed: 'Analiza Neuspešna',

      // Match info
      home: 'Domaćin',
      away: 'Gost',
      vs: 'vs',

      // Verdict
      aiVerdict: 'AI Presuda',
      probability: 'verovatnoća',

      // Badges
      strongFavorite: 'Jak Favorit',
      moderateFavorite: 'Umeren Favorit',
      slightFavorite: 'Blag Favorit',
      lowRisk: 'NIZAK Rizik',
      mediumRisk: 'SREDNJI Rizik',
      highRisk: 'VISOK Rizik',
      valueOn: 'Vrednost na',
      upsetAlert: 'Alarm za Iznenađenje',

      // Sections
      whyThisCall: 'Zašto Ovaj Zaključak?',
      deepDive: 'Dublja Analiza',

      // Tabs
      formStats: 'Forma i Statistike',
      injuries: 'Povrede',
      valueAnalysis: 'Analiza Vrednosti',
      fullAnalysis: 'Puna Analiza',

      // Form
      rising: 'Raste',
      falling: 'Pada',
      stable: 'Stabilna',
      noFormData: 'Nema dostupnih podataka o formi',
      keyFactors: 'Ključni Faktori',

      // Injuries
      noInjuryData: 'Nema dostupnih podataka o povredama za ovaj meč.',
      out: 'van',
      unavailable: 'Nedostupan',
      noReportedInjuries: 'Nema prijavljenih povreda',
      more: 'više',

      // Value
      fairOdds: 'Fer kvote',
      smallEdge: 'Mala prednost',
      valueFound: 'Pronađena vrednost',
      strongValue: 'Jaka vrednost',
      bestValue: 'Najbolja Vrednost',

      // Full Analysis
      riskAssessment: 'Procena Rizika',
      bankrollImpact: 'Uticaj na budžet',
      upsetPotential: 'Potencijal Iznenađenja',
      matchNarrative: 'Narativ Meča',

      // Pro upsell
      goProForMore: 'Pređi na Pro za Više',
      proDescription: '30 analiza dnevno, profili timova, puna istorija i napredna detekcija vrednosti.',
      upgradeToPro: 'Nadogradi na Pro',

      // Disclaimer
      defaultDisclaimer: 'Ova analiza je samo u edukativne svrhe. Prošli rezultati ne garantuju buduće rezultate. Molimo kladi se odgovorno. Samo 18+.',
    },
  },
} as const;

export type TranslationsType = {
  header: {
    home: string;
    picks: string;
    analyze: string;
    aiDesk: string;
    alerts: string;
    pricing: string;
    news: string;
    blog: string;
    premium: string;
    signIn: string;
    myTeams: string;
    history: string;
    marketAlerts: string;
    accountSettings: string;
    account: string;
    admin: string;
    adminDashboard: string;
    more: string;
    responsibleGaming: string;
    analyzeMatch: string;
    yourAccount: string;
    tools: string;
  };
  hero: {
    badge: string;
    title: string;
    titleHighlight: string;
    subtitle: string;
    subtitleHighlight: string;
    ctaPrimary: string;
    ctaSecondary: string;
    trust: {
      headlines: string;
      form: string;
      ai: string;
      share: string;
    };
    analysesCompleted: string;
  };
  stats: {
    sportsCovered: string;
    analysesRun: string;
    perAnalysis: string;
    liveData: string;
  };
  howItWorks: {
    label: string;
    title: string;
    subtitle: string;
    steps: readonly {
      number: string;
      title: string;
      description: string;
    }[];
  };
  whyNotTipster: {
    label: string;
    title: string;
    subtitle: string;
    features: readonly {
      title: string;
      description: string;
    }[];
    whatWeAre: {
      title: string;
      items: readonly string[];
    };
    whatWeAreNot: {
      title: string;
      items: readonly string[];
    };
  };
  features: {
    label: string;
    title: string;
    subtitle: string;
    items: readonly {
      title: string;
      description: string;
      badge: string;
    }[];
  };
  pricing: {
    label: string;
    title: string;
    subtitle: string;
    monthly: string;
    yearly: string;
    saveUpTo: string;
    free: string;
    perMonth: string;
    freeFeatures: readonly string[];
    getStarted: string;
    pro: {
      name: string;
      description: string;
      yearlyDescription: string;
      features: readonly string[];
      buttonText: string;
    };
    premium: {
      name: string;
      description: string;
      yearlyDescription: string;
      features: readonly string[];
      buttonText: string;
    };
    viewAll: string;
  };
  responsibleGambling: {
    title: string;
    description: string;
    ageRestriction: string;
    ctaButton: string;
    tips: {
      time: string;
      budget: string;
      help: string;
    };
  };
  trustBadges: {
    ssl: string;
    gdpr: string;
    age: string;
    responsible: string;
  };
  testimonials: {
    label: string;
    title: string;
  };
  language: {
    english: string;
    serbian: string;
  };
  matches: {
    pageTitle: string;
    pageSubtitle: string;
    pageDescription: string;
    leagues: string;
    loadingMatches: string;
    upcomingMatches: string;
    connectionIssue: string;
    connectionError: string;
    temporaryIssue: string;
    tryAgain: string;
    competitionOnBreak: string;
    noUpcomingMatches: string;
    betweenMatchdays: string;
    noScheduledMatches: string;
    atTheMoment: string;
    exploreOtherLeagues: string;
    checkBackLater: string;
    showingOf: string;
    of: string;
    matchesText: string;
    trendingNow: string;
    matchesCount: string;
    noMatches: string;
    noUpcoming: string;
    leaguesCount: string;
    // New AI Picks translations
    aiPicks: string;
    allMatches: string;
    today: string;
    tomorrow: string;
    later: string;
    aiFlaggedMatches: string;
    noAiPicksForTimeframe: string;
    noMatchesFound: string;
    viewAllMatches: string;
    checkTomorrow: string;
    hotIn: string;
    signals: string;
    aiFlagged: string;
    sports: {
      soccer: string;
      basketball: string;
      americanFootball: string;
      hockey: string;
    };
  };
  aiDesk: {
    pageTitle: string;
    pageSubtitle: string;
    realTimeData: string;
    gptPerplexity: string;
    autoIntelFeed: string;
    unlockTitle: string;
    unlockDescription: string;
    askAnything: string;
    realTime: string;
    liveIntel: string;
    createFreeAccount: string;
    alreadyHaveAccount: string;
    signIn: string;
    disclaimer: string;
  };
  pricingPage: {
    title: string;
    subtitle: string;
    faqTitle: string;
    faq: {
      cancel: { question: string; answer: string };
      payment: { question: string; answer: string };
      guarantee: { question: string; answer: string };
      freePlan: { question: string; answer: string };
    };
    disclaimer: string;
    note: string;
  };
  auth: {
    welcomeBack: string;
    signInToAccess: string;
    continueWithGoogle: string;
    orContinueWithEmail: string;
    email: string;
    password: string;
    signingIn: string;
    signIn: string;
    dontHaveAccount: string;
    signUp: string;
    createAccount: string;
    startAnalyzing: string;
    creatingAccount: string;
    alreadyHaveAccount: string;
    errorOccurred: string;
  };
  analysis: {
    analysisFailed: string;
    home: string;
    away: string;
    vs: string;
    aiVerdict: string;
    probability: string;
    strongFavorite: string;
    moderateFavorite: string;
    slightFavorite: string;
    lowRisk: string;
    mediumRisk: string;
    highRisk: string;
    valueOn: string;
    upsetAlert: string;
    whyThisCall: string;
    deepDive: string;
    formStats: string;
    injuries: string;
    valueAnalysis: string;
    fullAnalysis: string;
    rising: string;
    falling: string;
    stable: string;
    noFormData: string;
    keyFactors: string;
    noInjuryData: string;
    out: string;
    unavailable: string;
    noReportedInjuries: string;
    more: string;
    fairOdds: string;
    smallEdge: string;
    valueFound: string;
    strongValue: string;
    bestValue: string;
    riskAssessment: string;
    bankrollImpact: string;
    upsetPotential: string;
    matchNarrative: string;
    goProForMore: string;
    proDescription: string;
    upgradeToPro: string;
    defaultDisclaimer: string;
  };
};

export function getTranslations(locale: Locale): TranslationsType {
  return translations[locale];
}

export const defaultLocale: Locale = 'en';
export const locales: Locale[] = ['en', 'sr'];

// Serbian-speaking countries for geo-detection
export const serbianCountries = ['RS', 'BA', 'ME', 'HR', 'MK', 'XK'];
