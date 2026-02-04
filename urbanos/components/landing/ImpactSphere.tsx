'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface Testimonial {
  id: number;
  name: string;
  role: string;
  story: string;
  impact: string;
  avatar: string;
  color: string;
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    name: 'Sarah Martinez',
    role: 'Downtown Resident',
    story: 'Reported a dangerous pothole',
    impact: 'Fixed in 24 hours, prevented accidents',
    avatar: '👩‍💼',
    color: '#7FDBDB',
  },
  {
    id: 2,
    name: 'James Chen',
    role: 'Small Business Owner',
    story: 'Broken streetlight near my shop',
    impact: 'Restored safety, increased foot traffic',
    avatar: '👨‍💻',
    color: '#E85D75',
  },
  {
    id: 3,
    name: 'Maria Rodriguez',
    role: 'Teacher',
    story: 'School zone safety concern',
    impact: 'New crosswalk installed, kids safer',
    avatar: '👩‍🏫',
    color: '#B8D96D',
  },
  {
    id: 4,
    name: 'David Kim',
    role: 'Community Organizer',
    story: 'Organized neighborhood cleanup',
    impact: '50+ volunteers, cleaner streets',
    avatar: '👨‍🎨',
    color: '#E8A05D',
  },
  {
    id: 5,
    name: 'Emily Johnson',
    role: 'Healthcare Worker',
    story: 'Reported illegal dumping',
    impact: 'Area cleaned, health hazard removed',
    avatar: '👩‍⚕️',
    color: '#5B8BD6',
  },
  {
    id: 6,
    name: 'Michael Brown',
    role: 'Retired Veteran',
    story: 'Wheelchair accessibility issue',
    impact: 'Ramp built, independence restored',
    avatar: '👨‍🦳',
    color: '#D4C5A9',
  },
];

export default function ImpactSphere() {
  const [selectedCard, setSelectedCard] = useState<number | null>(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [isAutoRotating, setIsAutoRotating] = useState(true);
  const sphereRef = useRef<HTMLDivElement>(null);

  // Auto-rotation
  useEffect(() => {
    if (!isAutoRotating) return;

    const interval = setInterval(() => {
      setRotation((prev) => ({
        x: prev.x,
        y: prev.y + 0.3,
      }));
    }, 30);

    return () => clearInterval(interval);
  }, [isAutoRotating]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!sphereRef.current) return;
    setIsAutoRotating(false);

    const rect = sphereRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const rotateY = ((e.clientX - centerX) / rect.width) * 50;
    const rotateX = -((e.clientY - centerY) / rect.height) * 50;

    setRotation({ x: rotateX, y: rotateY });
  };

  const handleMouseLeave = () => {
    setIsAutoRotating(true);
  };

  return (
    <section className="section-spacing flex items-center justify-center relative overflow-hidden">
      <motion.div
        className="max-w-7xl w-full relative z-10"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true, margin: "-100px" }}
      >
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <motion.div
            className="inline-block bg-[#2C2C2C] neo-border px-10 py-6 mb-8 rounded-lg interactive-element"
            whileHover={{ scale: 1.05, rotate: 2 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <h2 className="text-section-title font-black text-white uppercase tracking-tighter">
              Real People, Real Impact
            </h2>
          </motion.div>
          <motion.p
            className="text-body-large text-black font-bold max-w-3xl mx-auto bg-white neo-border px-8 py-5 rounded-lg leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            viewport={{ once: true }}
          >
            See how UrbanOS has transformed lives and communities across the city
          </motion.p>
        </motion.div>

        {/* 3D Sphere */}
        <div className="mb-20">
          <div
            ref={sphereRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="relative w-full h-[600px] flex items-center justify-center"
            style={{ perspective: '1200px' }}
          >
            <div
              className="relative w-[500px] h-[500px]"
              style={{
                transformStyle: 'preserve-3d',
                transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
                transition: isAutoRotating ? 'none' : 'transform 0.1s ease-out',
              }}
            >
              {testimonials.map((testimonial, index) => {
                const angle = (index / testimonials.length) * 2 * Math.PI;
                const radius = 300;
                const rotateY = (index / testimonials.length) * 360;

                return (
                  <div
                    key={testimonial.id}
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                    style={{
                      transformStyle: 'preserve-3d',
                      transform: `rotateY(${rotateY}deg) translateZ(${radius}px)`,
                    }}
                  >
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      onClick={() => setSelectedCard(selectedCard === testimonial.id ? null : testimonial.id)}
                      className="cursor-pointer"
                      style={{
                        transform: `rotateY(${-rotateY - rotation.y}deg)`,
                        backfaceVisibility: 'visible',
                      }}
                    >
                      <div
                        className={`bg-white neo-border p-5 rounded-lg w-[260px]`}
                      >
                        {/* Avatar with colored background */}
                        <div
                          className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mb-4 neo-border"
                          style={{ backgroundColor: testimonial.color }}
                        >
                          {testimonial.avatar}
                        </div>

                        {/* Content */}
                        <h3 className="font-black text-xl text-black mb-1 uppercase tracking-tight">{testimonial.name}</h3>
                        <p className="text-sm font-bold mb-3" style={{ color: testimonial.color }}>{testimonial.role}</p>

                        <div className="border-t-4 border-black pt-3">
                          <p className="text-sm font-bold text-black mb-2">{testimonial.story}</p>
                          {selectedCard === testimonial.id && (
                            <motion.p
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              className="text-xs font-semibold text-black mt-2 pt-2 border-t-2 border-black"
                            >
                              ✅ {testimonial.impact}
                            </motion.p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  </div>
                );
              })}
            </div>
          </div>

          <motion.p
            className="text-center text-black font-bold text-sm bg-white neo-border px-6 py-3 rounded-lg inline-block"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            viewport={{ once: true }}
            style={{ display: 'block', width: 'fit-content', margin: '0 auto' }}
          >
            🖱️ Drag to rotate • Click cards for more details
          </motion.p>
        </div>


      </motion.div>
    </section>
  );
}
