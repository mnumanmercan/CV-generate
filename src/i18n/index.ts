export type Locale = 'en' | 'tr'

export interface SplitHeading {
  prefix: string
  accent: string
  suffix: string
}

export interface Step {
  eyebrow: string
  numeral: string
  title: string
  description: string
}

export interface Translations {
  nav: {
    builder: string
    pricing: string
    login: string
    register: string
    dashboard: string
    myResume: string
    coverLetter: string
    signOut: string
  }
  ai: {
    analyzeButton: {
      text: string
      analyzing: string
    }
    feedback: {
      label: string
    }
    suggestion: {
      label: string
      apply: string
      discard: string
    }
    errors: {
      unauthorized: string
      tooManyRequests: string
      serviceUnavailable: string
      invalidInput: string
      unexpected: string
    }
  }
  home: {
    eyebrow: string
    hero: {
      heading: SplitHeading
      lede: string
      tagline: string
    }
    miniDemo: {
      eyebrow: string
      stepLabel: string
      fields: {
        fullName: string
        role: string
        company: string
        started: string
        highlight: string
      }
      hint: string
      cta: string
    }
    method: {
      eyebrow: string
      heading: SplitHeading
    }
    steps: [Step, Step]
    cta: {
      tagline: string
      heading: SplitHeading
      lede: string
      button: string
      secondary: string
    }
  }

  builder: {
    eyebrow: string
    headingLine1: string
    headingLine2: SplitHeading
    clearData: string
    saved: string
    downloadPdf: string
    generating: string
    zoomIn: string
    zoomOut: string
    fitPanel: string
    cvBuilderTab: string
    coverLetterTab: string
    resumeTemplate: string
    sections: {
      personal: string
      summary: string
      experience: string
      education: string
      skills: string
      projects: string
      certifications: string
      languages: string
    }
    toast: {
      pdfSuccess: string
      pdfError: string
      pdfOverflow: string
    }
    clearTitle: string
    clearMessage: string
    clearConfirm: string
    proRequired: string
  }

  dashboard: {
    planFree: string
    planPro: string
    welcomePrefix: string
    welcomeFallback: string
    welcomeDescFree: string
    welcomeDescPro: string
    yourCv: string
    sectionsLabel: string
    editCv: string
    viewCv: string
    lastSavedNever: string
    lastSavedJustNow: string
    lastSavedMins: string
    lastSavedHours: string
    lastSavedDays: string
    unlock: string
    proCardBadge: string
    proCardName: string
    proCardDesc: string
    getNotified: string
    cloudSyncTitle: string
    cloudSyncDesc: string
    multipleCvsTitle: string
    multipleCvsDesc: string
    coverLetterEyebrow: string
    coverLetterHeading: SplitHeading
    coverLetterDesc: string
    coverLetterButton: string
    statsEyebrow: string
    statsCvsCreated: string
    statsCoverLetters: string
    statsPdfDownloads: string
  }

  pricing: {
    eyebrow: string
    heading: SplitHeading
    lede: string
    billingMonthly: string
    billingAnnual: string
    free: string
    pro: string
    currentPlan: string
    getStartedFree: string
    getNotified: string
    perMonth: string
    billedAnnually: string
    noCreditCard: string
    everythingInFree: string
    compareEyebrow: string
    compareHeading: SplitHeading
    compareFeatureCol: string
    teamsLink: string
    comparisonRows: [string, string, string, string, string, string, string, string, string, string]
    faqEyebrow: string
    faqHeading: SplitHeading
    faqItems: Array<{ q: string; a: string }>
    closingTagline: string
    closingHeading: SplitHeading
    closingButton: string
    freePlanFeatures: string[]
    proPlanFeatures: string[]
  }

  auth: {
    login: {
      eyebrow: string
      heading: SplitHeading
      lede: string
      noAccount: string
      signUpFree: string
      emailLabel: string
      passwordLabel: string
      forgot: string
      rememberMe: string
      signIn: string
      signingIn: string
      orContinueWith: string
      google: string
      footnote: string
      showPassword: string
      hidePassword: string
      forgotEyebrow: string
      forgotHeading: SplitHeading
      forgotLede: string
      forgotEmailLabel: string
      forgotSendLink: string
      forgotSending: string
      forgotSentConfirm: string
      forgotClose: string
      forgotEmailRequired: string
      forgotSendError: string
      errorRequired: string
      errorInvalidCredentials: string
    }
    register: {
      eyebrow: string
      heading: SplitHeading
      lede: string
      alreadyHaveAccount: string
      signIn: string
      nameLabel: string
      emailLabel: string
      passwordLabel: string
      confirmPasswordLabel: string
      passwordPlaceholder: string
      confirmPlaceholder: string
      strengthWeak: string
      strengthFair: string
      strengthGood: string
      strengthStrong: string
      ruleLength: string
      ruleUppercase: string
      ruleLowercase: string
      ruleNumber: string
      passwordError: string
      confirmMatch: string
      confirmMismatch: string
      termsLabel: string
      termsLink: string
      privacyLink: string
      create: string
      creating: string
      orContinueWith: string
      google: string
      footnote: string
      showPassword: string
      hidePassword: string
      errorRequired: string
      errorInvalidEmail: string
      errorPasswordMismatch: string
      errorTerms: string
      errorRegistrationFailed: string
    }
  }

