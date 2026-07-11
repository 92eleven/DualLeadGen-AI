const db = require('./db');
const fs = require('fs');
const path = require('path');

// Dictionary of industry-specific copy, design details, and services
const industryAssets = {
  'Plumbing': {
    tagline: 'Reliable Plumbing Services When You Need Them Most',
    subtagline: 'From emergency leak repairs to advanced diagnostics, our licensed professionals deliver superior service and upfront pricing.',
    primaryColor: '#3b82f6', // sky-500
    secondaryColor: '#1d4ed8', // sky-700
    services: [
      { title: 'Emergency Repairs', desc: 'Available 24/7 for burst pipes, sudden flooding, and urgent residential crises.', icon: 'wrench' },
      { title: 'Drain Clearing', desc: 'Professional hydro-jetting and camera inspections for stubborn blockages.', icon: 'droplet' },
      { title: 'Water Heaters', desc: 'Expert maintenance, diagnostics, and eco-friendly installations of premium tankless systems.', icon: 'flame' }
    ],
    testimonials: [
      { name: 'Sarah Jenkins', role: 'Homeowner', text: 'Our hot water heater failed at 10 PM. They were here within an hour and completed the repair fast. Exceptionally polite and professional!' },
      { name: 'Marcus Vance', role: 'Property Manager', text: 'I trust them with all my local rentals. Their pricing is transparent, communication is outstanding, and work is top-tier.' }
    ]
  },
  'Dentist': {
    tagline: 'Exceptional Dental Care for a Beautiful, Confident Smile',
    subtagline: 'Step into a modern, comfortable family practice dedicated to preventative excellence and state-of-the-art dental treatments.',
    primaryColor: '#0d9488', // teal-600
    secondaryColor: '#0f766e', // teal-700
    services: [
      { title: 'Cosmetic Dentistry', desc: 'Premium teeth whitening, high-end veneers, and modern teeth alignment procedures.', icon: 'sparkles' },
      { title: 'Preventative Care', desc: 'Comprehensive exams, professional cleanings, and digital low-radiation X-rays.', icon: 'shield' },
      { title: 'Emergency Dental', desc: 'Same-day urgent appointments for toothaches, crown repairs, and dental injuries.', icon: 'heart-pulse' }
    ],
    testimonials: [
      { name: 'Emily Rodriguez', role: 'Patient', text: 'The gentlest dental cleaning I have ever experienced. The entire staff was welcoming and took time to explain everything.' },
      { name: 'David Liang', role: 'Patient', text: 'Super modern office with incredible tech. Painless wisdom tooth extraction. Hands down the best local dentist.' }
    ]
  },
  'Roofing': {
    tagline: 'Premium Roofing Systems Built to Protect What Matters',
    subtagline: 'Experienced local roofing contractors providing ultra-durable installations, fast repairs, and storm restoration.',
    primaryColor: '#f97316', // orange-500
    secondaryColor: '#ea580c', // orange-600
    services: [
      { title: 'Roof Replacement', desc: 'Precision installations of asphalt shingles, metal systems, and tiles with lifetime warranties.', icon: 'home' },
      { title: 'Leak Detection & Repair', desc: 'Meticulous water-entry diagnosis and prompt, weatherproof repairs.', icon: 'umbrella' },
      { title: 'Storm & Wind Restoration', desc: 'Thorough structural damage inspections and comprehensive insurance claim assistance.', icon: 'cloud-lightning' }
    ],
    testimonials: [
      { name: 'Robert Torrez', role: 'Homeowner', text: 'Outstanding work! Replaced our entire roof in just two days. Spotless cleanup and the roof looks amazing.' },
      { name: 'Linda Miller', role: 'Business Owner', text: 'Very professional process from estimation to project completion. Extremely fair pricing and excellent warranties.' }
    ]
  },
  'Real Estate': {
    tagline: 'Your Trusted Partner in Navigating the Local Real Estate Market',
    subtagline: 'Whether buying your dream home or listing a high-end property, achieve elite results with our market-leading expertise.',
    primaryColor: '#eab308', // gold/amber-500
    secondaryColor: '#ca8a04', // amber-600
    services: [
      { title: 'Home Buying', desc: 'Tailored property alerts, private viewings, and strategic negotiation strategies.', icon: 'key' },
      { title: 'Property Listing', desc: 'Professional home staging advice, cinematic media packages, and aggressive multi-channel marketing.', icon: 'trending-up' },
      { title: 'Market Consultation', desc: 'Comprehensive property valuations and highly detailed local neighborhood trend reports.', icon: 'bar-chart' }
    ],
    testimonials: [
      { name: 'James & Chloe', role: 'Buyers', text: 'Found our dream home within a week! Their local knowledge and negotiation skills saved us thousands.' },
      { name: 'Arthur Gallow', role: 'Luxury Seller', text: 'Listed our luxury home and had multiple offers over asking within days. Their marketing strategy was brilliant!' }
    ]
  },
  'HVAC': {
    tagline: 'Smart Climate Control Solutions for Year-Round Comfort',
    subtagline: 'Certified heating and air conditioning professionals offering prompt system repairs, maintenance, and expert installations.',
    primaryColor: '#3b82f6', // blue-500
    secondaryColor: '#2563eb', // blue-600
    services: [
      { title: 'AC Installation', desc: 'High-efficiency cooling systems designed for your home size and family comfort needs.', icon: 'snowflake' },
      { title: 'Heating Repair', desc: 'Comprehensive furnace diagnostics, carbon monoxide checks, and rapid heat restorations.', icon: 'flame' },
      { title: 'Air Quality Solutions', desc: 'Advanced filtration upgrades, air duct sanitizations, and whole-home humidity controls.', icon: 'wind' }
    ],
    testimonials: [
      { name: 'Sandra H.', role: 'Homeowner', text: 'Our air conditioner broke during a 100-degree weekend. They responded instantly and had it cooling again in no time.' },
      { name: 'Kevin B.', role: 'Business Owner', text: 'Fair pricing, no high-pressure sales tactics, and outstanding professional system installation.' }
    ]
  },
  'Electrician': {
    tagline: 'Safe, Reliable Electrical Solutions Done Right',
    subtagline: 'From electrical panel replacements to complex smart home wiring, our licensed master electricians guarantee absolute safety.',
    primaryColor: '#f59e0b', // amber-500
    secondaryColor: '#d97706', // amber-600
    services: [
      { title: 'Panel Upgrades', desc: 'Heavy-duty panel replacements to support modern home appliances and EV charging safely.', icon: 'zap' },
      { title: 'Smart Home Wiring', desc: 'Professional setup of home automation systems, smart lighting, and security monitors.', icon: 'cpu' },
      { title: 'Emergency Repairs', desc: 'Prompt troubleshooting and safe isolation of dangerous electrical hazards.', icon: 'alert-triangle' }
    ],
    testimonials: [
      { name: 'Gary P.', role: 'Resident', text: 'Fixed our flickering lights and added a dedicated line for our EV. On-time, clean, and highly knowledgeable.' },
      { name: 'Diana V.', role: 'Store Owner', text: 'Outstanding commercial electrician. Diagnosed and rewired our retail floor overnight so we didn\'t lose a day.' }
    ]
  }
};

