'use client';

import { motion } from 'framer-motion';
import LaunchButton from '@/components/splash/LaunchButton';
import Magnet from '@/components/ui/Magnet';
import TextType from '@/components/ui/TextType';

export default function CallToAction() {
  // Video background is handled by ParallaxImageBackground component

  return (
    <section className="min-h-screen flex items-center justify-center py-20 px-4 relative overflow-hidden">
      {/* No separate video - using the scroll-driven ParallaxImageBackground video instead */}

      <div className="relative z-10 max-w-7xl mx-auto w-full px-6 md:px-8">
        <div className="flex items-center justify-between min-h-screen">
          {/* Left side - Heading and Tagline */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="max-w-2xl"
          >
            <motion.div
              className="inline-block bg-[#5CFF5C] neo-border px-8 py-6 mb-6 rounded-lg interactive-element"
              whileHover={{ scale: 1.05, rotate: -2 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <h2 className="text-3xl md:text-5xl lg:text-6xl font-black text-black uppercase tracking-tighter">
                <TextType
                  text={["Ready to Make a Difference?", "Join the Civic Revolution", "Transform Your Community"]}
                  typingSpeed={75}
                  pauseDuration={1500}
                  showCursor={true}
                  cursorCharacter="|"
                  loop={true}
                />
              </h2>
            </motion.div>

            <motion.p 
              className="text-lg md:text-xl text-white font-bold max-w-2xl bg-black/60 backdrop-blur-md neo-border px-6 py-4 rounded-lg leading-relaxed text-on-shader-subtle"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
              viewport={{ once: true }}
            >
              Join thousands of citizens working together to create safer, better communities.
            </motion.p>
          </motion.div>

          {/* Right side - START BOOT Button with Magnetic Effect */}
          <div className="flex items-center justify-end">
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              viewport={{ once: true }}
            >
              <Magnet padding={150} disabled={false} magnetStrength={15}>
                <LaunchButton
                  href="/os"
                  className="inline-flex items-center justify-center px-10 py-5 bg-[#5CFF5C] text-black text-xl font-black uppercase neo-border rounded-lg tracking-tight cursor-pointer"
                >
                  START BOOT
                </LaunchButton>
              </Magnet>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
