import { useState, useEffect, lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { Heart, Loader2 } from "lucide-react";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { PerformanceOptimizer } from "./components/PerformanceOptimizer";
import { Toaster } from "./components/ui/sonner";

// Core components (loaded immediately)
import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { Footer } from "./components/Footer";

// Lazy load heavy components to reduce initial bundle size
const Features = lazy(() => import("./components/Features").then(m => ({ default: m.Features })));
const HowItWorks = lazy(() => import("./components/HowItWorks").then(m => ({ default: m.HowItWorks })));
const Statistics = lazy(() => import("./components/Statistics").then(m => ({ default: m.Statistics })));
const CallToAction = lazy(() => import("./components/CallToAction").then(m => ({ default: m.CallToAction })));
const UnifiedAuth = lazy(() => import("./components/UnifiedAuth").then(m => ({ default: m.UnifiedAuth })));
const UnifiedDashboard = lazy(() => import("./components/UnifiedDashboard").then(m => ({ default: m.UnifiedDashboard })));
const Dashboard = lazy(() => import("./components/Dashboard").then(m => ({ default: m.Dashboard })));
const HowItWorksPage = lazy(() => import("./components/HowItWorksPage").then(m => ({ default: m.HowItWorksPage })));
const FindDonorsPage = lazy(() => import("./components/FindDonorsPage").then(m => ({ default: m.FindDonorsPage })));
const AboutPage = lazy(() => import("./components/AboutPage").then(m => ({ default: m.AboutPage })));
const ProfileCompletionWizard = lazy(() => import("./components/ProfileCompletionWizard").then(m => ({ default: m.ProfileCompletionWizard })));
const HospitalBloodBankDirectory = lazy(() => import("./components/HospitalBloodBankDirectory").then(m => ({ default: m.HospitalBloodBankDirectory })));


// Loading component
const LoadingSpinner = () => (
  <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center">
    <div className="text-center space-y-4">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
        <Heart className="w-8 h-8 text-red-600" />
      </div>
      <Loader2 className="w-8 h-8 animate-spin text-red-600 mx-auto" />
      <h2 className="text-lg font-semibold text-gray-900">BloodConnect</h2>
      <p className="text-gray-600">Loading...</p>
    </div>
  </div>
);

const AppContent = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [pendingUserEmail, setPendingUserEmail] = useState<string>('');

  useEffect(() => {
    const emergencyTimeout = setTimeout(() => {
      console.debug('✅ App initialization timeout reached - ensuring app loads');
      setIsCheckingSession(false);
    }, 5000);

    return () => clearTimeout(emergencyTimeout);
  }, []);

  useEffect(() => {
    const checkStoredSession = async () => {
      try {
        const demoSession = localStorage.getItem('demo_session');
        const demoProfile = localStorage.getItem('demo_profile');

        if (demoSession && demoProfile) {
          console.log('🎯 Found demo session, restoring...');
          navigate('/dashboard');
          setIsCheckingSession(false);
          return;
        }

        if (demoSession && !demoProfile) {
          console.log('🔧 Demo session found but no profile, attempting restoration...');
          try {
            const session = JSON.parse(demoSession);
            const email = session.user?.email;
            const { DEMO_USERS } = await import('./utils/supabase/client');
            if (email && email in DEMO_USERS) {
              const profile = DEMO_USERS[email as keyof typeof DEMO_USERS].profile;
              localStorage.setItem('demo_profile', JSON.stringify(profile));
              console.log('✅ Demo profile restored, proceeding to dashboard');
              navigate('/dashboard');
              setIsCheckingSession(false);
              return;
            }
          } catch (error) {
            console.warn('Failed to restore demo profile:', error);
            localStorage.removeItem('demo_session');
          }
        }

        const stayLoggedIn = localStorage.getItem('bloodconnect_stay_logged_in');
        if (stayLoggedIn === 'true') {
          try {
            const sessionCheckPromise = (async () => {
              const { auth, profile } = await import('./utils/supabase/client');
              const session = await auth.getSession();
              if (session?.access_token) {
                const { profile: userProfile } = await profile.get();
                if (userProfile?.role) {
                  return { success: true, profile: userProfile };
                }
              }
              return { success: false };
            })();

            const timeoutPromise = new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Session check timeout')), 2000)
            );

            const result = await Promise.race([sessionCheckPromise, timeoutPromise]);

            if (result.success) {
              navigate('/dashboard');
              console.log('Auto-login successful');
            }
          } catch (error) {
            localStorage.removeItem('bloodconnect_stay_logged_in');
            localStorage.removeItem('bloodconnect_session_token');
            console.debug('Session check failed:', error);
          }
        }
      } catch (error) {
        console.debug('Error checking stored session:', error);
      } finally {
        setIsCheckingSession(false);
      }
    };

    const fallbackTimeout = setTimeout(() => {
      console.debug('Session check fallback timeout reached');
      setIsCheckingSession(false);
    }, 3000);

    checkStoredSession().finally(() => {
      clearTimeout(fallbackTimeout);
    });

    return () => {
      clearTimeout(fallbackTimeout);
    };
  }, [navigate]);

  const handleAuthSuccess = () => {
    const demoProfile = localStorage.getItem('demo_profile');
    if (demoProfile) {
      const profile = JSON.parse(demoProfile);
      setPendingUserEmail(profile.email);
      const isProfileComplete = localStorage.getItem(`profile_complete_${profile.email}`);
      if (!isProfileComplete) {
        navigate('/profile-wizard');
        return;
      }
    }
    navigate('/dashboard');
  };

  const handleProfileComplete = (profileData: any) => {
    console.log('Profile completed:', profileData);
    localStorage.setItem(`profile_complete_${profileData.email}`, 'true');
    localStorage.setItem(`profile_data_${profileData.email}`, JSON.stringify(profileData));
    navigate('/dashboard');
  };

  const handleProfileSkip = () => {
    localStorage.setItem(`profile_skipped_${pendingUserEmail}`, 'true');
    navigate('/dashboard');
  };

  const handleSignOut = async () => {
    localStorage.removeItem('bloodconnect_stay_logged_in');
    localStorage.removeItem('bloodconnect_session_token');
    localStorage.removeItem('demo_session');
    localStorage.removeItem('demo_profile');
    setPendingUserEmail('');
    navigate('/');

    try {
      const signOutPromise = (async () => {
        const { auth } = await import('./utils/supabase/client');
        await auth.signOut();
      })();

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('SignOut timeout')), 1000)
      );

      await Promise.race([signOutPromise, timeoutPromise]);
    } catch (error) {
      console.debug('SignOut error (continuing anyway):', error);
    }
  };

  if (isCheckingSession) {
    return <LoadingSpinner />;
  }

  const MainLayout = ({ children }: { children: React.ReactNode }) => (
    <>
      <Header />
      {children}
      <Footer />
    </>
  );

  return (
    <ErrorBoundary>
      <PerformanceOptimizer />
      <div className="min-h-screen bg-white">
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route path="/profile-wizard" element={<ProfileCompletionWizard onComplete={handleProfileComplete} onSkip={handleProfileSkip} userEmail={pendingUserEmail} />} />
            <Route path="/dashboard" element={<UnifiedDashboard onSignOut={handleSignOut} />} />
            <Route path="/donor-dashboard" element={<Dashboard userRole="donor" onSignOut={handleSignOut} />} />
            <Route path="/patient-dashboard" element={<Dashboard userRole="patient" onSignOut={handleSignOut} />} />
            <Route path="/auth" element={<UnifiedAuth onAuthSuccess={handleAuthSuccess} />} />
            <Route path="/how-it-works" element={<MainLayout><HowItWorksPage /></MainLayout>} />
            <Route path="/find-donors" element={<MainLayout><FindDonorsPage /></MainLayout>} />
            <Route path="/about" element={<MainLayout><AboutPage /></MainLayout>} />
            <Route path="/hospital-directory" element={<MainLayout><HospitalBloodBankDirectory /></MainLayout>} />
            <Route path="/" element={
              <MainLayout>
                <main>
                  <Hero />
                  <Features />
                  <HowItWorks />
                  <Statistics />
                  <CallToAction />
                </main>
              </MainLayout>
            } />
          </Routes>
        </Suspense>
        <Toaster />
      </div>
    </ErrorBoundary>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}