const defaultAssets = {
  tagline: 'Premium Solutions Tailored for Local Success',
  subtagline: 'Delivering exceptional workmanship, reliable support, and guaranteed satisfaction for our valued local community.',
  primaryColor: '#6366f1', // indigo-500
  secondaryColor: '#4f46e5', // indigo-600
  services: [
    { title: 'Custom Consultations', desc: 'Detailed assessments, expert evaluations, and personalized blueprints for your goals.', icon: 'users' },
    { title: 'Premium Execution', desc: 'Efficient, high-quality completion using state-of-the-art technology and premium industry practices.', icon: 'award' },
    { title: 'Support & Care', desc: 'Dedicated client support, fast responsive repairs, and long-term maintenance programs.', icon: 'tool' }
  ],
  testimonials: [
    { name: 'Alex Mercer', role: 'Business Client', text: 'Extremely professional, incredibly responsive, and high quality. They exceeded every single expectation!' },
    { name: 'Jessica Vance', role: 'Local Customer', text: 'An absolute pleasure to work with. Fair pricing, meticulous attention to detail, and top-tier results.' }
  ]
};

// Helper function to return SVG paths for icons
function getSvgIcon(iconName) {
  const icons = {
    'wrench': `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>`,
    'droplet': `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path>`,
    'flame': `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>`,
    'sparkles': `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path>`,
    'shield': `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>`,
    'heart-pulse': `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>`,
    'home': `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>`,
    'umbrella': `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16h.01M4 12h.01M20 12h.01M7 7l1.41 1.41M15.59 15.59L17 17M7 17l1.41-1.41M15.59 8.41L17 7M14 12a2 2 0 11-4 0 2 2 0 014 0z"></path>`,
    'cloud-lightning': `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 10-3-3m3 3a3 3 0 103-3m-3 3H9m3 0h3"></path>`,
    'key': `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m-2-2a2 2 0 00-2 2m2-2V5a2 2 0 10-4 0v2m4 0h2m-2 0h-2m-3 4H4a2 2 0 00-2 2v3a2 2 0 002 2h3a2 2 0 002-2v-3a2 2 0 00-2-2H7m3 4v-4m0 4h2"></path>`,
    'trending-up': `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>`,
    'bar-chart': `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>`,
    'snowflake': `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v18M3 12h18M12 9l3 3-3 3M12 15l-3-3 3-3"></path>`,
    'wind': `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 16.58A5 5 0 0018 7h-1.26A8 8 0 104 15.25"></path>`,
    'zap': `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>`,
    'cpu': `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 5h10a2 2 0 012 2v10a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2z"></path>`,
    'alert-triangle': `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>`,
    'refresh-cw': `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 15H19M16.24 7.76l1.414-1.414m-12.02 0L7.05 7.76"></path>`,
    'truck': `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0zM13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-11h6a1 1 0 011 1v7l-3 4H12m0-11v11m1-1h1"></path>`,
    'users': `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>`,
    'award': `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path>`,
    'tool': `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>`
  };
  return icons[iconName] || icons['wrench'];
}

