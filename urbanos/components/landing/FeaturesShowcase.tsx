'use client';

import { AlertTriangle, Users, Map, Shield, Share2 } from 'lucide-react';
import FeatureSection from './FeatureSection';

export default function FeaturesShowcase() {
  const features = [
    {
      title: "Report Issues",
      description: "Easily report civic problems like potholes, broken streetlights, and more. Track resolution in real-time.",
      icon: AlertTriangle,
      features: [
        "Multi-type issue reporting with photo upload",
        "Real-time status tracking and updates",
        "Automatic agency assignment",
        "Response time monitoring",
        "Follow-up and resolution tracking"
      ],
      gradient: "bg-gradient-to-br from-red-500 to-orange-500"
    },
    {
      title: "Know Your Community",
      description: "Connect with community leaders and understand their roles in your area.",
      icon: Users,
      features: [
        "Complete directory of community officials",
        "Roles and responsibilities breakdown",
        "Direct contact information",
        "Region-based filtering",
        "Accountability and transparency"
      ],
      gradient: "bg-gradient-to-br from-blue-500 to-cyan-500"
    },
    {
      title: "Issue Predictor",
      description: "Stay informed about potential problems in your area using historical data and AI.",
      icon: Map,
      features: [
        "AI-powered route risk assessment",
        "Historical incident analysis",
        "Interactive risk zone mapping",
        "Time-based pattern detection",
        "Proactive issue avoidance"
      ],
      gradient: "bg-gradient-to-br from-green-500 to-emerald-500"
    },
    {
      title: "Cybersecurity Alerts",
      description: "Report cyber threats anonymously and help protect your community from digital dangers.",
      icon: Shield,
      features: [
        "Anonymous incident reporting",
        "Community-wide security alerts",
        "Phishing and scam tracking",
        "Real-time threat notifications",
        "Privacy-focused protection"
      ],
      gradient: "bg-gradient-to-br from-purple-500 to-pink-500"
    },
    {
      title: "Social Integration",
      description: "Report issues from anywhere using your favorite social media platforms.",
      icon: Share2,
      features: [
        "Instagram DM reporting",
        "WhatsApp message integration",
        "Twitter/X mention support",
        "Automatic report creation",
        "Cross-platform updates"
      ],
      gradient: "bg-gradient-to-br from-yellow-500 to-amber-500"
    }
  ];

  return (
    <div>
      {features.map((feature, index) => (
        <FeatureSection
          key={feature.title}
          {...feature}
          reverse={index % 2 === 1}
        />
      ))}
    </div>
  );
}