  coverLetter: {
    eyebrow: string
    headingLine1: string
    headingLine2: SplitHeading
    clearData: string
    saved: string
    sectionDetails: string
    sectionRecipient: string
    sectionContent: string
    syncFromCv: string
    detailFullName: string
    detailJobTitle: string
    detailEmail: string
    detailPhone: string
    detailLocation: string
    detailDate: string
    recipientName: string
    recipientTitle: string
    recipientCompany: string
    recipientAddress: string
    contentOpening: string
    contentOpeningHint: string
    contentBodyWhy: string
    contentBodyWhyHint: string
    contentBodyBring: string
    contentBodyBringHint: string
    contentClosing: string
    contentClosingHint: string
    contentSignOff: string
    signatures: [string, string, string, string, string]
    pdfError: string
    downloadAriaLabel: string
  }

  forms: {
    remove: string
    add: string
    dragToReorder: string
    currentlyWorkHere: string
    fullName: string
    jobTitle: string
    titleColor: string
    titleColorSienna: string
    titleColorDark: string
    email: string
    phone: string
    location: string
    linkedin: string
    github: string
    website: string
    errorFullNameRequired: string
    errorJobTitleRequired: string
    errorInvalidEmail: string
    errorInvalidPhone: string
    errorLocationRequired: string
    errorUrlHttps: string
    optionalLinksHint: string
    personalComplete: string
    professionalSummary: string
    atsTipsLabel: string
    summaryHint: string
    expJobTitle: string
    expCompany: string
    expStartDate: string
    expEndDate: string
    expLocation: string
    bulletPoints: string
    addBullet: string
    addExperience: string
    expEntryLabel: string
    errorStartRequired: string
    errorDateFormat: string
    errorEndAfterStart: string
    eduInstitution: string
    eduDegree: string
    eduField: string
    eduStartDate: string
    eduEndDate: string
    eduGpa: string
    addEducation: string
    eduLayoutLabel: string
    eduLayoutFull: string
    eduLayoutFullDesc: string
    eduLayoutColumns: string
    eduLayoutColumnsDesc: string
    eduEntryLabel: string
    skillCategory: string
    skillsHint: string
    addSkillPlaceholder: string
    skillCatEntryLabel: string
    addSkillCategory: string
    duplicateSkill: string
    projectName: string
    projectEntryLabel: string
    projectDesc: string
    projectUrl: string
    techStack: string
    addTech: string
    addProject: string
    certName: string
    certIssuer: string
    certDate: string
    certCredentialId: string
    certCredentialUrl: string
    addCertification: string
    certEntryLabel: string
    language: string
    langEntryLabel: string
    proficiency: string
    selectLevel: string
    levelNative: string
    levelFluent: string
    levelProfessional: string
    levelConversational: string
    levelBasic: string
    addLanguage: string
  }

  teams: {
    eyebrow: string
    heading: SplitHeading
    desc1: string
    desc2: string
    cta: string
  }

  footer: {
    pricing: string
    builder: string
    github: string
    copyright: string
  }

  upgrade: {
    eyebrow: string
    heading: SplitHeading
    triggerDesc: string
    proDesc: string
    emailLabel: string
    notify: string
    notifying: string
    onList: string
    seeSoon: SplitHeading
    sentDesc: string
    close: string
    emailError: string
    emailInvalid: string
  }

  confirm: {
    defaultTitle: string
    confirm: string
    cancel: string
  }

  preview: {
    dialogLabel: string
    close: string
  }

  aria: {
    switchToDark: string
    switchToLight: string
    zoomIn: string
    zoomOut: string
    fitToPanel: string
    downloadCv: string
    downloadCl: string
    mainNav: string
    footerNav: string
    builderTools: string
    resumeHome: string
    openMenu: string
    closeMenu: string
  }
}
