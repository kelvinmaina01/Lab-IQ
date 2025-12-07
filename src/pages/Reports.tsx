import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Plus, FileText, Download, Eye, MoreVertical, Calendar,
  User, Search, History, RotateCcw, Clock, Brain,
  BarChart3, FileCheck, ShieldCheck, Mail
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSubscription } from "@/hooks/useSubscription";
import { UpgradeDialog } from "@/components/UpgradeDialog";
import { useActivityTracker } from "@/hooks/useActivityTracker";
import { ReportBuilder } from "@/components/reports/ReportBuilder";
import { reportService } from "@/lib/services/reportService";
import { TemplatesGallery, Template } from "@/components/reports/TemplatesGallery";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Reports = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [loading, setLoading] = useState(true);
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [versionHistoryOpen, setVersionHistoryOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [builderConfig, setBuilderConfig] = useState<any>(null);
  const { toast } = useToast();
  const { subscription } = useSubscription();
  const { trackActivity } = useActivityTracker();

  // Real data state
  const [reports, setReports] = useState<any[]>([]);

  useEffect(() => {
    const loadReports = async () => {
      const data = await reportService.getReports();
      setReports(data);
      setLoading(false);
    };
    loadReports();

    const unsubscribe = reportService.subscribeDocs(() => {
      loadReports();
    });

    return () => unsubscribe();
  }, []);

  const handleReportCreated = async (config: any) => {
    try {
      if (activeTab === 'templates') setActiveTab('all');
      await reportService.createReport(config);
      trackActivity("Report generated", `Created ${config.title}`, "FileText");
      toast({
        title: "Report Generation Started",
        description: `${config.title} is being generated in the background.`,
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to create report.",
        variant: "destructive"
      });
    }
  };


  const handleUseTemplate = (template: Template) => {
    setBuilderConfig(template.config);
    setIsBuilderOpen(true);
  };

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (report.description && report.description.toLowerCase().includes(searchQuery.toLowerCase()));
    // If prompt is in templates tab but reports are in 'all', don't hide them when switching
    // The confusion often comes from 'activeTab' being 'templates' but the list is hidden.
    // So if activeTab is templates, we don't show the main list anyway (we show gallery).
    // But for 'all', 'executive' etc we filter.
    const matchesTab = activeTab === "all" || activeTab === "templates" ? true : report.type.toLowerCase() === activeTab;
    return matchesSearch && matchesTab;
  });

  return (
    <AuthGuard>
      <MainLayout>
        <main className="p-4 md:p-8 space-y-8">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Enterprise Reports</h1>
              <p className="text-muted-foreground mt-1">
                Manage, generate, and audit compliant documentation for your lab.
              </p>
            </div>
            <Button onClick={() => { setBuilderConfig(null); setIsBuilderOpen(true); }} className="gap-2 shadow-lg hover:shadow-xl transition-all">
              <Plus className="w-4 h-4" />
              New Report
            </Button>
          </div>

          {/* Analytics Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Reports (YTD)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reports.length + 124}</div>
                <div className="flex items-center text-xs text-green-500 mt-1">
                  <BarChart3 className="w-3 h-3 mr-1" />
                  +12% from last month
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Compliance Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">98.5%</div>
                <div className="flex items-center text-xs text-green-500 mt-1">
                  <ShieldCheck className="w-3 h-3 mr-1" />
                  Audit ready
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Scheduled Jobs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">8</div>
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                  <Clock className="w-3 h-3 mr-1" />
                  Next run in 2h
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Storage Used</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">4.2 GB</div>
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                  of 10 GB limit
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by title, compliance standard, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
          </div>

          <Tabs defaultValue="all" className="w-full" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full max-w-2xl grid-cols-5">
              <TabsTrigger value="all">All Reports</TabsTrigger>
              <TabsTrigger value="executive">Executive</TabsTrigger>
              <TabsTrigger value="technical">Technical</TabsTrigger>
              <TabsTrigger value="compliance">Compliance</TabsTrigger>
              <TabsTrigger value="templates">Templates</TabsTrigger>
            </TabsList>

            <div className="mt-6">
              {/* Reports List - Professional Table/List View */}
              {activeTab === 'templates' ? (
                <TemplatesGallery onUseTemplate={handleUseTemplate} />
              ) : (
                <div className="rounded-md border bg-card" data-tour="reports-builder">
                  <div className="grid grid-cols-12 gap-4 p-4 border-b bg-muted/40 text-sm font-medium text-muted-foreground">
                    <div className="col-span-4">Report Name</div>
                    <div className="col-span-2">Type & Compliance</div>
                    <div className="col-span-2">Author</div>
                    <div className="col-span-2">Date</div>
                    <div className="col-span-1">Status</div>
                    <div className="col-span-1 text-right">Actions</div>
                  </div>

                  <div className="divide-y">
                    {loading ? (
                      <div className="p-8 text-center text-muted-foreground">Loading reports...</div>
                    ) : filteredReports.length === 0 ? (
                      <div className="p-8 text-center text-muted-foreground">No reports found. Click "New Report" to get started!</div>
                    ) : (
                      filteredReports.map((report) => (
                        <div key={report.id} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-muted/30 transition-colors">
                          <div className="col-span-4">
                            <div className="flex items-start gap-3">
                              <div className="p-2 bg-primary/10 rounded">
                                <FileText className="w-4 h-4 text-primary" />
                              </div>
                              <div>
                                <h4 className="font-medium text-sm">{report.title}</h4>
                                <p className="text-xs text-muted-foreground line-clamp-1">{report.description}</p>
                              </div>
                            </div>
                          </div>
                          <div className="col-span-2">
                            <div className="flex flex-col gap-1 items-start">
                              <Badge variant="outline" className="font-normal">{report.type}</Badge>
                              {report.compliance !== "Internal" && (
                                <span className="flex items-center gap-1 text-[10px] text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full dark:bg-green-900/20 dark:text-green-400">
                                  <ShieldCheck className="w-3 h-3" />
                                  {report.compliance}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="col-span-2">
                            <div className="flex items-center gap-2 text-sm">
                              <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-xs">
                                {(report.author || 'U').charAt(0)}
                              </div>
                              {report.author}
                            </div>
                          </div>
                          <div className="col-span-2 text-sm text-muted-foreground">
                            {report.created}
                          </div>
                          <div className="col-span-1">
                            <Badge variant={report.status === 'published' ? 'default' : 'secondary'} className="capitalize">
                              {report.status}
                            </Badge>
                          </div>
                          <div className="col-span-1 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => { }}>
                                  <Eye className="w-4 h-4 mr-2" /> View
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => { }}>
                                  <Download className="w-4 h-4 mr-2" /> Download
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => { setSelectedReport(report); setVersionHistoryOpen(true); }}>
                                  <History className="w-4 h-4 mr-2" /> Version History
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-red-600">
                                  Archive
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </Tabs>

          <ReportBuilder
            open={isBuilderOpen}
            onOpenChange={setIsBuilderOpen}
            onComplete={handleReportCreated}
            initialConfig={builderConfig}
          />

          {/* Version History Dialog */}
          <Dialog open={versionHistoryOpen} onOpenChange={setVersionHistoryOpen}>
            <DialogContent className="max-w-xl">
              <DialogHeader>
                <DialogTitle>Version History</DialogTitle>
              </DialogHeader>
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-4 pt-4">
                  {selectedReport?.versions?.map((version: any, index: number) => (
                    <div key={index} className="flex gap-4 pb-4 border-b last:border-0 relative">
                      <div className="mt-1">
                        <div className={`w-2 h-2 rounded-full ${index === 0 ? 'bg-primary ring-4 ring-primary/20' : 'bg-muted-foreground'}`} />
                        {index !== (selectedReport.versions.length - 1) && (
                          <div className="absolute top-3 left-[3.5px] w-[1px] h-full bg-border -z-10" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <h4 className="font-medium text-sm">Version {version.version}</h4>
                          <span className="text-xs text-muted-foreground">{version.date}</span>
                        </div>
                        <p className="text-sm text-foreground mb-1">{version.changes}</p>
                        <p className="text-xs text-muted-foreground">Edited by {version.author}</p>
                      </div>
                      <Button variant="outline" size="sm" className="h-7 text-xs">View</Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </DialogContent>
          </Dialog>
        </main>
      </MainLayout>
      <UpgradeDialog open={upgradeOpen} onOpenChange={setUpgradeOpen} />
    </AuthGuard>
  );
};

export default Reports;
