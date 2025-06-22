import { useState } from 'react'
import { Button } from './ui/button'
import { Card, CardContent } from './ui/card'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { CheckCircle, ArrowRight, Users, MessageSquare, Trophy, BookOpen, Brain, BarChart3, Star, Award, Clock, CheckCircle2, LogIn, Calendar, Building2, UserCheck, Zap, Shield, Heart, Gamepad2 } from 'lucide-react'
import LoginWidget from './LoginWidget'

// Import assets
import salesImpactGraph from '../assets/sales_impact_graph.png'
import roiGrowthGraph from '../assets/roi_growth_graph.png'
import userEngagementGraph from '../assets/user_engagement_graph.png'
import lizaHeadshot from '../assets/Lizaonbeachheadshot.jpg'
import communityHero from '../assets/communityof5.jpg'
import handsWithHeart from '../assets/handswithheartpaint.jpg'
import diverseGroup from '../assets/grouppicdiverse.jpg'
import handPile from '../assets/handpile.jpg'

export default function PublicWebsite() {
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
            <div className="hidden md:flex space-x-8 items-center">
              <button onClick={scrollToContact} className="text-gray-700 hover:text-brand-secondary transition-colors font-body">
                Contact
              </button>
              
              {/* Unified Login Widget */}
              <LoginWidget 
                buttonText="Login" 
                buttonVariant="default" 
                className="bg-brand-primary hover:bg-brand-primary/90 text-white px-6 py-2 rounded-lg transition-colors flex items-center font-body"
              />
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-20 pb-16 bg-gradient-to-br from-green-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-brand-primary mb-6 font-heading">
              Engage<span className="text-brand-secondary">Natural</span>
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
                  The Only Platform Built Exclusively For Natural Products Retail Staff
                </h2>
                <div className="space-y-4 mb-8">
                  <div className="flex items-start">
                    <CheckCircle className="w-6 h-6 text-brand-secondary mr-3 mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-brand-primary font-body">Double Your Product Knowledge in 30 Days</h3>
                      <p className="text-gray-600 font-body">Master ingredients, benefits, and customer recommendations through bite-sized daily challenges</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle className="w-6 h-6 text-brand-secondary mr-3 mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-brand-primary font-body">Join an Elite Community of Natural Retail Pros</h3>
                      <p className="text-gray-600 font-body">Connect with verified peers who understand your daily challenges and celebrate your wins</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle className="w-6 h-6 text-brand-secondary mr-3 mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-brand-primary font-body">Earn Real Rewards While Building Your Career</h3>
                      <p className="text-gray-600 font-body">Transform your expertise into recognition, samples, and career advancement opportunities</p>
                    </div>
                  </div>
                </div>
                
                <LoginWidget 
                  buttonText="Join the Community" 
                  buttonVariant="default" 
                  className="bg-brand-secondary hover:bg-brand-secondary/90 text-white px-8 py-3 text-lg font-body"
                />
              </div>
              <div className="relative">
                <img 
                  src={communityHero} 
                  alt="Retail community" 
                  className="rounded-2xl shadow-2xl"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
{/* Download App Section */}
<div className="mt-8 text-center">
  <p className="text-gray-600 mb-4">Get the mobile app for the full experience</p>
  <div className="flex justify-center space-x-4">
    <button className="bg-black text-white px-6 py-3 rounded-lg flex items-center space-x-2 hover:bg-gray-800 transition-colors">
      <span>📱</span>
      <div className="text-left">
        <div className="text-xs">Download on the</div>
        <div className="text-sm font-semibold">App Store</div>
      </div>
    </button>
    <button className="bg-black text-white px-6 py-3 rounded-lg flex items-center space-x-2 hover:bg-gray-800 transition-colors">
      <span>🤖</span>
      <div className="text-left">
        <div className="text-xs">Get it on</div>
        <div className="text-sm font-semibold">Google Play</div>
      </div>
    </button>
  </div>
</div>
      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-brand-primary mb-4 font-heading">
              Why Choose EngageNatural?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto font-body">
              Stop wasting time on generic platforms that don't understand natural products.
              Start growing your expertise, community, and career with the only app built for YOU.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center p-8 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <Gamepad2 className="w-8 h-8 text-brand-secondary" />
                </div>
                <h3 className="text-xl font-semibold text-brand-primary mb-3 font-heading">Gamified Experience</h3>
                <p className="text-gray-600 font-body">
                  Forget boring training modules. Our challenges turn learning into a game that's actually FUN, with points, badges, and rewards that keep you coming back for more.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-8 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="mx-auto mb-4 w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <Brain className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-brand-primary mb-3 font-heading">Expert Knowledge</h3>
                <p className="text-gray-600 font-body">
                  Become the go-to expert your customers trust. Access exclusive content directly from top brands that 99% of your coworkers will never see.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-8 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="mx-auto mb-4 w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                  <Heart className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold text-brand-primary mb-3 font-heading">Community Support</h3>
                <p className="text-gray-600 font-body">
                  Stop feeling isolated in your store. Join the ONLY verified community of natural retail professionals who understand exactly what you're going through.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Impact Metrics - Removed from public site */}

      {/* About Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-brand-primary mb-6 font-heading">
                Meet the Founder
              </h2>
              <p className="text-lg text-gray-600 mb-6 font-body">
                Hi, I'm Liza! After 30+ years in the natural products industry, I've seen firsthand how retail staff are the MOST IMPORTANT yet MOST OVERLOOKED part of the entire ecosystem.
              </p>
              <p className="text-lg text-gray-600 mb-8 font-body">
                EngageNatural exists because YOU deserve better than generic training platforms that don't understand our industry. This is more than an app - it's a movement to recognize, reward, and elevate the retail professionals who make natural products successful.
              </p>
              <div className="flex space-x-4">
                <Button variant="outline" size="sm" className="border-brand-primary text-brand-primary hover:bg-brand-primary hover:text-white">
                  <Users className="w-4 h-4 mr-2" />
                  LinkedIn
                </Button>
                <Button variant="outline" size="sm" className="border-brand-primary text-brand-primary hover:bg-brand-primary hover:text-white">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Email
                </Button>
              </div>
            </div>
            <div className="relative">
              <img 
                src={lizaHeadshot} 
                alt="Liza - Founder of EngageNatural" 
                className="rounded-2xl shadow-2xl max-w-xs mx-auto transform scale-x-[-1]"
              />
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
              Ready to transform your retail experience? Let's start the conversation.
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
                    rows={5}
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                    placeholder="Tell us about your needs and how we can help..."
                    className="border-gray-300 focus:border-brand-primary focus:ring-brand-primary"
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full bg-brand-primary hover:bg-brand-primary/90 text-white py-3 font-body"
                >
                  Send Message
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-brand-primary text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="text-2xl font-bold mb-4 font-heading">EngageNatural</div>
              <p className="text-gray-300 font-body">
                Empowering retail teams through gamified engagement and community building.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4 font-heading">For Retail Staff</h3>
              <ul className="space-y-2 text-gray-300 font-body">
                <li>Gamified Learning</li>
                <li>Community Connection</li>
                <li>Career Growth</li>
                <li>Expert Knowledge</li>
              </ul>
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

