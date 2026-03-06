export interface SessionCategory {
  key: string;
  name: string;
  emoji: string;
  desc: string;
  sessions: SessionItem[];
}

export interface SessionItem {
  id: string;
  title: string;
  sub: string;
  why: string;
  scripture?: { text: string; ref: string };
  myStory: string[];
  yourStory: string[];
  middle: string[];
  openPrayer: string;
  closePrayer: string;
  flashCards: string[];
}

export const CATEGORIES: SessionCategory[] = [
  {
    key: 'foundation',
    name: 'Foundation',
    emoji: '🏛️',
    desc: 'Who you are and why you are doing this together.',
    sessions: [
      {
        id: 'f1',
        title: 'Who We Are',
        sub: 'Your individual stories and what shaped you.',
        why: `Every person arrives in a relationship carrying the weight and beauty of their history. The family you grew up in, the experiences that formed you, the wounds you still carry and the strengths you've built — all of these come with you.\n\nBefore you can build something together, you need to understand who each of you actually is. Not the version you present, but the real person shaped by a real story.\n\nThis session is an invitation to let your partner truly see you — and to truly see them.`,
        scripture: {
          text: 'So then you are no longer strangers and aliens, but you are fellow citizens with the saints and members of the household of God.',
          ref: 'Ephesians 2:19',
        },
        myStory: [
          'What is one experience from your childhood that shaped how you relate to people you love?',
          'What belief about yourself did you grow up carrying that still influences you today?',
          'What do you most want your partner to understand about who you are and where you came from?',
        ],
        yourStory: [
          'What part of their upbringing do you think has shaped them the most?',
          'What is a belief or value they hold that you want to understand more deeply?',
          'What is one thing about their story that moves or inspires you?',
        ],
        middle: [
          'Where do your backgrounds differ the most?',
          'Where do you already feel a natural alignment in your stories?',
          'What tension might your different histories create?',
          'What principle should guide how you hold each other\'s stories?',
          'What do you want to commit to in how you handle each other\'s past?',
        ],
        openPrayer: 'Lord, give us the courage to be seen fully and the grace to fully see each other.',
        closePrayer: 'Lord, thank you for the story you gave each of us. Help us to honour what has shaped the person we love.',
        flashCards: [
          'What is one experience from childhood that still shapes how you love?',
          'What belief about yourself did you carry into this relationship?',
          'What do you wish your partner understood more fully about your story?',
          'Where do our backgrounds create beautiful difference between us?',
          'What is one wound from your past you\'re still learning to carry?',
          'What strength did your upbringing give you that you\'re proud of?',
          'What does "home" mean to you — based on where you came from?',
          'What part of your partner\'s story moves you the most?',
        ],
      },
      {
        id: 'f2',
        title: 'Why We\'re Doing This',
        sub: 'Clarifying your shared intent and vision for this relationship.',
        why: `A relationship without a shared sense of purpose drifts. Two people can be deeply in love and still be heading in different directions because they've never articulated what they're building together.\n\nThis session asks a foundational question: Why are we doing this? Not just "because we love each other" — love is the fuel, but what's the destination?\n\nCouples who can answer this question together build on solid ground.`,
        scripture: {
          text: 'Commit your way to the Lord; trust in him, and he will act.',
          ref: 'Psalm 37:5',
        },
        myStory: [
          'What is the deepest reason you are pursuing this relationship — beyond feelings?',
          'What does a successful marriage look like to you in 10 years?',
          'What are you most afraid of when you think about the future of this relationship?',
        ],
        yourStory: [
          'What do you think motivates your partner most deeply in this relationship?',
          'What vision do you sense your partner has for the life you could build?',
          'What fear do you think your partner carries that they may not always voice?',
        ],
        middle: [
          'Where does your vision for this relationship overlap?',
          'Where do you notice differences in what you each hope for?',
          'What is the tension between your individual hopes and a shared direction?',
          'What principle should guide your shared purpose as a couple?',
          'What one commitment can you make today about the kind of relationship you are building?',
        ],
        openPrayer: 'Lord, align our hearts with your purpose for this relationship. Let us build something that glorifies you.',
        closePrayer: 'Lord, seal the vision you have placed in us. Let our love be purposeful, not accidental.',
        flashCards: [
          'Why are you really in this relationship — beyond feelings?',
          'What does "a successful marriage" mean to you?',
          'What is the life you imagine building together in 20 years?',
          'What are you most afraid of when you think about the future?',
          'What is one shared dream you haven\'t said out loud yet?',
          'What would make you feel like this relationship was everything it could be?',
          'What do you think God has for you two together?',
          'What legacy do you want to leave as a couple?',
        ],
      },
    ],
  },
];
