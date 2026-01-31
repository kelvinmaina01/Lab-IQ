import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  Loader2,
  Activity,
  Brain,
  Database,
  LineChart,
  Shield,
  Users,
  ArrowRight,
  Eye,
  EyeOff,
  CheckCircle2,
  Sparkles,
  Rocket,
  Zap
} from 'lucide-react';

const Signup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect');
  const token = searchParams.get('token');

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        if (redirect) {
          navigate(`${redirect}${token ? ` ?token=${token}` : ''}`);
        } else {
          navigate('/dashboard');
        }
      }
      setCheckingAuth(false);
    };
    checkAuth();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({
        title: 'Passwords do not match',
        description: 'Please make sure your passwords match.',
        variant: 'destructive',
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: 'Password too short',
        description: 'Password must be at least 6 characters.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) throw error;
      toast({
        title: 'Account created!',
        description: 'Welcome to DataIQ. Start exploring your data intelligence platform.',
      });
      if (redirect) {
        navigate(`${redirect}${token ? `?token=${token}` : ''}`);
      } else {
        navigate('/dashboard');
      }
    } catch (error: any) {
      toast({
        title: 'Sign up failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const benefits = [
    { icon: Brain, title: "AI-Powered Analysis", description: "Google Gemini AI analyzes your data instantly" },
    { icon: Database, title: "Multi-Source Integration", description: "Connect 10+ data sources seamlessly" },
    { icon: LineChart, title: "Real-Time Insights", description: "Interactive dashboards and visualizations" },
    { icon: Users, title: "Team Collaboration", description: "Real-time chat and task management" },
  ];

  const passwordStrength = () => {
    if (!password) return { strength: 0, label: '', color: '' };
    if (password.length < 6) return { strength: 25, label: 'Weak', color: 'bg-red-500' };
    if (password.length < 8) return { strength: 50, label: 'Fair', color: 'bg-yellow-500' };
    if (password.length < 12 && /[A-Z]/.test(password) && /[0-9]/.test(password))
      return { strength: 75, label: 'Good', color: 'bg-blue-500' };
    if (password.length >= 12 && /[A-Z]/.test(password) && /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password))
      return { strength: 100, label: 'Strong', color: 'bg-green-500' };
    return { strength: 50, label: 'Fair', color: 'bg-yellow-500' };
  };

  const pwStrength = passwordStrength();

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Sign Up Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 md:px-16 lg:px-20 xl:px-24 py-12 bg-white text-slate-900">
        {/* Mobile Logo */}
        <div className="lg:hidden mb-8">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-black bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              DataIQ
            </span>
          </Link>
        </div>

        <div className="max-w-md mx-auto w-full">
          {/* Header */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-primary/10 to-secondary/10 text-primary text-sm font-medium mb-4">
              <Rocket className="w-4 h-4" />
              <span>Start free today</span>
            </div>
            <h2 className="text-3xl font-bold mb-2">Create your account</h2>
            <p className="text-muted-foreground">
              Join analysts worldwide using DataIQ for intelligent data analysis
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email address
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                disabled={loading}
                className="h-12 px-4 text-base border-border/60 focus:border-primary transition-colors"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a strong password"
                  required
                  disabled={loading}
                  minLength={6}
                  className="h-12 px-4 pr-12 text-base border-border/60 focus:border-primary transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {/* Password strength indicator */}
              {password && (
                <div className="space-y-2 pt-1">
                  <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full ${pwStrength.color} transition-all duration-300`}
                      style={{ width: `${pwStrength.strength}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Password strength: <span className="font-medium">{pwStrength.label}</span>
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium">
                Confirm password
              </Label>
              <Input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                required
                disabled={loading}
                minLength={6}
                className="h-12 px-4 text-base border-border/60 focus:border-primary transition-colors"
              />
              {confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-red-500">Passwords do not match</p>
              )}
              {confirmPassword && password === confirmPassword && (
                <p className="text-xs text-green-500 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Passwords match
                </p>
              )}
            </div>

            {/* Terms */}
            <p className="text-sm text-muted-foreground">
              By creating an account, you agree to our{' '}
              <a href="#" className="text-primary hover:underline">Terms of Service</a>
              {' '}and{' '}
              <a href="#" className="text-primary hover:underline">Privacy Policy</a>.
            </p>

            <Button
              type="submit"
              className="w-full h-12 text-base font-semibold gap-2 rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]"
              disabled={loading || (confirmPassword && password !== confirmPassword)}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  Create account
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-muted-foreground">
                Already have an account?
              </span>
            </div>
          </div>

          {/* Sign in link */}
          <Link to="/login">
            <Button
              variant="outline"
              className="w-full h-12 text-base font-semibold gap-2 rounded-xl hover:bg-primary/5 hover:border-primary/50 transition-all"
            >
              Sign in instead
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>

          {/* Trust badges */}
          <div className="mt-8 flex items-center justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span>Free tier</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span>No credit card</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span>Cancel anytime</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Brand Showcase */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-secondary/10 via-white to-primary/10 overflow-hidden border-l border-slate-100">
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 right-10 w-72 h-72 bg-secondary/5 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 left-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-secondary/3 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        {/* Floating particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-20 w-2 h-2 bg-secondary/30 rounded-full animate-float" style={{ animationDelay: '0s', animationDuration: '6s' }} />
          <div className="absolute top-40 left-32 w-3 h-3 bg-primary/30 rounded-full animate-float" style={{ animationDelay: '1s', animationDuration: '8s' }} />
          <div className="absolute bottom-40 right-1/4 w-2 h-2 bg-secondary/20 rounded-full animate-float" style={{ animationDelay: '2s', animationDuration: '7s' }} />
          <div className="absolute top-1/3 left-1/4 w-2 h-2 bg-primary/20 rounded-full animate-float" style={{ animationDelay: '3s', animationDuration: '9s' }} />
        </div>

        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20 w-full">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 mb-12 group">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <Activity className="w-7 h-7 text-white" />
            </div>
            <span className="text-3xl font-black bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              DataIQ
            </span>
          </Link>

          {/* Main headline */}
          <div className="space-y-6 mb-12">
            <h1 className="text-4xl xl:text-5xl font-bold leading-tight">
              Transform your
              <br />
              <span className="text-muted-foreground">data analysis today</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-md leading-relaxed">
              Join the next generation of data intelligence.
              Analyze data 10x faster with AI-powered insights.
            </p>
          </div>

          {/* Benefits Grid */}
          <div className="grid grid-cols-2 gap-4">
            {benefits.map((benefit, idx) => {
              const Icon = benefit.icon;
              return (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-white/60 backdrop-blur-sm border border-slate-200/50 hover:border-primary/30 transition-all duration-300 group"
                >
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-sm mb-1">{benefit.title}</h3>
                  <p className="text-xs text-muted-foreground">{benefit.description}</p>
                </div>
              );
            })}
          </div>

          {/* Testimonial or Quote */}
          <div className="mt-12 p-6 rounded-xl bg-white/60 backdrop-blur-sm border border-slate-200/50">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground italic mb-2">
                  "DataIQ transformed how we analyze data. What used to take days now takes minutes."
                </p>
                <p className="text-xs font-medium">
                  Data Team Lead
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
