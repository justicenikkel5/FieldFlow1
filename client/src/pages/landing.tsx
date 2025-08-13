import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, MessageSquare, BarChart3, Zap, Shield, Settings } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-textPrimary">FieldFlow</span>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-textSecondary hover:text-textPrimary transition-colors">Features</a>
              <a href="#pricing" className="text-textSecondary hover:text-textPrimary transition-colors">Pricing</a>
              <a href="#integrations" className="text-textSecondary hover:text-textPrimary transition-colors">Integrations</a>
              <Button variant="ghost" asChild>
                <a href="/signin">Sign In</a>
              </Button>
              <Button asChild>
                <a href="/register">Get Started</a>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-textPrimary leading-tight">
                  Never Miss Another{' '}
                  <span className="text-primary">Appointment</span>
                </h1>
                <p className="text-xl text-textSecondary leading-relaxed">
                  Automate your appointment reminders and follow-ups with SMS and email. 
                  Integrate with your existing calendar and reduce no-shows by up to 80%.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" asChild className="text-lg px-8 py-4">
                  <a href="/register">Get Started Free</a>
                </Button>
                <Button variant="outline" size="lg" className="text-lg px-8 py-4">
                  Watch Demo
                </Button>
              </div>

              <div className="flex items-center space-x-6 text-sm text-textSecondary">
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 text-secondary">✓</div>
                  <span>Free 14-day trial</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 text-secondary">✓</div>
                  <span>No credit card required</span>
                </div>
              </div>
            </div>

            <div className="relative">
              <Card className="shadow-2xl">
                <CardContent className="p-8 space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-textPrimary">Upcoming Appointments</h3>
                    <span className="bg-secondary/10 text-secondary px-3 py-1 rounded-full text-sm font-medium">12 Today</span>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4 p-4 bg-blue-50 rounded-lg">
                      <div className="w-3 h-3 bg-primary rounded-full"></div>
                      <div className="flex-1">
                        <p className="font-medium text-textPrimary">Sarah Johnson - Hair Cut</p>
                        <p className="text-sm text-textSecondary">2:30 PM • Reminder sent via SMS</p>
                      </div>
                      <div className="bg-secondary text-white px-3 py-1 rounded-full text-xs font-medium">Confirmed</div>
                    </div>
                    
                    <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                      <div className="w-3 h-3 bg-accent rounded-full"></div>
                      <div className="flex-1">
                        <p className="font-medium text-textPrimary">Mike Chen - Consultation</p>
                        <p className="text-sm text-textSecondary">4:00 PM • Email reminder pending</p>
                      </div>
                      <div className="bg-accent text-white px-3 py-1 rounded-full text-xs font-medium">Pending</div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex justify-between text-sm">
                      <span className="text-textSecondary">No-show rate this month</span>
                      <span className="font-semibold text-secondary">↓ 78% reduction</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-textPrimary">Everything You Need to Manage Appointments</h2>
            <p className="text-xl text-textSecondary max-w-3xl mx-auto">
              Streamline your business with automated reminders, seamless integrations, and powerful analytics.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-6">
                  <MessageSquare className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-textPrimary mb-4">SMS & Email Reminders</h3>
                <p className="text-textSecondary leading-relaxed">
                  Send automated appointment reminders via SMS and email. Customize timing and messaging to match your brand.
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-6">
                  <Calendar className="w-6 h-6 text-secondary" />
                </div>
                <h3 className="text-xl font-semibold text-textPrimary mb-4">Calendar Integration</h3>
                <p className="text-textSecondary leading-relaxed">
                  Seamlessly sync with Calendly, Google Calendar, and Microsoft Calendar. No manual data entry required.
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-6">
                  <BarChart3 className="w-6 h-6 text-accent" />
                </div>
                <h3 className="text-xl font-semibold text-textPrimary mb-4">Analytics & Insights</h3>
                <p className="text-textSecondary leading-relaxed">
                  Track no-show rates, reminder effectiveness, and customer engagement with detailed analytics dashboard.
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-6">
                  <Zap className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold text-textPrimary mb-4">Automated Follow-ups</h3>
                <p className="text-textSecondary leading-relaxed">
                  Create custom follow-up sequences for confirmations, cancellations, and post-appointment feedback.
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-6">
                  <Shield className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-textPrimary mb-4">HIPAA Compliant</h3>
                <p className="text-textSecondary leading-relaxed">
                  Enterprise-grade security and HIPAA compliance for healthcare providers and sensitive business data.
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-6">
                  <Settings className="w-6 h-6 text-indigo-600" />
                </div>
                <h3 className="text-xl font-semibold text-textPrimary mb-4">Custom Workflows</h3>
                <p className="text-textSecondary leading-relaxed">
                  Build personalized reminder workflows for different appointment types and customer segments.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Ready to Reduce No-Shows by 80%?
          </h2>
          <p className="text-xl text-blue-100 mb-8 leading-relaxed">
            Join thousands of businesses using FieldFlow to automate their appointment communications and grow their revenue.
          </p>
          <Button size="lg" variant="secondary" asChild className="text-lg px-8 py-4">
            <a href="/register">Start Your Free Trial</a>
          </Button>
        </div>
      </section>
    </div>
  );
}
