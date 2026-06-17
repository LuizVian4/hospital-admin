import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

interface AnimatedListProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export function AnimatedList({ children, className, delay = 0.1 }: AnimatedListProps) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {Array.isArray(children)
        ? children.map((child, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: delay + i * 0.08 }}
            >
              {child}
            </motion.div>
          ))
        : children}
    </div>
  );
}
