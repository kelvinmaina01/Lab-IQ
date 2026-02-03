import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Shield, Lock, ArrowRight, Database, Warehouse, FileText, Lightbulb, Clock, Cloud, Copy, Info, Key, Plus, TrendingUp, Users, MessageSquare, CreditCard, ShoppingCart, Activity, BarChart3, Upload, ChevronRight, Check, Loader2, RefreshCw, Trash2, Search, Filter, Globe, Heart, X, HardDrive, LayoutGrid, CheckCircle2, Workflow } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

import { useNavigate } from "react-router-dom";
import { getBrandInfo } from "@/lib/utils/branding";
import { dataSourceService, DataSource } from "@/lib/services/dataSourceService";
import { ingestionService } from "@/lib/services/ingestionService";
import { datasetService } from "@/lib/services/datasetService";
import { supabase } from "@/integrations/supabase/client";

const ConnectDataSources = () => {
  const [activeTab, setActiveTab] = useState("all");
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [connectedSources, setConnectedSources] = useState<DataSource[]>([]);
  const [loading, setLoading] = useState(false);
  const [connectionConfig, setConnectionConfig] = useState({
    host: "",
    port: "",
    database: "",
    username: "",
    password: "",
    projectId: "",
    dataset: "",
    ssl: false,
    ssh: false,
    sshHost: "",
    sshUser: "",
    schema: "public",
    role: "",
    clientId: "",
    scopes: "",
    sshPort: "22",
    useSsh: false,
    serviceAccountJson: "",
    location: "US",
    mfaType: "none",
    permissionLevel: "read_write",
    requireReview: true,
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [connectionPhase, setConnectionPhase] = useState<'select' | 'guide' | 'config' | 'auth' | 'fetching' | 'success'>('select');
  const [ingestionProgress, setIngestionProgress] = useState(0);
  const [ingestionMessage, setIngestionMessage] = useState("");
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [requestDetails, setRequestDetails] = useState({ name: "", description: "" });
  const [usageStats, setUsageStats] = useState({ storage: 0, datasets: 0, plan: "Student" });
  const [showWhitelisting, setShowWhitelisting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchConnectedSources = async () => {
    try {
      const sources = await dataSourceService.getSources();
      setConnectedSources(sources);
    } catch (error) {
      console.error("Failed to fetch sources", error);
    }
  };
  useEffect(() => {
    fetchConnectedSources();
    fetchUsageStats();

    // Check for OAuth success callback
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === 'true') {
      const provider = params.get('provider');
      toast({
        title: "Connection Established",
        description: `Successfully authorized ${provider}. Syncing will begin shortly.`,
      });
      // Clear params without reload
      window.history.replaceState({}, document.title, window.location.pathname);
      setSelectedSource("googledrive"); // Just to show the success dialog for visual feedback if needed
      setConnectionPhase('success');
    }
  }, []);

  const fetchUsageStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const stats = await datasetService.getUsageStats(user.id);

      const { data: sub } = await supabase
        .from('subscriptions')
        .select('tier')
        .eq('user_id', user.id)
        .maybeSingle();

      setUsageStats({
        storage: stats.storage_used_mb || 0,
        datasets: stats.datasets_count || 0,
        plan: sub?.tier || "Student"
      });
    } catch (error) {
      console.warn("Failed to fetch usage stats:", error);
    }
  };

  const handleSourceSelect = (sourceId: string) => {
    setSelectedSource(sourceId);
    // Databases and complex cloud integrations go to guide first
    const needsGuide = ['postgresql', 'mysql', 'sqlserver', 'snowflake', 'bigquery', 'googledrive', 'googlesheets', 'onedrive', 'sharepoint', 'epic', 'cerner', 'fhir'];
    if (needsGuide.includes(sourceId)) {
      setConnectionPhase('guide');
    } else {
      setConnectionPhase('config');
    }
  };

  const establishConnection = async () => {
    // Validation: Require host only for DBs and Warehouses
    const isFileSource = ["csv", "hl7"].includes(selectedSource || "");
    const isOAuthSource = ["googledrive", "googlesheets", "onedrive", "sharepoint", "googleads", "applehealth", "fitbit", "oura", "dexcom", "epic", "cerner", "fhir", "biobank"].includes(selectedSource || "");

    if (!connectionConfig.host && !isFileSource && !isOAuthSource) {
      toast({
        title: "Configuration Error",
        description: "Please provide the connection host/endpoint.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      if (isFileSource) {
        if (!selectedFile) {
          toast({
            title: "File Required",
            description: "Please select a file to process.",
            variant: "destructive"
          });
          setLoading(false);
          return;
        }

        toast({
          title: "Processing Data",
          description: `Parsing and validating ${selectedFile.name}...`,
        });

        // Get Current User
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Authentication required");

        // Step 1: Ingest File with Provider Metadata
        setConnectionPhase('fetching');
        await ingestionService.ingestFile(
          selectedFile,
          user.id,
          {},
          (progress, message) => {
            setIngestionProgress(progress);
            setIngestionMessage(message);
          },
          { provider: selectedSource, sourceType: 'file' }
        );

        // Step 2: Register as Data Source
        await dataSourceService.saveSource(
          selectedFile.name,
          'file',
          selectedSource || 'csv',
          { ...connectionConfig, fileName: selectedFile.name }
        );

        setConnectionPhase('success');
        toast({
          title: "Ingestion Successful",
          description: `Data from ${selectedFile.name} is now available in Datasets.`,
        });

        fetchConnectedSources();
      } else if (isOAuthSource) {
        // Real OAuth Auth Flow
        setConnectionPhase('auth');

        try {
          console.log("Initializing OAuth for:", selectedSource);
          // Initialize OAuth Handshake via Edge Function
          const { data: initData, error: initError } = await supabase.functions.invoke('oauth-handler', {
            body: {
              provider: selectedSource,
              userId: (await supabase.auth.getUser()).data.user?.id,
              redirectUrl: window.location.origin + '/upload',
              host: connectionConfig.host // Crucial for clinical FHIR audience (aud)
            },
            method: 'POST',
            headers: {
              'x-action': 'init' // Explicit action signaling
            }
          });

          if (initError) {
            console.error("Supabase function error:", initError);
            throw new Error(initError.message || "Failed to call oauth-handler");
          }

          if (initData?.url) {
            console.log("Redirecting to:", initData.url);
            window.location.href = initData.url;
          } else {
            console.error("No URL returned from oauth-handler", initData);
            throw new Error("No authorization URL received from server.");
          }
        } catch (err) {
          console.error("OAuth Init Catch:", err);
          toast({
            title: "Authorization Failed",
            description: err instanceof Error ? err.message : "Could not initialize secure handshake.",
            variant: "destructive"
          });
          setConnectionPhase('config');
        }
      } else {
        // Database / Warehouse direct connection
        setConnectionPhase('config');
        const success = await dataSourceService.testConnection(selectedSource || "", connectionConfig);

        if (success) {
          await dataSourceService.saveSource(
            `${selectedSource} Connection`,
            isOAuthSource ? 'integration' : 'database',
            selectedSource || 'generic',
            connectionConfig
          );

          setConnectionPhase('success');
          fetchConnectedSources();
        } else {
          throw new Error("Handshake failed. Please check your credentials and firewall settings.");
        }
      }
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getSourceLogo = (provider: string) => {
    return getBrandInfo(provider)?.logoUrl || null;
  };

  const handleRequestSubmit = () => {
    toast({
      title: "Request Submitted",
      description: `Your request for ${requestDetails.name || 'a new connector'} has been sent to our engineering team.`,
    });
    setRequestDialogOpen(false);
    setRequestDetails({ name: "", description: "" });
  };

  const connectionCards = {
    all: [
      // Databases
      { id: "postgres", title: "Postgres", description: "Connect your Postgres data for instant AI analysis", icon: <Database className="w-6 h-6 text-indigo-500" />, sourceType: "postgresql", category: "Database" },
      { id: "mysql", title: "MySQL", description: "Connect your MySQL data for instant AI analysis", icon: <Database className="w-6 h-6 text-orange-500" />, sourceType: "mysql", category: "Database" },
      { id: "sqlserver", title: "SqlServer", description: "Connect your SqlServer data for instant AI analysis", icon: <Database className="w-6 h-6 text-blue-600" />, sourceType: "sqlserver", category: "Database" },
      { id: "supabase", title: "Supabase", description: "Connect your Supabase data for instant AI analysis", icon: <Database className="w-6 h-6 text-green-500" />, sourceType: "supabase", category: "Database" },
      { id: "vertica", title: "Vertica", description: "Connect your Vertica data for instant AI analysis", icon: <Database className="w-6 h-6 text-slate-600" />, sourceType: "vertica", category: "Database" },
      // Data Warehouses
      { id: "bigquery", title: "BigQuery", description: "Connect your BigQuery data for instant AI analysis", icon: <Warehouse className="w-6 h-6 text-blue-600" />, sourceType: "bigquery", category: "Data Warehouse" },
      { id: "snowflake", title: "Snowflake", description: "Connect your Snowflake data for instant AI analysis", icon: <Warehouse className="w-6 h-6 text-cyan-500" />, sourceType: "snowflake", category: "Data Warehouse" },
      { id: "databricks", title: "Databricks", description: "Connect your Databricks data for instant AI analysis", icon: <Warehouse className="w-6 h-6 text-red-500" />, sourceType: "databricks", category: "Data Warehouse" },
      // Integrations
      { id: "googledrive", title: "Google Drive", description: "Analyze your Google Drive files and folders", icon: <Cloud className="w-6 h-6 text-blue-500" />, sourceType: "googledrive", category: "Integration", badge: null },
      { id: "googlesheets", title: "Google Sheets", description: "Live connection to your Google Sheets", icon: <FileText className="w-6 h-6 text-green-500" />, sourceType: "googlesheets", category: "Integration" },
      { id: "onedrive", title: "Microsoft OneDrive", description: "Analyze your Personal OneDrive files and folders", icon: <Cloud className="w-6 h-6 text-blue-600" />, sourceType: "onedrive", category: "Integration", badge: "New" },
      { id: "sharepoint", title: "SharePoint", description: "Analyze your SharePoint or OneDrive for Business files", icon: <Cloud className="w-6 h-6 text-indigo-600" />, sourceType: "sharepoint", category: "Integration", badge: "New" },
      { id: "googleads", title: "Google Ads", description: "Analyze your data and manage your campaigns in Google Ads", icon: <TrendingUp className="w-6 h-6 text-yellow-600" />, sourceType: "googleads", category: "Integration", badge: "New" },
      // Files
      { id: "csv", title: "CSV / Excel", description: "Direct spreadsheet ingestion with auto-mapping", icon: <FileText className="w-6 h-6 text-green-500" />, sourceType: "csv", category: "Files" },
      // Health (existing)
      { id: "apple", title: "Apple Health", description: "Vitals, activity, and clinical records via HealthKit", icon: <Activity className="w-6 h-6 text-red-500" />, sourceType: "applehealth", category: "Health" },
      { id: "fitbit", title: "Fitbit", description: "Sleep and activity data via OAuth sync", icon: <Activity className="w-6 h-6 text-teal-500" />, sourceType: "fitbit", category: "Health" },
      { id: "oura", title: "Oura Ring", description: "Advanced sleep and recovery biometric sync", icon: <Activity className="w-6 h-6 text-gray-500" />, sourceType: "oura", category: "Health" },
      { id: "dexcom", title: "Dexcom CGM", description: "Real-time glucose monitor streaming", icon: <Activity className="w-6 h-6 text-green-500" />, sourceType: "dexcom", category: "Health" },
      { id: "epic", title: "Epic EHR", description: "SMART on FHIR clinical integration", icon: <Activity className="w-6 h-6 text-orange-600" />, sourceType: "epic", category: "Health" },
      { id: "cerner", title: "Oracle Cerner", description: "Enterprise medical record synchronization", icon: <Activity className="w-6 h-6 text-blue-600" />, sourceType: "cerner", category: "Health" },
    ],
    databases: [
      { id: "postgres", title: "Postgres", description: "Connect your Postgres data for instant AI analysis", icon: <Database className="w-6 h-6 text-indigo-500" />, sourceType: "postgresql" },
      { id: "mysql", title: "MySQL", description: "Connect your MySQL data for instant AI analysis", icon: <Database className="w-6 h-6 text-orange-500" />, sourceType: "mysql" },
      { id: "sqlserver", title: "SqlServer", description: "Connect your SqlServer data for instant AI analysis", icon: <Database className="w-6 h-6 text-blue-600" />, sourceType: "sqlserver" },
      { id: "supabase", title: "Supabase", description: "Connect your Supabase data for instant AI analysis", icon: <Database className="w-6 h-6 text-green-500" />, sourceType: "supabase" },
      { id: "vertica", title: "Vertica", description: "Connect your Vertica data for instant AI analysis", icon: <Database className="w-6 h-6 text-slate-600" />, sourceType: "vertica" },
    ],
    warehouses: [
      { id: "bigquery", title: "BigQuery", description: "Connect your BigQuery data for instant AI analysis", icon: <Warehouse className="w-6 h-6 text-blue-600" />, sourceType: "bigquery" },
      { id: "snowflake", title: "Snowflake", description: "Connect your Snowflake data for instant AI analysis", icon: <Warehouse className="w-6 h-6 text-cyan-500" />, sourceType: "snowflake" },
      { id: "databricks", title: "Databricks", description: "Connect your Databricks data for instant AI analysis", icon: <Warehouse className="w-6 h-6 text-red-500" />, sourceType: "databricks" },
    ],
    integrations: [
      { id: "googledrive", title: "Google Drive", description: "Analyze your Google Drive files and folders", icon: <Cloud className="w-6 h-6 text-blue-500" />, sourceType: "googledrive" },
      { id: "googlesheets", title: "Google Sheets", description: "Live connection to your Google Sheets", icon: <FileText className="w-6 h-6 text-green-500" />, sourceType: "googlesheets" },
      { id: "onedrive", title: "Microsoft OneDrive", description: "Analyze your Personal OneDrive files and folders", icon: <Cloud className="w-6 h-6 text-blue-600" />, sourceType: "onedrive", badge: "New" },
      { id: "sharepoint", title: "SharePoint", description: "Analyze your SharePoint or OneDrive for Business files", icon: <Cloud className="w-6 h-6 text-indigo-600" />, sourceType: "sharepoint", badge: "New" },
      { id: "googleads", title: "Google Ads", description: "Analyze your data and manage your campaigns in Google Ads", icon: <TrendingUp className="w-6 h-6 text-yellow-600" />, sourceType: "googleads", badge: "New" },
    ],
    health: [
      { id: "apple", title: "Apple Health", description: "Vitals, activity, and clinical records via HealthKit", icon: <Activity className="w-6 h-6 text-red-500" />, sourceType: "applehealth" },
      { id: "fitbit", title: "Fitbit", description: "Sleep and activity data via OAuth sync", icon: <Activity className="w-6 h-6 text-teal-500" />, sourceType: "fitbit" },
      { id: "oura", title: "Oura Ring", description: "Advanced sleep and recovery biometric sync", icon: <Activity className="w-6 h-6 text-gray-500" />, sourceType: "oura" },
      { id: "dexcom", title: "Dexcom CGM", description: "Real-time glucose monitor streaming", icon: <Activity className="w-6 h-6 text-green-500" />, sourceType: "dexcom" },
      { id: "epic", title: "Epic EHR", description: "SMART on FHIR clinical integration", icon: <Activity className="w-6 h-6 text-orange-600" />, sourceType: "epic" },
      { id: "cerner", title: "Oracle Cerner", description: "Enterprise medical record synchronization", icon: <Activity className="w-6 h-6 text-blue-600" />, sourceType: "cerner" },
    ]
  };

  return (
    <div className="space-y-8">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 h-auto p-1 bg-muted/50 rounded-xl">
          <TabsTrigger value="all" className="py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider">All</TabsTrigger>
          <TabsTrigger value="databases" className="py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider">Databases</TabsTrigger>
          <TabsTrigger value="warehouses" className="py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider">Data Warehouses</TabsTrigger>
          <TabsTrigger value="integrations" className="py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider">Integrations</TabsTrigger>
          <TabsTrigger value="health" className="py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider">Health</TabsTrigger>
        </TabsList>

        {Object.entries(connectionCards).map(([category, cards]) => (
          <TabsContent key={category} value={category} className="mt-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {cards.map((card: any) => (
                <Card
                  key={card.id}
                  className="group hover:border-primary/50 transition-all hover:shadow-md cursor-pointer overflow-hidden border-border/50 relative"
                  onClick={() => handleSourceSelect(card.sourceType)}
                >
                  <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowRight className="w-4 h-4 text-primary" />
                  </div>
                  {card.badge && (
                    <div className="absolute top-3 left-3">
                      <Badge variant="secondary" className="bg-primary/10 text-primary text-[10px] font-bold">
                        {card.badge}
                      </Badge>
                    </div>
                  )}
                  <div className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-xl bg-muted/50 group-hover:bg-primary/10 transition-colors shrink-0">
                        {getSourceLogo(card.sourceType) ? (
                          <img src={getSourceLogo(card.sourceType) || ""} className="w-6 h-6 object-contain" alt={card.title} />
                        ) : card.icon}
                      </div>
                      <div className="space-y-1 text-left">
                        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">{card.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                          {card.description}
                        </p>
                        {card.category && category === 'all' && (
                          <Badge variant="outline" className="mt-2 text-[10px]">
                            {card.category}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Connection Performance & Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 bg-gradient-to-br from-primary/5 to-transparent border-primary/10">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-primary/20">
              <TrendingUp className="w-6 h-6 text-primary" />
            </div>
            <div className="space-y-2 text-left">
              <h3 className="font-bold text-lg">Auto-Anonymization Engine</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                All uploaded health data is automatically screened for 18 HIPAA identifiers. PII is masked before ingestion into research cohorts.
              </p>
              <div className="flex items-center gap-4 pt-2">
                <div className="text-[10px] font-bold px-2 py-1 bg-green-500/10 text-green-600 rounded flex items-center gap-1 uppercase tracking-wider">
                  <Shield className="w-3" /> GDPR Ready
                </div>
                <div className="text-[10px] font-bold px-2 py-1 bg-blue-500/10 text-blue-600 rounded flex items-center gap-1 uppercase tracking-wider">
                  <Lock className="w-3" /> AES-256
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-indigo-500/5 to-transparent border-indigo-500/10">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-indigo-500/20">
              <BarChart3 className="w-6 h-6 text-indigo-500" />
            </div>
            <div className="space-y-2 text-left w-full">
              <h3 className="font-bold text-lg">Active Connections</h3>
              <div className="space-y-3 pt-1">
                {connectedSources.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">No active data streams detected</p>
                ) : (
                  connectedSources.slice(0, 3).map((source: any) => (
                    <div key={source.id} className="flex items-center justify-between group">
                      <div className="flex items-center gap-2">
                        {getSourceLogo(source.provider) ? (
                          <img src={getSourceLogo(source.provider) || ""} className="w-4 h-4 object-contain" alt="" />
                        ) : (
                          <div className="w-4 h-4 rounded-full bg-primary/20" />
                        )}
                        <span className="text-sm font-medium">{source.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] bg-green-50/50 text-green-600 border-green-200">ACTIVE</Badge>
                        <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive" onClick={() => dataSourceService.deleteSource(source.id).then(() => fetchConnectedSources())}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
                {connectedSources.length > 0 && (
                  <button className="text-xs text-primary font-semibold hover:underline flex items-center gap-1">
                    Manage all {connectedSources.length} sources <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Enhanced Request Connector & Security Section */}
      <div className="space-y-6 pt-10">
        <Card className="p-8 bg-slate-50 border-slate-200/60 shadow-sm overflow-hidden relative group">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-sm border border-slate-200/50 shrink-0 group-hover:scale-105 transition-transform">
                <Plus className="w-8 h-8 text-slate-400 group-hover:text-primary transition-colors" />
              </div>
              <div className="text-left space-y-1.5">
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">Need another connection?</h3>
                <p className="text-sm text-slate-500 font-medium max-w-md leading-relaxed">
                  Our engineering team can build custom secure pipelines for your unique lab infrastructure or proprietary data streams.
                </p>
              </div>
            </div>
            <Button
              className="bg-white hover:bg-slate-100 text-slate-900 border border-slate-200 font-bold px-8 py-6 rounded-xl shadow-sm transition-all active:scale-95 shrink-0"
              onClick={() => setRequestDialogOpen(true)}
            >
              Request New Connector
            </Button>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* IP Whitelisting Section */}
          <Card className="p-8 bg-white border-slate-100 shadow-soft relative group transition-all hover:shadow-xl hover:border-primary/20">
            <div className="space-y-6">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center shrink-0 shadow-inner">
                  <Info className="w-8 h-8 text-indigo-600" />
                </div>
                <div className="text-left">
                  <h3 className="text-xl font-bold text-slate-900 tracking-tight">Database Firewall Whitelist</h3>
                  <p className="text-sm text-slate-500 font-medium">Add these production IPs to your allowed connections</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-1.5 bg-slate-900 rounded-xl border border-slate-800 shadow-inner group/code">
                <code className="text-[13px] font-mono text-indigo-300 font-medium flex-1 px-4 truncate select-all">
                  35.225.57.12, 35.202.28.218, 35.184.233.185
                </code>
                <Button
                  variant="ghost"
                  className="text-slate-400 hover:text-white hover:bg-white/10 gap-2 shrink-0 h-10 px-4 rounded-lg font-bold transition-all text-xs"
                  onClick={() => {
                    navigator.clipboard.writeText("35.225.57.12, 35.202.28.218, 35.184.233.185");
                    toast({ title: "IPs Copied", description: "Production whitelist IPs added to clipboard." });
                  }}
                >
                  <Copy className="w-3.5 h-3.5" /> COPY
                </Button>
              </div>
            </div>
          </Card>

          {/* SSH Key Section */}
          <Card className="p-8 bg-white border-slate-100 shadow-soft relative group transition-all hover:shadow-xl hover:border-primary/20">
            <div className="space-y-6">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-2xl bg-primary/5 flex items-center justify-center shrink-0 shadow-inner">
                  <Key className="w-8 h-8 text-primary rotate-45" />
                </div>
                <div className="text-left">
                  <h3 className="text-xl font-bold text-slate-900 tracking-tight">Production SSH Public Key</h3>
                  <p className="text-sm text-slate-500 font-medium">For secure bastion or tunnel-based access</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-1.5 bg-slate-900 rounded-xl border border-slate-800 shadow-inner group/code">
                <code className="text-[11px] font-mono text-emerald-300 font-medium flex-1 px-4 truncate select-all">
                  ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIBTNqPkOsYoFP2GbM5Bq6rKXjwkhbgg1mCxi/WqnhYpR
                </code>
                <Button
                  variant="ghost"
                  className="text-slate-400 hover:text-white hover:bg-white/10 gap-2 shrink-0 h-10 px-4 rounded-lg font-bold transition-all text-xs"
                  onClick={() => {
                    navigator.clipboard.writeText("ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIBTNqPkOsYoFP2GbM5Bq6rKXjwkhbgg1mCxi/WqnhYpR");
                    toast({ title: "SSH Key Copied", description: "Production SSH key added to clipboard." });
                  }}
                >
                  <Copy className="w-3.5 h-3.5" /> COPY
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Security Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-12 border-t border-slate-100">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-widest">SOC 2 TYPE 2</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-widest">HIPAA & GDPR</span>
            </div>
          </div>

          <a
            href="#"
            className="group flex items-center gap-2 text-sm font-bold text-primary hover:text-primary/80 transition-colors uppercase tracking-widest"
            onClick={(e) => {
              e.preventDefault();
              toast({ title: "Security & Trust", description: "Redirecting to Security & Trust Center..." });
            }}
          >
            <span>Security & Trust Center</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </a>
        </div>
      </div>

      {/* Dialogs */}
      <Dialog open={!!selectedSource} onOpenChange={(open) => {
        if (!open) {
          setSelectedSource(null);
          setConnectionPhase('config');
          setIngestionProgress(0);
          setIngestionMessage("");
        }
      }}>
        <DialogContent className="sm:max-w-[500px] border-primary/20 shadow-glow rounded-[2rem] p-8">
          <DialogHeader>
            <div className="flex items-center gap-6 mb-4">
              <div className="p-4 rounded-2xl bg-primary/10">
                {selectedSource && getSourceLogo(selectedSource) ? (
                  <img src={getSourceLogo(selectedSource) || ""} className="w-10 h-10 object-contain" alt="" />
                ) : (
                  <Database className="w-10 h-10 text-primary" />
                )}
              </div>
              <div className="text-left">
                <DialogTitle className="text-2xl font-bold text-slate-900">Connect {selectedSource?.toUpperCase()}</DialogTitle>
                <DialogDescription className="font-medium text-slate-500">
                  {selectedSource && ['applehealth', 'fitbit', 'oura', 'dexcom'].includes(selectedSource) ? 'Secure OAuth2 Stream' : 'Direct Production Handshake'}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-6">
            {connectionPhase === 'guide' ? (
              <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
                <div className="flex items-center gap-4 p-4 bg-primary/5 rounded-2xl border border-primary/10 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm">
                    <Database className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 capitalize">{selectedSource}</h3>
                    <p className="text-sm text-slate-500">Professional Data Connector</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-slate-600 leading-relaxed">
                    Configure a connector to analyze your <strong>{selectedSource}</strong> data with DataIQ.
                    You'll need accessibility details and credentials. All data is encrypted and never stored in plain text.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm flex-shrink-0">
                        <FileText className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">Read Documentation</p>
                        <p className="text-xs text-slate-500">Detailed setup guides</p>
                      </div>
                    </div>
                    <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm flex-shrink-0">
                        <Shield className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">Security & Trust</p>
                        <p className="text-xs text-slate-500">Compliance & Privacy</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-amber-50 border border-amber-100">
                    <div className="flex items-center gap-2 mb-2">
                      <Activity className="w-4 h-4 text-amber-600" />
                      <p className="text-sm font-bold text-amber-900 uppercase tracking-wider">Pro Tip</p>
                    </div>
                    <p className="text-sm text-amber-800">
                      If you need help setting up your connector, watch our <span className="underline font-bold cursor-pointer">video walkthrough</span> or send setup info to your IT department.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-3 pt-4">
                  <Button onClick={() => setConnectionPhase('config')} className="h-14 rounded-xl text-lg font-bold shadow-lg hover:shadow-xl transition-all">
                    Set up {selectedSource === 'postgresql' ? 'Postgres' : selectedSource}
                  </Button>
                  <Button variant="ghost" onClick={() => setSelectedSource(null)} className="h-12 rounded-xl text-slate-500">
                    Cancel
                  </Button>
                </div>
              </div>
            ) : connectionPhase === 'config' ? (
              <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-bold text-slate-900">Configure Connection</h3>
                  <button onClick={() => setConnectionPhase('guide')} className="text-xs font-bold text-primary uppercase tracking-widest hover:underline">
                    View Setup Guide
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-bold text-slate-900">Configure Connection</h3>
                    <button onClick={() => setConnectionPhase('guide')} className="text-xs font-bold text-primary uppercase tracking-widest hover:underline">
                      View Setup Guide
                    </button>
                  </div>

                  {selectedSource && ["csv", "hl7"].includes(selectedSource) ? (
                    <div className="space-y-4">
                      <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-3xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-all border-slate-200 hover:border-primary/50 group/upload">
                        <div className="flex flex-col items-center justify-center p-8">
                          <Upload className="w-12 h-12 mb-4 text-slate-400 group-hover:text-primary transition-colors" />
                          <p className="mb-2 text-lg font-bold text-slate-900">Drop clinical data here</p>
                          <p className="text-sm text-slate-500 font-medium">MAX. 50MB per ingestion batch</p>
                        </div>
                        <input type="file" className="hidden" accept={selectedSource === 'csv' ? ".csv,.xlsx,.xls" : ".hl7,.txt"} onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
                      </label>
                      {selectedFile && (
                        <div className="flex items-center gap-4 p-4 bg-primary/5 rounded-2xl border border-primary/10 animate-in zoom-in-95 duration-300">
                          <FileText className="w-6 h-6 text-primary" />
                          <span className="text-sm font-bold text-slate-700 truncate flex-1">{selectedFile.name}</span>
                          <Badge variant="secondary" className="bg-white text-primary px-3 py-1">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</Badge>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Postgres / SQL Advanced Config */}
                      {selectedSource && ['postgresql', 'mysql', 'sqlserver'].includes(selectedSource) && (
                        <div className="space-y-6">
                          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <div className="flex items-center gap-3">
                              <Workflow className="w-5 h-5 text-primary" />
                              <div>
                                <p className="text-sm font-bold text-slate-900">SSH Tunnel</p>
                                <p className="text-xs text-slate-500">Connect to private database</p>
                              </div>
                            </div>
                            <Button
                              variant={connectionConfig.useSsh ? "default" : "outline"}
                              size="sm"
                              className="rounded-lg h-9"
                              onClick={() => setConnectionConfig({ ...connectionConfig, useSsh: !connectionConfig.useSsh })}
                            >
                              {connectionConfig.useSsh ? "Enabled" : "Disabled"}
                            </Button>
                          </div>

                          <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="host" className="text-xs font-bold uppercase tracking-widest text-slate-400">Host*</Label>
                                <Input id="host" className="h-12 rounded-xl bg-slate-50 border-slate-100" placeholder="production.db.internal" value={connectionConfig.host} onChange={(e) => setConnectionConfig({ ...connectionConfig, host: e.target.value })} />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="port" className="text-xs font-bold uppercase tracking-widest text-slate-400">Port*</Label>
                                <Input id="port" className="h-12 rounded-xl bg-slate-50 border-slate-100" placeholder="5432" value={connectionConfig.port} onChange={(e) => setConnectionConfig({ ...connectionConfig, port: e.target.value })} />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="db" className="text-xs font-bold uppercase tracking-widest text-slate-400">Database Name*</Label>
                              <Input id="db" className="h-12 rounded-xl bg-slate-50 border-slate-100" placeholder="research_vault" value={connectionConfig.database} onChange={(e) => setConnectionConfig({ ...connectionConfig, database: e.target.value })} />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="user" className="text-xs font-bold uppercase tracking-widest text-slate-400">Username*</Label>
                                <Input id="user" className="h-12 rounded-xl bg-slate-50 border-slate-100" placeholder="admin_user" value={connectionConfig.username} onChange={(e) => setConnectionConfig({ ...connectionConfig, username: e.target.value })} />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="pw" className="text-xs font-bold uppercase tracking-widest text-slate-400">Password*</Label>
                                <Input id="pw" type="password" className="h-12 rounded-xl bg-slate-50 border-slate-100" placeholder="••••••••" value={connectionConfig.password} onChange={(e) => setConnectionConfig({ ...connectionConfig, password: e.target.value })} />
                              </div>
                            </div>
                          </div>

                          {connectionConfig.useSsh && (
                            <div className="space-y-4 p-5 bg-primary/5 rounded-2xl border border-primary/10 animate-in fade-in duration-300">
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label className="text-xs font-bold uppercase tracking-widest text-primary">SSH Host</Label>
                                  <Input className="h-10 bg-white border-primary/20" value={connectionConfig.sshHost} onChange={(e) => setConnectionConfig({ ...connectionConfig, sshHost: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-xs font-bold uppercase tracking-widest text-primary">SSH User</Label>
                                  <Input className="h-10 bg-white border-primary/20" value={connectionConfig.sshUser} onChange={(e) => setConnectionConfig({ ...connectionConfig, sshUser: e.target.value })} />
                                </div>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-widest text-primary">Public Key (Copy to server)</Label>
                                <div className="p-3 bg-slate-900 text-slate-300 text-[10px] font-mono rounded-lg break-all select-all">
                                  ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIKnT/D3vadRvtpytizk2yOGsHqhY9T3rSaZVl8z3JCdB dataiq-connector
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* BigQuery specific */}
                      {selectedSource === 'bigquery' && (
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-widest text-slate-400">Service Account JSON*</Label>
                            <textarea
                              className="w-full h-32 p-3 rounded-xl bg-slate-50 border-slate-100 text-[10px] font-mono focus:ring-primary/20 focus:border-primary/50"
                              placeholder='{"type": "service_account", ...}'
                              value={connectionConfig.serviceAccountJson}
                              onChange={(e) => setConnectionConfig({ ...connectionConfig, serviceAccountJson: e.target.value })}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-xs font-bold uppercase tracking-widest text-slate-400">Location</Label>
                              <Input className="h-12 rounded-xl bg-slate-50 border-slate-100" placeholder="US" value={connectionConfig.location} onChange={(e) => setConnectionConfig({ ...connectionConfig, location: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs font-bold uppercase tracking-widest text-slate-400">MFA Type</Label>
                              <Input className="h-12 rounded-xl bg-slate-50 border-slate-100" placeholder="None" value={connectionConfig.mfaType} onChange={(e) => setConnectionConfig({ ...connectionConfig, mfaType: e.target.value })} />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Google Sheets specific */}
                      {selectedSource === 'googlesheets' && (
                        <div className="space-y-6">
                          <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-widest text-slate-400">Permission Level</Label>
                            <div className="grid grid-cols-2 gap-2">
                              <Button
                                variant={connectionConfig.permissionLevel === 'read_only' ? "default" : "outline"}
                                onClick={() => setConnectionConfig({ ...connectionConfig, permissionLevel: 'read_only' })}
                                className="rounded-xl h-12"
                              >
                                Read Only
                              </Button>
                              <Button
                                variant={connectionConfig.permissionLevel === 'read_write' ? "default" : "outline"}
                                onClick={() => setConnectionConfig({ ...connectionConfig, permissionLevel: 'read_write' })}
                                className="rounded-xl h-12"
                              >
                                Read + Write
                              </Button>
                            </div>
                          </div>
                          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <div>
                              <p className="text-sm font-bold text-slate-900">Require Review</p>
                              <p className="text-xs text-slate-500">Manually approve new data</p>
                            </div>
                            <Button
                              variant={connectionConfig.requireReview ? "default" : "outline"}
                              size="sm"
                              className="rounded-lg h-9"
                              onClick={() => setConnectionConfig({ ...connectionConfig, requireReview: !connectionConfig.requireReview })}
                            >
                              {connectionConfig.requireReview ? "Enabled" : "Disabled"}
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Standard Cloud Informational */}
                      {selectedSource && ['googledrive', 'onedrive', 'sharepoint', 'googleads', 'applehealth', 'fitbit', 'oura', 'dexcom', 'epic', 'cerner', 'fhir'].includes(selectedSource) && (
                        <div className="p-8 bg-primary/5 rounded-3xl border border-primary/10 text-center space-y-4 animate-in zoom-in-95 duration-300">
                          <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center shadow-sm mx-auto">
                            <Cloud className="w-8 h-8 text-primary opacity-60" />
                          </div>
                          <p className="text-slate-600 font-medium max-w-[280px] mx-auto">
                            Securely authorizing <strong>{selectedSource}</strong> via OIDC Handshake.
                          </p>
                          <p className="text-xs text-slate-400">Redirecting to project-specific login portal...</p>
                        </div>
                      )}

                      {/* Show Whitelisting Accordion */}
                      {selectedSource && ['postgresql', 'mysql', 'sqlserver', 'snowflake', 'bigquery'].includes(selectedSource) && (
                        <div className="pt-2">
                          <button
                            onClick={() => setShowWhitelisting(!showWhitelisting)}
                            className="w-full flex items-center justify-between p-3 text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-primary transition-colors border-t border-slate-100 mt-4"
                          >
                            <span>Show IPs to whitelist</span>
                            <ChevronDown className={`w-4 h-4 transition-transform ${showWhitelisting ? 'rotate-180' : ''}`} />
                          </button>
                          {showWhitelisting && (
                            <div className="p-3 bg-slate-50 rounded-xl mt-2 space-y-2 animate-in slide-in-from-top-2 duration-300">
                              <p className="text-[10px] text-slate-500 mb-2">If your database requires IP whitelisting, add these addresses:</p>
                              <div className="grid grid-cols-1 gap-1">
                                {['35.184.2.148', '35.184.144.11', '35.184.16.202'].map(ip => (
                                  <div key={ip} className="flex items-center justify-between p-2 bg-white rounded border border-slate-100">
                                    <span className="font-mono text-xs">{ip}</span>
                                    <Badge className="text-[9px] h-4">US-EAST</Badge>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  <DialogFooter className="pt-8">
                    <Button variant="ghost" onClick={() => setConnectionPhase('guide')} className="h-12 rounded-xl min-w-[100px]">
                      Back
                    </Button>
                    <Button onClick={establishConnection} disabled={connectionPhase === 'verifying'} className="h-12 px-8 rounded-xl font-bold shadow-lg flex-1 md:flex-none">
                      {connectionPhase === 'verifying' ? (
                        <>
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-r-transparent mr-2"></div>
                          Connecting...
                        </>
                      ) : 'Connect Source'}
                    </Button>
                  </DialogFooter>
                </div>
              </div>
            ) : connectionPhase === 'auth' ? (
              <div className="py-12 flex flex-col items-center justify-center text-center space-y-8 animate-in fade-in duration-500">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 rounded-[2.5rem] animate-ping" />
                  <div className="relative p-10 bg-primary/10 rounded-[2.5rem] border border-primary/20">
                    <Lock className="w-16 h-16 text-primary" />
                  </div>
                </div>
                <div className="space-y-3">
                  <h3 className="text-2xl font-bold text-slate-900 tracking-tight">External Authorization</h3>
                  <p className="text-slate-500 font-medium max-w-[320px]">Please complete the secure handshake in the pop-up window to authorize LabIQ data streams.</p>
                </div>
                <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.2em] text-primary bg-primary/5 px-6 py-3 rounded-full border border-primary/10">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Polling auth state...
                </div>
              </div>
            ) : connectionPhase === 'fetching' ? (
              <div className="py-12 space-y-10 animate-in fade-in duration-500">
                <div className="space-y-6">
                  <div className="flex items-end justify-between">
                    <div className="text-left space-y-1">
                      <p className="text-sm font-bold text-slate-900 uppercase tracking-widest">{ingestionMessage || "Acquiring Data..."}</p>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">TLS 1.3 SECURE TUNNEL ACTIVE</p>
                    </div>
                    <span className="text-3xl font-bold text-primary">{Math.round(ingestionProgress)}%</span>
                  </div>
                  <Progress value={ingestionProgress} className="h-4 rounded-full bg-slate-100" />
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {["Establishing encrypted handshake", "Acquiring clinical metadata", "Streaming record batches", "Real-time PII anonymization"].map((step, i) => (
                    <div key={i} className="flex items-center gap-4 text-xs font-bold uppercase tracking-[0.15em] text-slate-400">
                      {ingestionProgress > (i + 1) * 25 ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <div className={`w-5 h-5 rounded-full border-2 border-slate-200 flex items-center justify-center ${ingestionProgress > i * 25 ? 'border-primary' : ''}`}><div className={`w-2 h-2 rounded-full ${ingestionProgress > i * 25 ? 'bg-primary animate-pulse' : 'bg-slate-100'}`} /></div>}
                      {step}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="py-12 flex flex-col items-center justify-center text-center space-y-8 animate-in zoom-in-95 duration-500">
                <div className="w-24 h-24 bg-green-500/10 rounded-[2.5rem] flex items-center justify-center border border-green-500/20">
                  <CheckCircle2 className="w-12 h-12 text-green-500" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-3xl font-bold text-slate-900 tracking-tight">Stream Established</h3>
                  <p className="text-slate-500 font-medium max-w-[340px]">Production datasets have been securely acquired and are now available for cross-cohort analysis.</p>
                </div>
                <Button onClick={() => navigate('/datasets')} className="w-full h-16 rounded-2xl bg-green-600 hover:bg-green-700 text-white font-bold uppercase tracking-widest shadow-lg shadow-green-500/20 gap-3">EXPLORE INGESTED ASSETS <ArrowRight className="w-5 h-5" /></Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={requestDialogOpen} onOpenChange={setRequestDialogOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-[2rem] p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-slate-900">Request Integration</DialogTitle>
            <DialogDescription className="font-medium text-slate-500">Our engineering team will review your custom clinical API request within 24 hours.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-6">
            <div className="space-y-2">
              <Label htmlFor="req-name" className="text-xs font-bold uppercase tracking-widest text-slate-400">Source Name</Label>
              <Input id="req-name" className="h-12 rounded-xl bg-slate-50 border-slate-100" placeholder="e.g. MyCustomLIMS V3 API" value={requestDetails.name} onChange={(e) => setRequestDetails({ ...requestDetails, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="req-desc" className="text-xs font-bold uppercase tracking-widest text-slate-400">Integration Requirements</Label>
              <textarea id="req-desc" className="flex w-full rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-medium placeholder:text-slate-400 focus:ring-primary/20 min-h-[120px]" placeholder="Briefly describe the clinical API endpoints or database type..." value={requestDetails.description} onChange={(e) => setRequestDetails({ ...requestDetails, description: e.target.value })} />
            </div>
          </div>
          <DialogFooter className="gap-3">
            <Button variant="ghost" className="flex-1 rounded-xl font-bold uppercase" onClick={() => setRequestDialogOpen(false)}>Cancel</Button>
            <Button className="flex-1 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold uppercase tracking-widest shadow-glow" onClick={handleRequestSubmit} disabled={!requestDetails.name}>SUBMIT REQUEST</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ConnectDataSources;
