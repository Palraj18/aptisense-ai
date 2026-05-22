import React from "react";
import { motion } from "framer-motion";
import { cn } from "../../lib/utils";

export const GlassCard = ({ children, className, delay = 0, ...props }) => (
  <motion.div
    initial={{ opacity: 0, y: 22 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-80px" }}
    transition={{ duration: 0.55, delay }}
    className={cn(
      "rounded-lg border border-white/10 bg-white/[0.08] p-5 shadow-2xl shadow-black/20 backdrop-blur-xl",
      className
    )}
    {...props}
  >
    {children}
  </motion.div>
);
