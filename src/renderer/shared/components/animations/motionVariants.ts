import type { Variants } from 'framer-motion';

export const scaleIn: Variants = {
  hidden: { scale: 0.8, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 100,
    },
  },
};

export const slideInRight = {
  hidden: { x: 50, opacity: 0 },
  visible: { 
    x: 0, 
    opacity: 1,
    transition: { duration: 0.5, ease: "easeOut" as const }
  }
};

export const fadeInUp: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut" as const,
    },
  },
};



export const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.15
    }
  }
};

export const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 120,
      damping: 18
    }
  }
};

export const cardHoverVariants = {
  rest: { scale: 1, y: 0 },
  hover: {
    scale: 1.03,
    y: -6,
    transition: {
      type: "spring" as const,
      stiffness: 400,
      damping: 20
    }
  }
};

export const floatingVariants = {
  animate: {
    y: [-12, 12, -12],
    transition: {
      duration: 7,
      repeat: Infinity,
      ease: "easeInOut" as const
    }
  }
};

export const pulseGlowVariants = {
  animate: {
    scale: [1, 1.08, 1],
    opacity: [0.4, 0.7, 0.4],
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: "easeInOut" as const
    }
  }
};


export const glowVariants = {
  rest: { opacity: 0, scale: 0.8 },
  hover: { 
    opacity: 1, 
    scale: 1.1,
    transition: { duration: 0.4 }
  }
};

export const iconVariants = {
  rest: { rotate: 0, scale: 1 },
  hover: { 
    rotate: [0, -5, 5, -5, 0],
    scale: 1.1,
    transition: { duration: 0.6 }
  }
};

export const checkmarkVariants = {
  hidden: { scale: 0, rotate: -180, opacity: 0 },
  visible: { 
    scale: 1, 
    rotate: 0, 
    opacity: 1,
    transition: { 
      type: "spring" as const, 
      stiffness: 200, 
      damping: 15 
    }
  }
};
