import { motion } from 'framer-motion';
import { 
  Shield, 
  Lock,
  Award
} from 'lucide-react';
import { cn } from '../../../../../shared/types/cn';
import { containerVariants} from '../../../../../shared/components/animations/motionVariants'
import { itemVariants} from '../../../../../shared/components/animations/motionVariants'
   
   const TrustBadges = () => (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="flex flex-wrap items-center justify-center lg:justify-start gap-3"
      role="list"
      aria-label="Security certifications"
    >
      {[
        { 
          icon: Shield, 
          text: "HIPAA Compliant", 
          color: "emerald",
          description: "Health Insurance Portability and Accountability Act certified"
        },
        { 
          icon: Lock, 
          text: "256-bit Encrypted", 
          color: "blue",
          description: "Military-grade encryption for all data"
        },
        { 
          icon: Award, 
          text: "ISO 27001 Certified", 
          color: "purple",
          description: "International information security standard"
        }
      ].map((badge, index) => (
        <motion.div
          key={index}
          variants={itemVariants}
          whileHover={{ scale: 1.06, y: -2 }}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-full backdrop-blur-sm border-2 transition-all duration-300 cursor-default",
            badge.color === 'emerald' && "bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/15 hover:border-emerald-500/40",
            badge.color === 'blue' && "bg-blue-500/10 border-blue-500/30 hover:bg-blue-500/15 hover:border-blue-500/40",
            badge.color === 'purple' && "bg-purple-500/10 border-purple-500/30 hover:bg-purple-500/15 hover:border-purple-500/40"
          )}
          role="listitem"
          title={badge.description}
          aria-label={`${badge.text}: ${badge.description}`}
        >
          <badge.icon 
            className={cn(
              "w-4 h-4",
              badge.color === 'emerald' && "text-emerald-600 dark:text-emerald-400",
              badge.color === 'blue' && "text-blue-600 dark:text-blue-400",
              badge.color === 'purple' && "text-purple-600 dark:text-purple-400"
            )}
            aria-hidden="true"
          />
          <span className={cn(
            "text-sm font-bold tracking-tight",
            badge.color === 'emerald' && "text-emerald-800 dark:text-emerald-200",
            badge.color === 'blue' && "text-blue-800 dark:text-blue-200",
            badge.color === 'purple' && "text-purple-800 dark:text-purple-200"
          )}>
            {badge.text}
          </span>
        </motion.div>
      ))}
    </motion.div>
  );
  export default TrustBadges