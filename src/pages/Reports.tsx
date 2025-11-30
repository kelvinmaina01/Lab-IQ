import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import MobileNav from "@/components/MobileNav";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, FileText, Download, Eye, MoreVertical, Calendar, User, Search, History, RotateCcw, Clock, Brain } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSubscription } from "@/hooks/useSubscription";
import { UpgradeDialog } from "@/components/UpgradeDialog";
import { useActivityTracker } from "@/hooks/useActivityTracker";

const Reports = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [versionHistoryOpen, setVersionHistoryOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const { toast } = useToast();
  const { subscription, loading } = useSubscription();
  const { trackActivity } = useActivityTracker();

  const reports = [
    {
      id: 1,
      title: "Q4 2024 Laboratory Performance",
      description: "Comprehensive analysis of all experiments conducted in Q4",
      type: "Quarterly",
      created: "2025-01-15",
      author: "Dr. Sarah Chen",
      format: "PDF",
      size: "2.4 MB",
      status: "published",
      versions: [
        { version: "3.0", date: "2025-01-15", author: "Dr. Sarah Chen", changes: "Added executive summary and updated conclusion section" },
        { version: "2.1", date: "2025-01-14", author: "Dr. Sarah Chen", changes: "Fixed data visualization errors in charts" },
        { version: "2.0", date: "2025-01-13", author: "John Smith", changes: "Major revision with additional experiment results" },
        { version: "1.0", date: "2025-01-10", author: "Dr. Sarah Chen", changes: "Initial draft created" },
      ]
    },
    {
      id: 2,
      title: "Protein Analysis Summary",
      description: "Detailed findings from protein structure experiments",
      type: "Experiment",
      created: "2025-01-12",
      author: "John Smith",
      format: "PDF",
      size: "1.8 MB",
      status: "published",
      versions: [
        { version: "2.0", date: "2025-01-12", author: "John Smith", changes: "Added methodology section and references" },
        { version: "1.0", date: "2025-01-11", author: "John Smith", changes: "Initial version" },
      ]
    },
    {
      id: 3,
      title: "Chemical Screening Results",
      description: "High-throughput screening outcomes and recommendations",
      type: "Experiment",
      created: "2025-01-10",
      author: "Dr. Mike Ross",
      format: "PDF",
      size: "3.2 MB",
      status: "published",
      versions: [
        { version: "1.5", date: "2025-01-10", author: "Dr. Mike Ross", changes: "Updated recommendations based on peer review" },
        { version: "1.0", date: "2025-01-08", author: "Dr. Mike Ross", changes: "Initial draft" },
      ]
    },
    {
      id: 4,
      title: "Monthly Team Progress Report",
      description: "January 2025 team activities and achievements",
      type: "Monthly",
      created: "2025-01-08",
      author: "Emma Wilson",
      format: "PDF",
      size: "1.5 MB",
      status: "draft",
      versions: [
        { version: "0.9", date: "2025-01-08", author: "Emma Wilson", changes: "Added team member contributions" },
        { version: "0.5", date: "2025-01-07", author: "Emma Wilson", changes: "Initial draft with summary" },
      ]
    },
    {
      id: 5,
      title: "Data Quality Audit",
      description: "Assessment of data integrity and quality metrics",
      type: "Audit",
      created: "2025-01-05",
      author: "Alex Turner",
      format: "PDF",
      size: "2.1 MB",
      status: "published",
      versions: [
        { version: "1.0", date: "2025-01-05", author: "Alex Turner", changes: "Final audit report" },
      ]
    },
  ];

  const templates = [
    { id: 1, name: "Experiment Summary", description: "Standard template for experiment results" },
    { id: 2, name: "Monthly Progress", description: "Monthly team and project updates" },
    { id: 3, name: "Quarterly Review", description: "Comprehensive quarterly performance review" },
    { id: 4, name: "Data Analysis", description: "In-depth data analysis and insights" },
    { id: 5, name: "AI Model Performance", description: "Accuracy metrics, confusion matrix, and feature importance" },
  ];

  const handleGenerateReport = () => {
    trackActivity("Report generated", "New report created", "BarChart3");
    toast({
      title: "Report Generated",
      description: "Your report has been generated and is ready for download.",
    });
    setIsCreateDialogOpen(false);
  };

  const handleDownloadReport = (reportTitle: string) => {
    if (subscription?.tier === "free") {
      setUpgradeOpen(true);
      toast({
        title: "Pro Feature",
        description: "Report downloads require a Pro subscription.",
        variant: "destructive"
      });
      return;
    }
    trackActivity("Report downloaded", reportTitle, "BarChart3");
    toast({
      title: "Downloading Report",
      description: `${reportTitle} is being downloaded.`,
    });
  };

  const handleViewVersionHistory = (report: any) => {
    if (subscription?.tier === "free") {
      setUpgradeOpen(true);
      toast({
        title: "Pro Feature",
        description: "Version history is a Pro feature.",
        variant: "destructive"
      });
      return;
    }
    setSelectedReport(report);
    setVersionHistoryOpen(true);
  };

  const handleRollback = (version: string) => {
    toast({
      title: "Version Restored",
      description: `Successfully rolled back to version ${version}.`,
    });
    setVersionHistoryOpen(false);
  };

  const filteredReports = reports.filter(report =>
    report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    report.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-background">
        <Sidebar />

        <div className="flex-1 md:ml-64 pb-16 md:pb-0">
          <TopBar />

          <main className="p-4 md:p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">Reports</h1>
                <p className="text-muted-foreground">Generate, view, and manage your laboratory reports</p>
              </div>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    Generate Report
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Generate New Report</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="report-title">Report Title</Label>
                      <Input id="report-title" placeholder="e.g., Q1 2025 Performance Report" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="report-description">Description</Label>
                      <Textarea id="report-description" placeholder="Describe what this report covers..." rows={3} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="template">Template</Label>
                        <Select>
                          <SelectTrigger id="template">
                            <SelectValue placeholder="Select template" />
                          </SelectTrigger>
                          <SelectContent>
                            {templates.map((template) => (
                              <SelectItem key={template.id} value={template.id.toString()}>
                                {template.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="format">Format</Label>
                        <Select defaultValue="pdf">
                          <SelectTrigger id="format">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pdf">PDF</SelectItem>
                            <SelectItem value="docx">Word Document</SelectItem>
                            <SelectItem value="xlsx">Excel Spreadsheet</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="data-source">Data Source</Label>
                      <Select>
                        <SelectTrigger id="data-source">
                          <SelectValue placeholder="Select data source" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Experiments</SelectItem>
                          <SelectItem value="recent">Last 30 Days</SelectItem>
                          <SelectItem value="custom">Custom Date Range</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={handleGenerateReport} className="w-full">
                      Generate Report
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Search */}
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search reports..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Tabs */}
            <Tabs defaultValue="all" className="space-y-6">
              <TabsList>
                <TabsTrigger value="all">All Reports ({reports.length})</TabsTrigger>
                <TabsTrigger value="published">Published ({reports.filter(r => r.status === "published").length})</TabsTrigger>
                <TabsTrigger value="drafts">Drafts ({reports.filter(r => r.status === "draft").length})</TabsTrigger>
                <TabsTrigger value="templates">Templates ({templates.length})</TabsTrigger>
              </TabsList>

              {/* All Reports Tab */}
              <TabsContent value="all">
                <div className="space-y-4">
                  {filteredReports.map((report) => (
                    <Card key={report.id} className="p-6 hover:shadow-lg transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="p-3 rounded-lg bg-primary/10">
                            <FileText className="w-6 h-6 text-primary" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold">{report.title}</h3>
                              <Badge variant={report.status === "published" ? "default" : "secondary"}>
                                {report.status}
                              </Badge>
                              <Badge variant="outline">{report.type}</Badge>
                            </div>
                            <p className="text-muted-foreground mb-3">{report.description}</p>
                            <div className="flex items-center gap-6 text-sm text-muted-foreground">
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4" />
                                {report.author}
                              </div>
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                {report.created}
                              </div>
                              <span>{report.format} • {report.size}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-2"
                            onClick={() => handleViewVersionHistory(report)}
                          >
                            <History className="w-4 h-4" />
                            History
                            {subscription?.tier === "free" && <Badge variant="secondary" className="ml-1 text-xs">Pro</Badge>}
                          </Button>
                          <Button size="sm" variant="outline" className="gap-2">
                            <Eye className="w-4 h-4" />
                            View
                          </Button>
                          <Button
                            size="sm"
                            className="gap-2"
                            onClick={() => handleDownloadReport(report.title)}
                          >
                            <Download className="w-4 h-4" />
                            Download
                            {subscription?.tier === "free" && <Badge variant="secondary" className="ml-1 text-xs">Pro</Badge>}
                          </Button>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* Published Reports Tab */}
              <TabsContent value="published">
                <div className="space-y-4">
                  {filteredReports.filter(r => r.status === "published").map((report) => (
                    <Card key={report.id} className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold mb-1">{report.title}</h3>
                          <p className="text-sm text-muted-foreground">{report.description}</p>
                        </div>
                        <Button size="sm" className="gap-2" onClick={() => handleDownloadReport(report.title)}>
                          <Download className="w-4 h-4" />
                          Download
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* Drafts Tab */}
              <TabsContent value="drafts">
                <div className="space-y-4">
                  {filteredReports.filter(r => r.status === "draft").map((report) => (
                    <Card key={report.id} className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold mb-1">{report.title}</h3>
                          <p className="text-sm text-muted-foreground">{report.description}</p>
                        </div>
                        <Button size="sm">Continue Editing</Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* Templates Tab */}
              <TabsContent value="templates">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {templates.map((template) => (
                    <Card key={template.id} className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-lg ${template.name.includes("AI") ? "bg-purple-500/10" : "bg-accent/10"}`}>
                          {template.name.includes("AI") ? (
                            <Brain className="w-6 h-6 text-purple-500" />
                          ) : (
                            <FileText className="w-6 h-6 text-accent" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold mb-1">{template.name}</h3>
                          <p className="text-sm text-muted-foreground mb-3">{template.description}</p>
                          <Button size="sm" variant="outline">Use Template</Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>

            {/* Version History Dialog */}
            <Dialog open={versionHistoryOpen} onOpenChange={setVersionHistoryOpen}>
              <DialogContent className="max-w-3xl max-h-[80vh]">
                <DialogHeader>
                  <DialogTitle>Version History - {selectedReport?.title}</DialogTitle>
                </DialogHeader>
                <ScrollArea className="h-[500px] pr-4">
                  <div className="space-y-4">
                    {selectedReport?.versions?.map((version: any, index: number) => (
                      <Card key={version.version} className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4 flex-1">
                            <div className={`p-2 rounded-lg ${index === 0 ? 'bg-primary/10' : 'bg-muted'}`}>
                              <Clock className={`w-5 h-5 ${index === 0 ? 'text-primary' : 'text-muted-foreground'}`} />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-semibold">Version {version.version}</h4>
                                {index === 0 && <Badge>Current</Badge>}
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">{version.changes}</p>
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <User className="w-3 h-3" />
                                  {version.author}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {version.date}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="outline">
                              <Eye className="w-3 h-3 mr-1" />
                              View
                            </Button>
                            {index !== 0 && (
                              <Button
                                size="sm"
                                onClick={() => handleRollback(version.version)}
                                className="gap-1"
                              >
                                <RotateCcw className="w-3 h-3" />
                                Restore
                              </Button>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </DialogContent>
            </Dialog>

            <UpgradeDialog open={upgradeOpen} onOpenChange={setUpgradeOpen} />
          </main>
        </div>
        <MobileNav />
      </div>
    </AuthGuard>
  );
};

export default Reports;
