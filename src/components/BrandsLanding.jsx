import { useState } from 'react'
import { Button } from './ui/Button'
import { Card, CardContent } from './ui/card'
import { Dialog, DialogContent, DialogTrigger } from './ui/dialog'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { CheckCircle, ArrowRight, Users, TrendingUp, Target, Linkedin, Mail, MessageSquare, Trophy, BookOpen, Brain, BarChart3, Star, Award, Clock, CheckCircle2, LogIn, Calendar, Building2, UserCheck, Zap, Shield, Heart, Gamepad2 } from 'lucide-react'

// Import assets
import salesImpactGraph from '../assets/sales_impact_graph.png'
import roiGrowthGraph from '../assets/roi_growth_graph.png'
import userEngagementGraph from '../assets/user_engagement_graph.png'
import lizaHeadshot from '../assets/Lizaonbeachheadshot.jpg'
import communityHero from '../assets/communityof5.jpg'
import handsWithHeart from '../assets/handswithheartpaint.jpg'
import diverseGroup from '../assets/grouppicdiverse.jpg'
import handPile from '../assets/handpile.jpg'

export default function BrandsLanding() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    message: ''
  })

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    // Formspree will handle the form submission
    const form = e.target
    const formData = new FormData(form)
    
    fetch('https://formspree.io/f/xeokjykw', {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json'
      }
    }).then(response => {
      if (response.ok) {
        alert('Thank you! Your message has been sent.')
        setFormData({ name: '', email: '', company: '', message: '' })
      } else {
        alert('Oops! There was a problem submitting your form')
      }
    }).catch(error => {
      alert('Oops! There was a problem submitting your form')
    })
  }

  const scrollToContact = () => {
    document.getElementById('contact').scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-sm border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="text-2xl font-bold text-brand-primary font-heading">EngageNatural</div>
            <div className="hidden md:flex space-x-8">
              <a href="/" className="text-gray-700 hover:text-brand-secondary transition-colors font-body">
                Home
              </a>
              <button onClick={scrollToContact} className="text-gray-700 hover:text-brand-secondary transition-colors font-body">
                Contact
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-20 pb-16 bg-gradient-to-br from-green-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-brand-primary mb-6 font-heading">
              Partner with <span className="text-brand-secondary">EngageNatural</span>
            </h1>
            <p className="text-xl text-gray-600 mb-4 max-w-3xl mx-auto font-body">
              Learn. Connect. Grow. Naturally
            </p>
            <p className="text-lg text-brand-secondary font-semibold mb-8 max-w-3xl mx-auto font-body">
              More Than Training… It's a Movement
            </p>

            <div className="grid md:grid-cols-2 gap-12 items-center mt-16">
              <div className="text-left">
                <h2 className="text-3xl font-bold text-brand-primary mb-6 font-heading">
                  Transform Your Brand Presence
                </h2>
                <div className="space-y-4 mb-8">
                  <div className="flex items-start">
                    <TrendingUp className="w-6 h-6 text-brand-secondary mr-3 mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-brand-primary font-body">Measurable ROI</h3>
                      <p className="text-gray-600 font-body">Track campaign performance and sales impact in real-time</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <Target className="w-6 h-6 text-brand-secondary mr-3 mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-brand-primary font-body">Targeted Engagement</h3>
                      <p className="text-gray-600 font-body">Connect directly with verified retail professionals</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <Users className="w-6 h-6 text-brand-secondary mr-3 mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-brand-primary font-body">Community Building</h3>
                      <p className="text-gray-600 font-body">Foster brand loyalty through authentic relationships</p>
                    </div>
                  </div>
                </div>
                
                <Button onClick={scrollToContact} className="bg-brand-secondary hover:bg-brand-secondary/90 text-white px-8 py-3 text-lg font-body">
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
              <div className="relative">
                <img 
                  src={diverseGroup} 
                  alt="Diverse retail team" 
                  className="rounded-2xl shadow-2xl"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Now Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-brand-primary mb-4 font-heading">
              Why Now?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto font-body">
              The retail landscape is changing rapidly, creating new challenges and opportunities
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="bg-green-100 rounded-full p-2 mr-4 flex-shrink-0">
                    <CheckCircle className="w-6 h-6 text-brand-secondary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-brand-primary mb-2 font-heading">Post-COVID Engagement Challenge</h3>
                    <p className="text-gray-600 font-body">
                      Retail teams are harder to engage in-person, requiring new digital approaches to training and connection.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-green-100 rounded-full p-2 mr-4 flex-shrink-0">
                    <CheckCircle className="w-6 h-6 text-brand-secondary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-brand-primary mb-2 font-heading">ROI-Driven Marketing</h3>
                    <p className="text-gray-600 font-body">
                      Brands are demanding direct ROI from marketing and training budgets with measurable impact.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-green-100 rounded-full p-2 mr-4 flex-shrink-0">
                    <CheckCircle className="w-6 h-6 text-brand-secondary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-brand-primary mb-2 font-heading">Community Over Corporate</h3>
                    <p className="text-gray-600 font-body">
                      Staff want authentic community experiences, not corporate tools or impersonal platforms.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-green-100 rounded-full p-2 mr-4 flex-shrink-0">
                    <CheckCircle className="w-6 h-6 text-brand-secondary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-brand-primary mb-2 font-heading">Trust Deficit</h3>
                    <p className="text-gray-600 font-body">
                      General distrust of large corporations and social media creates need for authentic connection.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-green-100 rounded-full p-2 mr-4 flex-shrink-0">
                    <CheckCircle className="w-6 h-6 text-brand-secondary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-brand-primary mb-2 font-heading">Industry Gap</h3>
                    <p className="text-gray-600 font-body">
                      No current app delivers a personal, education-first experience built just for the natural products industry.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              <img 
                src={handsWithHeart} 
                alt="Hands forming a heart" 
                className="rounded-2xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Proven Results Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-brand-primary mb-4 font-heading">
              Proven Results
            </h2>
            <p className="text-xl text-gray-600 font-body">
              See the measurable impact EngageNatural has on retail performance
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="text-center">
              <div className="text-4xl font-bold mb-2 font-heading">85%</div>
              <div className="text-gray-600 font-body">Increase in Product Knowledge</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2 font-heading">67%</div>
              <div className="text-gray-600 font-body">Boost in Customer Satisfaction</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2 font-heading">92%</div>
              <div className="text-gray-600 font-body">Staff Engagement Rate</div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-6">
              <CardContent>
                <h3 className="text-lg font-semibold text-brand-primary mb-4 font-heading">Sales Impact</h3>
                <img src={salesImpactGraph} alt="Sales Impact Graph" className="w-full rounded-lg" />
              </CardContent>
            </Card>
            
            <Card className="p-6">
              <CardContent>
                <h3 className="text-lg font-semibold text-brand-primary mb-4 font-heading">ROI Growth</h3>
                <img src={roiGrowthGraph} alt="ROI Growth Graph" className="w-full rounded-lg" />
              </CardContent>
            </Card>
            
            <Card className="p-6">
              <CardContent>
                <h3 className="text-lg font-semibold text-brand-primary mb-4 font-heading">User Engagement</h3>
                <img src={userEngagementGraph} alt="User Engagement Graph" className="w-full rounded-lg" />
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ROI Example Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-brand-primary mb-4 font-heading">
              Real ROI Example
            </h2>
            <p className="text-xl text-gray-600 font-body">
              See how brands achieve measurable returns with EngageNatural
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <Card className="p-8 border-2 border-brand-secondary">
                <CardContent>
                  <h3 className="text-2xl font-semibold text-brand-primary mb-6 font-heading">Sales Impact Example</h3>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                      <span className="font-semibold text-gray-700 font-body">Employees trained in campaign</span>
                      <span className="text-xl font-bold text-brand-primary font-heading">500</span>
                    </div>
                    
                    <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                      <span className="font-semibold text-gray-700 font-body">Extra sales per employee</span>
                      <span className="text-xl font-bold text-brand-primary font-heading">3 units</span>
                    </div>
                    
                    <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                      <span className="font-semibold text-gray-700 font-body">Total additional units sold</span>
                      <span className="text-xl font-bold text-brand-primary font-heading">1,500 units</span>
                    </div>
                    
                    <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                      <span className="font-semibold text-gray-700 font-body">Profit per unit</span>
                      <span className="text-xl font-bold text-brand-primary font-heading">$5</span>
                    </div>
                    
                    <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                      <span className="font-semibold text-gray-700 font-body">Campaign cost</span>
                      <span className="text-xl font-bold text-brand-primary font-heading">$2,000</span>
                    </div>
                    
                    <div className="flex justify-between items-center pt-2">
                      <span className="font-bold text-gray-800 font-body">Total ROI</span>
                      <span className="text-2xl font-bold text-brand-secondary font-heading">275%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-semibold text-brand-primary mb-3 font-heading">Every Trained Staff Member Matters</h3>
                <p className="text-gray-600 font-body">
                  Our data shows that properly trained retail staff sell an average of 3 more units per shift. 
                  With a $5 profit per unit, that's $15+ in added value per staff member, per shift.
                </p>
              </div>
              
              <div>
                <h3 className="text-2xl font-semibold text-brand-primary mb-3 font-heading">Quick Campaign Recovery</h3>
                <p className="text-gray-600 font-body">
                  Brands recover their campaign spend (avg. $2,000) through just 135 trained staff — 
                  often in a single week. Everything beyond that is pure profit.
                </p>
              </div>
              
              <div>
                <h3 className="text-2xl font-semibold text-brand-primary mb-3 font-heading">Gamification Boosts Engagement</h3>
                <p className="text-gray-600 font-body">
                  Gamified users interact 3–5x more often with brand content, boosting retention and 
                  creating a multiplier effect on repeat campaign ROI.
                </p>
              </div>
              
              <Button onClick={scrollToContact} className="bg-brand-secondary hover:bg-brand-secondary/90 text-white px-8 py-3 text-lg font-body mt-4">
                Start Your Campaign
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-brand-primary mb-4 font-heading">
              Get In Touch
            </h2>
            <p className="text-xl text-gray-600 font-body">
              Ready to transform your brand's retail presence? Let's start the conversation.
            </p>
          </div>

          <Card className="p-8">
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-brand-primary mb-2 font-body">
                      Name *
                    </label>
                    <Input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      placeholder="Your full name"
                      className="border-gray-300 focus:border-brand-primary focus:ring-brand-primary"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-brand-primary mb-2 font-body">
                      Email *
                    </label>
                    <Input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      placeholder="your.email@company.com"
                      className="border-gray-300 focus:border-brand-primary focus:ring-brand-primary"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="company" className="block text-sm font-medium text-brand-primary mb-2 font-body">
                    Company
                  </label>
                  <Input
                    type="text"
                    id="company"
                    name="company"
                    value={formData.company}
                    onChange={handleInputChange}
                    placeholder="Your company name"
                    className="border-gray-300 focus:border-brand-primary focus:ring-brand-primary"
                  />
                </div>
                
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-brand-primary mb-2 font-body">
                    Message *
                  </label>
                  <Textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                    rows={5}
                    placeholder="Tell us about your goals and how we can help"
                    className="border-gray-300 focus:border-brand-primary focus:ring-brand-primary"
                  />
                </div>
                
                <div>
                  <Button type="submit" className="w-full bg-brand-secondary hover:bg-brand-secondary/90 text-white py-3 font-body">
                    Send Message
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <h2 className="text-2xl font-bold mb-4 font-heading">EngageNatural</h2>
              <p className="text-gray-300 mb-4 font-body">
                Empowering retail teams through gamified engagement, education, and community building 
                in the natural products industry.
              </p>
              <div className="flex space-x-4">
                <Button variant="ghost" size="icon" className="text-gray-300 hover:text-white">
                  <Linkedin className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="icon" className="text-gray-300 hover:text-white">
                  <Mail className="w-5 h-5" />
                </Button>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-4 font-heading">Platform</h3>
              <ul className="space-y-2 text-gray-300 font-body">
                <li>Challenges</li>
                <li>Community</li>
                <li>Learning</li>
                <li>Verification</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4 font-heading">Connect</h3>
              <ul className="space-y-2 text-gray-300 font-body">
                <li>Contact Us</li>
                <li>LinkedIn</li>
                <li>Support</li>
                <li>Privacy Policy</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-600 mt-8 pt-8 text-center text-gray-300">
            <p className="font-body">&copy; 2024 EngageNatural. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

