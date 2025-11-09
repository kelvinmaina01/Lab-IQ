import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Shield, Lock, ArrowRight, Database, Warehouse, FileText, Lightbulb, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const ConnectDataSources = () => {
  const [activeTab, setActiveTab] = useState("files");
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [connectionConfig, setConnectionConfig] = useState({
    host: "",
    port: "",
    database: "",
    username: "",
    password: "",
    projectId: "",
    dataset: "",
  });
  const { toast } = useToast();

  const handleConnect = () => {
    toast({
      title: "Connection initiated",
      description: `Connecting to ${selectedSource}...`,
    });
    setSelectedSource(null);
    setConnectionConfig({
      host: "",
      port: "",
      database: "",
      username: "",
      password: "",
      projectId: "",
      dataset: "",
    });
  };

  const connectionCards = {
    files: [
      {
        name: "Sample CSV",
        description: "Upload CSV files directly",
        icon: FileText,
        setupTime: "2 mins Setup",
        sourceType: "csv"
      }
    ],
    databases: [
      {
        name: "MySQL",
        description: "Connect to your MySQL database",
        icon: Database,
        setupTime: "5 mins Setup",
        sourceType: "mysql"
      },
      {
        name: "PostgreSQL",
        description: "Connect to your PostgreSQL database",
        icon: Database,
        setupTime: "5 mins Setup",
        sourceType: "postgresql"
      }
    ],
    warehouse: [
      {
        name: "BigQuery",
        description: "Connect to your Big Query database",
        icon: Warehouse,
        setupTime: "5 mins Setup",
        sourceType: "bigquery"
      },
      {
        name: "Redshift Serverless",
        description: "Connect to your Redshift Serverless",
        icon: Warehouse,
        setupTime: "5 mins Setup",
        sourceType: "redshift"
      }
    ]
  };

  return (
    <div className="grid lg:grid-cols-[1fr_400px] gap-8">
      {/* Main Content */}
      <div className="space-y-6">
        {/* Header Section */}
        <div>
          <h2 className="text-2xl font-bold mb-2">Connect your data securely</h2>
          <p className="text-muted-foreground">
            Import your data with enterprise-grade security and privacy controls.
          </p>
        </div>

        {/* Security Features */}
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="p-6 bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Lock className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">End-to-End Encryption</h3>
                <p className="text-sm text-muted-foreground">
                  Your data is encrypted in transit and at rest.
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-accent/5 to-transparent border-accent/20">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-accent/10">
                <Shield className="w-6 h-6 text-accent" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Access Control</h3>
                <p className="text-sm text-muted-foreground">
                  Granular permissions and role-based access.
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Pro Tip Banner */}
        <Card className="p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20">
          <div className="flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm">
              <span className="font-semibold">Pro Tip:</span> Not sure where to start? Choose "File Upload" to try it out with the sample data, or connect your favorite platform for real-time insights.
            </p>
          </div>
        </Card>

        {/* Connection Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
            <TabsTrigger 
              value="files" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              Files
            </TabsTrigger>
            <TabsTrigger 
              value="databases"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              Databases
            </TabsTrigger>
            <TabsTrigger 
              value="warehouse"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              Warehouse
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            {["files", "databases", "warehouse"].map((tab) => (
              <TabsContent key={tab} value={tab} className="mt-0">
                <div className="grid md:grid-cols-2 gap-4">
                  {connectionCards[tab as keyof typeof connectionCards].map((card, idx) => (
                    <Card 
                      key={idx}
                      className="p-6 hover:shadow-lg transition-all duration-300 cursor-pointer group hover:border-primary/50"
                      onClick={() => setSelectedSource(card.sourceType)}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                          <card.icon className="w-6 h-6 text-primary" />
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          <Clock className="w-3 h-3 mr-1" />
                          {card.setupTime}
                        </Badge>
                      </div>
                      <h3 className="font-semibold text-lg mb-2">{card.name}</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        {card.description}
                      </p>
                      <div className="flex items-center text-primary text-sm font-medium group-hover:translate-x-1 transition-transform">
                        Connect
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </div>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            ))}
          </div>
        </Tabs>
      </div>

      {/* Quick Start Guide Sidebar */}
      <div>
        <Card className="p-6 sticky top-8">
          <h3 className="font-semibold text-lg mb-4">Quick start guide</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Connect your first data source in under 2 minutes
          </p>
          
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full border-2 border-primary bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-semibold text-primary">1</span>
              </div>
              <div>
                <h4 className="font-medium mb-1">Choose your platform or file</h4>
                <p className="text-sm text-muted-foreground">
                  Select from Files, Databases, or Data Warehouses
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full border-2 border-muted bg-muted/10 flex items-center justify-center">
                <span className="text-sm font-semibold text-muted-foreground">2</span>
              </div>
              <div>
                <h4 className="font-medium mb-1">Follow the guided setup</h4>
                <p className="text-sm text-muted-foreground">
                  Step-by-step instructions for secure connection
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full border-2 border-muted bg-muted/10 flex items-center justify-center">
                <span className="text-sm font-semibold text-muted-foreground">3</span>
              </div>
              <div>
                <h4 className="font-medium mb-1">Start exploring insights</h4>
                <p className="text-sm text-muted-foreground">
                  Query and analyze your data instantly
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Connection Dialogs */}
      <Dialog open={selectedSource === "csv"} onOpenChange={() => setSelectedSource(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload CSV File</DialogTitle>
            <DialogDescription>
              Select a CSV file from your computer to import data
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="csv-file">Choose File</Label>
              <Input id="csv-file" type="file" accept=".csv" className="mt-2" />
            </div>
            <Button onClick={handleConnect} className="w-full">Upload & Connect</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={selectedSource === "mysql" || selectedSource === "postgresql"} onOpenChange={() => setSelectedSource(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect to {selectedSource === "mysql" ? "MySQL" : "PostgreSQL"}</DialogTitle>
            <DialogDescription>
              Enter your database credentials to establish a connection
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="host">Host</Label>
              <Input 
                id="host" 
                placeholder="localhost or IP address" 
                value={connectionConfig.host}
                onChange={(e) => setConnectionConfig({...connectionConfig, host: e.target.value})}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="port">Port</Label>
              <Input 
                id="port" 
                placeholder={selectedSource === "mysql" ? "3306" : "5432"}
                value={connectionConfig.port}
                onChange={(e) => setConnectionConfig({...connectionConfig, port: e.target.value})}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="database">Database Name</Label>
              <Input 
                id="database" 
                placeholder="my_database"
                value={connectionConfig.database}
                onChange={(e) => setConnectionConfig({...connectionConfig, database: e.target.value})}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="username">Username</Label>
              <Input 
                id="username" 
                placeholder="Database user"
                value={connectionConfig.username}
                onChange={(e) => setConnectionConfig({...connectionConfig, username: e.target.value})}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password" 
                placeholder="••••••••"
                value={connectionConfig.password}
                onChange={(e) => setConnectionConfig({...connectionConfig, password: e.target.value})}
                className="mt-2"
              />
            </div>
            <Button onClick={handleConnect} className="w-full">Test & Connect</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={selectedSource === "bigquery" || selectedSource === "redshift"} onOpenChange={() => setSelectedSource(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect to {selectedSource === "bigquery" ? "BigQuery" : "Redshift Serverless"}</DialogTitle>
            <DialogDescription>
              Enter your {selectedSource === "bigquery" ? "Google Cloud" : "AWS"} credentials
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedSource === "bigquery" && (
              <>
                <div>
                  <Label htmlFor="projectId">Project ID</Label>
                  <Input 
                    id="projectId" 
                    placeholder="my-gcp-project"
                    value={connectionConfig.projectId}
                    onChange={(e) => setConnectionConfig({...connectionConfig, projectId: e.target.value})}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="dataset">Dataset</Label>
                  <Input 
                    id="dataset" 
                    placeholder="my_dataset"
                    value={connectionConfig.dataset}
                    onChange={(e) => setConnectionConfig({...connectionConfig, dataset: e.target.value})}
                    className="mt-2"
                  />
                </div>
              </>
            )}
            {selectedSource === "redshift" && (
              <>
                <div>
                  <Label htmlFor="host">Endpoint</Label>
                  <Input 
                    id="host" 
                    placeholder="workgroup.account.region.redshift-serverless.amazonaws.com"
                    value={connectionConfig.host}
                    onChange={(e) => setConnectionConfig({...connectionConfig, host: e.target.value})}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="database">Database Name</Label>
                  <Input 
                    id="database" 
                    placeholder="dev"
                    value={connectionConfig.database}
                    onChange={(e) => setConnectionConfig({...connectionConfig, database: e.target.value})}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="username">Username</Label>
                  <Input 
                    id="username" 
                    placeholder="admin"
                    value={connectionConfig.username}
                    onChange={(e) => setConnectionConfig({...connectionConfig, username: e.target.value})}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="••••••••"
                    value={connectionConfig.password}
                    onChange={(e) => setConnectionConfig({...connectionConfig, password: e.target.value})}
                    className="mt-2"
                  />
                </div>
              </>
            )}
            <Button onClick={handleConnect} className="w-full">Connect</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ConnectDataSources;
