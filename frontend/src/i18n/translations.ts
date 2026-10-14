/**
 * SilentWatch Bilingual Translation Dictionary
 * English / தமிழ் (Tamil)
 *
 * Fully bundled locally for complete offline PWA operation.
 * Zero external translation APIs or citizen accounts required.
 */

export type Language = 'en' | 'ta';

export const TRANSLATIONS = {
  en: {
    // Brand & Header
    appTitle: 'SilentWatch',
    appSubtitle: 'Privacy-Preserving Urban Noise & Audit System',
    versionBadge: 'v1.0',
    dataSource: 'Data Source',
    online: 'Online',
    offline: 'Offline Mode',
    pending: 'pending',
    toggleTheme: 'Toggle Theme',
    adminLogin: 'Admin Login',
    logout: 'Logout',
    logoutAdmin: 'Log Out Administrator',
    activeAdminSession: 'Active Administrator Session',
    municipalAdmin: 'Municipal Admin',

    // Nav sections
    publicCitizenNav: 'Public Citizen Features',
    municipalAdminNav: 'Municipal Administration',
    officersOnly: 'Municipal Officers',

    // Nav items
    navDashboard: 'Dashboard',
    navLiveMonitor: 'Live Noise Monitoring',
    navSoundClassification: 'Sound Identification',
    navHeatmap: 'Noise Heatmap',
    navCalibration: 'Calibration & Quality',
    navPrivacy: 'Privacy Centre',
    navIncidents: 'Incident Reports',
    navNightScreening: 'Nighttime Screening',
    navAuditReports: 'Municipal Audit Reports',

    // Data Sources
    sourceLiveMic: 'Live Microphone & Public Data',
    sourceLocalStored: 'Stored Local Records (IndexedDB)',
    sourceBackend: 'Municipal Backend Sync',
    sourceDemo: 'Simulation Archive',
    demoModeActive: 'DEMO MODE ACTIVE',
    demoModeDesc: 'Displaying synthetic demonstration records for evaluation. Switch to Live Monitor for local microphone testing.',
    switchToLive: 'Switch to Live',

    // Privacy Guarantee Callout
    zeroAudioTitle: 'Zero-Audio Guarantee',
    zeroAudioDesc: 'Raw audio is never recorded, saved to storage, or transmitted. Features are processed locally in RAM.',
    zeroCitizenTitle: 'Zero Citizen Accounts',
    zeroCitizenDesc: 'Public visitors use monitoring with zero logins. Restricted reports require municipal credentials.',

    // Common Buttons & Actions
    startMonitoring: 'Start Live Monitor',
    stopMonitoring: 'Stop Monitoring',
    startAnalysis: 'Start Sound Analysis',
    stopAnalysis: 'Stop Analysis',
    tryAgain: 'Try Again',
    generateAudit: 'Generate Audit',
    exportCsv: 'Export CSV',
    exportJson: 'Export JSON',
    exportPdf: 'Download Official PDF',
    details: 'Details',
    viewAll: 'View All',
    filter: 'Filter',
    search: 'Search',
    reset: 'Reset',
    close: 'Close',
    back: 'Back',
    submit: 'Submit',

    // Dashboard
    dashboardTitle: 'Urban Noise & Municipal Audit Overview',
    dashboardSubtitle: 'Privacy-preserving environmental surveillance with transparent, rule-based screening.',
    publicHeatmapBtn: 'Public Heatmap',
    kpiLatestEst: 'Latest Est. Sound Level',
    kpiMedianFloor: 'Median Noise Floor',
    kpiHotspots: 'Recurring Hotspots',
    kpiValidObs: 'Valid Observations',
    kpiZeroAudio: 'Zero Audio Kept',
    kpiPeak: 'Peak',
    kpiCalibrated: 'Calibrated',
    kpiUncalibrated: 'Uncalibrated',
    trendChartTitle: 'Real-Time Acoustic Trend (dB(A) LAeq)',
    trendChartDesc: 'Local logarithmic energy integration vs regulatory thresholds',
    categoryChartTitle: 'Sound Categories',
    categoryChartDesc: 'Heuristic DSP rule-based clustering',
    exceedanceTableTitle: 'Municipal Exceedance Evidence Records',
    exceedanceTableDesc: 'Restricted municipal audit files and legal enforcement screening',
    recordsRestrictedTitle: 'Official Incident Records Restricted',
    recordsRestrictedDesc: 'Per SilentWatch privacy policies, raw incident evidence files and violation records are protected from public exposure. Municipal officers can log in to view and investigate records.',
    authAsAdminBtn: 'Authenticate as Municipal Administrator',
    viewFullEvidence: 'View Full Evidence Files',

    // Sound Categories
    catIndustrial: 'Industrial Machinery',
    catTraffic: 'Road Traffic',
    catConstruction: 'Construction',
    catSpeech: 'Human Speech',
    catMusic: 'Music',
    catSirens: 'Sirens and alarms',
    catNatural: 'Natural sounds',
    catMixed: 'Mixed sound',
    catUnknown: 'Unknown sound',

    // Category translation helper

    classPageTitle: 'Sound Identification & Classification',
    classPageSubtitle: 'Explainable, non-AI rule-based acoustic classification covering 9 verified environmental sound categories.',
    tabLiveMic: 'Live Microphone',
    tabSandbox: 'Rule Sandbox',
    micStatusActive: 'Active Capture (Live RAM)',
    micStatusDenied: 'Permission Denied',
    micStatusIdle: 'Standby / Idle',
    micNoticeTitle: 'Microphone Access Required for Live Analysis',
    micNoticeFallback: 'You can also switch to the Rule Sandbox tab above to interactively test all 9 heuristic classification rules without a microphone.',
    oscilloTitle: 'Real-Time Oscilloscope & Frequency Spectrum',
    waveformLabel: 'Waveform (RAM)',
    fftLabel: 'FFT Spectrum',
    analysisIdle: 'Analysis Idle',
    analysisIdleDesc: 'Click "Start Sound Analysis" to capture audio locally and evaluate non-AI heuristic classifications.',
    classResultTitle: 'Classification Result',
    identifiedCategory: 'Identified Category',
    ruleMatchScore: 'Rule-Match Score',
    heuristicMatch: 'Heuristic match',
    qualityStatus: 'Quality Status',
    acousticClarity: 'Acoustic clarity',
    ruleMatchReason: 'Rule Match Reason:',
    alternativeCandidate: 'Alternative Candidate:',
    supportingCues: 'Supporting Acoustic Cues:',
    noActiveClassification: 'No Active Classification',
    startToStreamDesc: 'Start analysis to stream real-time acoustic signal evaluation.',
    recentHistoryTitle: 'Recent Classification History (Derived Records Only)',
    recentHistoryDesc: 'Episodic classification results derived in local RAM; no audio persistent.',
    eventsLogged: 'events logged',
    timeHeader: 'Time',
    categoryHeader: 'Category',
    statusHeader: 'Status',
    scoreHeader: 'Rule-Match Score',
    altHeader: 'Alternative',
    reasonHeader: 'Audit Reason',
    gridHeader: 'Grid',

    // Sandbox
    sandboxTitle: 'Acoustic Feature Sandbox',
    sandboxDesc: 'Adjust signal parameters to verify all 9 heuristic rules',
    presetsLabel: 'Presets:',
    rmsEnergyLabel: 'Signal RMS Energy',
    centroidLabel: 'Spectral Centroid (Frequency Center of Mass)',
    dominantFreqLabel: 'Dominant Frequency (Peak Energy Tone)',
    periodicityLabel: 'Periodicity Score (Tonal / Stationary Hum)',
    flatnessLabel: 'Spectral Flatness (0 = Pure Tone, 1 = White Noise)',
    peakCountLabel: 'Transient Impact Peaks (Percussive / Crest Peaks)',

    // Heatmap Page
    heatmapTitle: 'Interactive Noise Heatmap',
    heatmapSubtitle: 'Geospatial visualization of ambient sound pressure levels across Coimbatore municipal zones.',
    legendQuiet: 'Low / Ambient Floor (< 45 dB)',
    legendModerate: 'Moderate Permissible (45 - 55 dB)',
    legendElevated: 'Elevated Ambient (55 - 65 dB)',
    legendHigh: 'Exceedance Hotspot (> 65 dB)',
    zoneResidential: 'Residential Zone',
    zoneCommercial: 'Commercial / Mixed',
    zoneIndustrial: 'Industrial Zone',
    zoneSilence: 'Silence Zone (Hospitals / Colleges)',

    // Admin Login Page
    adminLoginTitle: 'Municipal Administrator Login',
    adminLoginSubtitle: 'Restricted access for authorized municipal officers and acoustic audit personnel.',
    citizenNoticeTitle: 'Citizen Notice:',
    citizenNoticeDesc: 'Ordinary citizens do not need to log in or register. Public noise monitoring, live sound classification, and heatmaps are freely accessible without an account.',
    adminUsernameLabel: 'Administrator Username or Official Email',
    adminPasswordLabel: 'Password',
    adminSubmitBtn: 'Authenticate Administrator',
    verifyingCredentials: 'Verifying Credentials...',
    officialProvisionNotice: 'Official accounts are provisioned via secure municipal bootstrap. Public registration is disabled.',
    invalidCredentialsError: 'Invalid municipal administrator credentials.',
    proceedToReports: 'Proceed to Reports',

    // Incident Reports (Admin Only)
    incidentsTitle: 'Noise Incident Management & Evidence Files',
    incidentsSubtitle: 'Auditable incident evidence summaries for municipal environmental investigators.',
    searchIncidentsPlaceholder: 'Search incidents by ID, grid, or sound category...',
    allReviewStatus: 'All Review Status',
    unreviewed: 'Unreviewed',
    underInvestigation: 'Under Investigation',
    confirmedExceedance: 'Confirmed Exceedance',
    dismissed: 'Dismissed',
    evidenceDetails: 'Evidence Dossier Details',
    applicableThreshold: 'Applicable Limit Threshold',
    recordedExceedance: 'Recorded Exceedance',
    likelySoundSource: 'Likely Sound Source',
    updateStatus: 'Update Incident Review Status',
    adminNotes: 'Investigator Notes',
    saveStatusBtn: 'Update Record Status',

    // Nighttime Screening (Admin Only)
    screeningTitle: 'Nighttime Violation Screening (22:00 - 06:00)',
    screeningSubtitle: 'Screening nighttime observations against CPCB & Municipal Environmental Limits.',
    screeningDisclaimer: 'Presumptive screening only. Phone measurements are indicative and require official acoustic confirmation.',
    chronicScoreHeader: 'Chronic Score',
    actionRequiredHeader: 'Recommended Municipal Action',
    regulatorySource: 'Regulatory Standard: Model Environmental Protection Act (Night Schedule)',

    // Municipal Audit Reports (Admin Only)
    auditReportsTitle: 'Municipal Environmental Noise Audit',
    auditReportsSubtitle: 'Certified municipal noise summary reports for municipal ward committee review.',
    selectGridToAudit: 'Select Monitored Grid Area:',
    reportingPeriod: 'Reporting Period:',
    toLabel: 'to',
    generateAuditBtn: 'Generate Audit Report',
    printingReport: 'Official Municipal Audit Report',
    auditConfidence: 'Measurement Confidence & Auditability',
    regulatoryFramework: 'Statutory Standard & Compliance Basis',
    privacyOfficerCert: 'Privacy Officer Certification: Zero raw acoustic waveforms retained.',

    // Privacy Centre
    privacyCentreTitle: 'Privacy & Data Integrity Centre',
    privacyCentreSubtitle: 'Technical and architectural guarantees ensuring non-surveillance and zero audio storage.',
    privacyAuditStatus: 'Automated Privacy Compliance Status',
    privacyPassed: 'STRICT_PRIVACY_ENFORCED',
    ramOnlyProcessing: 'Local Ephemeral RAM Processing',
    ramOnlyDesc: 'Microphone data exists only in 100ms Float32 RAM buffers and is deleted immediately after DSP analysis.',
    zeroVoiceRecording: 'No Voice / Audio Uploads',
    zeroVoiceDesc: 'Backend APIs reject any payloads containing audio files, waveforms, or raw voice binary data.',
    gridAnonymization: 'Geographic Grid Anonymization',
    gridAnonymDesc: 'Coordinates are bound to anonymized municipal grids rather than precise residential addresses.'
  },

  ta: {
    // Brand & Header
    appTitle: 'சைலன்ட்வாட்ச்',
    appSubtitle: 'தனியுரிமை காக்கும் நகர்ப்புற இரைச்சல் கண்காணிப்பு மற்றும் தணிக்கை அமைப்பு',
    versionBadge: 'பதிப்பு 1.0',
    dataSource: 'தரவு மூலம்',
    online: 'இணைப்பில் உள்ளது',
    offline: 'ஆஃப்லைன் முறை',
    pending: 'நிலுவையில்',
    toggleTheme: 'வண்ண தீம் மாற்று',
    adminLogin: 'நிர்வாகி உள்நுழைவு',
    logout: 'வெளியேறு',
    logoutAdmin: 'நிர்வாகி அமர்வை முடி',
    activeAdminSession: 'செயலில் உள்ள நிர்வாக அமர்வு',
    municipalAdmin: 'மாநகராட்சி நிர்வாகி',

    // Nav sections
    publicCitizenNav: 'பொது மக்கள் வசதிகள்',
    municipalAdminNav: 'மாநகராட்சி நிர்வாகம்',
    officersOnly: 'அதிகாரிகள் மட்டும்',

    // Nav items
    navDashboard: 'முகப்புப் பக்கம்',
    navLiveMonitor: 'நேரடி இரைச்சல் கண்காணிப்பு',
    navSoundClassification: 'ஒலி அடையாளம் காணுதல்',
    navHeatmap: 'இரைச்சல் வரைபடம்',
    navCalibration: 'அளவீடு & நம்பகத்தன்மை',
    navPrivacy: 'தனியுரிமை மையம்',
    navIncidents: 'இரைச்சல் புகார்கள் & சம்பவங்கள்',
    navNightScreening: 'இரவு நேர விதிமீறல் சரிபார்ப்பு',
    navAuditReports: 'மாநகராட்சி தணிக்கை அறிக்கைகள்',

    // Data Sources
    sourceLiveMic: 'நேரடி மைக் & பொதுத் தரவு',
    sourceLocalStored: 'உள்ளூர் சேமிப்பு பதிவுகள் (IndexedDB)',
    sourceBackend: 'மாநகராட்சி சர்வர் ஒருங்கிணைப்பு',
    sourceDemo: 'மாதிரி தரவு காப்பகம்',
    demoModeActive: 'மாதிரி பயன்முறை செயலில் உள்ளது',
    demoModeDesc: 'மதிப்பீட்டிற்காக மாதிரி தரவுகள் காட்டப்படுகின்றன. உங்கள் மைக்ரோஃபோனை சோதிக்க நேரடி கண்காணிப்புக்கு மாறவும்.',
    switchToLive: 'நேரடிக்கு மாறு',

    // Privacy Guarantee Callout
    zeroAudioTitle: 'பூஜ்ஜிய ஆடியோ உத்தரவாதம்',
    zeroAudioDesc: 'நேரடி ஆடியோ ஒருபோதும் பதிவு செய்யப்படுவதோ, சேமிக்கப்படுவதோ அல்லது அனுப்பப்படுவதோ இல்லை. கணக்கீடுகள் தற்காலிக ரேமில் (RAM) மட்டுமே நடைபெறுகின்றன.',
    zeroCitizenTitle: 'குடிமக்களுக்கு கணக்கு தேவையில்லை',
    zeroCitizenDesc: 'பொதுமக்கள் எந்தவொரு உள்நுழைவும் இன்றி கண்காணிப்பை உடனே பயன்படுத்தலாம். அறிக்கைகளுக்கு மட்டுமே அதிகாரப்பூர்வ அனுமதி தேவை.',

    // Common Buttons & Actions
    startMonitoring: 'கண்காணிப்பைத் தொடங்கு',
    stopMonitoring: 'கண்காணிப்பை நிறுத்து',
    startAnalysis: 'ஒலி பகுப்பாய்வைத் தொடங்கு',
    stopAnalysis: 'பகுப்பாய்வை நிறுத்து',
    tryAgain: 'மீண்டும் முயற்சி செய்',
    generateAudit: 'தணிக்கை அறிக்கை உருவாக்கு',
    exportCsv: 'CSV பதிவிறக்கு',
    exportJson: 'JSON பதிவிறக்கு',
    exportPdf: 'அதிகாரப்பூர்வ PDF பதிவிறக்கு',
    details: 'விவரங்கள்',
    viewAll: 'அனைத்தையும் காண்க',
    filter: 'வடிகட்டு',
    search: 'தேடு',
    reset: 'மீட்டமை',
    close: 'மூடு',
    back: 'பின்செல்',
    submit: 'சமர்ப்பி',

    // Dashboard
    dashboardTitle: 'நகர்ப்புற இரைச்சல் & மாநகராட்சி தணிக்கை கண்ணோட்டம்',
    dashboardSubtitle: 'விதிமுறைகளின் அடிப்படையில் வெளிப்படையான, தனியுரிமை காக்கும் சுற்றுச்சூழல் கண்காணிப்பு.',
    publicHeatmapBtn: 'பொது இரைச்சல் வரைபடம்',
    kpiLatestEst: 'சமீபத்திய கணிக்கப்பட்ட ஒலி அளவு',
    kpiMedianFloor: 'அடிப்படை இரைச்சல் தளம் (Median Floor)',
    kpiHotspots: 'தொடர் இரைச்சல் மையங்கள் (Hotspots)',
    kpiValidObs: 'செல்லுபடியாகும் அளவீடுகள்',
    kpiZeroAudio: 'ஆடியோ சேமிக்கப்படவில்லை',
    kpiPeak: 'உச்ச அளவு (Peak)',
    kpiCalibrated: 'சரிபார்க்கப்பட்டது (Calibrated)',
    kpiUncalibrated: 'அளவீடு செய்யப்படாதது',
    trendChartTitle: 'நேரடி ஒலி மாறுபாட்டுப் போக்கு (dB(A) LAeq)',
    trendChartDesc: 'சட்டரீதியான வரம்புகளுடன் ஒப்பிடப்படும் உள்ளூர் ஒலி அளவு ஒருங்கிணைப்பு',
    categoryChartTitle: 'ஒலி வகைகள்',
    categoryChartDesc: 'கணித சிக்னல் செயலாக்க (DSP) விதிகள் சார்ந்த வகைப்பாடு',
    exceedanceTableTitle: 'மாநகராட்சி இரைச்சல் விதிமீறல் பதிவுகள்',
    exceedanceTableDesc: 'அதிகாரப்பூர்வ தணிக்கை மற்றும் சட்ட அமலாக்க சரிபார்ப்பு கோப்புகள்',
    recordsRestrictedTitle: 'அதிகாரப்பூர்வ சம்பவ பதிவுகள் கட்டுப்படுத்தப்பட்டுள்ளன',
    recordsRestrictedDesc: 'தனியுரிமை விதிமுறைகளின்படி, விரிவான ஆதாரக் கோப்புகள் பொது பார்வைக்கு வைக்கப்படுவதில்லை. மாநகராட்சி அதிகாரிகள் உள்நுழைந்து ஆய்வு செய்யலாம்.',
    authAsAdminBtn: 'மாநகராட்சி நிர்வாகியாக உள்நுழைக',
    viewFullEvidence: 'முழு ஆதாரக் கோப்புகளைப் பார்',

    // Sound Categories
    catIndustrial: 'தொழிற்சாலை இயந்திரங்கள்',
    catTraffic: 'சாலைப் போக்குவரத்து',
    catConstruction: 'கட்டுமானப் பணிகள்',
    catSpeech: 'மனிதப் பேச்சு',
    catMusic: 'இசை / பெருக்கி ஒலி',
    catSirens: 'எச்சரிக்கை சைரன்கள் & அலாரங்கள்',
    catNatural: 'இயற்கை ஒலிகள் (காற்று/மழை)',
    catMixed: 'கலந்த ஒலி (Mixed Sound)',
    catUnknown: 'அடையாளம் தெரியாத ஒலி',

    // Sound Classification Page
    classPageTitle: 'ஒலி அடையாளம் காணுதல் மற்றும் வகைப்பாடு',
    classPageSubtitle: 'AI இன்றி, வெளிப்படையான சிக்னல் செயலாக்க விதிகளின்படி 9 சுற்றுச்சூழல் ஒலிகளைப் பிரித்தறியும் தொழில்நுட்பம்.',
    tabLiveMic: 'நேரடி மைக்ரோஃபோன்',
    tabSandbox: 'விதிகள் ஆய்வுக்கூடம் (Sandbox)',
    micStatusActive: 'நேரடி ஒலிப்பதிவு இயங்குகிறது (தற்காலிக RAM)',
    micStatusDenied: 'மைக்ரோஃபோன் அனுமதி மறுக்கப்பட்டது',
    micStatusIdle: 'காத்திருப்பு நிலை',
    micNoticeTitle: 'நேரடி பகுப்பாய்விற்கு மைக்ரோஃபோன் அனுமதி தேவை',
    micNoticeFallback: 'மைக் இல்லாமலும் 9 விதிகளையும் சோதிக்க மேலே உள்ள "விதிகள் ஆய்வுக்கூடம்" பகுதிக்கு மாறலாம்.',
    oscilloTitle: 'நேரடி அலைவரிசை மற்றும் அதிர்வெண் ஸ்பெக்ட்ரம்',
    waveformLabel: 'அலைவடிவம் (RAM)',
    fftLabel: 'அதிர்வெண் ஸ்பெக்ட்ரம் (FFT)',
    analysisIdle: 'பகுப்பாய்வு நிறுத்தப்பட்டுள்ளது',
    analysisIdleDesc: 'உள்ளூர் ஒலியைப் பகுப்பாய்வு செய்ய "ஒலி பகுப்பாய்வைத் தொடங்கு" என்பதை அழுத்தவும்.',
    classResultTitle: 'வகைப்பாட்டு முடிவு',
    identifiedCategory: 'கண்டறியப்பட்ட ஒலி வகை',
    ruleMatchScore: 'விதி-பொருத்த மதிப்பெண் (Rule-Match)',
    heuristicMatch: 'கணித விதிப் பொருத்தம்',
    qualityStatus: 'ஒலி தர நிலை',
    acousticClarity: 'சிக்னல் தெளிவு',
    ruleMatchReason: 'விதி பொருந்தியதற்கான காரணம்:',
    alternativeCandidate: 'மாற்று வாய்ப்புள்ள வகை:',
    supportingCues: 'ஆதார ஒலி பண்புகள்:',
    noActiveClassification: 'செயலில் பகுப்பாய்வு ஏதுமில்லை',
    startToStreamDesc: 'நேரடி ஒலி சிக்னல்களைக் கணக்கிட பகுப்பாய்வைத் தொடங்குங்கள்.',
    recentHistoryTitle: 'சமீபத்திய வகைப்பாட்டு வரலாறு (கணக்கிடப்பட்டவை மட்டுமே)',
    recentHistoryDesc: 'தற்காலிக ரேமில் உருவான முடிவுகள்; ஆடியோ எதுவும் சேமிக்கப்படவில்லை.',
    eventsLogged: 'நிகழ்வுகள் பதிவுசெய்யப்பட்டன',
    timeHeader: 'நேரம்',
    categoryHeader: 'ஒலி வகை',
    statusHeader: 'நிலை',
    scoreHeader: 'விதி-பொருத்த மதிப்பெண்',
    altHeader: 'மாற்று வகை',
    reasonHeader: 'தணிக்கை காரணம்',
    gridHeader: 'பகுதி (Grid)',

    // Sandbox
    sandboxTitle: 'ஒலி அம்சங்கள் ஆய்வுக்கூடம் (Sandbox)',
    sandboxDesc: '9 கணித விதிகளையும் சோதிக்க சிக்னல் அளவுகளை மாற்றிப் பாருங்கள்',
    presetsLabel: 'மாதிரிகள்:',
    rmsEnergyLabel: 'சிக்னல் ஆற்றல் (RMS Energy)',
    centroidLabel: 'ஸ்பெக்ட்ரல் மைய அதிர்வெண் (Spectral Centroid)',
    dominantFreqLabel: 'முக்கிய உச்ச அதிர்வெண் (Dominant Frequency)',
    periodicityLabel: 'மீண்டும் மீண்டும் நிகழும் தன்மை (Periodicity)',
    flatnessLabel: 'ஸ்பெக்ட்ரல் தட்டைத்தன்மை (Spectral Flatness)',
    peakCountLabel: 'திடீர் உச்ச அதிர்வுகள் (Impact Peaks)',

    // Heatmap Page
    heatmapTitle: 'ஊடாடும் இரைச்சல் வரைபடம் (Noise Heatmap)',
    heatmapSubtitle: 'கோயம்புத்தூர் மாநகராட்சி மண்டலங்களின் சுற்றுச்சூழல் ஒலி அளவுகளின் புவியியல் வரைபடம்.',
    legendQuiet: 'குறைந்த ஒலி / அமைதி மண்டலம் (< 45 dB)',
    legendModerate: 'மிதமான அனுமதிக்கப்பட்ட ஒலி (45 - 55 dB)',
    legendElevated: 'அதிகரித்த இரைச்சல் (55 - 65 dB)',
    legendHigh: 'அபாய இரைச்சல் மையம் (> 65 dB)',
    zoneResidential: 'குடியிருப்பு மண்டலம்',
    zoneCommercial: 'வணிக / கலப்பு மண்டலம்',
    zoneIndustrial: 'தொழில்துறை மண்டலம்',
    zoneSilence: 'அமைதி மண்டலம் (மருத்துவமனை / கல்லூரிகள்)',

    // Admin Login Page
    adminLoginTitle: 'மாநகராட்சி நிர்வாகி உள்நுழைவு',
    adminLoginSubtitle: 'அங்கீகரிக்கப்பட்ட சுற்றுச்சூழல் அலுவலர்கள் மற்றும் ஒலி ஆய்வாளர்களுக்கான பாதுகாக்கப்பட்ட பகுதி.',
    citizenNoticeTitle: 'குடிமக்கள் அறிவிப்பு:',
    citizenNoticeDesc: 'பொது மக்களுக்கு உள்நுழைவோ அல்லது பதிவோ தேவையில்லை. நேரடி கண்காணிப்பு மற்றும் இரைச்சல் வரைபடங்களை நீங்கள் தடையின்றி பயன்படுத்தலாம்.',
    adminUsernameLabel: 'நிர்வாகி பயனர் பெயர் அல்லது மின்னஞ்சல்',
    adminPasswordLabel: 'கடவுச்சொல்',
    adminSubmitBtn: 'நிர்வாகியாக உள்நுழைக',
    verifyingCredentials: 'விவரங்கள் சரிபார்க்கப்படுகின்றன...',
    officialProvisionNotice: 'அதிகாரப்பூர்வ கணக்குகள் அரசு மூலம் மட்டுமே உருவாக்கப்படும். பொது மக்கள் பதிவு முடக்கப்பட்டுள்ளது.',
    invalidCredentialsError: 'தவறான நிர்வாக பயனர் பெயர் அல்லது கடவுச்சொல்.',
    proceedToReports: 'அறிக்கைகளுக்குச் செல்',

    // Incident Reports (Admin Only)
    incidentsTitle: 'இரைச்சல் சம்பவங்கள் மேலாண்மை & ஆதாரக் கோப்புகள்',
    incidentsSubtitle: 'மாநகராட்சி சுற்றுச்சூழல் ஆய்வாளர்களுக்கான விரிவான ஆதாரக் குறிப்புகள்.',
    searchIncidentsPlaceholder: 'சம்பவ எண், பகுதி அல்லது ஒலி வகை மூலம் தேடுக...',
    allReviewStatus: 'அனைத்து பரிசீலனை நிலைகளும்',
    unreviewed: 'பரிசீலிக்கப்படாதது',
    underInvestigation: 'விசாரணையில் உள்ளது',
    confirmedExceedance: 'உறுதிசெய்யப்பட்ட விதிமீறல்',
    dismissed: 'நிராகரிக்கப்பட்டது',
    evidenceDetails: 'ஆதாரக் கோப்பு விவரங்கள்',
    applicableThreshold: 'அனுமதிக்கப்பட்ட உச்ச வரம்பு',
    recordedExceedance: 'பதிவான கூடுதல் இரைச்சல் அளவு',
    likelySoundSource: 'சாத்தியமான ஒலி மூலம்',
    updateStatus: 'சம்பவ பரிசீலனை நிலையை மாற்று',
    adminNotes: 'ஆய்வாளர் குறிப்புகள்',
    saveStatusBtn: 'பதிவு நிலையைச் சேமி',

    // Nighttime Screening (Admin Only)
    screeningTitle: 'இரவு நேர விதிமீறல் சரிபார்ப்பு (இரவு 10:00 - காலை 06:00)',
    screeningSubtitle: 'மாசு கட்டுப்பாட்டு வாரிய (CPCB) விதிகளுடன் இரவு நேர அளவீடுகளை ஒப்பிடுதல்.',
    screeningDisclaimer: 'இது முதற்கட்ட வழிகாட்டி மட்டுமே. சட்டப்பூர்வ நடவடிக்கைக்கு சான்றளிக்கப்பட்ட ஆய்வுக் கருவிகள் தேவை.',
    chronicScoreHeader: 'தொடர் இரைச்சல் குறியீடு',
    actionRequiredHeader: 'பரிந்துரைக்கப்படும் மாநகராட்சி நடவடிக்கை',
    regulatorySource: 'சட்ட விதிகளின் ஆதாரம்: சுற்றுச்சூழல் பாதுகாப்பு சட்டம் (இரவு நேர அட்டவணை)',

    // Municipal Audit Reports (Admin Only)
    auditReportsTitle: 'மாநகராட்சி சுற்றுச்சூழல் இரைச்சல் தணிக்கை',
    auditReportsSubtitle: 'வார்டு குழு மறுஆய்விற்கான சான்றளிக்கப்பட்ட இரைச்சல் சுருக்க அறிக்கை.',
    selectGridToAudit: 'தணிக்கை செய்ய வேண்டிய பகுதி:',
    reportingPeriod: 'அறிக்கைக் காலம்:',
    toLabel: 'முதல்',
    generateAuditBtn: 'தணிக்கை அறிக்கை உருவாக்கு',
    printingReport: 'அதிகாரப்பூர்வ மாநகராட்சி தணிக்கை அறிக்கை',
    auditConfidence: 'அளவீட்டு நம்பகத்தன்மை & தணிக்கை சான்று',
    regulatoryFramework: 'சட்டரீதியான தரநிலைகள் & விதிமுறைகள்',
    privacyOfficerCert: 'தனியுரிமை அலுவலர் சான்றளிப்பு: குரல் அல்லது மூல ஆடியோ எதுவும் சேமிக்கப்படவில்லை.',

    // Privacy Centre
    privacyCentreTitle: 'தனியுரிமை மற்றும் தரவு ஒருமைப்பாடு மையம்',
    privacyCentreSubtitle: 'மக்கள் உரையாடல்கள் கண்காணிக்கப்படாமல் இருக்க உருவாக்கப்பட்ட தொழில்நுட்ப பாதுகாப்புகள்.',
    privacyAuditStatus: 'தானியங்கி தனியுரிமை இணக்க நிலை',
    privacyPassed: 'கடுமையான தனியுரிமை நடைமுறைப்படுத்தப்பட்டுள்ளது',
    ramOnlyProcessing: 'தற்காலிக ரேமில் (RAM) மட்டுமே செயலாக்கம்',
    ramOnlyDesc: 'மைக்ரோஃபோன் தரவு 100 மில்லி விநாடிகள் மட்டுமே நினைவகத்தில் இருக்கும்; கணக்கீட்டிற்குப் பின் உடனே அழிக்கப்படும்.',
    zeroVoiceRecording: 'குரல் பதிவுகள் பதிவேற்றம் செய்யப்படுவதில்லை',
    zeroVoiceDesc: 'ஆடியோ கோப்புகள் அல்லது குரல் பதிவுகளை ஏற்கும் எந்தவொரு அமைப்பும் எங்கள் சர்வரில் முற்றிலுமாகத் தடுக்கப்பட்டுள்ளது.',
    gridAnonymization: 'மண்டல வரைபட அநாமதேயமாக்கல்',
    gridAnonymDesc: 'துல்லியமான வீட்டு முகவரிகளுக்குப் பதிலாக பரந்த மாநகராட்சி பகுதி எண்கள் மட்டுமே பயன்படுத்தப்படுகின்றன.'
  }
};


export const translateCategory = (cat: string, lang: Language): string => {
  if (lang !== 'ta') return cat;
  const dict = TRANSLATIONS.ta;
  switch (cat) {
    case 'Industrial Machinery':
      return dict.catIndustrial;
    case 'Road Traffic':
    case 'Traffic':
      return dict.catTraffic;
    case 'Construction':
      return dict.catConstruction;
    case 'Human Speech':
    case 'Speech':
      return dict.catSpeech;
    case 'Music':
      return dict.catMusic;
    case 'Sirens and alarms':
      return dict.catSirens;
    case 'Natural sounds':
      return dict.catNatural;
    case 'Mixed sound':
      return dict.catMixed;
    case 'Unknown sound':
    case 'Unknown':
      return dict.catUnknown;
    default:
      return cat;
  }
};
