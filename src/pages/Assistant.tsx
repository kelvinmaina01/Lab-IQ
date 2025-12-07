import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown, Activity, Target, Users, FileText, Clock, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const Assistant = () => {
  const [timeRange, setTimeRange] = useState("30d");

  // Mock data for analytics
  const performanceData = [
    { date: "Jan", experiments: 24, success: 18, pending: 4, failed: 2 },
    { date: "Feb", experiments: 31, success: 25, pending: 3, failed: 3 },
    { date: "Mar", experiments: 28, success: 22, pending: 5, failed: 1 },
    { date: "Apr", experiments: 35, success: 29, pending: 4, failed: 2 },
    { date: "May", experiments: 42, success: 36, pending: 3, failed: 3 },
    { date: "Jun", experiments: 38, success: 32, pending: 4, failed: 2 },
  ];

  const dataUsageData = [
    { month: "Jan", uploaded: 45, analyzed: 42 },
    { month: "Feb", uploaded: 52, analyzed: 48 },
    { month: "Mar", uploaded: 48, analyzed: 45 },
    { month: "Apr", uploaded: 61, analyzed: 58 },
    { month: "May", uploaded: 70, analyzed: 65 },
    { month: "Jun", uploaded: 65, analyzed: 62 },
  ];

  const experimentTypeData = [
    { name: "Chemical Analysis", value: 35, color: "#8B5CF6" },
    { name: "Biological Tests", value: 28, color: "#06B6D4" },
    { name: "Material Testing", value: 22, color: "#10B981" },
    { name: "Quality Control", value: 15, color: "#F59E0B" },
  ];

  const teamActivityData = [
    { name: "Week 1", team1: 12, team2: 15, team3: 8 },
    { name: "Week 2", team1: 15, team2: 13, team3: 10 },
    { name: "Week 3", team1: 18, team2: 17, team3: 12 },
    { name: "Week 4", team1: 14, team2: 19, team3: 15 },
  ];

  const metrics = [
    {
      title: "Total Experiments",
      value: "238",
      change: "+12.5%",
      trend: "up",
      icon: Activity,
      color: "text-blue-500"
    },
    {
      title: "Success Rate",
      value: "87.3%",
      change: "+3.2%",
      trend: "up",
      icon: Target,
      color: "text-green-500"
    },
    {
      title: "Active Users",
      value: "24",
      change: "+5",
      trend: "up",
      icon: Users,
      color: "text-purple-500"
    },
    {
      title: "Reports Generated",
      value: "156",
      change: "+18",
      trend: "up",
      icon: FileText,
      color: "text-orange-500"
    },
  ];

  const recentActivity = [
    { id: 1, action: "Experiment completed", user: "Dr. Sarah Chen", time: "5 min ago", status: "success" },
    { id: 2, action: "Data analysis finished", user: "John Smith", time: "12 min ago", status: "success" },
    { id: 3, action: "New dataset uploaded", user: "Dr. Mike Ross", time: "23 min ago", status: "pending" },
    { id: 4, action: "Report generated", user: "Emma Wilson", time: "1 hour ago", status: "success" },
    { id: 5, action: "Automation triggered", user: "System", time: "2 hours ago", status: "success" },
  ];

  return (
    <AuthGuard>
      <MainLayout>
        <main className="p-4 md:p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Analytics Dashboard</h1>
              <p className="text-muted-foreground">Track performance, usage, and insights across your lab</p>
            </div>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="1y">Last year</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {metrics.map((metric) => {
              const Icon = metric.icon;
              const TrendIcon = metric.trend === "up" ? TrendingUp : TrendingDown;
              return (
                <Card key={metric.title} className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-lg bg-muted ${metric.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className={`flex items-center gap-1 text-sm ${metric.trend === "up" ? "text-green-500" : "text-red-500"}`}>
                      <TrendIcon className="w-4 h-4" />
                      <span>{metric.change}</span>
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold mb-1">{metric.value}</h3>
                  <p className="text-sm text-muted-foreground">{metric.title}</p>
                </Card>
              );
            })}
          </div>

          {/* Charts */}
          <Tabs defaultValue="performance" className="mb-8" data-tour="chat-interface">
            <TabsList className="mb-4">
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="usage">Data Usage</TabsTrigger>
              <TabsTrigger value="distribution">Distribution</TabsTrigger>
              <TabsTrigger value="teams">Team Activity</TabsTrigger>
            </TabsList>

            <TabsContent value="performance">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Experiment Performance Over Time</h3>
                <ResponsiveContainer width="100%" height={350}>
                  <AreaChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="success" stackId="1" stroke="#10B981" fill="#10B981" fillOpacity={0.6} name="Success" />
                    <Area type="monotone" dataKey="pending" stackId="1" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.6} name="Pending" />
                    <Area type="monotone" dataKey="failed" stackId="1" stroke="#EF4444" fill="#EF4444" fillOpacity={0.6} name="Failed" />
                  </AreaChart>
                </ResponsiveContainer>
              </Card>
            </TabsContent>

            <TabsContent value="usage">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Data Upload vs Analysis</h3>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={dataUsageData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="uploaded" fill="#8B5CF6" name="Datasets Uploaded" />
                    <Bar dataKey="analyzed" fill="#06B6D4" name="Datasets Analyzed" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </TabsContent>

            <TabsContent value="distribution">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Experiment Type Distribution</h3>
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie
                      data={experimentTypeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {experimentTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            </TabsContent>

            <TabsContent value="teams">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Team Activity Comparison</h3>
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={teamActivityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="team1" stroke="#8B5CF6" strokeWidth={2} name="Team Alpha" />
                    <Line type="monotone" dataKey="team2" stroke="#06B6D4" strokeWidth={2} name="Team Beta" />
                    <Line type="monotone" dataKey="team3" stroke="#10B981" strokeWidth={2} name="Team Gamma" />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Recent Activity */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                  <div className="flex items-center gap-4">
                    {activity.status === "success" ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <Clock className="w-5 h-5 text-orange-500" />
                    )}
                    <div>
                      <p className="font-medium">{activity.action}</p>
                      <p className="text-sm text-muted-foreground">{activity.user}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={activity.status === "success" ? "default" : "secondary"}>
                      {activity.status}
                    </Badge>
                    <span className="text-sm text-muted-foreground">{activity.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </main>
      </MainLayout>
    </AuthGuard>
  );
};

export default Assistant;
