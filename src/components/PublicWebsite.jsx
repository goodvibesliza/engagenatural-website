import { useState } from 'react'
import { Button } from './ui/Button'
import { Card, CardContent } from './ui/card'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { CheckCircle, ArrowRight, Users, MessageSquare, Trophy, BookOpen, Brain, BarChart3, Star, Award, Clock, CheckCircle2, LogIn, Calendar, Building2, UserCheck, Zap, Shield, Heart, Gamepad2 } from 'lucide-react'
import LoginWidget from './LoginWidget'
import BrandTitle from '@/components/typography/BrandTitle'
import Kicker from '@/components/typography/Kicker'
import LogoWordmark from './brand/LogoWordmark'
import LogoCloud from '@/components/LogoCloud'
import { BRAND_LOGOS } from '@/data/brandLogos'

// Import assets
import lizaHeadshot from '../assets/Lizaonbeachheadshot.jpg'
import communityHero from '../assets/communityof5.jpg'

/**
 * Renders the public marketing website for EngageNatural, including hero, features, founder, contact form, and footer.
 *
 * The component manages contact form state, submits form data to a Formspree endpoint (showing success/error alerts and resetting the form on success), and exposes a scroll-to-contact action used by several CTAs.
 *
 * @returns {JSX.Element} The rendered public website UI.
 */
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
    }).catch(() => {
      alert('Oops! There was a problem submitting your form')
    })
  }

  const scrollToContact = () => {
    document.getElementById('contact').scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-[#f5f3f3] backdrop-blur-sm border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <LogoWordmark size="md" />
            </div>
            <div className="hidden md:flex space-x-8 items-center">
              <button onClick={scrollToContact} className="text-gray-700 hover:text-brand-secondary transition-colors font-body">
                Contact
              </button>
              
              {/* Unified Login Widget */}
              <LoginWidget 
                buttonText="Login" 
                buttonVariant="default" 
                className="bg-black hover:bg-[#1A1A1A] text-white px-6 py-2 rounded-lg transition-colors flex items-center font-body border border-black"
              />
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 bg-[#f5f3f3]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="font-body text-[0.9rem] md:text-[1rem] tracking-[0.18em] uppercase text-black mb-1" aria-label="Section descriptor">
              COMMUNITY & TRAINING FOR NATURAL PRODUCTS
            </p>
            <h1
              className="font-heading text-[2.25rem] md:text-[2.6rem] font-normal md:font-medium leading-[1.15] tracking-tight text-primary mb-5 max-w-[24ch] mx-auto"
              style={{ textWrap: 'balance' }}
            >
              <span className="block">More than training.</span>
              <span className="block">Together, we’re a movement.</span>
            </h1>
            <p className="text-base md:text-lg text-muted font-body max-w-3xl mx-auto mb-8">
              Genuine connection and micro-lessons that<br />
              give you the confidence and support you need.
            </p>
            <div className="mt-2 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <LoginWidget 
                buttonText="Join the Community" 
                buttonVariant="default" 
                className="bg-black hover:bg-[#1A1A1A] text-white border border-black px-8 py-3 text-lg font-body"
              />
              <Button
                variant="outline"
                className="border-black text-black hover:bg-[var(--color-petal-pink)] hover:text-[var(--color-black)] px-8 py-3 text-lg"
              >
                For Brands
              </Button>
            </div>
            <section aria-label="Trusted by natural product brands" className="container-lg" style={{marginTop: '2.5rem', marginBottom: '2.5rem'}}>
              <h2 className="sr-only">Trusted by natural product brands</h2>
              <LogoCloud logos={BRAND_LOGOS} />
            </section>

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
                  className="bg-black hover:bg-[#1A1A1A] text-white border border-black px-8 py-3 text-lg font-body"
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
  <p className="text-gray-600 font-body">Mobile apps — coming soon</p>
</div>
      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-brand-primary mb-4 font-heading">
              Why Choose EngageNatural?
            </h2>
            <p className="text-base md:text-lg text-black max-w-3xl mx-auto font-body font-normal" style={{ fontFamily: 'var(--font-body)' }}>
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

      {/* Meet the Founder – redesigned to match CultureTest experts style */}
      <section className="py-6 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-4 md:gap-6 items-center">
            {/* Left: Headline, subhead, CTA */}
            <div className="order-1">
              <h2 className="font-heading text-white text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight mb-3">
                Use the educational blueprint of an industry expert
              </h2>
              <p className="font-body text-white/80 text-sm sm:text-base md:text-lg leading-relaxed mb-5">
                EngageNatural was built with insights from decades in natural products education, retail training, and community building.
              </p>
              <Button
                type="button"
                onClick={scrollToContact}
                className="bg-white text-black hover:bg-neutral-200 transition-colors px-4 py-2 rounded-md font-body border border-white text-sm"
              >
                Get early access
              </Button>
            </div>

            {/* Right: Founder card */}
            <div className="order-2">
              <Card className="bg-neutral-900/60 border-neutral-800 text-white rounded-2xl shadow-md overflow-hidden max-w-[14rem] mx-auto">
                <CardContent className="p-0">
                  <div className="aspect-[4/5] w-full overflow-hidden bg-neutral-900">
                    <img
                      src={lizaHeadshot}
                      alt="Portrait of Liza Boone, Founder of EngageNatural"
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-5">
                    <div className="flex flex-col">
                      <span className="font-heading text-white text-lg">Liza Boone</span>
                      <span className="font-body text-white/70 text-xs">Founder @ EngageNatural</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
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
            <p className="text-base md:text-lg text-black font-body font-normal" style={{ fontFamily: 'var(--font-body)' }}>
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
                  className="w-full bg-black hover:bg-[#1A1A1A] border border-black text-white py-3 font-body"
                >
                  Send Message
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#f5f3f3] text-black py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="mb-4">
                <LogoWordmark size="md" />
              </div>
              <p className="text-black font-body">
                Empowering retail teams through gamified engagement and community building.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4 font-heading">For Retail Staff</h3>
              <ul className="space-y-2 text-black font-body">
                <li>Gamified Learning</li>
                <li>Community Connection</li>
                <li>Career Growth</li>
                <li>Expert Knowledge</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4 font-heading">Platform</h3>
              <ul className="space-y-2 text-black font-body">
                <li>Challenges</li>
                <li>Community</li>
                <li>Learning</li>
                <li>Verification</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4 font-heading">Connect</h3>
              <ul className="space-y-2 text-black font-body">
                <li>Contact Us</li>
                <li>LinkedIn</li>
                <li>Support</li>
                <li>Privacy Policy</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-300 mt-8 pt-8 text-center text-black">
            <p className="font-body">&copy; 2024 EngageNatural. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

