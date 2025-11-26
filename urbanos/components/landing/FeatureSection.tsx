'use client';

import { motion } from 'framer-motion';
import { useRef, useState } from 'react';
import { LucideIcon, Check } from 'lucide-react';

interface FeatureSectionProps {
  title: string;
  description: string;
  icon: LucideIcon;
  features: string[];
  reverse?: boolean;
  gradient: string;
}

// Map gradients to solid neo-brutalism colors (subtle tones)
const colorMap: Record<string, { bg: string; text: string }> = {
  'bg-gradient-to-br from-red-500 to-orange-500': { bg: '#E85D75', text: 'white' },
  'bg-gradient-to-br from-blue-500 to-cyan-500': { bg: '#7FDBDB', text: 'black' },
  'bg-gradient-to-br from-green-500 to-emerald-500': { bg: '#B8D96D', text: 'black' },
  'bg-gradient-to-br from-purple-500 to-pink-500': { bg: '#5B8BD6', text: 'white' },
  'bg-gradient-to-br from-yellow-500 to-amber-500': { bg: '#D4C5A9', text: 'black' },
};

export default function FeatureSection({
  title,
  description,
  icon: Icon,
  features,
  reverse = false,
  gradient
}: FeatureSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [checkedFeatures, setCheckedFeatures] = useState<Record<number, boolean>>({});

  const colors = colorMap[gradient] || { bg: '#D4C5A9', text: 'black' };

  const toggleFeature = (index: number) => {
    setCheckedFeatures(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  return (
    <section ref={ref} className="section-spacing flex items-center justify-center relative overflow-hidden">
      <motion.div
        className={`max-w-7xl w-full grid md:grid-cols-2 gap-16 items-center ${reverse ? 'md:grid-flow-dense' : ''}`}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true, margin: "-100px" }}
      >
        {/* Icon/Visual */}
        <motion.div
          className={`flex items-center justify-center ${reverse ? 'md:col-start-2' : ''}`}
          initial={{ opacity: 0, x: reverse ? 100 : -100 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true, margin: "-100px" }}
        >
          <motion.div
            className="w-64 h-64 md:w-80 md:h-80 rounded-lg neo-border flex items-center justify-center backdrop-blur-sm interactive-element"
            style={{ backgroundColor: colors.bg }}
            whileHover={{ scale: 1.08, rotate: reverse ? 8 : -8 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <Icon 
              className="w-32 h-32 md:w-40 md:h-40" 
              style={{ color: colors.text }}
              strokeWidth={2.5} 
            />
          </motion.div>
        </motion.div>

        {/* Content */}
        <motion.div
          className={reverse ? 'md:col-start-1 md:row-start-1' : ''}
          initial={{ opacity: 0, x: reverse ? -100 : 100 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true, margin: "-100px" }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            viewport={{ once: true }}
            className="bg-black neo-border px-8 py-5 mb-8 inline-block rounded-lg interactive-element"
            whileHover={{ scale: 1.02, rotate: 1 }}
          >
            <h2 className="text-section-title font-black text-white uppercase tracking-tighter">
              {title}
            </h2>
          </motion.div>

          <motion.p 
            className="text-body-large text-black font-bold mb-10 bg-white neo-border p-6 rounded-lg leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            viewport={{ once: true }}
          >
            {description}
          </motion.p>

          <ul className="space-y-4">
            {features.map((feature, index) => {
              const isChecked = checkedFeatures[index] || false;
              return (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.1, type: "spring", stiffness: 200 }}
                  viewport={{ once: true }}
                  className="flex items-start gap-3 group"
                >
                  <motion.button
                    onClick={() => toggleFeature(index)}
                    className="w-11 h-11 neo-border flex-shrink-0 mt-1 rounded flex items-center justify-center cursor-pointer interactive-element focus:outline-none focus:ring-3 focus:ring-black focus:ring-offset-2 focus:ring-offset-white"
                    style={{ 
                      backgroundColor: isChecked ? colors.bg : 'white',
                      borderColor: 'black'
                    }}
                    whileHover={{ scale: 1.15, rotate: 8 }}
                    whileTap={{ scale: 0.9 }}
                    aria-label={`${isChecked ? 'Uncheck' : 'Check'} ${feature}`}
                    aria-pressed={isChecked}
                    role="checkbox"
                  >
                    {isChecked && <Check className="w-6 h-6" style={{ color: colors.text }} strokeWidth={3} aria-hidden="true" />}
                  </motion.button>
                  <motion.span 
                    className={`text-lg md:text-xl font-semibold bg-white neo-border px-5 py-3 rounded flex-1 transition-all text-black ${isChecked ? 'opacity-50 line-through' : ''}`}
                    whileHover={{ scale: 1.02, x: 4 }}
                  >
                    {feature}
                  </motion.span>
                </motion.li>
              );
            })}
          </ul>
        </motion.div>
      </motion.div>
    </section>
  );
}
