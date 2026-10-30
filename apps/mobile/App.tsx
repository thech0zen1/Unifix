// Unifix Mobile Application - React Native (Expo)
import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MobileApiClient } from './src/api/mobileClient';

export default function App() {
  // Session State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [campuses, setCampuses] = useState<any[]>([]);
  const [selectedCampus, setSelectedCampus] = useState<any>(null);

  // Auth Inputs
  const [identifier, setIdentifier] = useState<string>('student.alex@pstc.test');
  const [otpCode, setOtpCode] = useState<string>('123456');
  const [isAnonymousMode, setIsAnonymousMode] = useState<boolean>(false);
  const [authStep, setAuthStep] = useState<'campus' | 'otp'>('campus');
  const [authLoading, setAuthLoading] = useState<boolean>(false);

  // App Navigation
  const [activeTab, setActiveTab] = useState<'report' | 'browse' | 'myTickets' | 'notifications'>('report');

  // Reporting State
  const [reportingMode, setReportingMode] = useState<'ai' | 'manual'>('ai');
  const [aiPrompt, setAiPrompt] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<any>(null);
  const [similarTickets, setSimilarTickets] = useState<any[]>([]);

  // Manual & Confirmation Fields
  const [reportTitle, setReportTitle] = useState<string>('');
  const [reportDescription, setReportDescription] = useState<string>('');
  const [reportLocation, setReportLocation] = useState<string>('');
  const [reportSeverity, setReportSeverity] = useState<string>('MODERATE');
  const [reportIsAnonymous, setReportIsAnonymous] = useState<boolean>(false);
  const [isSubmittingReport, setIsSubmittingReport] = useState<boolean>(false);

  // Data Lists
  const [campusTickets, setCampusTickets] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isDataLoading, setIsDataLoading] = useState<boolean>(false);

  // 1. Initial Load: Fetch Campuses
  useEffect(() => {
    async function loadCampuses() {
      try {
        const res: any = await MobileApiClient.getCampuses();
        if (res.data && res.data.length > 0) {
          setCampuses(res.data);
          setSelectedCampus(res.data[0]);
        }
      } catch (err: any) {
        console.error('Failed to load campuses', err);
      }
    }
    loadCampuses();
  }, []);

  // 2. Fetch Tickets & Notifications when Authenticated
  useEffect(() => {
    if (isAuthenticated && selectedCampus) {
      loadTickets();
      loadNotifications();
    }
  }, [isAuthenticated, selectedCampus, activeTab]);

  const loadTickets = async () => {
    setIsDataLoading(true);
    try {
      const res: any = await MobileApiClient.getTickets({
        campusId: selectedCampus.id,
        search: searchQuery,
      });
      if (res.data) setCampusTickets(res.data);
    } catch (err) {
      console.error('Failed to load tickets', err);
    } finally {
      setIsDataLoading(false);
    }
  };

  const loadNotifications = async () => {
    try {
      const res: any = await MobileApiClient.getNotifications();
      if (res.data) setNotifications(res.data);
    } catch (err) {
      console.error('Failed to load notifications', err);
    }
  };

  // Auth Handlers
  const handleRequestOtp = async () => {
    if (!selectedCampus) return;
    setAuthLoading(true);
    try {
      await MobileApiClient.requestOTP(identifier, selectedCampus.id, isAnonymousMode);
      setAuthStep('otp');
    } catch (err: any) {
      Alert.alert('Eligibility Notice', err.message || 'Identity not authorized for this campus.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setAuthLoading(true);
    try {
      const res: any = await MobileApiClient.verifyOTP(
        identifier,
        otpCode,
        selectedCampus.id,
        isAnonymousMode
      );
      if (res.data) {
        setCurrentUser(res.data.user);
        setIsAuthenticated(true);
      }
    } catch (err: any) {
      Alert.alert('Verification Failed', err.message || 'Invalid code.');
    } finally {
      setAuthLoading(false);
    }
  };

  // AI-Assisted Reporting
  const handleAnalyzeWithAI = async () => {
    if (!aiPrompt.trim() || !selectedCampus) return;
    setIsAnalyzing(true);
    try {
      const [parseRes, simRes]: any = await Promise.all([
        MobileApiClient.parseIssueWithAI(selectedCampus.id, aiPrompt),
        MobileApiClient.checkSimilarityWithAI(selectedCampus.id, aiPrompt),
      ]);

      if (parseRes.data) {
        setAiAnalysisResult(parseRes.data);
        setReportTitle(parseRes.data.suggestedTitle);
        setReportDescription(aiPrompt);
        setReportLocation(parseRes.data.extractedLocation || '');
        setReportSeverity(parseRes.data.suggestedSeverity || 'MODERATE');
      }

      if (simRes.data?.matches) {
        setSimilarTickets(simRes.data.matches);
      }
    } catch (err: any) {
      Alert.alert('AI Notice', 'AI service is temporarily unavailable. Switching to manual report mode.');
      setReportingMode('manual');
      setReportDescription(aiPrompt);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Final Ticket Submission (Explicit User Confirmation)
  const handleSubmitTicket = async () => {
    if (!reportTitle.trim() || !reportDescription.trim()) {
      Alert.alert('Missing Info', 'Please provide a title and description.');
      return;
    }

    setIsSubmittingReport(true);
    try {
      await MobileApiClient.createTicket({
        campusId: selectedCampus.id,
        title: reportTitle,
        description: reportDescription,
        locationText: reportLocation,
        severity: reportSeverity,
        isAnonymous: reportIsAnonymous,
      });

      Alert.alert('Issue Submitted', 'Your ticket has been logged and queued for campus management.');
      // Reset form
      setAiPrompt('');
      setAiAnalysisResult(null);
      setSimilarTickets([]);
      setReportTitle('');
      setReportDescription('');
      setReportLocation('');
      setActiveTab('browse');
    } catch (err: any) {
      Alert.alert('Submission Error', err.message || 'Failed to submit report');
    } finally {
      setIsSubmittingReport(false);
    }
  };

  // Endorse Duplicate
  const handleEndorse = async (ticketId: string) => {
    try {
      await MobileApiClient.endorseTicket(ticketId);
      Alert.alert('Endorsed', 'You have been added as an affected user on this existing ticket.');
      loadTickets();
    } catch (err: any) {
      Alert.alert('Notice', err.message || 'Already endorsed or unable to record.');
    }
  };

  // ==========================================
  // Render: Onboarding & Auth Flow
  // ==========================================
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.authContainer}>
        <StatusBar barStyle="dark-content" />
        <ScrollView contentContainerStyle={styles.authScroll}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoText}>U</Text>
          </View>
          <Text style={styles.appTitle}>Unifix Campus</Text>
          <Text style={styles.appSubtitle}>Facility issues, safety reports, and quick resolution</Text>

          <View style={styles.authCard}>
            {authStep === 'campus' ? (
              <View>
                <Text style={styles.fieldLabel}>Select Campus</Text>
                <View style={styles.campusPickerContainer}>
                  {campuses.map((c) => (
                    <TouchableOpacity
                      key={c.id}
                      onPress={() => setSelectedCampus(c)}
                      style={[
                        styles.campusOption,
                        selectedCampus?.id === c.id && styles.campusOptionSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.campusOptionText,
                          selectedCampus?.id === c.id && styles.campusOptionTextSelected,
                        ]}
                      >
                        {c.name} ({c.code})
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Campus Email or Phone</Text>
                <TextInput
                  style={styles.input}
                  value={identifier}
                  onChangeText={setIdentifier}
                  placeholder="e.g. student.alex@pstc.test"
                  autoCapitalize="none"
                />

                <TouchableOpacity
                  onPress={() => setIsAnonymousMode(!isAnonymousMode)}
                  style={styles.anonToggle}
                >
                  <View style={[styles.checkbox, isAnonymousMode && styles.checkboxActive]} />
                  <Text style={styles.anonText}>Report Anonymously as Guest</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleRequestOtp}
                  disabled={authLoading}
                  style={styles.primaryButton}
                >
                  {authLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Continue to Verification</Text>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <View>
                <View style={styles.infoBanner}>
                  <Text style={styles.infoBannerText}>
                    Simulated verification code for {identifier}: 123456
                  </Text>
                </View>

                <Text style={styles.fieldLabel}>Enter 6-Digit Code</Text>
                <TextInput
                  style={[styles.input, styles.otpInput]}
                  value={otpCode}
                  onChangeText={setOtpCode}
                  maxLength={6}
                  keyboardType="number-pad"
                  placeholder="123456"
                />

                <TouchableOpacity
                  onPress={handleVerifyOtp}
                  disabled={authLoading}
                  style={styles.primaryButton}
                >
                  {authLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Sign In & Open Campus Portal</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setAuthStep('campus')}
                  style={{ marginTop: 12, alignItems: 'center' }}
                >
                  <Text style={styles.linkText}>Back to campus selection</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ==========================================
  // Render: Authenticated Main App
  // ==========================================
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Top Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>{selectedCampus?.name}</Text>
          <Text style={styles.headerSubtitle}>
            {currentUser?.isAnonymous ? 'Anonymous Guest' : `${currentUser?.firstName} ${currentUser?.lastName}`}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => setIsAuthenticated(false)}
          style={styles.logoutButton}
        >
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      {/* Main Content Body */}
      <View style={styles.mainContent}>
        {activeTab === 'report' && (
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* Mode Switcher: AI-Assisted vs Manual */}
            <View style={styles.modeTabs}>
              <TouchableOpacity
                onPress={() => setReportingMode('ai')}
                style={[styles.modeTab, reportingMode === 'ai' && styles.modeTabActive]}
              >
                <Text style={[styles.modeTabText, reportingMode === 'ai' && styles.modeTabTextActive]}>
                  AI-Assisted Report
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setReportingMode('manual')}
                style={[styles.modeTab, reportingMode === 'manual' && styles.modeTabActive]}
              >
                <Text style={[styles.modeTabText, reportingMode === 'manual' && styles.modeTabTextActive]}>
                  Manual Form
                </Text>
              </TouchableOpacity>
            </View>

            {reportingMode === 'ai' ? (
              <View style={styles.card}>
                <Text style={styles.cardHeading}>Describe the issue in your own words</Text>
                <Text style={styles.cardSubheading}>
                  e.g., "The hallway light outside Chemistry Lab 301 has been flickering loudly and sparking since this morning."
                </Text>

                <TextInput
                  style={[styles.input, styles.textArea]}
                  multiline
                  numberOfLines={4}
                  value={aiPrompt}
                  onChangeText={setAiPrompt}
                  placeholder="What is the problem and where is it located?"
                />

                <TouchableOpacity
                  onPress={handleAnalyzeWithAI}
                  disabled={isAnalyzing || !aiPrompt.trim()}
                  style={styles.primaryButton}
                >
                  {isAnalyzing ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Analyze Issue with AI</Text>
                  )}
                </TouchableOpacity>

                {/* Similar Tickets Warning (Prevent Duplicates) */}
                {similarTickets.length > 0 && (
                  <View style={styles.duplicateBox}>
                    <Text style={styles.duplicateTitle}>Similar Existing Reports Detected</Text>
                    <Text style={styles.duplicateSubtitle}>
                      Has someone already reported this? Tap "I have this issue too" to endorse it:
                    </Text>
                    {similarTickets.map((st) => (
                      <View key={st.ticketId} style={styles.duplicateItem}>
                        <Text style={styles.duplicateItemTitle}>{st.title}</Text>
                        <Text style={styles.duplicateItemReason}>{st.explanation}</Text>
                        <TouchableOpacity
                          onPress={() => handleEndorse(st.ticketId)}
                          style={styles.endorseButton}
                        >
                          <Text style={styles.endorseButtonText}>I have this issue too</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}

                {/* AI Extracted Confirmation Screen */}
                {aiAnalysisResult && (
                  <View style={styles.confirmationBox}>
                    <Text style={styles.confirmationTitle}>Review Before Submission</Text>
                    <Text style={styles.confirmationNotice}>
                      AI extracted the fields below. You can edit them before confirming:
                    </Text>

                    <Text style={styles.fieldLabel}>Title</Text>
                    <TextInput
                      style={styles.input}
                      value={reportTitle}
                      onChangeText={setReportTitle}
                    />

                    <Text style={styles.fieldLabel}>Category</Text>
                    <View style={styles.readOnlyBadge}>
                      <Text style={styles.badgeText}>{aiAnalysisResult.suggestedCategory}</Text>
                    </View>

                    <Text style={styles.fieldLabel}>Location</Text>
                    <TextInput
                      style={styles.input}
                      value={reportLocation}
                      onChangeText={setReportLocation}
                      placeholder="Room, floor, or building..."
                    />

                    {/* Follow-up Clarification Questions */}
                    {aiAnalysisResult.followUpQuestions?.length > 0 && (
                      <View style={styles.questionsBox}>
                        <Text style={styles.questionHeading}>Clarification Needed:</Text>
                        {aiAnalysisResult.followUpQuestions.map((q: string, idx: number) => (
                          <Text key={idx} style={styles.questionText}>• {q}</Text>
                        ))}
                      </View>
                    )}

                    <TouchableOpacity
                      onPress={() => setReportIsAnonymous(!reportIsAnonymous)}
                      style={styles.anonToggle}
                    >
                      <View style={[styles.checkbox, reportIsAnonymous && styles.checkboxActive]} />
                      <Text style={styles.anonText}>Submit as Anonymous Report</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={handleSubmitTicket}
                      disabled={isSubmittingReport}
                      style={[styles.primaryButton, { backgroundColor: '#34c759' }]}
                    >
                      {isSubmittingReport ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text style={styles.buttonText}>Confirm & Submit Report</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ) : (
              /* Mode A: Manual Form */
              <View style={styles.card}>
                <Text style={styles.cardHeading}>Manual Issue Form</Text>

                <Text style={styles.fieldLabel}>Issue Title *</Text>
                <TextInput
                  style={styles.input}
                  value={reportTitle}
                  onChangeText={setReportTitle}
                  placeholder="Short, descriptive headline"
                />

                <Text style={styles.fieldLabel}>Detailed Description *</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  multiline
                  numberOfLines={4}
                  value={reportDescription}
                  onChangeText={setReportDescription}
                  placeholder="Explain what is broken or malfunctioning..."
                />

                <Text style={styles.fieldLabel}>Location (Building / Floor / Room)</Text>
                <TextInput
                  style={styles.input}
                  value={reportLocation}
                  onChangeText={setReportLocation}
                  placeholder="e.g. Science Hall 3rd Floor"
                />

                <Text style={styles.fieldLabel}>Severity</Text>
                <View style={styles.severityRow}>
                  {['MINOR', 'MODERATE', 'MAJOR', 'CRITICAL'].map((sev) => (
                    <TouchableOpacity
                      key={sev}
                      onPress={() => setReportSeverity(sev)}
                      style={[
                        styles.severityPill,
                        reportSeverity === sev && styles.severityPillActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.severityPillText,
                          reportSeverity === sev && styles.severityPillTextActive,
                        ]}
                      >
                        {sev}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity
                  onPress={() => setReportIsAnonymous(!reportIsAnonymous)}
                  style={styles.anonToggle}
                >
                  <View style={[styles.checkbox, reportIsAnonymous && styles.checkboxActive]} />
                  <Text style={styles.anonText}>Submit Anonymously</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleSubmitTicket}
                  disabled={isSubmittingReport}
                  style={styles.primaryButton}
                >
                  {isSubmittingReport ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Submit Report</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        )}

        {/* Browse Campus Issues */}
        {activeTab === 'browse' && (
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <Text style={styles.sectionHeader}>Campus Issues Feed ({campusTickets.length})</Text>
            {isDataLoading ? (
              <ActivityIndicator style={{ marginTop: 24 }} color="#0071e3" />
            ) : campusTickets.length === 0 ? (
              <Text style={styles.emptyText}>No tickets reported yet on this campus.</Text>
            ) : (
              campusTickets.map((t) => (
                <View key={t.id} style={styles.ticketCard}>
                  <View style={styles.ticketCardHeader}>
                    <Text style={styles.ticketCategory}>{t.category?.name || 'General'}</Text>
                    <Text style={styles.ticketStatus}>{t.status}</Text>
                  </View>
                  <Text style={styles.ticketTitle}>{t.title}</Text>
                  <Text style={styles.ticketDesc} numberOfLines={2}>
                    {t.description}
                  </Text>
                  <View style={styles.ticketFooter}>
                    <Text style={styles.ticketLocation}>📍 {t.location?.name || t.locationText || 'Campus'}</Text>
                    <TouchableOpacity
                      onPress={() => handleEndorse(t.id)}
                      style={styles.smallEndorseBtn}
                    >
                      <Text style={styles.smallEndorseText}>
                        👍 {t._count?.endorsements || 0} Affected
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        )}

        {/* My Reported Tickets & Tracking */}
        {activeTab === 'myTickets' && (
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <Text style={styles.sectionHeader}>My Reported Issues & 3-Week Stage Tracking</Text>
            {campusTickets
              .filter((t) => t.reporterId === currentUser?.id)
              .map((t) => (
                <View key={t.id} style={styles.ticketCard}>
                  <View style={styles.ticketCardHeader}>
                    <Text style={styles.stageBadge}>Stage: {t.currentStage}</Text>
                    <Text style={styles.ticketStatus}>{t.status}</Text>
                  </View>
                  <Text style={styles.ticketTitle}>{t.title}</Text>
                  <Text style={styles.trackingInfo}>
                    In current stage since {new Date(t.stageStartTime).toLocaleDateString()}
                  </Text>
                  {t.resolvedAt && (
                    <Text style={styles.resolutionNotice}>
                      Resolved: {t.resolutionSummary}
                    </Text>
                  )}
                </View>
              ))}
          </ScrollView>
        )}

        {/* In-App Notifications */}
        {activeTab === 'notifications' && (
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <Text style={styles.sectionHeader}>Notifications & Escalation Alerts</Text>
            {notifications.length === 0 ? (
              <Text style={styles.emptyText}>No notifications right now.</Text>
            ) : (
              notifications.map((n) => (
                <View key={n.id} style={styles.notifCard}>
                  <Text style={styles.notifTitle}>{n.title}</Text>
                  <Text style={styles.notifBody}>{n.message}</Text>
                  <Text style={styles.notifTime}>
                    {new Date(n.createdAt).toLocaleDateString()}
                  </Text>
                </View>
              ))
            )}
          </ScrollView>
        )}
      </View>

      {/* Bottom Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          onPress={() => setActiveTab('report')}
          style={styles.tabItem}
        >
          <Text style={[styles.tabText, activeTab === 'report' && styles.tabTextActive]}>
            Report Issue
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab('browse')}
          style={styles.tabItem}
        >
          <Text style={[styles.tabText, activeTab === 'browse' && styles.tabTextActive]}>
            Browse ({campusTickets.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab('myTickets')}
          style={styles.tabItem}
        >
          <Text style={[styles.tabText, activeTab === 'myTickets' && styles.tabTextActive]}>
            My Issues
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab('notifications')}
          style={styles.tabItem}
        >
          <Text style={[styles.tabText, activeTab === 'notifications' && styles.tabTextActive]}>
            Alerts
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fbfbfd' },
  authContainer: { flex: 1, backgroundColor: '#fbfbfd' },
  authScroll: { padding: 24, alignItems: 'center' },
  logoBadge: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: '#0071e3',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  logoText: { color: '#ffffff', fontSize: 32, fontWeight: 'bold' },
  appTitle: { fontSize: 24, fontWeight: '700', color: '#1d1d1f', marginTop: 16 },
  appSubtitle: { fontSize: 13, color: '#6e6e73', marginTop: 6, textAlign: 'center' },
  authCard: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    marginTop: 24,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  campusPickerContainer: { marginTop: 6, gap: 8 },
  campusOption: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e5ea',
    backgroundColor: '#f5f5f7',
  },
  campusOptionSelected: { borderColor: '#0071e3', backgroundColor: '#eaf3ff' },
  campusOptionText: { fontSize: 13, color: '#1d1d1f', fontWeight: '500' },
  campusOptionTextSelected: { color: '#0071e3', fontWeight: '700' },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: '#6e6e73', marginTop: 12 },
  input: {
    backgroundColor: '#f5f5f7',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#e5e5ea',
    marginTop: 6,
    color: '#1d1d1f',
  },
  textArea: { height: 90, textAlignVertical: 'top' },
  otpInput: { textAlign: 'center', fontSize: 22, fontWeight: 'bold', letterSpacing: 6 },
  primaryButton: {
    backgroundColor: '#0071e3',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginTop: 18,
  },
  buttonText: { color: '#ffffff', fontSize: 14, fontWeight: '600' },
  linkText: { color: '#0071e3', fontSize: 13, fontWeight: '500' },
  infoBanner: { backgroundColor: '#eaf3ff', padding: 10, borderRadius: 8, marginBottom: 12 },
  infoBannerText: { color: '#0071e3', fontSize: 12, fontWeight: '500' },
  anonToggle: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14 },
  checkbox: { width: 18, height: 18, borderRadius: 5, borderWidth: 1, borderColor: '#c7c7cc' },
  checkboxActive: { backgroundColor: '#0071e3', borderColor: '#0071e3' },
  anonText: { fontSize: 13, color: '#6e6e73' },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#e5e5ea',
    backgroundColor: '#ffffff',
  },
  headerTitle: { fontSize: 15, fontWeight: '700', color: '#1d1d1f' },
  headerSubtitle: { fontSize: 11, color: '#86868b' },
  logoutButton: { padding: 6 },
  logoutText: { fontSize: 12, color: '#ff3b30', fontWeight: '500' },

  // Main Body
  mainContent: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  modeTabs: { flexDirection: 'row', backgroundColor: '#e5e5ea', borderRadius: 10, padding: 2, marginBottom: 14 },
  modeTab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  modeTabActive: { backgroundColor: '#ffffff' },
  modeTabText: { fontSize: 12, fontWeight: '500', color: '#6e6e73' },
  modeTabTextActive: { color: '#1d1d1f', fontWeight: '700' },
  card: { backgroundColor: '#ffffff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#e5e5ea' },
  cardHeading: { fontSize: 15, fontWeight: '700', color: '#1d1d1f' },
  cardSubheading: { fontSize: 12, color: '#86868b', marginTop: 4, marginBottom: 10 },

  // Duplicate box
  duplicateBox: { backgroundColor: '#fff8ea', borderWidth: 1, borderColor: '#ffe0b2', borderRadius: 12, padding: 12, marginTop: 14 },
  duplicateTitle: { fontSize: 13, fontWeight: '700', color: '#b76e00' },
  duplicateSubtitle: { fontSize: 11, color: '#8c5300', marginTop: 2, marginBottom: 8 },
  duplicateItem: { backgroundColor: '#ffffff', borderRadius: 8, padding: 10, marginBottom: 6 },
  duplicateItemTitle: { fontSize: 12, fontWeight: '600', color: '#1d1d1f' },
  duplicateItemReason: { fontSize: 11, color: '#6e6e73', marginTop: 2 },
  endorseButton: { backgroundColor: '#ff9f0a', borderRadius: 6, paddingVertical: 6, paddingHorizontal: 10, marginTop: 6, alignSelf: 'flex-start' },
  endorseButtonText: { color: '#ffffff', fontSize: 11, fontWeight: '600' },

  // Confirmation box
  confirmationBox: { backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#bbf7d0', borderRadius: 12, padding: 12, marginTop: 14 },
  confirmationTitle: { fontSize: 14, fontWeight: '700', color: '#166534' },
  confirmationNotice: { fontSize: 11, color: '#15803d', marginTop: 2, marginBottom: 8 },
  readOnlyBadge: { backgroundColor: '#dcfce7', borderRadius: 6, padding: 8, marginTop: 4 },
  badgeText: { fontSize: 12, fontWeight: '600', color: '#166534' },
  questionsBox: { backgroundColor: '#ffffff', borderRadius: 8, padding: 10, marginTop: 8 },
  questionHeading: { fontSize: 11, fontWeight: '700', color: '#b45309' },
  questionText: { fontSize: 11, color: '#78350f', marginTop: 2 },

  // Severity row
  severityRow: { flexDirection: 'row', gap: 6, marginTop: 6 },
  severityPill: { flex: 1, paddingVertical: 8, borderRadius: 8, backgroundColor: '#f5f5f7', alignItems: 'center' },
  severityPillActive: { backgroundColor: '#0071e3' },
  severityPillText: { fontSize: 10, fontWeight: '600', color: '#6e6e73' },
  severityPillTextActive: { color: '#ffffff' },

  // Ticket card
  sectionHeader: { fontSize: 16, fontWeight: '700', color: '#1d1d1f', marginBottom: 12 },
  ticketCard: { backgroundColor: '#ffffff', borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#e5e5ea' },
  ticketCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ticketCategory: { fontSize: 11, fontWeight: '600', color: '#0071e3' },
  ticketStatus: { fontSize: 11, fontWeight: '700', color: '#86868b' },
  ticketTitle: { fontSize: 14, fontWeight: '600', color: '#1d1d1f', marginTop: 4 },
  ticketDesc: { fontSize: 12, color: '#6e6e73', marginTop: 4 },
  ticketFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderColor: '#f5f5f7' },
  ticketLocation: { fontSize: 11, color: '#86868b' },
  smallEndorseBtn: { backgroundColor: '#f5f5f7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  smallEndorseText: { fontSize: 11, fontWeight: '600', color: '#1d1d1f' },
  stageBadge: { fontSize: 11, fontWeight: '700', color: '#af52de' },
  trackingInfo: { fontSize: 11, color: '#86868b', marginTop: 6 },
  resolutionNotice: { fontSize: 11, fontWeight: '600', color: '#34c759', marginTop: 4 },
  emptyText: { textAlign: 'center', color: '#86868b', fontSize: 13, marginTop: 40 },

  // Notifications
  notifCard: { backgroundColor: '#ffffff', borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#e5e5ea' },
  notifTitle: { fontSize: 13, fontWeight: '700', color: '#1d1d1f' },
  notifBody: { fontSize: 12, color: '#6e6e73', marginTop: 2 },
  notifTime: { fontSize: 10, color: '#86868b', marginTop: 6 },

  // Bottom Tab Bar
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderColor: '#e5e5ea',
    backgroundColor: '#ffffff',
    paddingVertical: 10,
    paddingBottom: 20,
  },
  tabItem: { flex: 1, alignItems: 'center' },
  tabText: { fontSize: 11, fontWeight: '500', color: '#86868b' },
  tabTextActive: { color: '#0071e3', fontWeight: '700' },
});
