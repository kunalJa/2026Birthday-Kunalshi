"use client";

import { useEffect, useRef } from "react";
import { motion, useSpring, useTransform } from "framer-motion";

interface AnimatedBalanceProps {
  value: number;
  className?: string;
}

export default function AnimatedBalance({ value, className = "" }: AnimatedBalanceProps) {
  const spring = useSpring(0, {
    stiffness: 80,
    damping: 20,
    mass: 1,
  });

  const display = useTransform(spring, (current) =>
    Math.floor(current).toLocaleString("en-US")
  );

  const prevValue = useRef(0);

  useEffect(() => {
    spring.set(value);
    prevValue.current = value;
  }, [value, spring]);

  return (
    <motion.span className={className}>
      $ <motion.span>{display}</motion.span>
    </motion.span>
  );
}