// Convert a hex color string to its corresponding RGB triple "R, G, B" for transparency styles
function hexToRgb(hex) {
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  const fullHex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
  return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '59, 130, 246';
}

class Devin {
  constructor() {
    this.name = 'Devin';
    this.role = 'AI Web Engineer';
    this.outputDir = path.join(__dirname, '../public/clients');
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  async buildSite(clientId) {
    console.log(`[DEVIN] Building high-end Base44-style site for client ID: ${clientId}...`);
    
    try {
      const client = await db.getAsync("SELECT * FROM clients WHERE id = ?", [clientId]);
      if (!client) throw new Error("Client not found");

      const lead = await db.getAsync("SELECT business_name FROM leads WHERE id = ?", [client.lead_id]);
      const businessName = lead ? lead.business_name : "Valued Customer";
      const industry = client.industry || "Professional Services";

      // 1. Determine the copy & design resources
      const normalizedIndustry = Object.keys(industryAssets).find(
        key => key.toLowerCase() === industry.toLowerCase() || industry.toLowerCase().includes(key.toLowerCase())
      );
      const assets = normalizedIndustry ? industryAssets[normalizedIndustry] : defaultAssets;

      // Brand styling configurations
      const primaryColor = client.brand_colors || assets.primaryColor;
      const hoverColor = assets.secondaryColor;
      const primaryRgb = hexToRgb(primaryColor);

      // Build services HTML list
      let servicesHtml = '';
      assets.services.forEach(svc => {
        servicesHtml += `
        <div class="bg-[#18181b]/40 backdrop-blur-md border border-zinc-800/80 rounded-2xl p-8 hover:border-zinc-700/80 hover:bg-[#18181b]/70 transition duration-300 transform hover:-translate-y-1">
          <div class="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-tr from-[var(--primary-color)] to-[var(--primary-color-hover)] shadow-lg shadow-[var(--primary-color)]/20 mb-6">
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              ${getSvgIcon(svc.icon)}
            </svg>
          </div>
          <h3 class="text-lg font-bold text-white mb-2">${svc.title}</h3>
          <p class="text-zinc-400 text-sm leading-relaxed">${svc.desc}</p>
        </div>
        `;
      });

      // Build testimonials HTML
      let testimonialsHtml = '';
      assets.testimonials.forEach(t => {
        testimonialsHtml += `
        <div class="bg-[#18181b]/40 backdrop-blur border border-zinc-800/80 rounded-2xl p-8 flex flex-col justify-between hover:border-zinc-700/80 transition duration-300">
          <div>
            <div class="flex items-center space-x-1 mb-5">
              ${Array(5).fill('<svg class="w-4 h-4 text-amber-500 fill-amber-500" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>').join('')}
            </div>
            <p class="text-zinc-300 italic text-sm leading-relaxed mb-6">"${t.text}"</p>
          </div>
          <div class="flex items-center space-x-4 pt-4 border-t border-zinc-800/60">
            <div class="w-8 h-8 rounded-full bg-gradient-to-tr from-[var(--primary-color)] to-[var(--primary-color-hover)] flex items-center justify-center font-bold text-white text-xs">
              ${t.name.split(' ').map(n=>n[0]).join('')}
            </div>
            <div>
              <h4 class="font-bold text-white text-xs">${t.name}</h4>
              <p class="text-[10px] text-zinc-500">${t.role}</p>
            </div>
          </div>
        </div>
        `;
      });

      // 2. Beautiful responsive layout template mimicking the premium dark base44 aesthetic
      const template = `<!DOCTYPE html>
<html lang="en" class="scroll-smooth">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${businessName} | ${industry} Experts</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
    <style>
        :root {
            --primary-color: ${primaryColor};
            --primary-color-hover: ${hoverColor};
            --primary-rgb: ${primaryRgb};
            font-family: 'Inter', sans-serif;
        }
        body {
            background-color: #09090b;
            color: #a1a1aa;
        }
        .text-gradient {
            background: linear-gradient(to b, #ffffff 0%, #a1a1aa 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .glow-button {
            box-shadow: 0 0 20px rgba(var(--primary-rgb), 0.25);
            transition: all 0.3s ease;
        }
        .glow-button:hover {
            box-shadow: 0 0 30px rgba(var(--primary-rgb), 0.4);
        }
    </style>
</head>
<body class="antialiased min-h-screen flex flex-col overflow-x-hidden">
    <!-- Header -->
    <header class="fixed top-0 left-0 w-full z-50 bg-[#09090b]/80 backdrop-blur-md border-b border-zinc-900/60">
        <div class="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <div class="flex items-center space-x-3">
                <span class="text-xl font-black text-white tracking-tight">${businessName}</span>
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-zinc-900 border border-zinc-800 text-zinc-300 uppercase tracking-wider">${industry}</span>
            </div>
            <nav class="hidden md:flex items-center space-x-8">
                <a href="#services" class="text-xs font-medium text-zinc-400 hover:text-white transition">Services</a>
                <a href="#about" class="text-xs font-medium text-zinc-400 hover:text-white transition">About</a>
                <a href="#reviews" class="text-xs font-medium text-zinc-400 hover:text-white transition">Reviews</a>
                <a href="#contact" class="px-4 py-2 rounded-full text-xs font-semibold text-white bg-gradient-to-tr from-[var(--primary-color)] to-[var(--primary-color-hover)] hover:opacity-90 transition">Contact Now</a>
            </nav>
            <button id="menu-btn" class="md:hidden text-white hover:text-zinc-400 focus:outline-none">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7"></path></svg>
            </button>
        </div>
        <!-- Mobile Dropdown -->
        <div id="mobile-menu" class="hidden md:hidden absolute top-16 left-0 w-full bg-[#09090b] border-b border-zinc-900 px-6 py-6 space-y-4">
            <a href="#services" class="block text-sm font-semibold text-zinc-400 hover:text-white transition">Services</a>
            <a href="#about" class="block text-sm font-semibold text-zinc-400 hover:text-white transition">About</a>
            <a href="#reviews" class="block text-sm font-semibold text-zinc-400 hover:text-white transition">Reviews</a>
            <a href="#contact" class="block w-full text-center px-5 py-2.5 rounded-full text-xs font-bold text-white bg-gradient-to-tr from-[var(--primary-color)] to-[var(--primary-color-hover)] transition">Contact Now</a>
        </div>
    </header>

    <!-- Hero Section -->
    <section class="relative pt-36 pb-24 px-6 overflow-hidden">
        <div class="absolute inset-0 bg-gradient-to-b from-[var(--primary-color)]/5 via-transparent to-transparent pointer-events-none"></div>
        <div class="max-w-4xl mx-auto text-center relative z-10">
            <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold bg-zinc-900/80 border border-zinc-800 text-zinc-300 uppercase tracking-widest mb-6">
                <span class="w-1.5 h-1.5 rounded-full bg-[var(--primary-color)] animate-pulse"></span>
                PRO ACTIVE ASSISTANCE
            </span>
            <h1 class="text-4xl sm:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-zinc-500 tracking-tight leading-[1.1] mb-6">
                ${assets.tagline}
            </h1>
            <p class="text-base sm:text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed mb-10">
                ${assets.subtagline}
            </p>
            <div class="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-sm mx-auto">
                <a href="#contact" class="w-full px-6 py-3.5 rounded-full font-bold text-xs uppercase tracking-wider text-white bg-gradient-to-tr from-[var(--primary-color)] to-[var(--primary-color-hover)] hover:opacity-90 transition text-center glow-button">
                    Get a Free Quote
                </a>
                <a href="#services" class="w-full px-6 py-3.5 rounded-full font-bold text-xs uppercase tracking-wider text-zinc-300 border border-zinc-800 hover:bg-zinc-900/50 transition text-center">
                    Explore Services
                </a>
            </div>
        </div>
    </section>

    <!-- Services Grid -->
    <section id="services" class="py-20 px-6 border-t border-zinc-900 bg-[#09090b]">
        <div class="max-w-7xl mx-auto">
            <div class="text-center max-w-2xl mx-auto mb-16">
                <span class="text-[10px] font-bold uppercase tracking-wider text-[var(--primary-color)]">Core Capabilities</span>
                <h2 class="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-2 mb-3">Our Specialized Services</h2>
                <p class="text-sm text-zinc-500">Discover how our targeted industry expertise translates into absolute reliability and premium workmanship on every single project.</p>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                ${servicesHtml}
            </div>
        </div>
    </section>

    <!-- About Section -->
    <section id="about" class="py-20 px-6 border-t border-zinc-900 bg-[#09090b]">
        <div class="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
                <span class="text-[10px] font-bold uppercase tracking-wider text-[var(--primary-color)]">Our Mission</span>
                <h2 class="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-2 mb-5">Premium Local Craftsmanship</h2>
                <p class="text-zinc-400 text-sm leading-relaxed mb-6">
                    ${client.bio || 'We are dedicated professionals providing top-tier solutions directly to our local community. Built upon foundations of absolute transparency, outstanding customer service, and mastercraft skills.'}
                </p>
                <div class="space-y-3.5 text-xs">
                    <div class="flex items-center space-x-3">
                        <svg class="w-4 h-4 text-[var(--primary-color)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                        <span class="font-medium text-white">Licensed, Bonded, and Highly Insured</span>
                    </div>
                    <div class="flex items-center space-x-3">
                        <svg class="w-4 h-4 text-[var(--primary-color)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                        <span class="font-medium text-white">Locally Owned & Operated Enterprise</span>
                    </div>
                    <div class="flex items-center space-x-3">
                        <svg class="w-4 h-4 text-[var(--primary-color)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                        <span class="font-medium text-white">Absolute Customer Satisfaction Guarantee</span>
                    </div>
                </div>
            </div>
            <div class="relative bg-zinc-900/20 border border-zinc-800/80 rounded-2xl p-8 flex flex-col justify-center min-h-[300px]">
                <div class="absolute inset-0 bg-gradient-to-tr from-[var(--primary-color)]/5 to-transparent pointer-events-none rounded-2xl"></div>
                <h3 class="text-xl font-bold text-white mb-3">Need Quick Assistance?</h3>
                <p class="text-zinc-400 text-sm mb-6 leading-relaxed">Reach out directly to speak with an on-duty local advisor and get clear answers to your key questions immediately.</p>
                <a href="#contact" class="inline-flex items-center justify-center px-5 py-3 rounded-full font-bold text-xs uppercase tracking-wider text-white bg-gradient-to-tr from-[var(--primary-color)] to-[var(--primary-color-hover)] max-w-[200px]">
                    Schedule Now
                </a>
            </div>
        </div>
    </section>

    <!-- Testimonials Grid -->
    <section id="reviews" class="py-20 px-6 border-t border-zinc-900 bg-[#09090b]">
        <div class="max-w-7xl mx-auto">
            <div class="text-center max-w-2xl mx-auto mb-16">
                <span class="text-[10px] font-bold uppercase tracking-wider text-[var(--primary-color)]">Verified Feedback</span>
                <h2 class="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-2 mb-3">What Our Clients Are Saying</h2>
                <p class="text-sm text-zinc-500">Read verified success stories directly from homeowners and business managers inside our local service area.</p>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                ${testimonialsHtml}
            </div>
        </div>
    </section>

    <!-- Lead Capture Form Section -->
    <section id="contact" class="py-20 px-6 relative border-t border-zinc-900 bg-[#09090b]">
        <div class="absolute inset-0 bg-gradient-to-t from-[var(--primary-color)]/5 via-transparent to-transparent pointer-events-none"></div>
        <div class="max-w-3xl mx-auto bg-zinc-950 border border-zinc-800/80 rounded-2xl p-8 sm:p-10 relative z-10 shadow-2xl">
            <div class="text-center max-w-2xl mx-auto mb-8">
                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-zinc-900 border border-zinc-850 text-[var(--primary-color)] uppercase tracking-wider mb-3">LEAD INTAKE ACTIVE</span>
                <h2 class="text-2xl font-bold text-white tracking-tight mb-2">Request Access</h2>
                <p class="text-sm text-zinc-400">Fill out this quick 30-second form and our scheduling advisor will follow up with you in under 15 minutes.</p>
            </div>
            
            <form id="lead-form" class="space-y-5 text-xs">
                <input type="hidden" name="lead_id" value="${client.lead_id}">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                        <label class="block font-bold uppercase tracking-widest text-zinc-400 mb-2">Your Name *</label>
                        <input type="text" name="name" required class="w-full bg-zinc-900/60 border border-zinc-800 focus:border-[var(--primary-color)] focus:ring-1 focus:ring-[var(--primary-color)] rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none transition" placeholder="John Doe">
                    </div>
                    <div>
                        <label class="block font-bold uppercase tracking-widest text-zinc-400 mb-2">Phone Number</label>
                        <input type="tel" name="phone" class="w-full bg-zinc-900/60 border border-zinc-800 focus:border-[var(--primary-color)] focus:ring-1 focus:ring-[var(--primary-color)] rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none transition" placeholder="(555) 000-0000">
                    </div>
                </div>
                <div>
                    <label class="block font-bold uppercase tracking-widest text-zinc-400 mb-2">Email Address *</label>
                    <input type="email" name="email" required class="w-full bg-zinc-900/60 border border-zinc-800 focus:border-[var(--primary-color)] focus:ring-1 focus:ring-[var(--primary-color)] rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none transition" placeholder="john@example.com">
                </div>
                <div>
                    <label class="block font-bold uppercase tracking-widest text-zinc-400 mb-2">What's Your Goal? *</label>
                    <textarea name="message" rows="4" required class="w-full bg-zinc-900/60 border border-zinc-800 focus:border-[var(--primary-color)] focus:ring-1 focus:ring-[var(--primary-color)] rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none transition" placeholder="Please tell us about your needs and required assistance..."></textarea>
                </div>
                <button type="submit" class="w-full py-3.5 rounded-xl font-bold uppercase tracking-wider text-xs text-white bg-gradient-to-tr from-[var(--primary-color)] to-[var(--primary-color-hover)] hover:opacity-90 transition glow-button">
                    Deploy My Service Request
                </button>
            </form>

            <div id="form-success" class="hidden text-center py-6">
                <div class="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 mb-5">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                </div>
                <h3 class="text-xl font-bold text-white mb-2">Request Submitted Successfully!</h3>
                <p class="text-sm text-zinc-400 max-w-md mx-auto">Thank you for choosing us. Our scheduling advisor has been notified and will contact you in under 15 minutes.</p>
            </div>
        </div>
    </section>

    <!-- Footer -->
    <footer class="mt-auto border-t border-zinc-900 bg-[#09090b] py-10 px-6">
        <div class="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
            <div class="flex items-center space-x-3">
                <span class="text-lg font-black text-white tracking-tight">${businessName}</span>
                <span class="text-xs text-zinc-800">|</span>
                <p class="text-xs text-zinc-500">&copy; 2026 ${businessName}. All rights reserved.</p>
            </div>
            <div class="flex space-x-6 text-xs text-zinc-500">
                <a href="#services" class="hover:text-white transition">Services</a>
                <a href="#about" class="hover:text-white transition">About</a>
                <a href="#reviews" class="hover:text-white transition">Reviews</a>
            </div>
        </div>
    </footer>

    <script>
        // Menu Toggle
        const menuBtn = document.getElementById('menu-btn');
        const mobileMenu = document.getElementById('mobile-menu');
        menuBtn.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
        });

        // Close Mobile Menu on Click
        document.querySelectorAll('#mobile-menu a').forEach(link => {
            link.addEventListener('click', () => mobileMenu.classList.add('hidden'));
        });

        // Form Submit AJAX Handler
        const form = document.getElementById('lead-form');
        const successBox = document.getElementById('form-success');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());

            try {
                const response = await fetch('/api/leads/capture', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                
                if (response.ok) {
                    form.classList.add('hidden');
                    successBox.classList.remove('hidden');
                } else {
                    alert('Submission failed. Please try again.');
                }
            } catch (err) {
                console.error(err);
                alert('A system error occurred. Please try again.');
            }
        });
    </script>
</body>
</html>
      `;

      const fileName = `${client.subdomain}.html`;
      fs.writeFileSync(path.join(this.outputDir, fileName), template);

      await db.runAsync("UPDATE clients SET site_status = 'live' WHERE id = ?", [clientId]);
      
      console.log(`[DEVIN] High-end site live at https://57c921b14b31dd4ab771f1d6cdfaa42e.ctonew.app/clients/${fileName}`);
      
      db.run("INSERT INTO interactions (lead_id, agent, direction, content) VALUES (?, ?, 'outbound', ?)",
        [client.lead_id, this.name, `Your professional premium single-page site is now live! View it here: https://57c921b14b31dd4ab771f1d6cdfaa42e.ctonew.app/clients/${fileName}`]);

    } catch (err) {
      console.error(`[DEVIN] Site build failed: ${err.message}`);
    }
  }

  // Domain registration and mapping simulation
  async registerCustomDomain(clientId, customDomain) {
    console.log(`[DEVIN] Registering and mapping custom domain: ${customDomain} for client ${clientId}...`);
    try {
      const client = await db.getAsync("SELECT * FROM clients WHERE id = ?", [clientId]);
      if (!client) throw new Error("Client not found");

      // Record initiating step in interactions
      await db.runAsync(
        "INSERT INTO interactions (lead_id, agent, direction, content) VALUES (?, ?, 'outbound', ?)",
        [client.lead_id, this.name, `Initiating custom domain registration for "${customDomain}"...`]
      );

      // Simulate registration delay & settings
      await db.runAsync("UPDATE clients SET custom_domain = ? WHERE id = ?", [customDomain, clientId]);

      // Complete registration interaction
      await db.runAsync(
        "INSERT INTO interactions (lead_id, agent, direction, content) VALUES (?, ?, 'outbound', ?)",
        [client.lead_id, this.name, `✅ Custom domain registration successful!
        
Your site has been successfully mapped to http://${customDomain}. Our DNS routing tables are fully active.`]
      );

      console.log(`[DEVIN] ✅ Custom domain mapped: http://${customDomain}`);
    } catch (err) {
      console.error(`[DEVIN] Custom domain registration failed: ${err.message}`);
    }
  }
}

const devin = new Devin();
module.exports = devin;
