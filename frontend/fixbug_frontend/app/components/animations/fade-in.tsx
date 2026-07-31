"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface FadeInProps {
  children: ReactNode;
  delay?: number;
  direction?: "left" | "right" | "up" | "down"; // 👈 On ajoute la direction
}

export function FadeIn({ children, delay = 0, direction = "up" }: FadeInProps) {
  // On définit la position de départ selon la direction choisie
  const getInitialPosition = () => {
    switch (direction) {
      case "left":
        return { x: -80, y: 0 };  // Arrive de la gauche
      case "right":
        return { x: 80, y: 0 };   // Arrive de la droite
      case "down":
        return { x: 0, y: -40 };  // Arrive du haut
      case "up":
      default:
        return { x: 0, y: 40 };   // Arrive du bas
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, ...getInitialPosition() }}
      whileInView={{ opacity: 1, x: 0, y: 0 }} // Revient à sa position normale
      viewport={{ once: true }}
      transition={{ duration: 0.7, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}