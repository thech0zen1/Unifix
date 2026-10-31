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
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MobileApiClient } from './src/api/mobileClient';

export default function App() {
  // Session State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [campuses, setCampuses] = useState<any[]>([
    { id: 'campus-pstc-01', name: 'Pacific Science & Tech Campus', code: 'PSTC' },
    { id: 'campus-madi-02', name: 'Metropolitan Arts & Design Institute', code: 'MADI' },
    { id: 'campus-hvu-03', name: 'Highland Valley University', code: 'HVU' },
  ]);
  const [selectedCampus, setSelectedCampus] = useState<any>({
    id: 'campus-pstc-01',
    name: 'Pacific Science & Tech Campus',
    code: 'PSTC',
  });

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

  // Ticket Detail Modal State
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState<boolean>(false);
  const [commentInput, setCommentInput] = useState<string>('');
  const [isPostingComment, setIsPostingComment] = useState<boolean>(false);
  const [isReopening, setIsReopening] = useState<boolean>(false);
  const [reopenReason, setReopenReason] = useState<string>('');
  const [isSubmittingReopen, setIsSubmittingReopen] = useState<boolean>(false);

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
      if (selectedTicket && selectedTicket.id === ticketId) {
        openTicketDetails(ticketId);
      }
    } catch (err: any) {
      Alert.alert('Notice', err.message || 'Already endorsed or unable to record.');
    }
  };

  // Open Ticket Details Modal
  const openTicketDetails = async (ticketId: string) => {
    setSelectedTicketId(ticketId);
    setIsDetailLoading(true);
    setIsReopening(false);
    setReopenReason('');
    setCommentInput('');
    try {
      const res: any = await MobileApiClient.getTicketDetails(ticketId);
      if (res.data) {
        setSelectedTicket(res.data);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to load ticket details');
      setSelectedTicketId(null);
    } finally {
      setIsDetailLoading(false);
    }
  };

  // Post Comment
  const handlePostComment = async () => {
    if (!commentInput.trim() || !selectedTicket) return;
    setIsPostingComment(true);
    try {
      await MobileApiClient.addComment(selectedTicket.id, commentInput.trim());
      setCommentInput('');
      const res: any = await MobileApiClient.getTicketDetails(selectedTicket.id);
      if (res.data) setSelectedTicket(res.data);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to post comment');
    } finally {
      setIsPostingComment(false);
    }
  };

  // Reopen Ticket (Original Reporter Workflow)
  const handleReopenTicket = async () => {
    if (!reopenReason.trim() || reopenReason.trim().length < 10) {
      Alert.alert('Reason Required', 'Please enter at least 10 characters explaining why the issue is not solved.');
      return;
    }
    setIsSubmittingReopen(true);
    try {
      await MobileApiClient.reopenTicket(selectedTicket.id, reopenReason.trim());
      Alert.alert('Ticket Reopened', 'Management has been notified and the stage timer has restarted.');
      setIsReopening(false);
      setReopenReason('');
      openTicketDetails(selectedTicket.id);
      loadTickets();
    } catch (err: any) {
      Alert.alert('Reopen Failed', err.message || 'Unable to reopen ticket');
    } finally {
      setIsSubmittingReopen(false);
    }
  };

  // Notifications Handlers
  const handleMarkAllNotificationsRead = async () => {
    try {
      await MobileApiClient.markAllNotificationsRead();
      loadNotifications();
    } catch (err: any) {
      console.error('Failed to mark all read', err);
    }
  };

  const handleMarkNotificationRead = async (id: string) => {
    try {
      await MobileApiClient.markNotificationRead(id);
      loadNotifications();
    } catch (err: any) {
      console.error('Failed to mark notification read', err);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Calculate remaining days for stage countdown (21 days for standard, 2 days for critical)
  const getStageCountdown = (ticket: any) => {
    if (!ticket?.stageStartTime) return null;
    const stageDurationDays = ticket.severity === 'CRITICAL' ? 2 : 21;
    const startTime = new Date(ticket.stageStartTime).getTime();
    const elapsedDays = Math.floor((Date.now() - startTime) / (1000 * 60 * 60 * 24));
    const remainingDays = stageDurationDays - elapsedDays;
    return {
      stageDurationDays,
      elapsedDays,
      remainingDays: Math.max(0, remainingDays),
      isOverdue: remainingDays <= 0,
    };
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
          <Text style={styles.appSubtitle}>Facility issues, safety reports, and rapid stage resolution</Text>

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
        {/* TAB 1: Report Issue */}
        {activeTab === 'report' && (
          <ScrollView contentContainerStyle={styles.scrollContent}>
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

        {/* TAB 2: Browse Campus Issues */}
        {activeTab === 'browse' && (
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeader}>Campus Issues Feed ({campusTickets.length})</Text>
              <TouchableOpacity onPress={loadTickets} style={styles.refreshBtn}>
                <Text style={styles.refreshBtnText}>↻ Refresh</Text>
              </TouchableOpacity>
            </View>

            {isDataLoading ? (
              <ActivityIndicator style={{ marginTop: 24 }} color="#0071e3" />
            ) : campusTickets.length === 0 ? (
              <Text style={styles.emptyText}>No tickets reported yet on this campus.</Text>
            ) : (
              campusTickets.map((t) => (
                <TouchableOpacity
                  key={t.id}
                  activeOpacity={0.8}
                  onPress={() => openTicketDetails(t.id)}
                  style={styles.ticketCard}
                >
                  <View style={styles.ticketCardHeader}>
                    <Text style={styles.ticketCategory}>{t.category?.name || 'General'}</Text>
                    <View style={styles.statusPillBadge}>
                      <Text style={styles.ticketStatus}>{t.status}</Text>
                    </View>
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
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        )}

        {/* TAB 3: My Reported Tickets & Tracking */}
        {activeTab === 'myTickets' && (
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <Text style={styles.sectionHeader}>My Reported Issues & 3-Week Stage Tracking</Text>
            {campusTickets.filter((t) => t.reporterId === currentUser?.id).length === 0 ? (
              <Text style={styles.emptyText}>You haven't submitted any issues yet.</Text>
            ) : (
              campusTickets
                .filter((t) => t.reporterId === currentUser?.id)
                .map((t) => {
                  const countdown = getStageCountdown(t);
                  return (
                    <TouchableOpacity
                      key={t.id}
                      activeOpacity={0.8}
                      onPress={() => openTicketDetails(t.id)}
                      style={styles.ticketCard}
                    >
                      <View style={styles.ticketCardHeader}>
                        <Text style={styles.stageBadge}>Stage: {t.currentStage}</Text>
                        <View style={styles.statusPillBadge}>
                          <Text style={styles.ticketStatus}>{t.status}</Text>
                        </View>
                      </View>
                      <Text style={styles.ticketTitle}>{t.title}</Text>
                      {countdown && (
                        <View style={styles.countdownBanner}>
                          <Text style={styles.countdownText}>
                            {countdown.isOverdue
                              ? `⚠️ Overdue for stage progression (${countdown.elapsedDays}d in stage)`
                              : `⏱️ ${countdown.remainingDays} days remaining in 21-day stage window`}
                          </Text>
                        </View>
                      )}
                      {t.resolvedAt && (
                        <Text style={styles.resolutionNotice}>
                          ✓ Resolved: {t.resolutionSummary || 'Resolution complete'}
                        </Text>
                      )}
                    </TouchableOpacity>
                  );
                })
            )}
          </ScrollView>
        )}

        {/* TAB 4: In-App Notifications & Alerts */}
        {activeTab === 'notifications' && (
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeader}>Alerts & Notifications</Text>
              {notifications.length > 0 && (
                <TouchableOpacity onPress={handleMarkAllNotificationsRead} style={styles.refreshBtn}>
                  <Text style={styles.refreshBtnText}>Mark all read</Text>
                </TouchableOpacity>
              )}
            </View>

            {notifications.length === 0 ? (
              <Text style={styles.emptyText}>No notifications right now.</Text>
            ) : (
              notifications.map((n) => (
                <TouchableOpacity
                  key={n.id}
                  activeOpacity={0.8}
                  onPress={() => {
                    handleMarkNotificationRead(n.id);
                    if (n.ticketId) openTicketDetails(n.ticketId);
                  }}
                  style={[styles.notifCard, !n.isRead && styles.notifCardUnread]}
                >
                  <View style={styles.notifHeaderRow}>
                    <Text style={styles.notifTitle}>{n.title}</Text>
                    {!n.isRead && <View style={styles.unreadDot} />}
                  </View>
                  <Text style={styles.notifBody}>{n.message}</Text>
                  <Text style={styles.notifTime}>
                    {new Date(n.createdAt).toLocaleDateString()}
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        )}
      </View>

      {/* TICKET DETAIL & REOPEN MODAL */}
      <Modal
        visible={Boolean(selectedTicketId)}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedTicketId(null)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ flex: 1 }}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeaderTitle}>Ticket Details</Text>
              <TouchableOpacity
                onPress={() => setSelectedTicketId(null)}
                style={styles.closeBtn}
              >
                <Text style={styles.closeBtnText}>Done</Text>
              </TouchableOpacity>
            </View>

            {isDetailLoading || !selectedTicket ? (
              <ActivityIndicator style={{ marginTop: 40 }} color="#0071e3" />
            ) : (
              <ScrollView contentContainerStyle={styles.modalContent}>
                {/* Status Badges */}
                <View style={styles.badgeRow}>
                  <View style={styles.statusPillBadge}>
                    <Text style={styles.ticketStatus}>{selectedTicket.status}</Text>
                  </View>
                  <View style={[styles.statusPillBadge, { backgroundColor: '#f0fdf4' }]}>
                    <Text style={[styles.ticketStatus, { color: '#166534' }]}>
                      {selectedTicket.severity}
                    </Text>
                  </View>
                  <View style={[styles.statusPillBadge, { backgroundColor: '#fdf4ff' }]}>
                    <Text style={[styles.ticketStatus, { color: '#86198f' }]}>
                      Stage: {selectedTicket.currentStage}
                    </Text>
                  </View>
                </View>

                {/* Title & Description */}
                <Text style={styles.detailTitle}>{selectedTicket.title}</Text>
                <Text style={styles.detailDesc}>{selectedTicket.description}</Text>

                {/* Metadata Details Card */}
                <View style={styles.metaCard}>
                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>Category:</Text>
                    <Text style={styles.metaValue}>{selectedTicket.category?.name || 'General'}</Text>
                  </View>
                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>Location:</Text>
                    <Text style={styles.metaValue}>
                      {selectedTicket.location?.name || selectedTicket.locationText || 'Campus'}
                    </Text>
                  </View>
                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>Reported By:</Text>
                    <Text style={styles.metaValue}>
                      {selectedTicket.isAnonymous
                        ? '🛡️ Anonymous Reporter'
                        : `${selectedTicket.reporter?.firstName || 'Campus'} ${selectedTicket.reporter?.lastName || 'Reporter'}`}
                    </Text>
                  </View>
                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>Endorsements:</Text>
                    <Text style={styles.metaValue}>
                      {selectedTicket._count?.endorsements || selectedTicket.endorsements?.length || 0} affected users
                    </Text>
                  </View>
                </View>

                {/* 21-Day Stage Countdown Banner */}
                {selectedTicket.stageStartTime && (
                  <View style={styles.stageCountdownCard}>
                    <Text style={styles.stageCountdownTitle}>3-Week Stage Escalation Tracker</Text>
                    <Text style={styles.stageCountdownSub}>
                      Timer started on {new Date(selectedTicket.stageStartTime).toLocaleDateString()}
                    </Text>
                    <Text style={styles.stageCountdownAlert}>
                      {getStageCountdown(selectedTicket)?.isOverdue
                        ? '⚠️ Overdue: Stage unchanged past the 21-day threshold. Management alerted.'
                        : `⏱️ Next automatic management escalation in ${getStageCountdown(selectedTicket)?.remainingDays} days if not progressed.`}
                    </Text>
                  </View>
                )}

                {/* Endorsement Action */}
                <TouchableOpacity
                  onPress={() => handleEndorse(selectedTicket.id)}
                  style={styles.endorseActionBtn}
                >
                  <Text style={styles.endorseActionText}>
                    👍 I have this issue too ({selectedTicket._count?.endorsements || selectedTicket.endorsements?.length || 0})
                  </Text>
                </TouchableOpacity>

                {/* Resolution Summary & Reopen Workflow */}
                {selectedTicket.status === 'RESOLVED' && (
                  <View style={styles.resolutionBox}>
                    <Text style={styles.resolutionTitle}>✓ Marked as Resolved</Text>
                    <Text style={styles.resolutionDetails}>
                      {selectedTicket.resolutionSummary || 'Management completed maintenance.'}
                    </Text>

                    {/* Original Reporter Reopen Action */}
                    {selectedTicket.reporterId === currentUser?.id && (
                      <View style={{ marginTop: 12 }}>
                        {!isReopening ? (
                          <TouchableOpacity
                            onPress={() => setIsReopening(true)}
                            style={styles.reopenPromptBtn}
                          >
                            <Text style={styles.reopenPromptText}>Issue still not fixed? Reopen Ticket</Text>
                          </TouchableOpacity>
                        ) : (
                          <View style={styles.reopenFormBox}>
                            <Text style={styles.reopenFormHeading}>Explain why issue is still unresolved:</Text>
                            <TextInput
                              style={[styles.input, styles.textArea, { backgroundColor: '#ffffff' }]}
                              multiline
                              numberOfLines={3}
                              value={reopenReason}
                              onChangeText={setReopenReason}
                              placeholder="Describe why the problem remains (min 10 characters)..."
                            />
                            <View style={styles.reopenButtonsRow}>
                              <TouchableOpacity
                                onPress={() => setIsReopening(false)}
                                style={styles.cancelBtn}
                              >
                                <Text style={styles.cancelBtnText}>Cancel</Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                onPress={handleReopenTicket}
                                disabled={isSubmittingReopen}
                                style={styles.confirmReopenBtn}
                              >
                                {isSubmittingReopen ? (
                                  <ActivityIndicator color="#fff" />
                                ) : (
                                  <Text style={styles.confirmReopenText}>Confirm Reopen</Text>
                                )}
                              </TouchableOpacity>
                            </View>
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                )}

                {/* Comments Section */}
                <View style={styles.commentsSection}>
                  <Text style={styles.commentsHeading}>
                    Comments ({selectedTicket.comments?.length || 0})
                  </Text>
                  {selectedTicket.comments?.map((c: any) => (
                    <View key={c.id} style={styles.commentItem}>
                      <View style={styles.commentHeader}>
                        <Text style={styles.commentAuthor}>{c.authorName || 'Campus Member'}</Text>
                        <Text style={styles.commentDate}>
                          {new Date(c.createdAt).toLocaleDateString()}
                        </Text>
                      </View>
                      <Text style={styles.commentContent}>{c.content}</Text>
                    </View>
                  ))}

                  <View style={styles.addCommentBox}>
                    <TextInput
                      style={[styles.input, styles.commentInput]}
                      placeholder="Add a public comment or update..."
                      value={commentInput}
                      onChangeText={setCommentInput}
                    />
                    <TouchableOpacity
                      onPress={handlePostComment}
                      disabled={isPostingComment || !commentInput.trim()}
                      style={styles.postCommentBtn}
                    >
                      {isPostingComment ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text style={styles.postCommentBtnText}>Post</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </ScrollView>
            )}
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      {/* Bottom Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          onPress={() => setActiveTab('report')}
          style={styles.tabItem}
        >
          <Text style={[styles.tabText, activeTab === 'report' && styles.tabTextActive]}>
            Report
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
          <View>
            <Text style={[styles.tabText, activeTab === 'notifications' && styles.tabTextActive]}>
              Alerts
            </Text>
            {unreadCount > 0 && <View style={styles.badgeIndicator} />}
          </View>
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
    justifyContent: 'space-between',
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
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionHeader: { fontSize: 16, fontWeight: '700', color: '#1d1d1f' },
  refreshBtn: { padding: 4 },
  refreshBtnText: { color: '#0071e3', fontSize: 12, fontWeight: '600' },
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
  ticketCard: { backgroundColor: '#ffffff', borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#e5e5ea' },
  ticketCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ticketCategory: { fontSize: 11, fontWeight: '600', color: '#0071e3' },
  ticketStatus: { fontSize: 10, fontWeight: '700', color: '#6e6e73' },
  statusPillBadge: { backgroundColor: '#f5f5f7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  ticketTitle: { fontSize: 14, fontWeight: '600', color: '#1d1d1f', marginTop: 4 },
  ticketDesc: { fontSize: 12, color: '#6e6e73', marginTop: 4 },
  ticketFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderColor: '#f5f5f7' },
  ticketLocation: { fontSize: 11, color: '#86868b' },
  smallEndorseBtn: { backgroundColor: '#f5f5f7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  smallEndorseText: { fontSize: 11, fontWeight: '600', color: '#1d1d1f' },
  stageBadge: { fontSize: 11, fontWeight: '700', color: '#af52de' },
  countdownBanner: { backgroundColor: '#f5f5f7', padding: 8, borderRadius: 6, marginTop: 8 },
  countdownText: { fontSize: 11, fontWeight: '500', color: '#1d1d1f' },
  resolutionNotice: { fontSize: 11, fontWeight: '600', color: '#34c759', marginTop: 6 },
  emptyText: { textAlign: 'center', color: '#86868b', fontSize: 13, marginTop: 40 },

  // Notifications
  notifCard: { backgroundColor: '#ffffff', borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#e5e5ea' },
  notifCardUnread: { backgroundColor: '#f0f7ff', borderColor: '#bfe0ff' },
  notifHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  notifTitle: { fontSize: 13, fontWeight: '700', color: '#1d1d1f' },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#0071e3' },
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
  badgeIndicator: {
    position: 'absolute',
    top: -2,
    right: -6,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ff3b30',
  },

  // Modal Styles
  modalContainer: { flex: 1, backgroundColor: '#ffffff' },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: '#e5e5ea',
  },
  modalHeaderTitle: { fontSize: 16, fontWeight: '700', color: '#1d1d1f' },
  closeBtn: { padding: 4 },
  closeBtnText: { color: '#0071e3', fontSize: 14, fontWeight: '600' },
  modalContent: { padding: 20, paddingBottom: 40 },
  badgeRow: { flexDirection: 'row', gap: 6, marginBottom: 12 },
  detailTitle: { fontSize: 18, fontWeight: '700', color: '#1d1d1f', marginBottom: 8 },
  detailDesc: { fontSize: 14, color: '#424245', lineHeight: 20, marginBottom: 16 },
  metaCard: {
    backgroundColor: '#f5f5f7',
    borderRadius: 12,
    padding: 12,
    gap: 8,
    marginBottom: 16,
  },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between' },
  metaLabel: { fontSize: 12, color: '#86868b', fontWeight: '500' },
  metaValue: { fontSize: 12, color: '#1d1d1f', fontWeight: '600' },
  stageCountdownCard: {
    backgroundColor: '#fbfbfd',
    borderWidth: 1,
    borderColor: '#e5e5ea',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  stageCountdownTitle: { fontSize: 13, fontWeight: '700', color: '#af52de' },
  stageCountdownSub: { fontSize: 11, color: '#86868b', marginTop: 2 },
  stageCountdownAlert: { fontSize: 12, fontWeight: '500', color: '#1d1d1f', marginTop: 6 },
  endorseActionBtn: {
    backgroundColor: '#eaf3ff',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  endorseActionText: { color: '#0071e3', fontWeight: '600', fontSize: 13 },

  // Resolution & Reopen
  resolutionBox: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  resolutionTitle: { fontSize: 14, fontWeight: '700', color: '#166534' },
  resolutionDetails: { fontSize: 12, color: '#15803d', marginTop: 4 },
  reopenPromptBtn: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ff9500',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  reopenPromptText: { color: '#ff9500', fontWeight: '600', fontSize: 12 },
  reopenFormBox: { marginTop: 8 },
  reopenFormHeading: { fontSize: 12, fontWeight: '600', color: '#1d1d1f', marginBottom: 4 },
  reopenButtonsRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 8 },
  cancelBtn: { padding: 8 },
  cancelBtnText: { color: '#86868b', fontSize: 12, fontWeight: '500' },
  confirmReopenBtn: {
    backgroundColor: '#ff9500',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  confirmReopenText: { color: '#ffffff', fontSize: 12, fontWeight: '600' },

  // Comments
  commentsSection: { marginTop: 12, borderTopWidth: 1, borderColor: '#e5e5ea', paddingTop: 16 },
  commentsHeading: { fontSize: 15, fontWeight: '700', color: '#1d1d1f', marginBottom: 12 },
  commentItem: {
    backgroundColor: '#f5f5f7',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  commentHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  commentAuthor: { fontSize: 12, fontWeight: '600', color: '#1d1d1f' },
  commentDate: { fontSize: 10, color: '#86868b' },
  commentContent: { fontSize: 13, color: '#333336' },
  addCommentBox: { flexDirection: 'row', gap: 8, marginTop: 8 },
  commentInput: { flex: 1, marginTop: 0 },
  postCommentBtn: {
    backgroundColor: '#0071e3',
    borderRadius: 10,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  postCommentBtnText: { color: '#ffffff', fontWeight: '600', fontSize: 13 },
});
