import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/badge';
import { Separator } from '../../components/ui/separator';
import { AlertCircle, Check, Copy } from 'lucide-react';

const BrandStyleGuide = () => {
  // Color palette definition
  const brandColors = [
    { name: 'Sage Green (Primary)', hex: '#9CAF88', variable: '--color-sage-green', class: 'bg-sage-green', textClass: 'text-sage-green', borderClass: 'border-sage-green' },
    { name: 'Deep Moss (Secondary)', hex: '#4A5D3A', variable: '--color-deep-moss', class: 'bg-deep-moss', textClass: 'text-deep-moss', borderClass: 'border-deep-moss' },
    { name: 'Oat Beige', hex: '#F5F1EB', variable: '--color-oat-beige', class: 'bg-oat-beige', textClass: 'text-oat-beige', borderClass: 'border-oat-beige' },
    { name: 'Sage Light', hex: '#B8C7A6', variable: '--color-sage-light', class: 'bg-sage-light', textClass: 'text-sage-light' },
    { name: 'Sage Dark', hex: '#7A8E6B', variable: '--color-sage-dark', class: 'bg-sage-dark', textClass: 'text-sage-dark' },
    { name: 'Moss Light', hex: '#5C7048', variable: '--color-moss-light', class: 'bg-moss-light', textClass: 'text-moss-light' },
    { name: 'Oat Dark', hex: '#E8E1D5', variable: '--color-oat-dark', class: 'bg-oat-dark', textClass: 'text-oat-dark' },
    { name: 'Warm Gray', hex: '#6B6B6B', variable: '--color-warm-gray', class: 'bg-warm-gray', textClass: 'text-warm-gray' },
    { name: 'Cool Gray', hex: '#F8F9FA', variable: '--color-cool-gray', class: 'bg-cool-gray', textClass: 'text-cool-gray' },
    { name: 'Black', hex: '#000000', variable: '--color-black', class: 'bg-black', textClass: 'text-black' },
    { name: 'White', hex: '#FFFFFF', variable: '--color-white', class: 'bg-white', textClass: 'text-white' },
  ];

  // Function to copy color value to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    // In a real app, you might want to show a toast notification here
    alert(`Copied ${text} to clipboard`);
  };

  // Function to determine if text should be white or black based on background color
  const getTextColor = (hexColor) => {
    // Convert hex to RGB
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    
    // Calculate luminance (perceived brightness)
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    // Return white for dark backgrounds, black for light backgrounds
    return luminance > 0.5 ? 'text-black' : 'text-white';
  };

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">EngageNatural Brand Style Guide</h1>
        <p className="text-muted-foreground mb-4">
          This guide displays all brand colors and their usage to verify correct implementation.
        </p>
      </div>

      {/* Color Palette Section */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Color Palette</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {brandColors.map((color) => (
            <Card key={color.name} className="overflow-hidden">
              <div 
                className={`h-24 ${color.class} flex items-end p-3 ${getTextColor(color.hex)}`}
              >
                <div className="flex justify-between w-full">
                  <span className="font-medium">{color.name}</span>
                  <button 
                    onClick={() => copyToClipboard(color.hex)}
                    className="opacity-70 hover:opacity-100"
                    title="Copy hex value"
                  >
                    <Copy size={16} />
                  </button>
                </div>
              </div>
              <CardContent className="pt-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-mono text-sm">{color.hex}</span>
                  <Badge variant="outline" className="text-xs">
                    {color.variable}
                  </Badge>
                </div>
                <div className="flex flex-col gap-2 mt-3">
                  <div className={`text-sm ${color.textClass}`}>
                    Text with this color
                  </div>
                  {color.borderClass && (
                    <div className={`border-2 p-2 rounded ${color.borderClass}`}>
                      Border with this color
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <Separator />

      {/* UI Components with Brand Colors */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">UI Components with Brand Colors</h2>
        
        <h3 className="text-xl font-medium mb-3">Buttons</h3>
        <div className="flex flex-wrap gap-4 mb-6">
          <Button>Primary Button (Default)</Button>
          <Button variant="secondary">Secondary Button</Button>
          <Button variant="outline">Outline Button</Button>
          <Button variant="ghost">Ghost Button</Button>
          <Button className="bg-sage-green text-black">Sage Green Button</Button>
          <Button className="bg-deep-moss text-white">Deep Moss Button</Button>
        </div>

        <h3 className="text-xl font-medium mb-3">Badges</h3>
        <div className="flex flex-wrap gap-4 mb-6">
          <Badge>Default Badge</Badge>
          <Badge variant="secondary">Secondary Badge</Badge>
          <Badge variant="outline">Outline Badge</Badge>
          <Badge variant="destructive">Destructive Badge</Badge>
          <Badge className="bg-sage-green text-black">Sage Green Badge</Badge>
          <Badge className="bg-deep-moss text-white">Deep Moss Badge</Badge>
        </div>

        <h3 className="text-xl font-medium mb-3">Cards</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Default Card</CardTitle>
              <CardDescription>Card with default styling</CardDescription>
            </CardHeader>
            <CardContent>
              <p>This card uses the default styling from the theme.</p>
            </CardContent>
          </Card>

          <Card className="border-sage-green">
            <CardHeader className="bg-sage-green/10">
              <CardTitle>Brand Primary Card</CardTitle>
              <CardDescription>Card with primary brand color</CardDescription>
            </CardHeader>
            <CardContent>
              <p>This card uses the sage green brand color for accents.</p>
            </CardContent>
          </Card>

          <Card className="border-deep-moss">
            <CardHeader className="bg-deep-moss text-white">
              <CardTitle>Brand Secondary Card</CardTitle>
              <CardDescription className="text-white/80">Card with secondary brand color</CardDescription>
            </CardHeader>
            <CardContent>
              <p>This card uses the deep moss brand color for the header.</p>
            </CardContent>
          </Card>

          <Card className="bg-oat-beige">
            <CardHeader>
              <CardTitle>Brand Accent Card</CardTitle>
              <CardDescription>Card with accent brand color</CardDescription>
            </CardHeader>
            <CardContent>
              <p>This card uses the oat beige brand color for the background.</p>
            </CardContent>
          </Card>
        </div>

        <h3 className="text-xl font-medium mb-3">Alerts and Messages</h3>
        <div className="space-y-4 mb-6">
          <div className="p-4 rounded-md bg-sage-green/20 border border-sage-green flex items-start">
            <Check className="h-5 w-5 text-sage-green mr-3 mt-0.5" />
            <div>
              <h4 className="font-medium text-sage-green">Success Message</h4>
              <p className="text-sage-dark">This is a success message using the primary brand color.</p>
            </div>
          </div>

          <div className="p-4 rounded-md bg-deep-moss/20 border border-deep-moss flex items-start">
            <AlertCircle className="h-5 w-5 text-deep-moss mr-3 mt-0.5" />
            <div>
              <h4 className="font-medium text-deep-moss">Important Notice</h4>
              <p className="text-deep-moss/80">This is an important notice using the secondary brand color.</p>
            </div>
          </div>
        </div>
      </section>

      <Separator />

      {/* Typography with Brand Colors */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Typography with Brand Colors</h2>
        
        <div className="space-y-4">
          <div>
            <h1 className="text-4xl font-bold text-sage-green">Heading 1 in Sage Green</h1>
            <p className="text-deep-moss">Paragraph text in Deep Moss color.</p>
          </div>
          
          <div>
            <h2 className="text-3xl font-bold text-deep-moss">Heading 2 in Deep Moss</h2>
            <p className="text-sage-dark">Paragraph text in Sage Dark color.</p>
          </div>
          
          <div className="bg-deep-moss p-4 rounded-md">
            <h3 className="text-2xl font-bold text-white">Heading 3 on Deep Moss Background</h3>
            <p className="text-oat-beige">Paragraph text in Oat Beige on a Deep Moss background.</p>
          </div>
          
          <div className="bg-oat-beige p-4 rounded-md">
            <h4 className="text-xl font-bold text-deep-moss">Heading 4 on Oat Beige Background</h4>
            <p className="text-deep-moss">Paragraph text in Deep Moss on an Oat Beige background.</p>
          </div>
        </div>
      </section>

      <Separator />

      {/* CSS Variables Reference */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">CSS Variables Reference</h2>
        
        <Card>
          <CardHeader>
            <CardTitle>Brand Color CSS Variables</CardTitle>
            <CardDescription>Use these CSS variables in your stylesheets</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="font-mono text-sm space-y-2">
              {brandColors.map((color) => (
                <div key={color.variable} className="flex justify-between items-center p-2 hover:bg-muted rounded">
                  <span>{color.variable}</span>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-6 h-6 rounded-full border" 
                      style={{ backgroundColor: color.hex }}
                    ></div>
                    <span>{color.hex}</span>
                    <button 
                      onClick={() => copyToClipboard(`var(${color.variable})`)}
                      className="text-muted-foreground hover:text-foreground"
                      title="Copy CSS variable"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

export default BrandStyleGuide;
